import React, { useState, useEffect, useCallback } from 'react';
import { useNoteStore } from '../../stores/noteStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { Note } from '../../types';

interface NoteEditorProps {
  sessionId: string;
  note?: Note | null;
  onSave?: () => void;
  onCancel?: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  sessionId,
  note,
  onSave,
  onCancel,
}) => {
  const { createNote, updateNote, isLoading } = useNoteStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content);
      setHasChanges(false);
    } else {
      setTitle('');
      setContent('');
      setHasChanges(false);
    }
  }, [note]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setHasChanges(true);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!content.trim()) return;

    try {
      if (note) {
        await updateNote(note.id, {
          title: title || undefined,
          content,
        });
      } else {
        await createNote(sessionId, {
          title: title || undefined,
          content,
        });
      }
      setHasChanges(false);
      onSave?.();
    } catch {
      // Error handled in store
    }
  };

  const handleCancel = () => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content);
    } else {
      setTitle('');
      setContent('');
    }
    setHasChanges(false);
    onCancel?.();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <Input
          value={title}
          onChange={handleTitleChange}
          placeholder="Note title (optional)"
          className="text-lg font-medium"
        />
      </div>

      <div className="flex-1 p-4">
        <textarea
          value={content}
          onChange={handleContentChange}
          placeholder="Start writing your notes..."
          className="w-full h-full resize-none border-0 focus:outline-none focus:ring-0 text-gray-900"
        />
      </div>

      <div className="flex justify-between items-center p-4 border-t border-gray-200">
        <div>
          {hasChanges && (
            <span className="text-sm text-gray-500">Unsaved changes</span>
          )}
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!content.trim() || !hasChanges}
            isLoading={isLoading}
          >
            {note ? 'Save Changes' : 'Create Note'}
          </Button>
        </div>
      </div>
    </div>
  );
};
