import { create } from 'zustand';
import * as chatApi from '../api/chat';
import type { Message, SourceReference } from '../types';

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;

  loadMessages: (sessionId: string) => Promise<void>;
  sendMessage: (sessionId: string, content: string) => Promise<void>;
  clearMessages: (sessionId: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  isSending: false,
  error: null,

  loadMessages: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await chatApi.getMessages(sessionId, 0, 200);
      set({ messages: response.messages, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load messages', isLoading: false });
    }
  },

  sendMessage: async (sessionId, content) => {
    // Optimistic update - add user message immediately
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      session_id: sessionId,
      role: 'user',
      content,
      sources: [],
      created_at: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, tempUserMessage],
      isSending: true,
      error: null,
    }));

    try {
      const response = await chatApi.sendMessage(sessionId, content);

      // Replace temp message and add assistant response
      set((state) => ({
        messages: [
          ...state.messages.filter((m) => m.id !== tempUserMessage.id),
          {
            id: response.user_message_id,
            session_id: sessionId,
            role: 'user' as const,
            content,
            sources: [],
            created_at: new Date().toISOString(),
          },
          {
            id: response.assistant_message_id,
            session_id: sessionId,
            role: 'assistant' as const,
            content: response.response,
            sources: response.sources,
            created_at: new Date().toISOString(),
          },
        ],
        isSending: false,
      }));
    } catch (err: any) {
      // Remove optimistic update on error
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== tempUserMessage.id),
        error: err.message || 'Failed to send message',
        isSending: false,
      }));
    }
  },

  clearMessages: async (sessionId) => {
    try {
      await chatApi.clearMessages(sessionId);
      set({ messages: [] });
    } catch (err: any) {
      set({ error: err.message || 'Failed to clear messages' });
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set({ messages: [], isLoading: false, isSending: false, error: null }),
}));
