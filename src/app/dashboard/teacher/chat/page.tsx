'use client';

import PreviewPanel from '@/components/layout/PreviewPanel';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { sendChatMessage, type ChatMessage, type ToolType } from '@/services/chatService';
import { generateLessonPlan, processUploadedFiles } from '@/services/lessonService';
import { XMarkIcon } from '@heroicons/react/24/outline';
import SaveMaterialButton from '@/components/SaveMaterialButton';
import AIEditorModal from '@/components/AIEditorModal';
import ChatMessageComponent from '@/components/ChatMessage';
import { toast } from 'react-hot-toast';
import { triggerDashboardUpdate } from '@/services/dashboardService';

interface TeacherPreferences {
  teachingStyle?: string;
  gradeLevel?: string;
  curriculum?: string;
  languagePreference?: string;
  specialNeeds?: boolean;
  preferredTools?: string[];
  lastOnboarding?: string;
}

export default function TeacherChat() {
  // All state declarations
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [selectedTool, setSelectedTool] = useState<ToolType | null>(null);
  const [hasStartedConversation, setHasStartedConversation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [teacher, setTeacher] = useState<any>(null);
  const [preferences, setPreferences] = useState<TeacherPreferences | null>(null);
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

  // Simplify action commands
  const actionCommands = [
    {
      title: `${teacher?.subject || 'Subject'} Lesson Planning`,
      description: `Create ${preferences?.teachingStyle || 'customized'} lesson plans`,
      type: 'Lesson Planning',
      icon: (
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
      )
    },
    {
      title: 'Assessment Generator',
      description: `Create ${teacher?.subject || 'subject'}-specific assessments`,
      type: 'Assessment Generator',
      icon: (
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
      )
    },
    {
      title: 'Student Feedback',
      description: 'Generate personalized feedback',
      type: 'Student Feedback',
      icon: (
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        </div>
      )
    },
    {
      title: 'Activity Creator',
      description: 'Design classroom activities',
      type: 'Activity Creator',
      icon: (
        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )
    }
  ];

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

  useEffect(() => {
    if (!teacher?.email) return;

    const loadPreferences = () => {
      try {
        const storedPrefs = localStorage.getItem(`teacher_preferences_${teacher.email}`);
        if (storedPrefs) {
          const prefs = JSON.parse(storedPrefs);
          const lastOnboarding = new Date(prefs.lastOnboarding);
          const monthsAgo = (Date.now() - lastOnboarding.getTime()) / (1000 * 60 * 60 * 24 * 30);
          
          if (monthsAgo < 3) {
            setPreferences(prefs);
            return;
          }
        }
        setIsOnboarding(true);
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    };

    loadPreferences();
  }, [teacher?.email]);

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
      question: `As a ${teacher.subject} teacher, what's your preferred teaching style?`,
      options: ['Interactive', 'Lecture-based', 'Project-based', 'Blended'],
      field: 'teachingStyle'
    },
    {
      question: `What curriculum or standards do you follow for ${teacher.subject}?`,
      options: ['Common Core', 'IB', 'National Standards', 'State-specific', 'Custom'],
      field: 'curriculum'
    },
    {
      question: 'Do you have students with special educational needs?',
      options: ['Yes', 'No'],
      field: 'specialNeeds'
    },
    {
      question: 'Which tools do you frequently use in your teaching?',
      options: ['Presentations', 'Interactive Whiteboards', 'Digital Assessments', 'Educational Games'],
      field: 'preferredTools',
      multiple: true
    }
  ];

  // Add handleOnboardingAnswer function
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
      // Save preferences
      localStorage.setItem(
        `teacher_preferences_${teacher.email}`,
        JSON.stringify(updatedPreferences)
      );
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
    setSelectedTool(null);
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
    if (workflowStep > 0 && workflowStep <= lessonWorkflowSteps.length) {
      const currentStep = lessonWorkflowSteps[workflowStep - 1];
      
      // Handle objectives conversion to array
      const value = currentStep.field === 'objectives' 
        ? message.split(',').map(obj => obj.trim())
        : message;

      setLessonData(prev => ({ 
        ...prev, 
        [currentStep.field]: value 
      }));
      
      if (workflowStep < lessonWorkflowSteps.length) {
        setWorkflowStep(prev => prev + 1);
        setMessages(prev => [...prev, 
          { role: 'user', content: message },
          { role: 'assistant', content: lessonWorkflowSteps[workflowStep].question }
        ]);
      } else {
        setIsGenerating(true);
        if (lessonData.topic.length > 100) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: "Please keep topic under 100 characters"
          }]);
          return;
        }
        const generatedPlan = await generateLessonPlan(lessonData)
          .finally(() => setIsGenerating(false));

        if (generatedPlan) {
          setGeneratedPlan(generatedPlan);
          setShowLessonCanvas(true);
          setWorkflowStep(0);
          setEditorContent(generatedPlan.plan);
        }
      }
      setMessage('');
      triggerDashboardUpdate();
      return;
    }
    if (!message.trim() && !isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: message
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(
        [...messages, userMessage],
        selectedTool
      );

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response
      };

      setMessages(prev => [...prev, assistantMessage]);
      triggerDashboardUpdate();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
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
      <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 overflow-auto">
        {/* ... LessonCanvas JSX ... */}
            </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      <div className="flex-1 flex flex-col relative h-[calc(100vh-80px)]">
        <div className="flex-1 overflow-hidden relative">
          {!hasStartedConversation ? (
            <div className="p-8 max-w-4xl mx-auto">
              <h2 className="text-2xl font-semibold text-center mb-8 text-black">
                How can I help you today?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {actionCommands.map((command, index) => (
                <button
                    key={index}
                    onClick={() => handleAction(command.type)}
                    className="w-full p-6 bg-white hover:bg-gray-50 rounded-2xl border 
                      border-gray-200 transition-all group text-left"
                  >
                    <div className="flex items-start gap-4">
                    {command.icon}
                      <div>
                        <h3 className="text-lg font-medium text-black">
                          {command.title}
                        </h3>
                        <p className="text-black/70 mt-1">
                          {command.description}
                        </p>
                      </div>
                    </div>
                </button>
              ))}
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
                    <ChatMessageComponent
                    key={index}
                      message={msg}
                      userId="teacher-id"
                      onAIEdit={(newContent) => handleAIEdit(index, newContent)}
                    />
                  ))}
                  </div>
                <div ref={messagesEndRef} className="h-8" />
            </div>
          </div>
          )}
        </div>

        {/* Chat Input - Fixed at bottom */}
        <div className="h-24 bg-white border-t border-gray-200 sticky bottom-0">
          <div className="max-w-7xl mx-auto h-full px-4 lg:px-8 py-4">
            <div className="flex items-center gap-3 bg-gray-50/80 rounded-full p-2 lg:p-3 shadow-sm">
              <button className="p-2.5 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 group">
                <svg 
                  className="w-6 h-6 text-gray-500 group-hover:text-gray-900 transition-colors" 
                  viewBox="0 0 512 512" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  stroke="currentColor"
                >
                  <path 
                    d="M216.08,192V335.55a40.08,40.08,0,0,0,80.15,0L296.36,147a67.94,67.94,0,1,0-135.87,0V336.82a95.51,95.51,0,0,0,191,0V159.44" 
                    strokeLinecap="square" 
                    strokeMiterlimit="10" 
                    strokeWidth="32"
                  />
                </svg>
              </button>
              
              <input 
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                onFocus={() => {
                  setHasStartedConversation(true);
                }}
                placeholder="Type a message..."
                className="flex-1 bg-transparent text-gray-900 placeholder-gray-500 outline-none px-4 py-2 text-base lg:text-lg min-w-0"
              />

              <div className="flex items-center gap-2">
                {!message.length && (
                  <>
                    <button className="p-3 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
                      <svg className="w-7 h-7 text-gray-600" viewBox="0 0 24 24" fill="none">
                        <path d="M12 3C12.51285 3 12.9355092 3.38604429 12.9932725 3.88337975L13 4L13 20C13 20.5523 12.5523 21 12 21C11.48715 21 11.0644908 20.613973 11.0067275 20.1166239L11 20L11 4C11 3.44772 11.4477 3 12 3ZM8 6C8.55228 6 9 6.44772 9 7L9 17C9 17.5523 8.55228 18 8 18C7.44772 18 7 17.5523 7 17L7 7C7 6.44772 7.44772 6 8 6ZM16 6C16.5523 6 17 6.44772 17 7L17 17C17 17.5523 16.5523 18 16 18C15.4477 18 15 17.5523 15 17L15 7C15 6.44772 15.4477 6 16 6ZM4 9C4.55228 9 5 9.44772 5 10L5 14C5 14.5523 4.55228 15 4 15C3.44772 15 3 14.5523 3 14L3 10C3 9.44772 3.44772 9 4 9ZM20 9C20.51285 9 20.9355092 9.38604429 20.9932725 9.88337975L21 10L21 14C21 14.5523 20.5523 15 20 15C19.48715 15 19.0644908 14.613973 19.0067275 14.1166239L19 14L19 10C19 9.44772 19.4477 9 20 9Z" fill="currentColor"/>
                      </svg>
                    </button>
                  </>
                )}

                <button 
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isLoading}
                  className="p-2.5 bg-indigo-600 rounded-full transition-colors flex-shrink-0 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="none">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12.2929 4.29289C12.6834 3.90237 13.3166 3.90237 13.7071 4.29289L20.7071 11.2929C21.0976 11.6834 21.0976 12.3166 20.7071 12.7071L13.7071 19.7071C13.3166 20.0976 12.6834 20.0976 12.2929 19.7071C11.9024 19.3166 11.9024 18.6834 12.2929 18.2929L17.5858 13H4C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11H17.5858L12.2929 5.70711C11.9024 5.31658 11.9024 4.68342 12.2929 4.29289Z" fill="currentColor"/>
                    </svg>
                  )}
                </button>
              </div>
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

      {showLessonCanvas && <LessonCanvas />}

      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <p className="flex items-center gap-3">
              <span className="animate-spin">🌀</span>
              Generating lesson plan...
            </p>
          </div>
        </div>
      )}

      {showAIEditor && (
        <AIEditorModal
          content={draftContent}
          onClose={() => setShowAIEditor(false)}
          onSave={(revisedContent) => {
            setEditorContent(revisedContent);
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: 'AI-enhanced revision completed'
            }]);
            triggerDashboardUpdate();
          }}
        />
      )}
    </div>
  );
} 