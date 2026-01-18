import React, { useEffect, useRef } from 'react';
import { useDocumentStore } from '../../stores/documentStore';
import { Button } from '../ui/Button';
import { Loading } from '../ui/Loading';
import type { Document } from '../../types';

interface DocumentListProps {
  sessionId: string;
}

const StatusBadge: React.FC<{ status: Document['processing_status'] }> = ({ status }) => {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${styles[status]}`}>
      {status}
    </span>
  );
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const DocumentList: React.FC<DocumentListProps> = ({ sessionId }) => {
  const { documents, isLoading, loadDocuments, deleteDocument, refreshDocumentStatus } =
    useDocumentStore();
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadDocuments(sessionId);
  }, [sessionId, loadDocuments]);

  // Poll for processing status updates
  useEffect(() => {
    const processingDocs = documents.filter(
      (d) => d.processing_status === 'pending' || d.processing_status === 'processing'
    );

    if (processingDocs.length > 0) {
      pollIntervalRef.current = setInterval(() => {
        processingDocs.forEach((doc) => refreshDocumentStatus(doc.id));
      }, 3000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [documents, refreshDocumentStatus]);

  const handleDelete = async (documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      await deleteDocument(documentId);
    }
  };

  if (isLoading && documents.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <Loading />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No documents uploaded yet</p>
        <p className="text-sm mt-1">Upload lecture notes to enhance AI responses</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <svg
              className="h-8 w-8 text-gray-400 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {doc.original_filename}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500">
                  {formatFileSize(doc.file_size)}
                </span>
                <StatusBadge status={doc.processing_status} />
                {doc.processing_status === 'completed' && doc.chunk_count > 0 && (
                  <span className="text-xs text-gray-500">
                    {doc.chunk_count} chunks
                  </span>
                )}
              </div>
              {doc.processing_error && (
                <p className="text-xs text-red-600 mt-1">{doc.processing_error}</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(doc.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Delete
          </Button>
        </div>
      ))}
    </div>
  );
};
