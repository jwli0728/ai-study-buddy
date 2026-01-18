export interface Session {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  subject: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface SessionCreate {
  title: string;
  description?: string;
  subject?: string;
}

export interface SessionUpdate {
  title?: string;
  description?: string;
  subject?: string;
  is_archived?: boolean;
}

export interface SessionListResponse {
  sessions: Session[];
  total: number;
}
