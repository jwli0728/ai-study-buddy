import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useDocumentStore } from '../../stores/documentStore';

interface DocumentUploadProps {
  sessionId: string;
  onUploadComplete?: () => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  sessionId,
  onUploadComplete,
}) => {
  const { uploadDocument, uploadProgress, isLoading } = useDocumentStore();
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setError(null);
      for (const file of acceptedFiles) {
        try {
          await uploadDocument(sessionId, file);
          onUploadComplete?.();
        } catch (err: any) {
          setError(err.message || 'Failed to upload file');
        }
      }
    },
    [sessionId, uploadDocument, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isLoading,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        {isLoading ? (
          <div className="space-y-2">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
          </div>
        ) : (
          <>
            <svg
              className="mx-auto h-10 w-10 text-gray-400 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-gray-600">
              {isDragActive
                ? 'Drop files here...'
                : 'Drag & drop lecture notes, or click to select'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Supports PDF, TXT, MD, DOCX (max 10MB)
            </p>
          </>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
