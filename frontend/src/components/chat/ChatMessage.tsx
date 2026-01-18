import React from 'react';
import type { Message } from '../../types';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          max-w-[80%] rounded-lg px-4 py-2
          ${isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}
        `}
      >
        <div className="whitespace-pre-wrap break-words">{message.content}</div>

        {/* Source citations */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Sources:</p>
            <div className="flex flex-wrap gap-1">
              {message.sources.map((source, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded"
                  title={`Similarity: ${(source.similarity * 100).toFixed(1)}%`}
                >
                  {source.document_name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
