'use client';

import { useEffect, useState } from 'react';
import { ChatMessage } from '@/services/chatService';

interface ChatHistoryProps {
  userId: string;
  onSelectChat?: (messages: ChatMessage[]) => void;
}

interface HistoryItem {
  id: string;
  messages: ChatMessage[];
  title: string;
  createdAt: string;
}

interface HistoryResponse {
  history: {
    [key: string]: {
      messages: ChatMessage[];
      title: string;
      createdAt: string;
    }
  }
}

export default function ChatHistory({ userId, onSelectChat }: ChatHistoryProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/chat-history?userId=${userId}`);
        const data = await response.json() as HistoryResponse;
        
        if (data.history) {
          setHistory(Object.entries(data.history).map(([id, item]) => ({
            id,
            messages: item.messages,
            title: item.title,
            createdAt: item.createdAt
          })));
        }
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userId]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {loading ? (
        <div className="text-center text-gray-500">Loading history...</div>
      ) : history.length === 0 ? (
        <div className="text-center text-gray-500">No chat history yet</div>
      ) : (
        history.map((item) => (
          <button
            key={item.id}
            className="w-full text-left p-4 rounded-lg border hover:bg-gray-50 transition-colors"
            onClick={() => onSelectChat?.(item.messages)}
          >
            <div className="font-medium text-gray-900">{item.title}</div>
            <div className="text-sm text-gray-500">
              {new Date(item.createdAt).toLocaleDateString()}
            </div>
            <div className="text-sm text-gray-500 truncate mt-1">
              {item.messages[0].content}
            </div>
          </button>
        ))
      )}
    </div>
  );
} 