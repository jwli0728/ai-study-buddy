import React, { useEffect, useState } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { SessionCard } from './SessionCard';
import { CreateSessionModal } from './CreateSessionModal';
import { Button } from '../ui/Button';
import { Loading } from '../ui/Loading';

export const SessionList: React.FC = () => {
  const { sessions, isLoading, loadSessions } = useSessionStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  if (isLoading && sessions.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Study Sessions</h2>
        <Button onClick={() => setShowCreateModal(true)}>
          + New Session
        </Button>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-16 w-16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No study sessions yet
          </h3>
          <p className="text-gray-600 mb-4">
            Create your first study session to get started
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            Create Your First Session
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}

      <CreateSessionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};
