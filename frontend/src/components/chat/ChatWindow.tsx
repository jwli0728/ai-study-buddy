import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Loading } from '../ui/Loading';

interface ChatWindowProps {
  sessionId: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ sessionId }) => {
  const { messages, isLoading, isSending, loadMessages, sendMessage, reset } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages(sessionId);
    return () => reset();
  }, [sessionId, loadMessages, reset]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (content: string) => {
    await sendMessage(sessionId, content);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loading />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-8">
            <svg
              className="h-12 w-12 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-lg font-medium">Start a conversation</p>
            <p className="text-sm mt-1">
              Ask questions about your study materials or any topic
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center gap-2">
                  <Loading size="sm" />
                  <span className="text-gray-600 text-sm">AI is thinking...</span>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSend={handleSend} disabled={isSending} />
    </div>
  );
};
