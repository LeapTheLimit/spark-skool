'use client';

import PreviewPanel from '@/components/layout/PreviewPanel';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { sendChatMessage, type ChatMessage, type ToolType, getTranslatedPrompts } from '@/services/chatService';
import { generateLessonPlan, processUploadedFiles } from '@/services/lessonService';
import { XMarkIcon } from '@heroicons/react/24/outline';
import SaveMaterialButton from '@/components/SaveMaterialButton';
import AIEditorModal from '@/components/AIEditorModal';
import ChatMessageComponent from '@/components/ChatMessage';
import { toast } from 'react-hot-toast';
import { triggerDashboardUpdate } from '@/services/dashboardService';
import { useLanguage } from '@/contexts/LanguageContext';
import { DocumentIcon, ClipboardIcon, ChatBubbleLeftIcon, PuzzlePieceIcon } from '@heroicons/react/24/outline';
import SparkMascot from '@/components/SparkMascot';
import { motion } from 'framer-motion';
import TeacherMascot from '@/components/TeacherMascot';

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

export default function TeacherChat() {
  const { language, t } = useLanguage();
  const isRTL = language === 'ar' || language === 'he';

  // All state declarations
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [selectedTool, setSelectedTool] = useState<ToolType | undefined>(undefined);
  const [hasStartedConversation, setHasStartedConversation] = useState(false);
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

  // Add translations for chat interface
  const chatTranslations = {
    en: {
      startPrompt: "How can I help you today?",
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
      startPrompt: "كيف يمكنني مساعدتك اليوم؟",
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
      startPrompt: "כיצד אוכל לעזור לך היום?",
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

  // Simplify the action handling
  const handleAction = (type: string) => {
    console.log('Action clicked:', type);
    if (type === 'Lesson Planning') {
      setWorkflowStep(1);
    }
    setSelectedTool(type as ToolType);
    setHasStartedConversation(true);

    // Start the conversation
    const initialMessage = `I need help with ${type}`;
    setMessages([
      { role: 'user', content: initialMessage },
      { role: 'assistant', content: `Let's work on ${type}. What would you like to do?` }
    ]);
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
  }, [t, teacher, language]);

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

  // Optionally, you can comment out or remove the onboarding related useEffect
  /*
  useEffect(() => {
    const checkOnboarding = async () => {
      // ... onboarding check logic ...
    };
    checkOnboarding();
  }, []);
  */

  // Loading state
  if (!teacher) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
    );
  }

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
  const handleOnboardingAnswer = (answer: string | string[]) => {
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
  };

  // Add handleAIEdit function
  const handleAIEdit = async (messageIndex: number, newContent: string) => {
    setMessages(prev => prev.map((msg, idx) => 
      idx === messageIndex ? { ...msg, content: newContent } : msg
    ));
    triggerDashboardUpdate();
  };

  // Add handleNewChat function
  const handleNewChat = () => {
    setMessages([]);
    setHasStartedConversation(false);
    setSelectedTool(undefined);
    triggerDashboardUpdate();
  };

  // Add handleLoadChat function
  const handleLoadChat = (loadedMessages: ChatMessage[]) => {
    setMessages(loadedMessages);
    setHasStartedConversation(true);
    triggerDashboardUpdate();
  };

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const AI_EDITOR_TRIGGER_WORD_COUNT = 100;

  const checkForAutoEdit = (text: string) => {
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount >= AI_EDITOR_TRIGGER_WORD_COUNT) {
      setDraftContent(text);
      setShowAIEditor(true);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      language: language
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);
    setHasStartedConversation(true);
    setIsThinking(true);

    try {
      // If the message contains keywords indicating a task request
      if (message.toLowerCase().includes('create') || 
          message.toLowerCase().includes('generate') ||
          message.toLowerCase().includes('make')) {
        updateTaskStatus('started', message);
      }
      
      const response = await sendChatMessage([...messages, userMessage]);
      
      // Add a 4-second delay before showing the response
      setTimeout(() => {
        const aiMessage: ChatMessage = {
          role: 'assistant',
          content: response,
          language: language
        };
        setMessages(prev => [...prev, aiMessage]);
        
        // If we started a task, complete it
        if (aiTaskStatus.current) {
          updateTaskStatus('completed', aiTaskStatus.current.task, 'Added to materials');
        }
        
        setIsThinking(false);
        setIsLoading(false);
      }, 4000);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      setIsThinking(false);
      setIsLoading(false);
    }
  };

  const handleToolClick = async (tool: ToolType) => {
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

    const userMessage: ChatMessage = {
      role: 'user',
      content: prompt,
      language: language
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);
    setHasStartedConversation(true);
    setIsThinking(true);

    try {
      const response = await sendChatMessage([userMessage]);
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        language: language
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
      setIsThinking(false);
    }
  };

  const lessonWorkflowSteps = [
    { question: "What topic would you like to teach?", field: 'topic' },
    { question: "What grade level? (1-12)", field: 'gradeLevel' },
    { question: "What are the learning objectives? (comma separated)", field: 'objectives' },
    { question: "Upload any resources (PDF/Word/Images) or type 'next' to continue", field: 'resources' },
    { question: "Class duration in minutes?", field: 'duration' }
  ];

  const handleFileUpload = async (files: File[]) => {
    if (workflowStep === 4) {
      const extractedText = await processUploadedFiles(files);
      setLessonData(prev => ({
        ...prev,
        resources: [...prev.resources, ...files],
        resourcesText: extractedText
      }));
      setMessages(prev => [...prev,
        { role: 'user', content: `Uploaded ${files.length} files` },
        { role: 'assistant', content: "Files processed! Anything else or type 'next'" }
      ]);
    }
    triggerDashboardUpdate();
  };

  const LessonCanvas = () => {
    const [editorChat, setEditorChat] = useState('');
    const [editorChatMessages, setEditorChatMessages] = useState<ChatMessage[]>([]);
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
        { role: 'user', content: userMessage },
        { role: 'assistant', content: "Revising lesson plan... ✍️" }
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
          setGeneratedPlan(prev => ({
            ...prev,
            plan: revisedContent,
            status: prev?.status || 'success'
          }));
        }
        setEditorChatMessages(prev => [
          ...prev.slice(0, -1), 
          { role: 'assistant', content: "Here's your revised lesson plan:" }
        ]);
      } catch (error) {
        console.error('Revision Error:', error);
        setEditorChatMessages(prev => [
          ...prev.slice(0, -1), 
          { role: 'assistant', content: "⚠️ Revision failed. Please try again." }
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
            { role: 'assistant', content: "✅ Lesson saved successfully!" }
          ]);
          setShowLessonCanvas(false);
        }
        triggerDashboardUpdate();
      } catch (error) {
        setMessages(prev => [...prev, 
          { role: 'assistant', content: "❌ Failed to save lesson. Please try again." }
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
          { role: 'assistant', content: "❌ PDF export failed. Please try again." }
        ]);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
        {/* Lesson Canvas content */}
      </div>
    );
  };

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

  // Add this function to update task status
  const updateTaskStatus = (status: 'started' | 'completed', task: string, result?: string) => {
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
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 overflow-hidden">
        {/* Chat interface */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-hidden relative">
            {!hasStartedConversation ? (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
                  <div className="mb-8 relative">
                    {/* Simple glow background */}
                    <div 
                      className="absolute inset-0 bg-[#3ab8fe]/20 rounded-full w-[140px] h-[140px]"
                      style={{ 
                        filter: "blur(20px)",
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)'
                      }}
                    />
                    
                    {/* Floating mascot animation */}
                    <motion.div className="mx-auto mb-8">
                      <TeacherMascot 
                        width={120} 
                        height={120} 
                        variant="blue"
                        className="drop-shadow-xl relative z-10"
                      />
                    </motion.div>
                  </div>
                  
                  <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
                    {chatTranslations[language].startPrompt}
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                    {actionCommands.map((command, index) => (
                      <button
                        key={index}
                        onClick={() => handleToolClick(command.type)}
                        className="w-full p-6 bg-white hover:bg-gray-50 rounded-2xl border border-gray-200 transition-all group text-left shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-xl bg-opacity-20 group-hover:scale-110 transition-transform" 
                               style={{ backgroundColor: command.title.includes('Lesson') ? 'rgba(59, 130, 246, 0.2)' : 
                                                   command.title.includes('Assessment') ? 'rgba(139, 92, 246, 0.2)' : 
                                                   command.title.includes('Feedback') ? 'rgba(34, 197, 94, 0.2)' : 
                                                   'rgba(249, 115, 22, 0.2)' }}>
                            {command.icon}
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {command.title}
                            </h3>
                            <p className="text-gray-700 mt-1">
                              {command.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col">
                <div 
                  className="flex-1 overflow-y-auto" 
                  style={{ 
                    padding: '1rem',
                    maxHeight: 'calc(100vh - 200px)',
                    paddingTop: '3rem'
                  }}
                >
                  <div className="space-y-4">
                    {messages.map((msg, index) => (
                      <div key={index} className="flex items-start gap-2">
                        {/* Show mascot only for assistant/AI messages */}
                        {msg.role === 'assistant' && (
                          <div className="flex-shrink-0 mt-1">
                            <TeacherMascot 
                              width={30} 
                              height={30} 
                              variant="blue"
                              className="drop-shadow-sm" 
                            />
                          </div>
                        )}
                        
                        {/* The actual message with proper styling */}
                        <div className={`flex-1 ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                          {msg.role === 'user' ? (
                            <div className="bg-[#2b9be0] text-white rounded-lg p-4 max-w-[80%] shadow-sm ltr">
                              <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                          ) : (
                            <ChatMessageComponent
                              message={msg}
                              userId="teacher-id"
                              onAIEdit={(newContent) => handleAIEdit(index, newContent)}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Thinking indicator - only shows when isThinking is true */}
                    {isThinking && (
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-1">
                          <TeacherMascot 
                            width={30} 
                            height={30} 
                            variant="blue"
                            className="drop-shadow-sm" 
                          />
                        </div>
                        <div className="bg-gray-100 rounded-lg p-4 shadow-sm">
                          <div className="flex items-center">
                            <span className="text-gray-600 font-medium">Thinking</span>
                            <span className="flex ml-2">
                              <motion.span
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5, times: [0, 0.5, 1] }}
                                className="text-gray-600"
                              >.</motion.span>
                              <motion.span
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5, delay: 0.2, times: [0, 0.5, 1] }}
                                className="text-gray-600"
                              >.</motion.span>
                              <motion.span
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5, delay: 0.4, times: [0, 0.5, 1] }}
                                className="text-gray-600"
                              >.</motion.span>
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Add this div at the end to scroll to */}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Chat Input */}
          <div className="h-24 bg-white border-t border-gray-200 sticky bottom-0 flex items-center">
            <div className="max-w-5xl mx-auto w-full px-4 lg:px-8 py-4">
              <div className="flex items-center gap-3 bg-gray-50 rounded-full p-2 lg:p-2 shadow-sm border border-gray-200">
                {/* Optional: Add file upload button */}
                <button className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                
                <input 
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={t('typeMessage')}
                  className="flex-1 bg-transparent text-gray-900 placeholder-gray-500 outline-none px-4 py-2 text-base lg:text-lg min-w-0"
                />
                
                <button 
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isLoading}
                  className="p-2.5 bg-[#3ab8fe] hover:bg-[#3ab8fe]/90 rounded-full transition-colors flex-shrink-0 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="w-full lg:w-80 bg-white border-l border-gray-200">
          <PreviewPanel 
            userId="teacher-id" 
            onNewChat={handleNewChat}
            messages={messages}
            onLoadChat={handleLoadChat}
          />
        </div>
      </div>

      {showLessonCanvas && <LessonCanvas />}

      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <p className="flex items-center gap-3">
              <span className="animate-spin">🌀</span>
              {t('generatingLesson')}
            </p>
          </div>
        </div>
      )}

      {showAIEditor && (
        <AIEditorModal
          content={draftContent}
          onSave={(content) => {
            setEditorContent(content);
            setShowAIEditor(false);
          }}
          onClose={() => setShowAIEditor(false)}
        />
      )}
    </div>
  );
}