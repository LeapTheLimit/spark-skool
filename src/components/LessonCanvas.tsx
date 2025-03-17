'use client';

import { useState, useRef } from 'react';
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { sendChatMessage, type ToolType, type ChatMessage } from '@/services/chatService';
import { toast } from 'react-hot-toast';
import RichTextEditor from './RichTextEditor';
import { useLanguage } from '@/contexts/LanguageContext';

interface LessonCanvasProps {
  content?: string;
  onClose: () => void;
  onSave: (content: string) => void;
}

export default function LessonCanvas({ content = '', onClose, onSave }: LessonCanvasProps) {
  const [editedContent, setEditedContent] = useState(content);
  const [revisionPrompt, setRevisionPrompt] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const { language } = useLanguage();
  const editorRef = useRef<any>(null);

  const handleAIEdit = async () => {
    if (!revisionPrompt.trim()) return;
    
    setIsRequesting(true);
    try {
      const messages: ChatMessage[] = [
        { role: 'assistant', content: editedContent },
        { role: 'user', content: `Please revise this content: ${revisionPrompt}` }
      ];
      
      const revisedContent = await sendChatMessage(messages, undefined);
      setEditedContent(revisedContent);
      
      // Update the editor content directly
      if (editorRef.current) {
        editorRef.current.setContent(revisedContent);
      }
      
      setRevisionPrompt('');
      toast.success('Content revised successfully');
    } catch (error) {
      console.error('AI revision failed:', error);
      toast.error('Failed to revise content');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-black">Edit Response</h2>
          <button onClick={onClose} className="text-black hover:text-gray-700">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 p-4 overflow-auto">
          <RichTextEditor 
            ref={editorRef}
            content={editedContent}
            onChange={setEditedContent}
          />
          
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={revisionPrompt}
              onChange={(e) => setRevisionPrompt(e.target.value)}
              placeholder="What would you like to revise? (e.g., 'Make it more concise')"
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              onKeyPress={(e) => e.key === 'Enter' && handleAIEdit()}
            />
            <button
              onClick={handleAIEdit}
              disabled={isRequesting || !revisionPrompt.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <SparklesIcon className="w-5 h-5" />
              {isRequesting ? 'Revising...' : 'Ask AI to revise'}
            </button>
          </div>
        </div>
        
        <div className="p-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-black hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(editedContent)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
} 