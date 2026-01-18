import apiClient from './client';
import type { ChatResponse, MessageListResponse } from '../types';

export async function getMessages(
  sessionId: string,
  skip = 0,
  limit = 50
): Promise<MessageListResponse> {
  const response = await apiClient.get<MessageListResponse>(
    `/sessions/${sessionId}/messages`,
    { params: { skip, limit } }
  );
  return response.data;
}

export async function sendMessage(sessionId: string, content: string): Promise<ChatResponse> {
  const response = await apiClient.post<ChatResponse>(`/sessions/${sessionId}/chat`, {
    content,
  });
  return response.data;
}

export async function clearMessages(sessionId: string): Promise<void> {
  await apiClient.delete(`/sessions/${sessionId}/messages`);
}
