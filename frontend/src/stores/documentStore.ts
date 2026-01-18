import { create } from 'zustand';
import * as documentApi from '../api/documents';
import type { Document } from '../types';

interface DocumentState {
  documents: Document[];
  isLoading: boolean;
  uploadProgress: number;
  error: string | null;

  loadDocuments: (sessionId: string) => Promise<void>;
  uploadDocument: (sessionId: string, file: File) => Promise<Document>;
  deleteDocument: (documentId: string) => Promise<void>;
  refreshDocumentStatus: (documentId: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  isLoading: false,
  uploadProgress: 0,
  error: null,

  loadDocuments: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await documentApi.getDocuments(sessionId);
      set({ documents: response.documents, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load documents', isLoading: false });
    }
  },

  uploadDocument: async (sessionId, file) => {
    set({ isLoading: true, uploadProgress: 0, error: null });
    try {
      const document = await documentApi.uploadDocument(sessionId, file, (progress) => {
        set({ uploadProgress: progress });
      });
      set((state) => ({
        documents: [document, ...state.documents],
        isLoading: false,
        uploadProgress: 0,
      }));
      return document;
    } catch (err: any) {
      set({ error: err.message || 'Failed to upload document', isLoading: false, uploadProgress: 0 });
      throw err;
    }
  },

  deleteDocument: async (documentId) => {
    set({ isLoading: true, error: null });
    try {
      await documentApi.deleteDocument(documentId);
      set((state) => ({
        documents: state.documents.filter((d) => d.id !== documentId),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete document', isLoading: false });
      throw err;
    }
  },

  refreshDocumentStatus: async (documentId) => {
    try {
      const status = await documentApi.getDocumentStatus(documentId);
      set((state) => ({
        documents: state.documents.map((d) =>
          d.id === documentId
            ? {
                ...d,
                processing_status: status.processing_status as Document['processing_status'],
                processing_error: status.processing_error,
                chunk_count: status.chunk_count,
              }
            : d
        ),
      }));
    } catch {
      // Ignore status refresh errors
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set({ documents: [], isLoading: false, uploadProgress: 0, error: null }),
}));
