import apiClient from './client';
import type { Document, DocumentListResponse, DocumentStatusResponse } from '../types';

export async function uploadDocument(
  sessionId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<Document> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<Document>(
    `/sessions/${sessionId}/documents`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    }
  );
  return response.data;
}

export async function getDocuments(
  sessionId: string,
  skip = 0,
  limit = 50
): Promise<DocumentListResponse> {
  const response = await apiClient.get<DocumentListResponse>(
    `/sessions/${sessionId}/documents`,
    { params: { skip, limit } }
  );
  return response.data;
}

export async function getDocument(documentId: string): Promise<Document> {
  const response = await apiClient.get<Document>(`/documents/${documentId}`);
  return response.data;
}

export async function getDocumentStatus(documentId: string): Promise<DocumentStatusResponse> {
  const response = await apiClient.get<DocumentStatusResponse>(`/documents/${documentId}/status`);
  return response.data;
}

export async function deleteDocument(documentId: string): Promise<void> {
  await apiClient.delete(`/documents/${documentId}`);
}
