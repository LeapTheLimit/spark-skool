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
  compactMode?: boolean;
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
  onLoadChat,
  compactMode
}: PreviewPanelProps) {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar' || language === 'he';
  const [chatHistory, setChatHistory] = useState<ChatConversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
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

  return (
    <div className={`flex flex-col h-full ${compactMode ? 'p-0' : 'p-4'}`}>
      {/* Header with title and new chat button */}
      {!compactMode && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-black">{t('chatHistory')}</h2>
          {onNewChat && (
            <button 
              onClick={onNewChat}
              className="p-1 rounded-md hover:bg-gray-100"
            >
              <XMarkIcon className="h-5 w-5 text-black" />
            </button>
          )}
                        </div>
                      )}

      {/* Display empty state if no chat history */}
      {chatHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center h-full p-4">
          <ClockIcon className="h-10 w-10 text-black mb-2" />
          <p className="text-black text-sm">{t('noChatHistory')}</p>
                    </div>
      ) : (
        <div className={`space-y-2 ${compactMode ? 'mt-2' : ''} overflow-y-auto flex-1`}>
          {/* Show chat history */}
          {chatHistory.map((chat) => {
            // Extract first user message as title or use default
            const firstUserMsg = chat.messages.find(m => m.role === 'user')?.content || 'Chat';
            const title = firstUserMsg.slice(0, compactMode ? 20 : 30) + (firstUserMsg.length > (compactMode ? 20 : 30) ? '...' : '');
            const date = new Date(chat.createdAt).toLocaleDateString(
              language === 'ar' ? 'ar-SA' : 
              language === 'he' ? 'he-IL' : 'en-US', 
              { month: 'short', day: 'numeric' }
            );
            
            return (
              <button
                key={chat.id}
                onClick={() => {
                  if (onLoadChat) onLoadChat(chat.messages);
                  setActiveChatId(chat.id);
                }}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  activeChatId === chat.id 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="font-medium text-black text-sm">{title}</div>
                <div className="flex justify-between items-center mt-1">
                  <div className="text-xs text-black flex items-center">
                    <ClockIcon className="h-3 w-3 mr-1" />
                    {date}
                  </div>
                  {!compactMode && (
                    <span className="text-xs text-black">{chat.messages.length} msgs</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
} 