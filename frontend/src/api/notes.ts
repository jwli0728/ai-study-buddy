import apiClient from './client';
import type { Note, NoteCreate, NoteUpdate, NoteListResponse } from '../types';

export async function getNotes(
  sessionId: string,
  skip = 0,
  limit = 50
): Promise<NoteListResponse> {
  const response = await apiClient.get<NoteListResponse>(
    `/sessions/${sessionId}/notes`,
    { params: { skip, limit } }
  );
  return response.data;
}

export async function getNote(noteId: string): Promise<Note> {
  const response = await apiClient.get<Note>(`/notes/${noteId}`);
  return response.data;
}

export async function createNote(sessionId: string, data: NoteCreate): Promise<Note> {
  const response = await apiClient.post<Note>(`/sessions/${sessionId}/notes`, data);
  return response.data;
}

export async function updateNote(noteId: string, data: NoteUpdate): Promise<Note> {
  const response = await apiClient.put<Note>(`/notes/${noteId}`, data);
  return response.data;
}

export async function deleteNote(noteId: string): Promise<void> {
  await apiClient.delete(`/notes/${noteId}`);
}

export async function pinNote(noteId: string, pin = true): Promise<Note> {
  const response = await apiClient.post<Note>(`/notes/${noteId}/pin`, null, {
    params: { pin },
  });
  return response.data;
}
