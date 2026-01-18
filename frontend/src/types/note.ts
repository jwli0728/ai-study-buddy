export interface Note {
  id: string;
  session_id: string;
  title: string | null;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface NoteCreate {
  title?: string;
  content: string;
}

export interface NoteUpdate {
  title?: string;
  content?: string;
  is_pinned?: boolean;
}

export interface NoteListResponse {
  notes: Note[];
  total: number;
}
