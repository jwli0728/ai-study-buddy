import React, { useEffect } from 'react';
import { useNoteStore } from '../../stores/noteStore';
import { Button } from '../ui/Button';
import { Loading } from '../ui/Loading';
import type { Note } from '../../types';

interface NoteListProps {
  sessionId: string;
  onSelectNote: (note: Note) => void;
  onNewNote: () => void;
  selectedNoteId?: string;
}

export const NoteList: React.FC<NoteListProps> = ({
  sessionId,
  onSelectNote,
  onNewNote,
  selectedNoteId,
}) => {
  const { notes, isLoading, loadNotes, deleteNote, pinNote, reset } = useNoteStore();

  useEffect(() => {
    loadNotes(sessionId);
    return () => reset();
  }, [sessionId, loadNotes, reset]);

  const handleDelete = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this note?')) {
      await deleteNote(noteId);
    }
  };

  const handlePin = async (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    await pinNote(note.id, !note.is_pinned);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading && notes.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <Loading />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-200">
        <Button onClick={onNewNote} className="w-full">
          + New Note
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500 px-4">
            <p>No notes yet</p>
            <p className="text-sm mt-1">Create a note to save your thoughts</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notes.map((note) => (
              <div
                key={note.id}
                onClick={() => onSelectNote(note)}
                className={`
                  p-3 cursor-pointer hover:bg-gray-50 transition-colors
                  ${selectedNoteId === note.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''}
                `}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      {note.is_pinned && (
                        <svg
                          className="h-3 w-3 text-blue-500 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                      )}
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {note.title || 'Untitled Note'}
                      </h4>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {note.content}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(note.updated_at)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => handlePin(e, note)}
                      className="p-1 text-gray-400 hover:text-blue-500"
                      title={note.is_pinned ? 'Unpin' : 'Pin'}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, note.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                      title="Delete"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
