import { ipcMain, IpcMainInvokeEvent, WebContents } from 'electron';
import { ZeroProcessManager } from '../services/ZeroProcessManager';
import type { IpcChannels, MainEvent, SpawnOptions, ProviderConfig, GitRepo, Worktree, AppSettings } from '../../shared/types';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class IpcHandler {
  private processManager: ZeroProcessManager;
  private providers: Map<string, ProviderConfig> = new Map();
  private settings: AppSettings;
  private mainWindow: WebContents | null = null;

  constructor() {
    this.processManager = new ZeroProcessManager();
    this.settings = this.loadDefaultSettings();
    this.setupHandlers();
    this.setupEventForwarding();
  }

  setMainWindow(webContents: WebContents) {
    this.mainWindow = webContents;
  }

  private loadDefaultSettings(): AppSettings {
    return {
      theme: 'dark',
      autoApproveLowRisk: false,
      maxConcurrentSessions: 3,
      zeroBinaryPath: 'zero',
      defaultWorkDir: process.env.HOME || process.env.USERPROFILE || '',
    };
  }

  private setupHandlers() {
    // Process Management
    ipcMain.handle('zero:spawn', async (_event, sessionId: string, options: SpawnOptions) => {
      await this.processManager.spawn(sessionId, options);
    });

    ipcMain.handle('zero:terminate', async (_event, sessionId: string) => {
      this.processManager.terminate(sessionId);
    });

    ipcMain.handle('zero:send-input', async (_event, sessionId: string, input: string) => {
      this.processManager.sendInput(sessionId, input);
    });

    // Session Management
    ipcMain.handle('sessions:list', async () => {
      return this.processManager.getAllSessions();
    });

    ipcMain.handle('sessions:get', async (_event, sessionId: string) => {
      return this.processManager.getSession(sessionId);
    });

    ipcMain.handle('sessions:delete', async (_event, sessionId: string) => {
      this.processManager.terminate(sessionId);
      // In full implementation, also delete from persisted storage
    });

    ipcMain.handle('sessions:fork', async (_event, sessionId: string, newName: string) => {
      const session = this.processManager.getSession(sessionId);
      if (!session) throw new Error('Session not found');

      const newSessionId = uuidv4();
      // In full implementation, create a forked session with copied state
      return newSessionId;
    });

    // Provider Management
    ipcMain.handle('providers:list', async () => {
      return Array.from(this.providers.values());
    });

    ipcMain.handle('providers:add', async (_event, provider: Omit<ProviderConfig, 'id'>) => {
      const id = uuidv4();
      const config: ProviderConfig = { ...provider, id };
      this.providers.set(id, config);
      return id;
    });

    ipcMain.handle('providers:update', async (_event, id: string, updates: Partial<ProviderConfig>) => {
      const provider = this.providers.get(id);
      if (!provider) throw new Error('Provider not found');
      this.providers.set(id, { ...provider, ...updates });
    });

    ipcMain.handle('providers:delete', async (_event, id: string) => {
      this.providers.delete(id);
    });

    ipcMain.handle('providers:test-connection', async (_event, providerId: string) => {
      const provider = this.providers.get(providerId);
      if (!provider) return { success: false, error: 'Provider not found' };

      // Simulate connection test - in real implementation, make actual API call
      return { success: true };
    });

    // Repository Management
    ipcMain.handle('repos:scan', async (_event, repoPath: string) => {
      return this.scanRepository(repoPath);
    });

    ipcMain.handle('repos:list', async () => {
      // Return recently accessed repos from settings
      return [];
    });

    ipcMain.handle('worktrees:list', async (_event, repoPath: string) => {
      // Execute `git worktree list` and parse output
      return this.listWorktrees(repoPath);
    });

    ipcMain.handle('worktrees:create', async (_event, repoPath: string, branchName: string) => {
      // Execute `git worktree add` command
      const worktreePath = path.join(repoPath, '..', branchName);
      return worktreePath;
    });

    // Permission Handling
    ipcMain.handle('permissions:approve', async (_event, requestId: string) => {
      // Forward approval to the running Zero process
      console.log(`Approving permission request: ${requestId}`);
    });

    ipcMain.handle('permissions:deny', async (_event, requestId: string) => {
      console.log(`Denying permission request: ${requestId}`);
    });

    ipcMain.handle('permissions:set-default', async (_event, type, action) => {
      console.log(`Setting default for ${type}: ${action}`);
    });

    // Settings
    ipcMain.handle('settings:get', async () => {
      return this.settings;
    });

    ipcMain.handle('settings:update', async (_event, updates: Partial<AppSettings>) => {
      this.settings = { ...this.settings, ...updates };
    });

    // System
    ipcMain.handle('system:check-zero', async () => {
      return this.checkZeroInstallation();
    });

    ipcMain.handle('system:install-zero', async () => {
      // In real implementation, download and install Zero binary
      console.log('Installing Zero...');
    });
  }

  private setupEventForwarding() {
    this.processManager.on('event', (event: MainEvent) => {
      if (this.mainWindow) {
        this.mainWindow.send('main-event', event);
      }
    });
  }

  private async scanRepository(repoPath: string): Promise<GitRepo> {
    // Check if it's a git repository
    const gitDir = path.join(repoPath, '.git');
    const isRepo = fs.existsSync(gitDir);

    if (!isRepo) {
      throw new Error('Not a git repository');
    }

    // Get current branch
    let branch = 'main';
    try {
      const headFile = path.join(gitDir, 'HEAD');
      const headContent = fs.readFileSync(headFile, 'utf-8').trim();
      if (headContent.startsWith('ref: refs/heads/')) {
        branch = headContent.replace('ref: refs/heads/', '');
      }
    } catch {
      // Use default branch
    }

    // Check for uncommitted changes
    let isDirty = false;
    let uncommittedChanges = 0;

    return {
      path: repoPath,
      name: path.basename(repoPath),
      branch,
      isDirty,
      uncommittedChanges,
    };
  }

  private async listWorktrees(repoPath: string): Promise<Worktree[]> {
    // In real implementation, execute `git worktree list --porcelain`
    return [
      {
        path: repoPath,
        branch: 'main',
        isActive: true,
      },
    ];
  }

  private async checkZeroInstallation(): Promise<{ installed: boolean; version?: string; path?: string }> {
    // Check if zero binary exists in PATH or common locations
    const commonPaths = [
      '/usr/local/bin/zero',
      '/usr/bin/zero',
      path.join(process.env.HOME || '', '.local', 'bin', 'zero'),
      path.join(process.env.USERPROFILE || '', 'AppData', 'Local', 'Programs', 'zero', 'zero.exe'),
    ];

    for (const p of commonPaths) {
      if (fs.existsSync(p)) {
        return { installed: true, path: p };
      }
    }

    // Try to find in PATH
    try {
      const { execSync } = require('child_process');
      const version = execSync('zero --version', { encoding: 'utf-8' }).trim();
      return { installed: true, version, path: 'zero' };
    } catch {
      return { installed: false };
    }
  }

  cleanup() {
    this.processManager.cleanup();
    ipcMain.removeAllListeners();
  }
}
