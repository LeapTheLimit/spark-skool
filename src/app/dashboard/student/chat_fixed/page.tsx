'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { 
  Cog6ToothIcon,
  PaperClipIcon,
  MicrophoneIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { sendChatMessage, ChatMessage } from '@/services/chatService';

// Helper function to ensure timestamp is included
const createChatMessage = (role: 'user' | 'assistant', content: string): ChatMessage => {
  return {
    role,
    content,
    timestamp: (time: any) => time ? time : new Date().toISOString()
  };
};

// Define types for Speech Recognition
interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResults extends Array<SpeechRecognitionResult> {
  isFinal: boolean;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResults[];
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

// Add this new component for the microphone icon
const MicrophoneWaveIcon = ({ isListening }: { isListening: boolean }) => (
  <div className="relative w-6 h-6">
    <svg viewBox="0 0 24 24" fill="none" className={`w-6 h-6 ${isListening ? 'text-red-500' : 'text-gray-600'}`}>
      <path d="M12 4C10.8954 4 10 4.89543 10 6V12C10 13.1046 10.8954 14 12 14C13.1046 14 14 13.1046 14 12V6C14 4.89543 13.1046 4 12 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 12C8 14.2091 9.79086 16 12 16C14.2091 16 16 14.2091 16 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 16C7 16 8.5 18 12 18C15.5 18 17 16 17 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={isListening ? 'animate-pulse' : ''}/>
      <path d="M12 18V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    {isListening && (
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-20"></div>
        <div className="absolute inset-0 animate-pulse rounded-full bg-red-400 opacity-30"></div>
      </div>
    )}
  </div>
);

export default function ChatPage() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Pulse animation for active state
  const pulseVariants = {
    inactive: { scale: 1, opacity: 0.9 },
    active: {
      scale: [1, 1.2, 1],
      opacity: [0.9, 0.7, 0.9],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Listening wave animation
  const waveVariants = {
    listening: {
      scale: [1, 1.2, 1],
      opacity: [0.3, 0.7, 0.3],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Handle voice input
  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
      return;
    }

    if (!('webkitSpeechRecognition' in window)) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }

    try {
      recognitionRef.current = new (window as any).webkitSpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        toast.success('Listening...', { id: 'listening' });
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join(' ');
        
        setMessage(prev => prev + ' ' + transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        stopListening();
        toast.error('Speech recognition failed');
      };

      recognitionRef.current.onend = () => {
        stopListening();
      };

      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      toast.error('Failed to start speech recognition');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      toast.dismiss('listening');
    }
    setIsListening(false);
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    try {
      const formData = new FormData();
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!allowedTypes.includes(file.type)) {
          toast.error(`${file.name} is not a supported file type`);
          continue;
        }

        // Validate file size
        if (file.size > maxSize) {
          toast.error(`${file.name} is too large (max 5MB)`);
          continue;
        }

        formData.append('files', file);
      }

      if (formData.has('files')) {
        setIsLoading(true);
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) throw new Error('Upload failed');
        
        const data = await response.json();
        setMessage(prev => prev + ' ' + data.text); // Append extracted text to message
        toast.success('Files processed successfully');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to process files');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input
      }
    }
  };

  // Send message function
  const handleSendMessage = async () => {
    if (!message.trim() && !isListening) return;

    const userMessage = createChatMessage('user', message);

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage([...messages, userMessage]);
      const aiMessage = createChatMessage('assistant', response);
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  // Add the rest of your component here for the return statement
  // This will depend on your specific UI implementation

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-100/80 via-blue-50/30 to-violet-50/30">
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-6 mt-5">
        <span className="text-xl font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-transparent bg-clip-text">
          SPARK SKOOL
        </span>
        <button className="p-2 text-indigo-600/80 hover:bg-indigo-50 rounded-xl">
          <Cog6ToothIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Rest of your component implementation */}
    </div>
  );
} 