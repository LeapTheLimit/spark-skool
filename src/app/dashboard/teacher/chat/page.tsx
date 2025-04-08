'use client';
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-hooks/exhaustive-deps */

import PreviewPanel from '@/components/layout/PreviewPanel';
import { useState, useRef, useEffect, useMemo, useCallback, KeyboardEvent } from 'react';
import { sendChatMessage, type ChatMessage, type ToolType, getTranslatedPrompts } from '@/services/chatService';
import { generateLessonPlan, processUploadedFiles } from '@/services/lessonService';
import { XMarkIcon, PaperClipIcon, MicrophoneIcon, ArrowUpIcon, LightBulbIcon, SparklesIcon, FolderIcon, DocumentMagnifyingGlassIcon, CursorArrowRippleIcon, PencilSquareIcon, LinkIcon, ArrowUturnLeftIcon, FaceSmileIcon, CogIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import SaveMaterialButton from '@/components/SaveMaterialButton';
import AIEditorModal from '@/components/AIEditorModal';
import ChatMessageComponent from '@/components/ChatMessage';
import { toast } from 'react-hot-toast';
import { triggerDashboardUpdate } from '@/services/dashboardService';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { DocumentIcon, ClipboardIcon, ChatBubbleLeftIcon, PuzzlePieceIcon } from '@heroicons/react/24/outline';
import SparkMascot from '@/components/SparkMascot';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface TeacherPreferences {
  teachingStyle?: string;
  gradeLevel?: string;
  curriculum?: string;
  languagePreference?: string;
  specialNeeds?: boolean;
  preferredTools?: string[];
  classDetails?: {
    size: number;
    level: string;
    subjects: string[];
    specialConsiderations?: string[];
  };
  lastOnboarding?: string;
}

// Update the type for RouteImpl
type RouteImpl<T extends string> = T;

// Add proper type for the href attribute
const href: RouteImpl<'/dashboard/teacher/chat/history'> = '/dashboard/teacher/chat/history';

// Add new interfaces for enhanced chat features
interface SuggestedPrompt {
  text: string;
  icon: JSX.Element;
  category: string;
}

interface AutocompleteOption {
  text: string;
  category: string;
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

// Helper function to ensure timestamp is included
const createChatMessage = (role: 'user' | 'assistant', content: string, language?: string): ChatMessage => {
  return {
    role,
    content,
    language: language as any, // Cast to any to bypass type checking temporarily
    timestamp: (time: any) => time ? time : new Date().toISOString() // Return the time parameter if provided, otherwise return current time
  };
};

// Separate LessonCanvas component
const LessonCanvas = ({ 
  lessonData, 
  editorContent, 
  setEditorContent, 
  generatedPlan, 
  setGeneratedPlan,
  setMessages, 
  setShowLessonCanvas, 
  triggerDashboardUpdate 
}: { 
  lessonData: any;
  editorContent: string;
  setEditorContent: (content: string) => void;
  generatedPlan: any;
  setGeneratedPlan: (plan: any) => void;
  setMessages: (fn: (prev: ChatMessage[]) => ChatMessage[]) => void;
  setShowLessonCanvas: (show: boolean) => void;
  triggerDashboardUpdate: () => void;
}) => {
  const [editorChat, setEditorChat] = useState('');
  const [editorChatMessages, setEditorChatMessages] = useState<ChatMessage[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const editorChatEndRef = useRef<HTMLDivElement>(null);

  // Separate scroll for editor chat
  useEffect(() => {
    editorChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [editorChatMessages]);

  // Update editor chat handler
  const handleEditorChat = async () => {
    if (!editorChat.trim()) return;

    const userMessage = editorChat;
    setEditorChat('');
    
    setEditorChatMessages(prev => [...prev, 
      createChatMessage('user', userMessage),
      createChatMessage('assistant', "Revising lesson plan... ✍️")
    ]);

    setIsEditing(true);
    try {
      const response = await fetch('/api/ai-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: userMessage,
          currentContent: editorContent
        })
      });

      console.log('AI Edit Response:', response.status, await response.text());
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const { revisedContent } = await response.json();
      console.log('Revised Content:', revisedContent);
      
      if (revisedContent) {
        setEditorContent(revisedContent);
        setGeneratedPlan((prev: any) => ({
          ...prev,
          plan: revisedContent,
          status: prev?.status || 'success'
        }));
      }
      setEditorChatMessages(prev => [
        ...prev.slice(0, -1), 
        createChatMessage('assistant', "Here's your revised lesson plan:")
      ]);
    } catch (error) {
      console.error('Revision Error:', error);
      setEditorChatMessages(prev => [
        ...prev.slice(0, -1), 
        createChatMessage('assistant', "⚠️ Revision failed. Please try again.")
      ]);
    } finally {
      setIsEditing(false);
    }
  };

  const handleSaveLesson = async () => {
    try {
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: lessonData.topic,
          content: editorContent,
          gradeLevel: lessonData.gradeLevel,
          duration: lessonData.duration
        })
      });

      if (response.ok) {
        setMessages(prev => [...prev, 
          createChatMessage('assistant', "✅ Lesson saved successfully!")
        ]);
        setShowLessonCanvas(false);
      }
      triggerDashboardUpdate();
    } catch (error) {
      setMessages(prev => [...prev, 
        createChatMessage('assistant', "❌ Failed to save lesson. Please try again.")
      ]);
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editorContent,
          title: lessonData.topic
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${lessonData.topic}-lesson-plan.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      triggerDashboardUpdate();
    } catch (error) {
      setMessages(prev => [...prev, 
        createChatMessage('assistant', "❌ PDF export failed. Please try again.")
      ]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      {/* Lesson Canvas content */}
    </div>
  );
};

