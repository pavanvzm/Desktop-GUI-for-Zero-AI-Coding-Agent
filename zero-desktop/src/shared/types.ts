/**
 * Shared types for Zero Desktop IPC and state management
 */

export interface ZeroSession {
  id: string;
  name: string;
  repoPath: string;
  model: string;
  provider: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  createdAt: number;
  lastActivityAt: number;
  output: OutputLine[];
  pendingPermissions: PermissionRequest[];
}

export interface OutputLine {
  id: string;
  timestamp: number;
  type: 'stdout' | 'stderr' | 'system' | 'tool' | 'permission';
  content: string;
  metadata?: Record<string, unknown>;
}

export interface PermissionRequest {
  id: string;
  type: 'file_write' | 'shell_command' | 'network_access';
  description: string;
  details: {
    path?: string;
    command?: string;
    url?: string;
  };
  status: 'pending' | 'approved' | 'denied';
}

export interface ProviderConfig {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'ollama' | 'lmstudio' | 'groq' | 'gemini';
  apiKey?: string;
  baseUrl?: string;
  models: ModelInfo[];
  isActive: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  contextWindow: number;
  supportsVision: boolean;
  supportsTools: boolean;
  costPerToken?: { input: number; output: number };
}

export interface ExecOptions {
  model?: string;
  useSpec?: string;
  worktree?: string;
  resume?: string;
  fork?: string;
  inputFormat?: 'stream-json';
  outputFormat?: 'stream-json';
  prompt?: string;
  additionalArgs?: string[];
}

export interface GitRepo {
  path: string;
  name: string;
  branch: string;
  isDirty: boolean;
  uncommittedChanges: number;
}

export interface Worktree {
  path: string;
  branch: string;
  isActive: boolean;
}

export interface AppState {
  sessions: ZeroSession[];
  activeSessionId: string | null;
  providers: ProviderConfig[];
  repos: GitRepo[];
  settings: AppSettings;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  autoApproveLowRisk: boolean;
  maxConcurrentSessions: number;
  zeroBinaryPath: string;
  defaultWorkDir: string;
}

// IPC Channel Types
export interface IpcChannels {
  // Process Management
  'zero:spawn': (sessionId: string, options: SpawnOptions) => Promise<void>;
  'zero:terminate': (sessionId: string) => Promise<void>;
  'zero:pause': (sessionId: string) => Promise<void>;
  'zero:resume': (sessionId: string) => Promise<void>;
  'zero:send-input': (sessionId: string, input: string) => Promise<void>;
  
  // Session Management
  'sessions:list': () => Promise<ZeroSession[]>;
  'sessions:get': (sessionId: string) => Promise<ZeroSession | null>;
  'sessions:delete': (sessionId: string) => Promise<void>;
  'sessions:fork': (sessionId: string, newName: string) => Promise<string>;
  'sessions:rewind': (sessionId: string, checkpointId: string) => Promise<void>;
  
  // Provider Management
  'providers:list': () => Promise<ProviderConfig[]>;
  'providers:add': (provider: Omit<ProviderConfig, 'id'>) => Promise<string>;
  'providers:update': (id: string, updates: Partial<ProviderConfig>) => Promise<void>;
  'providers:delete': (id: string) => Promise<void>;
  'providers:test-connection': (providerId: string) => Promise<{ success: boolean; error?: string }>;
  
  // Repository Management
  'repos:scan': (path: string) => Promise<GitRepo>;
  'repos:list': () => Promise<GitRepo[]>;
  'worktrees:list': (repoPath: string) => Promise<Worktree[]>;
  'worktrees:create': (repoPath: string, branchName: string) => Promise<string>;
  
  // Permission Handling
  'permissions:approve': (requestId: string) => Promise<void>;
  'permissions:deny': (requestId: string) => Promise<void>;
  'permissions:set-default': (type: PermissionRequest['type'], action: 'approve' | 'deny' | 'ask') => Promise<void>;
  
  // Settings
  'settings:get': () => Promise<AppSettings>;
  'settings:update': (settings: Partial<AppSettings>) => Promise<void>;
  
  // System
  'system:check-zero': () => Promise<{ installed: boolean; version?: string; path?: string }>;
  'system:install-zero': () => Promise<void>;
}

export interface SpawnOptions {
  repoPath: string;
  model: string;
  mode: 'interactive' | 'exec';
  execOptions?: ExecOptions;
  env?: Record<string, string>;
}

// Event types from main to renderer
export type MainEvent =
  | { type: 'session:output'; sessionId: string; line: OutputLine }
  | { type: 'session:status'; sessionId: string; status: ZeroSession['status'] }
  | { type: 'session:permission'; sessionId: string; request: PermissionRequest }
  | { type: 'session:error'; sessionId: string; error: string }
  | { type: 'process:exited'; sessionId: string; code: number };
