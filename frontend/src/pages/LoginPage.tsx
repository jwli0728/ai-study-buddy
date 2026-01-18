import React from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { Card, CardBody } from '../components/ui/Card';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">AI Study Buddy</h1>
          <p className="text-gray-600 mt-2">Your AI-powered study assistant</p>
        </div>
        <Card>
          <CardBody>
            <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
              Sign in to your account
            </h2>
            <LoginForm />
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
