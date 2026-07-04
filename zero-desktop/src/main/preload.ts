import { contextBridge, ipcRenderer } from 'electron';
import type { IpcChannels, MainEvent } from '../shared/types';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Process Management
  spawnZero: (sessionId: string, options: any) =>
    ipcRenderer.invoke('zero:spawn', sessionId, options),
  terminateZero: (sessionId: string) =>
    ipcRenderer.invoke('zero:terminate', sessionId),
  sendInput: (sessionId: string, input: string) =>
    ipcRenderer.invoke('zero:send-input', sessionId, input),

  // Session Management
  listSessions: () => ipcRenderer.invoke('sessions:list'),
  getSession: (sessionId: string) =>
    ipcRenderer.invoke('sessions:get', sessionId),
  deleteSession: (sessionId: string) =>
    ipcRenderer.invoke('sessions:delete', sessionId),
  forkSession: (sessionId: string, newName: string) =>
    ipcRenderer.invoke('sessions:fork', sessionId, newName),

  // Provider Management
  listProviders: () => ipcRenderer.invoke('providers:list'),
  addProvider: (provider: any) => ipcRenderer.invoke('providers:add', provider),
  updateProvider: (id: string, updates: any) =>
    ipcRenderer.invoke('providers:update', id, updates),
  deleteProvider: (id: string) => ipcRenderer.invoke('providers:delete', id),
  testProviderConnection: (providerId: string) =>
    ipcRenderer.invoke('providers:test-connection', providerId),

  // Repository Management
  scanRepository: (path: string) => ipcRenderer.invoke('repos:scan', path),
  listRepositories: () => ipcRenderer.invoke('repos:list'),
  listWorktrees: (repoPath: string) =>
    ipcRenderer.invoke('worktrees:list', repoPath),
  createWorktree: (repoPath: string, branchName: string) =>
    ipcRenderer.invoke('worktrees:create', repoPath, branchName),

  // Permission Handling
  approvePermission: (requestId: string) =>
    ipcRenderer.invoke('permissions:approve', requestId),
  denyPermission: (requestId: string) =>
    ipcRenderer.invoke('permissions:deny', requestId),
  setDefaultPermission: (type: string, action: string) =>
    ipcRenderer.invoke('permissions:set-default', type, action),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings: any) =>
    ipcRenderer.invoke('settings:update', settings),

  // System
  checkZeroInstallation: () => ipcRenderer.invoke('system:check-zero'),
  installZero: () => ipcRenderer.invoke('system:install-zero'),

  // Event listeners
  onMainEvent: (callback: (event: MainEvent) => void) => {
    const subscription = (_event: any, data: MainEvent) => callback(data);
    ipcRenderer.on('main-event', subscription);
    return () => ipcRenderer.removeListener('main-event', subscription);
  },
});

// Type declaration for the exposed API
declare global {
  interface Window {
    electronAPI: {
      spawnZero: (sessionId: string, options: any) => Promise<void>;
      terminateZero: (sessionId: string) => Promise<void>;
      sendInput: (sessionId: string, input: string) => Promise<void>;
      listSessions: () => Promise<any[]>;
      getSession: (sessionId: string) => Promise<any | null>;
      deleteSession: (sessionId: string) => Promise<void>;
      forkSession: (sessionId: string, newName: string) => Promise<string>;
      listProviders: () => Promise<any[]>;
      addProvider: (provider: any) => Promise<string>;
      updateProvider: (id: string, updates: any) => Promise<void>;
      deleteProvider: (id: string) => Promise<void>;
      testProviderConnection: (providerId: string) => Promise<{ success: boolean; error?: string }>;
      scanRepository: (path: string) => Promise<any>;
      listRepositories: () => Promise<any[]>;
      listWorktrees: (repoPath: string) => Promise<any[]>;
      createWorktree: (repoPath: string, branchName: string) => Promise<string>;
      approvePermission: (requestId: string) => Promise<void>;
      denyPermission: (requestId: string) => Promise<void>;
      setDefaultPermission: (type: string, action: string) => Promise<void>;
      getSettings: () => Promise<any>;
      updateSettings: (settings: any) => Promise<void>;
      checkZeroInstallation: () => Promise<{ installed: boolean; version?: string; path?: string }>;
      installZero: () => Promise<void>;
      onMainEvent: (callback: (event: MainEvent) => void) => () => void;
    };
  }
}