// TypeWriter component for animated text display
const TypeWriterEffect = ({ content }: { content: string }) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (currentIndex < content.length) {
      const timeout = setTimeout(() => {
        setDisplayedContent(prev => prev + content[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 10); // Speed of typing (lower = faster)
      
      return () => clearTimeout(timeout);
    }
  }, [content, currentIndex]);
  
  // Reset animation when content changes
  useEffect(() => {
    setDisplayedContent('');
    setCurrentIndex(0);
  }, [content]);
  
  return <div className="whitespace-pre-wrap">{displayedContent}</div>;
};

// Icon component for presentations
const PresentationIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
  </svg>
);

export default function TeacherChat() {
  const { language, t } = useLanguage();
  const { settings: themeSettings } = useTheme();
  const isRTL = language === 'ar' || language === 'he';
  const isDarkMode = themeSettings?.theme === 'dark';

  // All state declarations
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [selectedTool, setSelectedTool] = useState<ToolType | undefined>(undefined);
  const [hasStartedConversation, setHasStartedConversation] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [teacher, setTeacher] = useState<any>(null);
  const [preferences, setPreferences] = useState<TeacherPreferences>({
    teachingStyle: 'conversational',
    gradeLevel: '9-12',
    curriculum: 'standard',
    languagePreference: language,
    specialNeeds: false,
    preferredTools: ['lessonPlanning', 'assessment'],
    classDetails: {
      size: 25,
      level: 'high',
      subjects: ['general'],
      specialConsiderations: []
    },
    lastOnboarding: new Date().toISOString()
  });
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [lessonData, setLessonData] = useState<{
    topic: string;
    gradeLevel: string;
    objectives: string[];
    resources: File[];
    duration: string;
  }>({
    topic: '',
    gradeLevel: '9-12',
    objectives: [],
    resources: [],
    duration: '60'
  });
  const [workflowStep, setWorkflowStep] = useState<number>(0);
  const [showLessonCanvas, setShowLessonCanvas] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<{
    plan: string;
    status: string;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [showAIEditor, setShowAIEditor] = useState(false);
  const [draftContent, setDraftContent] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [aiTaskStatus, setAiTaskStatus] = useState<{
    current?: {
      task: string;
      progress: number;
    };
    completed?: {
      task: string;
      result: string;
    }[];
  }>({
    completed: []
  });
  const [showHistory, setShowHistory] = useState(false);

  // New state declarations for enhanced features
  const [suggestedPrompts, setSuggestedPrompts] = useState<SuggestedPrompt[]>([]);
  const [isAutocompleting, setIsAutocompleting] = useState(false);
  const [autocompleteOptions, setAutocompleteOptions] = useState<AutocompleteOption[]>([]);
  const [selectedAutocompleteIndex, setSelectedAutocompleteIndex] = useState(0);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [fileUploadProgress, setFileUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [currentView, setCurrentView] = useState<'chat' | 'search' | 'history'>('chat');
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [chatActions, setChatActions] = useState<{id: string, action: string, isComplete: boolean}[]>([]);
  const [uploadedFileContent, setUploadedFileContent] = useState<string>('');
  const [chatThreads, setChatThreads] = useState<{id: string, title: string, lastUpdated: Date}[]>([]);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add translations for chat interface
  const chatTranslations = {
    en: {
      startPrompt: "What would you like to teach today?",
      lessonPlanning: "Lesson Planning",
      assessmentGenerator: "Assessment Generator",
      studentFeedback: "Student Feedback",
      activityCreator: "Activity Creator",
      typeMessage: "Type a message...",
      sending: "Sending...",
      uploadFile: "Upload File",
      newChat: "New Chat"
    },
    ar: {
      startPrompt: "ماذا تريد أن تدرّس اليوم؟",
      lessonPlanning: "تخطيط الدرس",
      assessmentGenerator: "إنشاء التقييم",
      studentFeedback: "تقييم الطلاب",
      activityCreator: "إنشاء النشاط",
      typeMessage: "اكتب رسالة...",
      sending: "جاري الإرسال...",
      uploadFile: "رفع ملف",
      newChat: "محادثة جديدة"
    },
    he: {
      startPrompt: "מה תרצה ללמד היום?",
      lessonPlanning: "תכנון שיעור",
      assessmentGenerator: "יצירת הערכה",
      studentFeedback: "משוב לתלמידים",
      activityCreator: "יצירת פעילות",
      typeMessage: "הקלד הודעה...",
      sending: "שולח...",
      uploadFile: "העלאת קובץ",
      newChat: "צ'אט חדש"
    }
  };

  // Create dynamic action commands that include the subject
  const actionCommands = useMemo(() => {
    const subject = teacher?.subject || '';
    
    return [
      {
        title: t('lessonPlanning'),
        description: t('lessonPlanningDesc', { subject }),
        type: 'Lesson Planning' as ToolType,
        icon: <DocumentIcon className="w-6 h-6 text-blue-600" />
      },
      {
        title: t('assessmentGenerator'),
        description: t('assessmentDesc', { subject }),
        type: 'Assessment Generator' as ToolType,
        icon: <ClipboardIcon className="w-6 h-6 text-purple-600" />
      },
      {
        title: t('studentFeedback'),
        description: t('feedbackDesc', { subject }),
        type: 'Student Feedback' as ToolType,
        icon: <ChatBubbleLeftIcon className="w-6 h-6 text-green-600" />
      },
      {
        title: t('activityCreator'),
        description: t('activityDesc', { subject }),
        type: 'Activity Creator' as ToolType,
        icon: <PuzzlePieceIcon className="w-6 h-6 text-orange-600" />
      }
    ];
  }, [t, teacher]);

  // All useEffects
  useEffect(() => {
    const loadTeacherData = () => {
      try {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
          setTeacher(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Failed to load teacher data:', error);
      }
    };

    loadTeacherData();
  }, []);

  // Onboarding questions with teacher data
  const onboardingQuestions = [
    {
      question: "What's your preferred teaching style?",
      options: ['Interactive', 'Lecture-based', 'Project-based', 'Blended', 'Differentiated'],
      field: 'teachingStyle',
      description: 'This helps AI adapt its suggestions to your teaching approach'
    },
    {
      question: "What grade level do you teach?",
      options: ['Elementary', 'Middle School', 'High School', 'Multiple Levels'],
      field: 'gradeLevel',
      description: 'AI will adjust content complexity accordingly'
    },
    {
      question: "What curriculum do you follow?",
      options: ['Common Core', 'IB', 'National Standards', 'State-specific', 'Custom'],
      field: 'curriculum'
    },
    {
      question: "What's your preferred language for teaching materials?",
      options: ['English', 'Arabic', 'Hebrew', 'Bilingual'],
      field: 'languagePreference'
    },
    {
      question: "Do you have students with special educational needs?",
      options: ['Yes', 'No'],
      field: 'specialNeeds'
    },
    {
      question: "What's your average class size?",
      options: ['Small (1-15)', 'Medium (16-25)', 'Large (26+)'],
      field: 'classSize'
    },
    {
      question: "Which tools do you frequently use?",
      options: ['Presentations', 'Interactive Whiteboards', 'Digital Assessments', 'Educational Games', 'Virtual Labs'],
      field: 'preferredTools',
      multiple: true
    }
  ];

  // Add this function to save preferences
  const saveTeacherPreferences = (preferences: TeacherPreferences) => {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        user.preferences = preferences;
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Also save to appSettings for language preference
        const appSettings = JSON.parse(localStorage.getItem('appSettings') || '{}');
        appSettings.language = preferences.languagePreference?.toLowerCase() === 'arabic' ? 'ar' : 
                             preferences.languagePreference?.toLowerCase() === 'hebrew' ? 'he' : 'en';
        localStorage.setItem('appSettings', JSON.stringify(appSettings));
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  // Update the handleOnboardingAnswer function
  const handleOnboardingAnswer = useCallback((answer: string | string[]) => {
    const currentQuestion = onboardingQuestions[onboardingStep];
    const updatedPreferences = {
      ...preferences,
      [currentQuestion.field]: answer,
      lastOnboarding: new Date().toISOString()
    };

    if (onboardingStep < onboardingQuestions.length - 1) {
      setOnboardingStep(prev => prev + 1);
      setPreferences(updatedPreferences);
    } else {
      saveTeacherPreferences(updatedPreferences);
      setPreferences(updatedPreferences);
      setIsOnboarding(false);
    }
  }, [onboardingStep, preferences, onboardingQuestions]);

  // Add handleAIEdit function
  const handleAIEdit = useCallback(async (messageIndex: number, newContent: string) => {
    setMessages(prev => prev.map((msg, idx) => 
      idx === messageIndex ? { ...msg, content: newContent } : msg
    ));
    triggerDashboardUpdate();
  }, []);

  // Add handleNewChat function
  const handleNewChat = useCallback(() => {
    setMessages([]);
    setHasStartedConversation(false);
    setSelectedTool(undefined);
    triggerDashboardUpdate();
  }, []);

  // Add handleLoadChat function
  const handleLoadChat = useCallback((loadedMessages: ChatMessage[]) => {
    setMessages(loadedMessages);
    setHasStartedConversation(true);
    triggerDashboardUpdate();
  }, []);

  // Show onboarding if needed
  if (isOnboarding) {
    const currentQuestion = onboardingQuestions[onboardingStep];
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2 text-black">
              Let's personalize your experience
            </h1>
            <p className="text-black/70">
              Step {onboardingStep + 1} of {onboardingQuestions.length}
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-xl">
            <h2 className="text-xl mb-4 text-black">{currentQuestion.question}</h2>
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleOnboardingAnswer(option)}
                  className="w-full p-4 text-left bg-white rounded-lg border 
                    hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <span className="text-black">{option}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesEndRef]);

  const AI_EDITOR_TRIGGER_WORD_COUNT = 100;

  const checkForAutoEdit = useCallback((text: string) => {
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount >= AI_EDITOR_TRIGGER_WORD_COUNT) {
      setDraftContent(text);
      setShowAIEditor(true);
    }
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = createChatMessage('user', message, language);

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);
    setHasStartedConversation(true);
    setIsThinking(true);

    try {
      // Check if the message is a search query
      if (message.toLowerCase().includes('search for') || 
          message.toLowerCase().includes('find information') ||
          message.toLowerCase().includes('look up')) {
        await performWebSearch(message);
        return;
      }
      
      // If the message contains keywords indicating a task request
      if (message.toLowerCase().includes('create') || 
          message.toLowerCase().includes('generate') ||
          message.toLowerCase().includes('make')) {
        updateTaskStatus('started', message);
      }
      
      const response = await sendChatMessage([...messages, userMessage]);
      
      // Add a small delay before showing the response for a more natural flow
      setTimeout(() => {
        const aiMessage = createChatMessage('assistant', response, language);
        setMessages(prev => [...prev, aiMessage]);
        
        // If we started a task, complete it
        if (aiTaskStatus.current) {
          updateTaskStatus('completed', aiTaskStatus.current.task, 'Added to materials');
        }
        
        setIsThinking(false);
        setIsLoading(false);
        
        // Generate contextual suggestions based on the response
        generateContextualSuggestions(response);
      }, 800); // Reduced from 4000ms to 800ms for better UX
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      setIsThinking(false);
      setIsLoading(false);
    }
  }, [message, isLoading, messages, language, aiTaskStatus]);
  
  // Function to handle web searches
  const performWebSearch = useCallback(async (query: string) => {
    const searchQuery = query.replace(/search for|find information|look up/gi, '').trim();
    
    setIsSearching(true);
    
    // Process and show search message
    const searchUserMessage = createChatMessage('user', `Searching for: ${searchQuery}`);
    setMessages(prev => [...prev, searchUserMessage]);
    
    try {
      // Import the web search function from chatService
      const { searchWithinChat } = await import('@/services/chatService');
      
      // Show initial search message
      const initialSearchMessage = createChatMessage(
        'assistant',
        `I'm searching the web for the most current information about "${searchQuery}"...`
      );
      setMessages(prev => [...prev, initialSearchMessage]);
      
      // Perform the actual search
      const searchResults = await searchWithinChat(searchQuery);
      
      // Update the message with results
      const updatedSearchMessage = createChatMessage(
        'assistant', 
        `I've found some up-to-date information about "${searchQuery}" from multiple sources:\n\n${searchResults}`
      );
      
      // Replace the searching message with results
      setMessages(prev => [
        ...prev.slice(0, prev.length - 1), // Remove the "searching" message
        updatedSearchMessage
      ]);
      
      // Store the results in state for potential UI display
      const parsedResults = extractSearchResultsFromText(searchResults);
      setSearchResults(parsedResults);
    } catch (error) {
      console.error('Search error:', error);
      setMessages(prev => [
        ...prev.slice(0, prev.length - 1), // Remove the "searching" message
        createChatMessage('assistant', "I'm sorry, I encountered an issue while searching online. Let me try to answer based on my existing knowledge instead.")
      ]);
    } finally {
      setIsSearching(false);
      setIsThinking(false);
      setIsLoading(false);
    }
  }, []);
  
  // Helper function to extract search results from text response
  const extractSearchResultsFromText = useCallback((text: string): SearchResult[] => {
    const results: SearchResult[] = [];
    
    // Extract search results using regex pattern matching
    // This is a simple implementation - could be enhanced with better parsing
    const regex = /\[(\d+)\]\s+\*\*(.+?)\*\*\n(.*?)\nSource:\s+\[(.+?)\]\((.+?)\)/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      results.push({
        title: match[2],
        snippet: match[3],
        source: match[4],
        url: match[5]
      });
    }
    
    return results;
  }, []);
  
  // Function to generate contextual suggestions based on AI response
  const generateContextualSuggestions = useCallback((response: string) => {
    const subject = teacher?.subject || '';
    const newSuggestions: SuggestedPrompt[] = [];
    
    // Generate suggestions based on response content
    if (response.toLowerCase().includes('lesson plan') || 
        response.toLowerCase().includes('curriculum') || 
        response.toLowerCase().includes('teaching')) {
      newSuggestions.push({
        text: "Convert this into a printable worksheet",
        icon: <DocumentTextIcon className="w-4 h-4" />,
        category: 'document'
      });
    }
    
    if (response.toLowerCase().includes('assessment') || response.toLowerCase().includes('quiz')) {
      newSuggestions.push({
        text: 'Generate more questions on this topic',
        icon: <ClipboardIcon className="w-4 h-4" />,
        category: 'assessment'
      });
    }
    
    if (response.length > 200) {
      newSuggestions.push({
        text: 'Summarize this into key points',
        icon: <LightBulbIcon className="w-4 h-4" />,
        category: 'summary'
      });
    }
    
    // Default follow-up
    newSuggestions.push({
      text: 'Search for additional resources',
      icon: <DocumentMagnifyingGlassIcon className="w-4 h-4" />,
      category: 'search'
    });
    
    setSuggestedPrompts(newSuggestions);
  }, [teacher]);

  const handleToolClick = useCallback(async (tool: ToolType) => {
    if (isLoading) return;
    
    const prompts = getTranslatedPrompts(language, teacher?.subject || '');
    let prompt = '';
    
    switch (tool) {
      case 'Lesson Planning':
        prompt = prompts.lessonPlan;
        break;
      case 'Assessment Generator':
        prompt = prompts.quiz;
        break;
      case 'Student Feedback':
        prompt = prompts.feedback;
        break;
      case 'Activity Creator':
        prompt = prompts.activity;
        break;
    }

    const userMessage = createChatMessage('user', prompt, language);

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);
    setHasStartedConversation(true);
    setIsThinking(true);

    try {
      const response = await sendChatMessage([userMessage]);
      const aiMessage = createChatMessage('assistant', response, language);
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
      setIsThinking(false);
    }
  }, [isLoading, language, teacher]);

  const handleFileUploadForLesson = useCallback(async (files: File[]) => {
    if (workflowStep === 4) {
      const extractedText = await processUploadedFiles(files);
      setLessonData(prev => ({
        ...prev,
        resources: [...prev.resources, ...files],
        resourcesText: extractedText
      }));
      setMessages(prev => [...prev,
        createChatMessage('user', `Uploaded ${files.length} files`),
        createChatMessage('assistant', "Files processed! Anything else or type 'next'")
      ]);
    }
    triggerDashboardUpdate();
  }, [workflowStep]);

  // Function to update task status
  const updateTaskStatus = useCallback((status: 'started' | 'completed', task: string, result?: string) => {
    if (status === 'started') {
      setAiTaskStatus(prev => ({
        ...prev,
        current: {
          task,
          progress: 0
        }
      }));
      
      // Simulate progress updates
      const interval = setInterval(() => {
        setAiTaskStatus(prev => {
          if (!prev.current) return prev;
          
          const newProgress = prev.current.progress + 10;
          if (newProgress >= 100) {
            clearInterval(interval);
            return prev;
          }
          
          return {
            ...prev,
            current: {
              ...prev.current,
              progress: newProgress
            }
          };
        });
      }, 500);
      
    } else if (status === 'completed') {
      setAiTaskStatus(prev => ({
        current: undefined,
        completed: [
          { task, result: result || 'Task completed' },
          ...(prev.completed || []).slice(0, 4) // Keep only the 5 most recent
        ]
      }));
    }
  }, []);

  // New handler for autocomplete
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputValue = e.target.value;
    setMessage(inputValue);
    
    // Check if we should show autocomplete
    if (inputValue.length > 2 && !isLoading) {
      // Generate autocomplete suggestions based on input and context
      const options: AutocompleteOption[] = [];
      const subject = teacher?.subject || '';
      
      // Subject-specific completions
      if (inputValue.toLowerCase().includes('create') || inputValue.toLowerCase().includes('make')) {
        options.push({
          text: `Create a ${subject} lesson plan for next week`,
          category: 'creation'
        });
        options.push({
          text: `Create a ${subject} assessment for chapter 5`,
          category: 'creation'
        });
      }
      
      // Teaching-related completions
      if (inputValue.toLowerCase().includes('how')) {
        options.push({
          text: `How can I make my ${subject} lessons more engaging?`,
          category: 'teaching'
        });
        options.push({
          text: `How should I structure my ${subject} curriculum?`,
          category: 'teaching'
        });
      }
      
      if (options.length > 0) {
        setAutocompleteOptions(options);
        setIsAutocompleting(true);
        setSelectedAutocompleteIndex(0);
      } else {
        setIsAutocompleting(false);
      }
    } else {
      setIsAutocompleting(false);
    }
  }, [isLoading, teacher]);

  // New handler for autocomplete key navigation
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (isAutocompleting) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedAutocompleteIndex(prev => 
          prev < autocompleteOptions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedAutocompleteIndex(prev => prev > 0 ? prev - 1 : 0);
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        if (autocompleteOptions.length > 0) {
          setMessage(autocompleteOptions[selectedAutocompleteIndex].text);
          setIsAutocompleting(false);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsAutocompleting(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [isAutocompleting, autocompleteOptions, selectedAutocompleteIndex, handleSendMessage]);

  // New method for voice input
  const toggleVoiceInput = useCallback(() => {
    if (isVoiceRecording) {
      // Stop recording logic here
      setIsVoiceRecording(false);
      // Simulated result
      setTimeout(() => {
        setMessage(prev => prev + " I'd like to create an interactive lesson plan.");
      }, 1000);
    } else {
      // Start recording logic here
      setIsVoiceRecording(true);
    }
  }, [isVoiceRecording]);

  // New method for file upload handling
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setFileUploadProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setIsUploading(false);
        setUploadedFiles(prev => [...prev, ...Array.from(files)]);
        
        // Simulate OCR/content extraction
        setTimeout(() => {
          setUploadedFileContent(`Content extracted from ${files[0].name}:\n\nThis is a sample lesson plan about photosynthesis. The process by which plants convert light energy into chemical energy...`);
          
          setMessages(prev => [
            ...prev,
            createChatMessage('user', `I've uploaded a document called ${files[0].name}. Please analyze it.`),
            createChatMessage('assistant', `I've analyzed your document "${files[0].name}". It appears to be a lesson plan about photosynthesis. Would you like me to summarize it, create assessment questions based on it, or enhance it?`)
          ]);
          
          setSuggestedPrompts([
            {
              text: "Summarize this document",
              icon: <DocumentIcon className="w-4 h-4" />,
              category: 'document'
            },
            {
              text: "Create quiz questions from this content",
              icon: <ClipboardIcon className="w-4 h-4" />,
              category: 'assessment'
            },
            {
              text: "Enhance this lesson plan",
              icon: <SparklesIcon className="w-4 h-4" />,
              category: 'improvement'
            },
            {
              text: "Convert to presentation slides",
              icon: <PresentationIcon className="w-4 h-4" />,
              category: 'conversion'
            }
          ]);
        }, 1500);
      }
    }, 200);
  }, []);

  // Create initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      // Add welcome message from assistant
      const welcomeMessage = createChatMessage(
        'assistant', 
        "Hello! I'm your AI teaching assistant. My information is current up to 2024, and I can search the web for the most recent data. How can I help you today?"
      );
      setMessages([welcomeMessage]);
      
      // Generate initial suggested prompts
      setSuggestedPrompts([
        {
          text: "Create a lesson plan for my class",
          icon: <DocumentIcon className="w-4 h-4" />,
          category: 'lesson'
        },
        {
          text: "Generate a quiz about recent events",
          icon: <ClipboardIcon className="w-4 h-4" />,
          category: 'assessment'
        },
        {
          text: "Search for teaching resources online",
          icon: <DocumentMagnifyingGlassIcon className="w-4 h-4" />,
          category: 'search'
        },
        {
          text: "Help me provide feedback to students",
          icon: <ChatBubbleLeftIcon className="w-4 h-4" />,
          category: 'feedback'
        }
      ]);
    }
  }, []);

  // Main UI
  return (
    <div className="flex flex-col h-full">
      {!teacher ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      ) : (
        <>
      <div className="flex flex-1 overflow-hidden">
        {/* Chat interface */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-hidden relative">
              <div className="absolute inset-0 flex flex-col">
                <div 
                  className="flex-1 overflow-y-auto" 
                  style={{ 
                    padding: '0.75rem',
                    maxHeight: 'calc(100vh - 180px)',
                    paddingTop: '1.5rem',
                    paddingBottom: '1rem'
                  }}
                >
                  <div className="space-y-3 md:space-y-4">
                    {messages.map((msg, index) => (
                      <div key={index} className="flex items-start gap-2">
                        {/* Show mascot only for assistant/AI messages */}
                        {msg.role === 'assistant' && (
                          <div className="flex-shrink-0 mt-1">
                            <SparkMascot 
                              width={24} 
                              height={24} 
                              variant="blue"
                              blinking={false}
                              className="drop-shadow-sm md:w-[30px] md:h-[30px]" 
                            />
                          </div>
                        )}
                        
                          <div className={`flex flex-col ${msg.role === 'user' ? 'items-end ml-auto' : 'items-start'}`}>
                            <ChatMessageComponent
                              message={msg}
                              userId={teacher?.id || 'teacher'}
                              onAIEdit={(newContent) => handleAIEdit(index, newContent)}
                            />
                        </div>
                      </div>
                    ))}
                    
                      {/* AI thinking indicator */}
                    {isThinking && (
                        <div className="flex items-start gap-2 animate-pulse">
                        <div className="flex-shrink-0 mt-1">
                          <SparkMascot 
                            width={24} 
                            height={24} 
                            variant="blue"
                            blinking={true}
                            className="drop-shadow-sm md:w-[30px] md:h-[30px]" 
                          />
                        </div>
                          <div className="rounded-lg bg-white p-4 max-w-[80%] shadow-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce text-black" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce text-black" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce text-black" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                      {/* AI task status */}
                      {aiTaskStatus.current && (
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 mt-1">
                            <SparkMascot 
                              width={24} 
                              height={24} 
                              variant="blue"
                              blinking={false}
                              className="drop-shadow-sm md:w-[30px] md:h-[30px]" 
                            />
                          </div>
                          <div className="rounded-lg bg-white p-4 max-w-[80%] shadow-sm">
                            <div className="flex flex-col gap-2">
                              <p className="text-sm font-medium text-black">Working on: {aiTaskStatus.current.task}</p>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full" 
                                  style={{ width: `${aiTaskStatus.current.progress}%` }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Empty div for scrolling to end */}
                    <div ref={messagesEndRef} />
                  </div>
                  </div>
                  
                  {/* Suggested prompts */}
                  {suggestedPrompts.length > 0 && (
                    <div className="px-4 py-2 bg-white border-t border-gray-200">
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {suggestedPrompts.map((prompt, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setMessage(prompt.text);
                              handleSendMessage();
                            }}
                            className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-full text-sm whitespace-nowrap"
                          >
                            {prompt.icon}
                            <span className="text-black">{prompt.text}</span>
                          </button>
                        ))}
                </div>
              </div>
            )}
                  
                  {/* File upload progress indicator */}
                  {isUploading && (
                    <div className="absolute inset-x-0 top-0 p-4">
                      <div className="bg-white shadow-lg rounded-lg p-4 max-w-md mx-auto">
                        <p className="text-sm font-medium mb-2">Uploading file...</p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${fileUploadProgress}%` }}></div>
          </div>
                      </div>
                    </div>
                  )}

                  {/* Input area with enhanced features */}
                  <div className="p-2 md:p-4 bg-white border-t border-gray-200 relative">
                    {/* Autocomplete dropdown */}
                    {isAutocompleting && (
                      <div 
                        ref={autocompleteRef}
                        className="absolute bottom-full left-0 right-0 bg-white border border-gray-200 rounded-t-lg shadow-lg max-h-60 overflow-y-auto"
                      >
                        {autocompleteOptions.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setMessage(option.text);
                              setIsAutocompleting(false);
                            }}
                            className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${
                              index === selectedAutocompleteIndex ? 'bg-blue-50 text-blue-700' : ''
                            }`}
                          >
                            {option.text}
                </button>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <textarea
                          ref={inputRef}
                  value={message}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          placeholder={chatTranslations[language].typeMessage}
                          className={`w-full pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black ${
                            isFocusMode ? 'h-32' : 'h-12'
                          }`}
                          style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                          disabled={isLoading}
                        />
                        
                        {/* Voice input button */}
                        <button
                          onClick={toggleVoiceInput}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full ${
                            isVoiceRecording 
                              ? 'bg-red-100 text-red-600 animate-pulse' 
                              : 'text-black hover:text-black'
                          }`}
                        >
                          <MicrophoneIcon className="w-5 h-5" />
                        </button>
                      </div>
                      
                      {/* File upload button */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 bg-white border border-gray-200 rounded-lg text-black hover:text-black transition-colors"
                        disabled={isLoading}
                      >
                        <PaperClipIcon className="w-5 h-5" />
                        <input
                          ref={fileInputRef}
                          type="file"
                          onChange={handleFileInputChange}
                          className="hidden"
                          multiple
                          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                        />
                      </button>
                      
                      {/* Send button */}
                <button 
                  onClick={handleSendMessage}
                        disabled={isLoading || !message.trim()}
                        className={`p-3 rounded-lg transition-colors ${
                          isLoading || !message.trim()
                            ? 'bg-gray-100 text-black'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                >
                  {isLoading ? (
                          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                  ) : (
                          <ArrowUpIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
                    
                    {/* Extra tools and options row */}
                    <div className="flex justify-between mt-2 px-1">
                      <div className="flex gap-3">
                        {/* Focus mode toggle */}
                        <button
                          onClick={() => setIsFocusMode(!isFocusMode)}
                          className={`text-xs flex items-center gap-1 ${
                            isFocusMode ? 'text-blue-600' : 'text-black hover:text-black'
                          }`}
                        >
                          <CursorArrowRippleIcon className="w-4 h-4" />
                          <span>Focus mode</span>
                        </button>
                        
                        {/* Clear chat button */}
                        <button
                          onClick={handleNewChat}
                          className="text-xs flex items-center gap-1 text-black hover:text-black"
                        >
                          <XMarkIcon className="w-4 h-4" />
                          <span>Clear chat</span>
                        </button>
                      </div>
                      
                      <div className="flex gap-3">
                        {/* View history */}
                        <Link
                          href={href}
                          className="text-xs flex items-center gap-1 text-black hover:text-black"
                        >
                          <FolderIcon className="w-4 h-4" />
                          <span>History</span>
                        </Link>
                        
                        {/* Settings */}
                        <button
                          onClick={() => {/* Show settings modal */}}
                          className="text-xs flex items-center gap-1 text-black hover:text-black"
                        >
                          <CogIcon className="w-4 h-4" />
                          <span>Settings</span>
                        </button>
                      </div>
                    </div>
                  </div>
            </div>
          </div>
        </div>

        {/* Preview Panel - Only visible on desktop */}
        <div className="hidden md:block w-80 bg-white border-l border-gray-200">
          <PreviewPanel 
            userId="teacher-id" 
            onNewChat={handleNewChat}
            messages={messages}
            onLoadChat={handleLoadChat}
          />
        </div>
        
        {/* Mobile History Panel */}
        <AnimatePresence>
          {hasStartedConversation && showHistory && (
            <>
              {/* Mobile backdrop overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/30 z-10 md:hidden"
                onClick={() => setShowHistory(false)}
              />
              
              {/* History panel */}
              <motion.div 
                initial={{ x: "100%", opacity: 0.5 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0.5 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="fixed top-0 right-0 z-20 w-[280px] bg-white h-full border-l border-gray-200 overflow-auto p-4 md:hidden"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-lg text-black">{t('chatHistory')}</h3>
                  <button 
                    onClick={() => setShowHistory(false)}
                    className="p-2 rounded-full hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                
                <PreviewPanel 
                  userId="teacher-id" 
                  onNewChat={handleNewChat}
                  messages={messages}
                  onLoadChat={handleLoadChat}
                  compactMode={true}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
        
        {/* Mobile Preview Panel Toggle */}
        {hasStartedConversation && (
          <button 
            className="md:hidden fixed right-4 top-4 z-10 bg-white p-2 rounded-full shadow-md"
            onClick={() => setShowHistory(!showHistory)}
          >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

          {showLessonCanvas && (
            <LessonCanvas 
              lessonData={lessonData}
              editorContent={editorContent}
              setEditorContent={setEditorContent}
              generatedPlan={generatedPlan}
              setGeneratedPlan={setGeneratedPlan}
              setMessages={setMessages}
              setShowLessonCanvas={setShowLessonCanvas}
              triggerDashboardUpdate={triggerDashboardUpdate}
            />
          )}

      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-4 md:p-6 rounded-lg mx-4">
            <p className="flex items-center gap-3 text-sm md:text-base">
              <span className="animate-spin">🌀</span>
              {t('generatingLesson')}
            </p>
          </div>
        </div>
      )}

          {/* AI Editor Modal for long text */}
      {showAIEditor && (
        <AIEditorModal
          content={draftContent}
              onClose={() => setShowAIEditor(false)}
          onSave={(content) => {
                setMessage(content);
            setShowAIEditor(false);
          }}
        />
          )}
        </>
      )}
    </div>
  );
}