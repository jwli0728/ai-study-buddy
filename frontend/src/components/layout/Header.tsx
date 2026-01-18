import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/Button';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1
              className="text-xl font-bold text-blue-600 cursor-pointer"
              onClick={() => navigate('/dashboard')}
            >
              AI Study Buddy
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <>
                <span className="text-sm text-gray-600">
                  {user.full_name || user.email}
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
