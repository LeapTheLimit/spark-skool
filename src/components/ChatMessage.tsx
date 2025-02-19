'use client';

import { useState } from 'react';
import type { ChatMessage, MaterialCategory } from '@/services/chatService';
import { 
  EllipsisHorizontalIcon, 
  PencilIcon, 
  DocumentTextIcon, 
  ArrowDownTrayIcon,
  ClipboardDocumentIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import LessonCanvas from './LessonCanvas';
import { downloadAsPDF, saveToMaterials } from '@/services/chatService';
import { toast } from 'react-hot-toast';
import { MATERIALS_STORAGE_KEY } from '@/lib/constants';
import { triggerDashboardUpdate } from '@/services/dashboardService';

interface ChatMessageProps {
  message: ChatMessage;
  userId: string;
  onAIEdit?: (content: string) => void;
}

export default function ChatMessage({ message, userId, onAIEdit }: ChatMessageProps) {
  const [showCanvas, setShowCanvas] = useState(false);
  const [content, setContent] = useState(message.content);
  const [showActions, setShowActions] = useState(false);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);

  // Add state for material title if needed
  const [materialTitle, setMaterialTitle] = useState(`Material ${new Date().toLocaleDateString()}`);

  const wordCount = content.trim().split(/\s+/).length;
  const showEditCanvas = wordCount > 100;

  // Detect material category based on content
  const detectCategory = (content: string): MaterialCategory => {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('quiz') || lowerContent.includes('test') || lowerContent.includes('assessment')) {
      return 'quiz';
    } else if (lowerContent.includes('lesson') || lowerContent.includes('curriculum') || lowerContent.includes('plan')) {
      return 'lesson';
    }
    return 'other';
  };

  if (message.role !== 'assistant') {
    return (
      <div className="flex justify-end mb-4">
        <div className="bg-blue-500 text-white rounded-lg p-4 max-w-[80%]">
          <div className="whitespace-pre-wrap">{content}</div>
        </div>
      </div>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      // Add copy success notification
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleSaveToMaterials = async () => {
    try {
      const title = content.split('\n')[0].slice(0, 50);
      const category = detectCategory(content);
      
      const material = {
        id: `material:${Date.now()}`,
        content,
        category,
        title,
        createdAt: new Date().toISOString()
      };

      // Get existing materials
      const stored = localStorage.getItem(MATERIALS_STORAGE_KEY) || '[]';
      const materials = JSON.parse(stored);
      
      // Add new material at the beginning
      materials.unshift(material);
      
      // Keep only last 100 items
      const trimmed = materials.slice(0, 100);
      
      // Save back to localStorage
      localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(trimmed));
      
      // Trigger storage event for other tabs
      window.dispatchEvent(new Event('storage'));
      
      // After successful save
      triggerDashboardUpdate();
      toast.success('Material saved successfully');
    } catch (error) {
      console.error('Failed to save material:', error);
      toast.error('Failed to save material');
    }
  };

  const handleSaveChat = async () => {
    try {
      const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
      const newChat = {
        id: Date.now().toString(),
        title: content.split('\n')[0].slice(0, 50),
        content: content,
        createdAt: new Date().toISOString(),
        messages: [{ role: 'assistant', content }]
      };
      
      chatHistory.unshift(newChat);
      localStorage.setItem('chatHistory', JSON.stringify(chatHistory.slice(0, 100)));
      
      triggerDashboardUpdate();
      toast.success('Chat saved to history');
    } catch (error) {
      console.error('Failed to save chat:', error);
      toast.error('Failed to save chat');
    }
  };

  return (
    <div className="flex justify-start mb-4">
      <div className="bg-white rounded-lg p-4 max-w-[80%] shadow-sm">
        {/* AI Message Content - Changed to black text */}
        <div className="whitespace-pre-wrap mb-4 text-black">{content}</div>
        
        {/* Action Buttons */}
        <div className="border-t pt-3 mt-3 flex items-center gap-3">
          {/* Feedback Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFeedback(feedback === 'like' ? null : 'like')}
              className={`p-1.5 rounded-lg transition-colors ${
                feedback === 'like' 
                  ? 'bg-green-100 text-green-600' 
                  : 'text-gray-400 hover:text-black'
              }`}
            >
              <HandThumbUpIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setFeedback(feedback === 'dislike' ? null : 'dislike')}
              className={`p-1.5 rounded-lg transition-colors ${
                feedback === 'dislike' 
                  ? 'bg-red-100 text-red-600' 
                  : 'text-gray-400 hover:text-black'
              }`}
            >
              <HandThumbDownIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ClipboardDocumentIcon className="w-4 h-4" />
            Copy
          </button>

          {/* Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:bg-gray-100 rounded-lg transition-colors"
            >
              <EllipsisHorizontalIcon className="w-5 h-5" />
              Actions
              <ChevronDownIcon className="w-4 h-4" />
            </button>

            {showActions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                {showEditCanvas && (
                  <button
                    onClick={() => {
                      setShowCanvas(true);
                      setShowActions(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-black hover:bg-gray-100 w-full"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Edit in canvas
                  </button>
                )}
                <button
                  onClick={handleSaveToMaterials}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-black hover:bg-gray-100 w-full"
                >
                  <DocumentTextIcon className="w-4 h-4" />
                  Save to Materials
                </button>
                <button
                  onClick={async () => {
                    try {
                      await downloadAsPDF(content);
                      setShowActions(false);
                    } catch (error) {
                      console.error('Failed to download:', error);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-black hover:bg-gray-100 w-full"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Canvas Editor Modal */}
      {showCanvas && (
        <LessonCanvas
          content={content}
          onClose={() => setShowCanvas(false)}
          onSave={(newContent) => {
            setContent(newContent);
            setShowCanvas(false);
            if (onAIEdit) {
              onAIEdit(newContent);
            }
          }}
        />
      )}
    </div>
  );
} 