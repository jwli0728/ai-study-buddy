export interface Document {
  id: string;
  session_id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_error: string | null;
  chunk_count: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
}

export interface DocumentStatusResponse {
  id: string;
  processing_status: string;
  processing_error: string | null;
  chunk_count: number;
}
