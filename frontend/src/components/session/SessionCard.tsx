import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody } from '../ui/Card';
import type { Session } from '../../types';

interface SessionCardProps {
  session: Session;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session }) => {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card
      className="hover:border-blue-300"
      onClick={() => navigate(`/session/${session.id}`)}
    >
      <CardBody>
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {session.title}
            </h3>
            {session.subject && (
              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                {session.subject}
              </span>
            )}
            {session.description && (
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                {session.description}
              </p>
            )}
          </div>
          {session.is_archived && (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
              Archived
            </span>
          )}
        </div>
        <div className="mt-3 text-xs text-gray-500">
          Created {formatDate(session.created_at)}
        </div>
      </CardBody>
    </Card>
  );
};
