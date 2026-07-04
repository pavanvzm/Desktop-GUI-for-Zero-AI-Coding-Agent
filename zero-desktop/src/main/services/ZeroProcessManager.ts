import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import type {
  ZeroSession,
  OutputLine,
  PermissionRequest,
  SpawnOptions,
  MainEvent,
} from '../shared/types';

interface ActiveProcess {
  session: ZeroSession;
  process: ChildProcess | null;
  pid: number | null;
}

export class ZeroProcessManager extends EventEmitter {
  private processes: Map<string, ActiveProcess> = new Map();
  private zeroBinaryPath: string;
  private sessionsDir: string;

  constructor(zeroBinaryPath?: string) {
    super();
    this.zeroBinaryPath = zeroBinaryPath || 'zero';
    this.sessionsDir = this.getSessionsDir();
  }

  private getSessionsDir(): string {
    const home = process.env.HOME || process.env.USERPROFILE || '';
    return path.join(home, '.zero', 'sessions');
  }

  async spawn(sessionId: string, options: SpawnOptions): Promise<void> {
    if (this.processes.has(sessionId)) {
      throw new Error(`Session ${sessionId} is already running`);
    }

    const session: ZeroSession = {
      id: sessionId,
      name: `Session ${sessionId.slice(0, 8)}`,
      repoPath: options.repoPath,
      model: options.model,
      provider: '',
      status: 'idle',
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      output: [],
      pendingPermissions: [],
    };

    this.processes.set(sessionId, { session, process: null, pid: null });

    const args = this.buildArgs(options);
    const env = {
      ...process.env,
      ...options.env,
      ZERO_SESSION: sessionId,
      ZERO_WORKDIR: options.repoPath,
    };

    console.log(`Spawning Zero: ${this.zeroBinaryPath} ${args.join(' ')}`);

    const child = spawn(this.zeroBinaryPath, args, {
      cwd: options.repoPath,
      env,
      shell: true,
    });

    const activeProcess = this.processes.get(sessionId)!;
    activeProcess.process = child;
    activeProcess.pid = child.pid || null;

    this.updateStatus(sessionId, 'running');

    // Handle stdout
    child.stdout?.on('data', (data: Buffer) => {
      const content = data.toString();
      this.emitOutput(sessionId, 'stdout', content);
    });

    // Handle stderr
    child.stderr?.on('data', (data: Buffer) => {
      const content = data.toString();
      this.emitOutput(sessionId, 'stderr', content);
    });

    // Handle errors
    child.on('error', (err) => {
      console.error(`Process error for session ${sessionId}:`, err);
      this.emitEvent(sessionId, 'session:error', err.message);
      this.updateStatus(sessionId, 'error');
    });

    // Handle exit
    child.on('exit', (code) => {
      console.log(`Process exited for session ${sessionId} with code ${code}`);
      this.emitEvent(sessionId, 'process:exited', code);
      this.updateStatus(sessionId, code === 0 ? 'completed' : 'error');
      this.processes.delete(sessionId);
    });
  }

  private buildArgs(options: SpawnOptions): string[] {
    const args: string[] = [];

    if (options.mode === 'exec') {
      args.push('exec');

      if (options.execOptions) {
        const exec = options.execOptions;
        if (exec.model) args.push('--model', exec.model);
        if (exec.useSpec) args.push('--use-spec', exec.useSpec);
        if (exec.worktree) args.push('--worktree', exec.worktree);
        if (exec.resume) args.push('--resume', exec.resume);
        if (exec.fork) args.push('--fork', exec.fork);
        if (exec.inputFormat) args.push('--input-format', exec.inputFormat);
        if (exec.outputFormat) args.push('--output-format', exec.outputFormat);
        if (exec.prompt) {
          args.push('--prompt', exec.prompt);
        }
        if (exec.additionalArgs) {
          args.push(...exec.additionalArgs);
        }
      }
    } else {
      // Interactive mode - just run `zero`
      args.push('--model', options.model);
    }

    return args;
  }

  terminate(sessionId: string): void {
    const active = this.processes.get(sessionId);
    if (!active) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (active.process && active.pid) {
      try {
        // Try graceful shutdown first
        process.kill(active.pid, 'SIGTERM');
        
        // Force kill after timeout
        setTimeout(() => {
          if (this.processes.has(sessionId)) {
            process.kill(active.pid!, 'SIGKILL');
          }
        }, 5000);
      } catch (err) {
        console.error(`Failed to terminate process ${sessionId}:`, err);
      }
    }

    this.processes.delete(sessionId);
    this.updateStatus(sessionId, 'completed');
  }

  sendInput(sessionId: string, input: string): void {
    const active = this.processes.get(sessionId);
    if (!active || !active.process) {
      throw new Error(`Session ${sessionId} is not running`);
    }

    active.process.stdin?.write(input + '\n');
  }

  getSession(sessionId: string): ZeroSession | null {
    return this.processes.get(sessionId)?.session || null;
  }

  getAllSessions(): ZeroSession[] {
    return Array.from(this.processes.values()).map((p) => p.session);
  }

  private updateStatus(sessionId: string, status: ZeroSession['status']): void {
    const active = this.processes.get(sessionId);
    if (active) {
      active.session.status = status;
      active.session.lastActivityAt = Date.now();
      this.emitEvent(sessionId, 'session:status', status);
    }
  }

  private emitOutput(sessionId: string, type: OutputLine['type'], content: string): void {
    const active = this.processes.get(sessionId);
    if (!active) return;

    const line: OutputLine = {
      id: uuidv4(),
      timestamp: Date.now(),
      type,
      content,
    };

    active.session.output.push(line);
    active.session.lastActivityAt = Date.now();

    this.emitEvent(sessionId, 'session:output', line);
  }

  private emitEvent<T>(sessionId: string, eventType: string, data: T): void {
    const event: MainEvent = {
      type: eventType as never,
      sessionId,
      ...{ data },
    } as MainEvent;

    // For actual implementation, this would use electron's webContents.send
    this.emit('event', event);
  }

  async loadPersistedSessions(): Promise<ZeroSession[]> {
    const sessions: ZeroSession[] = [];

    try {
      if (!fs.existsSync(this.sessionsDir)) {
        return sessions;
      }

      const files = fs.readdirSync(this.sessionsDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.sessionsDir, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const session = JSON.parse(content) as ZeroSession;
          sessions.push(session);
        }
      }
    } catch (err) {
      console.error('Failed to load persisted sessions:', err);
    }

    return sessions;
  }

  cleanup(): void {
    for (const [sessionId] of this.processes) {
      this.terminate(sessionId);
    }
  }
}
