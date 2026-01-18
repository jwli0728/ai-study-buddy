import { create } from 'zustand';
import * as sessionApi from '../api/sessions';
import type { Session, SessionCreate, SessionUpdate } from '../types';

interface SessionState {
  sessions: Session[];
  currentSession: Session | null;
  total: number;
  isLoading: boolean;
  error: string | null;

  loadSessions: (includeArchived?: boolean) => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  createSession: (data: SessionCreate) => Promise<Session>;
  updateSession: (sessionId: string, data: SessionUpdate) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  archiveSession: (sessionId: string, archive: boolean) => Promise<void>;
  clearError: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  currentSession: null,
  total: 0,
  isLoading: false,
  error: null,

  loadSessions: async (includeArchived = false) => {
    set({ isLoading: true, error: null });
    try {
      const response = await sessionApi.getSessions(0, 100, includeArchived);
      set({ sessions: response.sessions, total: response.total, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load sessions', isLoading: false });
    }
  },

  loadSession: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      const session = await sessionApi.getSession(sessionId);
      set({ currentSession: session, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load session', isLoading: false });
    }
  },

  createSession: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const session = await sessionApi.createSession(data);
      set((state) => ({
        sessions: [session, ...state.sessions],
        total: state.total + 1,
        isLoading: false,
      }));
      return session;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create session', isLoading: false });
      throw err;
    }
  },

  updateSession: async (sessionId, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await sessionApi.updateSession(sessionId, data);
      set((state) => ({
        sessions: state.sessions.map((s) => (s.id === sessionId ? updated : s)),
        currentSession: state.currentSession?.id === sessionId ? updated : state.currentSession,
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to update session', isLoading: false });
      throw err;
    }
  },

  deleteSession: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      await sessionApi.deleteSession(sessionId);
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== sessionId),
        total: state.total - 1,
        currentSession: state.currentSession?.id === sessionId ? null : state.currentSession,
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete session', isLoading: false });
      throw err;
    }
  },

  archiveSession: async (sessionId, archive) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await sessionApi.archiveSession(sessionId, archive);
      set((state) => ({
        sessions: state.sessions.map((s) => (s.id === sessionId ? updated : s)),
        currentSession: state.currentSession?.id === sessionId ? updated : state.currentSession,
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to archive session', isLoading: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
