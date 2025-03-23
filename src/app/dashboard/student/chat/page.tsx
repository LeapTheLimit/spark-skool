'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { 
  Cog6ToothIcon,
  PaperClipIcon,
  MicrophoneIcon,
  ClockIcon,
  TrashIcon,
  ArrowPathIcon
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

interface ChatHistoryItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  messages: ChatMessage[];
}

export default function ChatPage() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history on mount
  useEffect(() => {
    const storedHistory = localStorage.getItem('chatHistory');
    if (storedHistory) {
      setChatHistory(JSON.parse(storedHistory));
    }
  }, []);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      
      // Save to chat history
      saveToHistory(userMessage, aiMessage);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save chat to history
  const saveToHistory = (userMessage: ChatMessage, aiMessage: ChatMessage) => {
    const currentMessages = [...messages, userMessage, aiMessage];
    const newChat: ChatHistoryItem = {
      id: Date.now().toString(),
      title: userMessage.content.split('\n')[0].slice(0, 30),
      content: aiMessage.content,
      createdAt: new Date().toISOString(),
      messages: currentMessages
    };
    
    const updatedHistory = [newChat, ...chatHistory].slice(0, 20); // Keep only last 20 chats
    setChatHistory(updatedHistory);
    localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
  };
  
  // Load chat history
  const loadChat = (chat: ChatHistoryItem) => {
    setMessages(chat.messages);
    setShowHistory(false);
  };
  
  // Clear current chat
  const clearChat = () => {
    setMessages([]);
    toast.success('Chat cleared');
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-100/80 via-blue-50/30 to-violet-50/30">
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-6 mt-5">
        <span className="text-xl font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-transparent bg-clip-text">
          SPARK SKOOL
        </span>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 text-black hover:bg-indigo-50 rounded-xl"
          >
            <ClockIcon className="w-6 h-6" />
          </button>
          <button 
            onClick={clearChat}
            className="p-2 text-black hover:bg-indigo-50 rounded-xl"
          >
            <TrashIcon className="w-6 h-6" />
          </button>
          <button className="p-2 text-black hover:bg-indigo-50 rounded-xl">
            <Cog6ToothIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex h-[calc(100%-6rem)]">
        {/* History panel - only shown when history button is clicked */}
        {showHistory && (
          <div className="w-[280px] bg-white/80 h-full border-r border-gray-200 overflow-auto p-4">
            <h3 className="font-medium text-lg mb-4 text-black">Chat History</h3>
            
            {chatHistory.length === 0 ? (
              <p className="text-gray-500 text-sm">No saved chats yet</p>
            ) : (
              <div className="space-y-2">
                {chatHistory.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => loadChat(chat)}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="font-medium text-black truncate">{chat.title}</div>
                    <div className="text-xs text-gray-500">{new Date(chat.createdAt).toLocaleString()}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h2 className="text-xl font-medium text-black mb-2">How can I help you today?</h2>
              <p className="text-gray-600 max-w-md">Ask me anything about your school work, assignments, or any topic you're curious about!</p>
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex justify-${msg.role === 'assistant' ? 'start' : 'end'} mb-4`}>
                  <div className={`${msg.role === 'assistant' ? 'bg-white text-black' : 'bg-blue-500 text-white'} rounded-lg p-4 max-w-[80%] shadow-sm`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-white text-black rounded-lg p-4 max-w-[80%] shadow-sm flex items-center">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Chat input */}
      <div className="h-16 absolute bottom-0 left-0 right-0 px-4 pb-2">
        <div className="flex items-center gap-2 bg-white rounded-full p-2 shadow-md border border-gray-200">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden" 
            multiple
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
          >
            <PaperClipIcon className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleVoiceInput}
            className={`p-2 rounded-full hover:bg-gray-100 ${isListening ? 'text-red-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <MicrophoneWaveIcon isListening={isListening} />
          </button>
          
          <input 
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 bg-transparent text-black placeholder-gray-500 outline-none px-3 py-1.5 text-base"
          />
          
          <button 
            onClick={handleSendMessage}
            disabled={(!message.trim() && !isListening) || isLoading}
            className="p-2 bg-blue-500 hover:bg-blue-600 rounded-full transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 