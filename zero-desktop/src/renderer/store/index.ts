import { create } from 'zustand';
import type { ZeroSession, ProviderConfig, GitRepo, AppSettings, OutputLine, PermissionRequest } from '../shared/types';

interface AppState {
  // Sessions
  sessions: ZeroSession[];
  activeSessionId: string | null;
  addSession: (session: ZeroSession) => void;
  updateSession: (sessionId: string, updates: Partial<ZeroSession>) => void;
  removeSession: (sessionId: string) => void;
  setActiveSession: (sessionId: string | null) => void;

  // Providers
  providers: ProviderConfig[];
  setProviders: (providers: ProviderConfig[]) => void;
  addProvider: (provider: ProviderConfig) => void;
  updateProvider: (id: string, updates: Partial<ProviderConfig>) => void;
  removeProvider: (id: string) => void;

  // Repositories
  recentRepos: GitRepo[];
  addRecentRepo: (repo: GitRepo) => void;

  // Settings
  settings: AppSettings | null;
  setSettings: (settings: AppSettings) => void;

  // UI State
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  selectedView: 'dashboard' | 'chat' | 'exec' | 'settings' | 'sessions';
  setSelectedView: (view: AppState['selectedView']) => void;

  // Output handling
  appendOutput: (sessionId: string, line: OutputLine) => void;
  addPermissionRequest: (sessionId: string, request: PermissionRequest) => void;
  resolvePermission: (sessionId: string, requestId: string, approved: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Sessions
  sessions: [],
  activeSessionId: null,
  addSession: (session) =>
    set((state) => ({
      sessions: [...state.sessions, session],
      activeSessionId: session.id,
    })),
  updateSession: (sessionId, updates) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, ...updates } : s
      ),
    })),
  removeSession: (sessionId) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== sessionId),
      activeSessionId:
        state.activeSessionId === sessionId ? null : state.activeSessionId,
    })),
  setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),

  // Providers
  providers: [],
  setProviders: (providers) => set({ providers }),
  addProvider: (provider) =>
    set((state) => ({ providers: [...state.providers, provider] })),
  updateProvider: (id, updates) =>
    set((state) => ({
      providers: state.providers.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),
  removeProvider: (id) =>
    set((state) => ({
      providers: state.providers.filter((p) => p.id !== id),
    })),

  // Repositories
  recentRepos: [],
  addRecentRepo: (repo) =>
    set((state) => ({
      recentRepos: [repo, ...state.recentRepos.filter((r) => r.path !== repo.path)].slice(0, 10),
    })),

  // Settings
  settings: null,
  setSettings: (settings) => set({ settings }),

  // UI State
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  selectedView: 'dashboard',
  setSelectedView: (view) => set({ selectedView: view }),

  // Output handling
  appendOutput: (sessionId, line) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? { ...s, output: [...s.output, line], lastActivityAt: Date.now() }
          : s
      ),
    })),
  addPermissionRequest: (sessionId, request) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? { ...s, pendingPermissions: [...s.pendingPermissions, request] }
          : s
      ),
    })),
  resolvePermission: (sessionId, requestId, approved) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              pendingPermissions: s.pendingPermissions.map((p) =>
                p.id === requestId ? { ...p, status: approved ? 'approved' : 'denied' } : p
              ),
            }
          : s
      ),
    })),
}));
