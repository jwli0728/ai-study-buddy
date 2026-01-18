export interface SourceReference {
  chunk_id: string;
  document_name: string;
  similarity: number;
}

export interface Message {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  sources: SourceReference[];
  created_at: string;
}

export interface ChatResponse {
  user_message_id: string;
  assistant_message_id: string;
  response: string;
  sources: SourceReference[];
}

export interface MessageListResponse {
  messages: Message[];
  total: number;
}
