import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useSessionStore } from '../../stores/sessionStore';

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateSessionModal: React.FC<CreateSessionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { createSession, isLoading } = useSessionStore();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const session = await createSession({
        title,
        subject: subject || undefined,
        description: description || undefined,
      });
      onClose();
      navigate(`/session/${session.id}`);
    } catch {
      // Error handled in store
    }
  };

  const handleClose = () => {
    setTitle('');
    setSubject('');
    setDescription('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Study Session">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Session Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Biology Chapter 5"
          required
        />

        <Input
          label="Subject (optional)"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g., Biology"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description for this study session..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Create Session
          </Button>
        </div>
      </form>
    </Modal>
  );
};
