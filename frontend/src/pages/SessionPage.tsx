import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSessionStore } from '../stores/sessionStore';
import { useNoteStore } from '../stores/noteStore';
import { useDocumentStore } from '../stores/documentStore';
import { ChatWindow } from '../components/chat/ChatWindow';
import { DocumentUpload } from '../components/documents/DocumentUpload';
import { DocumentList } from '../components/documents/DocumentList';
import { NoteList } from '../components/notes/NoteList';
import { NoteEditor } from '../components/notes/NoteEditor';
import { Button } from '../components/ui/Button';
import { Loading } from '../components/ui/Loading';
import type { Note } from '../types';

type Tab = 'chat' | 'documents' | 'notes';

export const SessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { currentSession, loadSession, deleteSession, isLoading } = useSessionStore();
  const { currentNote, setCurrentNote } = useNoteStore();
  const { loadDocuments, reset: resetDocuments } = useDocumentStore();
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [isEditingNote, setIsEditingNote] = useState(false);

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
      loadDocuments(sessionId);
    }
    return () => {
      resetDocuments();
    };
  }, [sessionId, loadSession, loadDocuments, resetDocuments]);

  const handleDeleteSession = async () => {
    if (window.confirm('Are you sure you want to delete this session? This cannot be undone.')) {
      await deleteSession(sessionId!);
      navigate('/dashboard');
    }
  };

  const handleSelectNote = (note: Note) => {
    setCurrentNote(note);
    setIsEditingNote(true);
  };

  const handleNewNote = () => {
    setCurrentNote(null);
    setIsEditingNote(true);
  };

  const handleNoteEditorClose = () => {
    setIsEditingNote(false);
    setCurrentNote(null);
  };

  if (isLoading || !currentSession) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'chat', label: 'Chat' },
    { id: 'documents', label: 'Documents' },
    { id: 'notes', label: 'Notes' },
  ];

  return (
    <div className="h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{currentSession.title}</h1>
          </div>
          {currentSession.subject && (
            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
              {currentSession.subject}
            </span>
          )}
          {currentSession.description && (
            <p className="text-gray-600 mt-1">{currentSession.description}</p>
          )}
        </div>
        <Button variant="danger" size="sm" onClick={handleDeleteSession}>
          Delete Session
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                pb-3 px-1 text-sm font-medium border-b-2 transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="h-[calc(100%-6rem)]">
        {activeTab === 'chat' && <ChatWindow sessionId={sessionId!} />}

        {activeTab === 'documents' && (
          <div className="space-y-4">
            <DocumentUpload
              sessionId={sessionId!}
              onUploadComplete={() => loadDocuments(sessionId!)}
            />
            <DocumentList sessionId={sessionId!} />
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="flex h-full gap-4">
            <div className="w-64 bg-white rounded-lg border border-gray-200 flex-shrink-0">
              <NoteList
                sessionId={sessionId!}
                onSelectNote={handleSelectNote}
                onNewNote={handleNewNote}
                selectedNoteId={currentNote?.id}
              />
            </div>
            <div className="flex-1 bg-white rounded-lg border border-gray-200">
              {isEditingNote ? (
                <NoteEditor
                  sessionId={sessionId!}
                  note={currentNote}
                  onSave={handleNoteEditorClose}
                  onCancel={handleNoteEditorClose}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <p>Select a note or create a new one</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
