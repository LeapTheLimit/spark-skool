'use client';

import { useState, useEffect } from 'react';
import { ChatMessage } from '@/services/chatService';
import { useLanguage } from '@/contexts/LanguageContext';
import { ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface PreviewPanelProps {
  userId: string;
  onNewChat?: () => void;
  messages: ChatMessage[];
  onLoadChat?: (messages: ChatMessage[]) => void;
}

interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export default function PreviewPanel({ 
  userId, 
  onNewChat, 
  messages, 
  onLoadChat 
}: PreviewPanelProps) {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar' || language === 'he';
  const [chatHistory, setChatHistory] = useState<ChatConversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-save chat when messages change
  useEffect(() => {
    const autoSaveChat = async () => {
      // Only save when we have messages
      if (messages.length > 0) {
        try {
          // Find the first user message to use as title
          const firstUserMessage = messages.find(m => m.role === 'user');
          const title = firstUserMessage ? firstUserMessage.content.slice(0, 50) + '...' : 'New Conversation';

          const response = await fetch('/api/chat-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: messages, // Send all messages
              userId,
              title
            })
          });

          if (!response.ok) {
            throw new Error('Failed to save chat');
          }

          const data = await response.json();
          
          if (data.status === 'success') {
            // Update local chat history
            setChatHistory(prev => {
              // Check if this is an update to an existing conversation
              const existingIndex = prev.findIndex(conv => conv.id === data.conversation.id);
              
              if (existingIndex !== -1) {
                // Update existing conversation
                const updated = [...prev];
                updated[existingIndex] = data.conversation;
                return updated;
              }

              // Add new conversation at the beginning
              return [data.conversation, ...prev].slice(0, 10);
            });
          }
        } catch (error) {
          console.error('Failed to auto-save chat:', error);
        }
      }
    };

    autoSaveChat();
  }, [messages, userId]);

    // Load chat history
    const loadChatHistory = async () => {
      try {
      setIsLoading(true);
      const response = await fetch('/api/chat-history');
        if (response.ok) {
          const data = await response.json();
        // Remove duplicates when loading with proper type casting
        const uniqueConversations = Array.from(
          new Map(
            (data.conversations || [])
              .map((chat: ChatConversation) => [chat.messages[0]?.content, chat])
          ).values()
        ) as ChatConversation[];  // Explicitly cast the result to ChatConversation[]
        
        setChatHistory(uniqueConversations);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory();
  }, []);

  // Function to handle loading a chat
  const handleLoadChat = (chat: ChatConversation) => {
    if (onLoadChat && chat.messages.length > 0) {
      onLoadChat(chat.messages);
    }
  };

  return (
    <div className={`h-full bg-gray-50 border-l ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-gray-500" />
              <h2 className="font-medium text-gray-900 text-sm">
                {t('chatHistory')}
              </h2>
            </div>
            <button 
              onClick={onNewChat}
              className="flex items-center gap-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{t('newChat')}</span>
            </button>
          </div>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-4 text-gray-500">
              {t('loading')}...
                      </div>
          ) : chatHistory.length > 0 ? (
            <div className="space-y-2">
              {chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleLoadChat(chat)}
                  className="p-3 bg-white rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-gray-200"
                >
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {chat.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(chat.createdAt).toLocaleDateString(
                      language === 'ar' ? 'ar-SA' : 
                      language === 'he' ? 'he-IL' : 
                      undefined,
                      { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }
                      )}
                    </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              {t('noChatHistory')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 