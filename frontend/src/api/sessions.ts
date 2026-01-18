import apiClient from './client';
import type { Session, SessionCreate, SessionUpdate, SessionListResponse } from '../types';

export async function getSessions(
  skip = 0,
  limit = 20,
  includeArchived = false
): Promise<SessionListResponse> {
  const response = await apiClient.get<SessionListResponse>('/sessions', {
    params: { skip, limit, include_archived: includeArchived },
  });
  return response.data;
}

export async function getSession(sessionId: string): Promise<Session> {
  const response = await apiClient.get<Session>(`/sessions/${sessionId}`);
  return response.data;
}

export async function createSession(data: SessionCreate): Promise<Session> {
  const response = await apiClient.post<Session>('/sessions', data);
  return response.data;
}

export async function updateSession(sessionId: string, data: SessionUpdate): Promise<Session> {
  const response = await apiClient.put<Session>(`/sessions/${sessionId}`, data);
  return response.data;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await apiClient.delete(`/sessions/${sessionId}`);
}

export async function archiveSession(sessionId: string, archive = true): Promise<Session> {
  const response = await apiClient.post<Session>(`/sessions/${sessionId}/archive`, null, {
    params: { archive },
  });
  return response.data;
}
