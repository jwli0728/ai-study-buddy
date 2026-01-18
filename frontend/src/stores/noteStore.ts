import { create } from 'zustand';
import * as noteApi from '../api/notes';
import type { Note, NoteCreate, NoteUpdate } from '../types';

interface NoteState {
  notes: Note[];
  currentNote: Note | null;
  isLoading: boolean;
  error: string | null;

  loadNotes: (sessionId: string) => Promise<void>;
  createNote: (sessionId: string, data: NoteCreate) => Promise<Note>;
  updateNote: (noteId: string, data: NoteUpdate) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  pinNote: (noteId: string, pin: boolean) => Promise<void>;
  setCurrentNote: (note: Note | null) => void;
  clearError: () => void;
  reset: () => void;
}

export const useNoteStore = create<NoteState>((set) => ({
  notes: [],
  currentNote: null,
  isLoading: false,
  error: null,

  loadNotes: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await noteApi.getNotes(sessionId);
      set({ notes: response.notes, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load notes', isLoading: false });
    }
  },

  createNote: async (sessionId, data) => {
    set({ isLoading: true, error: null });
    try {
      const note = await noteApi.createNote(sessionId, data);
      set((state) => ({
        notes: [note, ...state.notes],
        currentNote: note,
        isLoading: false,
      }));
      return note;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create note', isLoading: false });
      throw err;
    }
  },

  updateNote: async (noteId, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await noteApi.updateNote(noteId, data);
      set((state) => ({
        notes: state.notes.map((n) => (n.id === noteId ? updated : n)),
        currentNote: state.currentNote?.id === noteId ? updated : state.currentNote,
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to update note', isLoading: false });
      throw err;
    }
  },

  deleteNote: async (noteId) => {
    set({ isLoading: true, error: null });
    try {
      await noteApi.deleteNote(noteId);
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== noteId),
        currentNote: state.currentNote?.id === noteId ? null : state.currentNote,
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete note', isLoading: false });
      throw err;
    }
  },

  pinNote: async (noteId, pin) => {
    try {
      const updated = await noteApi.pinNote(noteId, pin);
      set((state) => {
        // Re-sort notes with pinned first
        const newNotes = state.notes.map((n) => (n.id === noteId ? updated : n));
        newNotes.sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        return {
          notes: newNotes,
          currentNote: state.currentNote?.id === noteId ? updated : state.currentNote,
        };
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to pin note' });
      throw err;
    }
  },

  setCurrentNote: (note) => set({ currentNote: note }),

  clearError: () => set({ error: null }),

  reset: () => set({ notes: [], currentNote: null, isLoading: false, error: null }),
}));
