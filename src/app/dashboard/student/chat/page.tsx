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

    const userMessage: ChatMessage = {
      role: 'user',
      content: message
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      // Updated to match the new function signature
      const response = await sendChatMessage(
        [...messages, userMessage]  // Just pass messages array
      );

      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: response
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* Title Section */}
      <div className="absolute top-[20%] left-0 right-0 text-center">
        <h1 className="text-3xl font-medium text-gray-500">
          {isListening ? "Listening..." : (
            <>Want to visualize{" "}<span className="text-indigo-500">what&apos;s on your mind?</span></>
          )}
        </h1>
      </div>

      {/* Interactive Orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div 
          className="relative w-32 h-32 cursor-pointer backdrop-blur-xl"
          onClick={() => {
            setIsListening(!isListening);
          }}
        >
          <AnimatePresence mode="wait">
            {!isListening ? (
              // Normal Idle State
              <>
                <motion.div
                  key="idle-orb"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 8,
                    ease: "linear",
                    repeat: Infinity,
                  }}
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 opacity-90 blur-xl"
                />
                <motion.div
                  variants={pulseVariants}
                  animate="inactive"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-blue-400 opacity-70 blur-lg"
                />
              </>
            ) : (
              // Listening State
              <motion.div
                key="listening"
                className="flex items-center justify-center gap-1 h-full"
              >
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: ["40%", "100%", "40%"],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                    className="w-3 bg-indigo-400 rounded-full opacity-70"
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Messages Section */}
      <div className="absolute inset-x-0 top-0 bottom-[80px] overflow-y-auto p-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
          >
            <div
              className={`inline-block max-w-[80%] p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-indigo-500 text-white' 
                  : 'bg-white text-gray-900'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-center">
            <div className="inline-block px-4 py-2 bg-gray-100 rounded-full">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Chat Bar */}
      <div className="fixed bottom-[80px] left-4 right-4">
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xl rounded-2xl p-2 shadow-lg 
          border border-white/40">
          
          {/* Left Side Buttons */}
          <div className="flex items-center gap-1">
            {/* File Upload */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              multiple
              accept=".jpg,.jpeg,.png,.gif,.pdf"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50 text-gray-500"
              title="Upload files"
            >
              <PaperClipIcon className="w-5 h-5" />
            </button>

            {/* Voice Input */}
            <button
              onClick={handleVoiceInput}
              disabled={isLoading}
              className={`p-2 rounded-xl transition-all duration-200 ${
                isListening 
                  ? 'bg-red-100 text-red-500' 
                  : 'hover:bg-gray-100 text-gray-500'
              }`}
              title={isListening ? 'Stop recording' : 'Start voice input'}
            >
              <MicrophoneIcon className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
            </button>
        </div>

          {/* Text Input */}
          <div className="flex-1 relative">
          <input
            type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder="Ask anything..."
              className="w-full px-4 py-2 bg-gray-100/50 rounded-xl focus:outline-none focus:bg-gray-100 
                text-gray-600 text-sm placeholder-gray-400 transition-colors"
            />
            {isListening && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Send Button */}
          <button 
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
            className="p-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-colors 
              disabled:opacity-50 disabled:hover:bg-indigo-500"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-4-4l4 4-4 4" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 