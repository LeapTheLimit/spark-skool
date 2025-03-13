'use client';

import { useEffect, useState } from 'react';
import { 
  ChartBarIcon, 
  UserGroupIcon,
  BookOpenIcon,
  AcademicCapIcon,
  BellIcon,
  LightBulbIcon,
  UserIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  UsersIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ChatBubbleLeftIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow, format } from 'date-fns';
import { MATERIALS_STORAGE_KEY } from '@/lib/constants';
import { useLanguage } from '@/contexts/LanguageContext';
import SparkMascot from '@/components/SparkMascot';
import { useRouter } from 'next/navigation';
import routes from '@/app/routes';
import React from 'react';

interface TeacherDashboardProps {
  teacher: {
    name: string;
    email: string;
    school: string;
    subject: string;
  } | null;
  todayEvents: any[];
  upcomingEvents: any[];
}

interface ChatMessage {
  id: string;
  student: {
    name: string;
    avatar: string;
  };
  message: string;
  timestamp: Date;
}

interface Material {
  id: string;
  title: string;
  type: 'quiz' | 'document' | 'assignment';
  createdAt: Date;
  updatedAt: Date;
}

interface GradedExam {
  id: string;
  student: {
    name: string;
    avatar: string;
  };
  title: string;
  grade: string;
  gradedAt: Date;
}

const useRecentActivity = (teacherId: string) => {
  const [recentChats, setRecentChats] = useState<ChatMessage[]>([]);
  const [savedMaterials, setSavedMaterials] = useState<Material[]>([]);
  const [recentGrades, setRecentGrades] = useState<GradedExam[]>([]);

  const loadRecentActivity = () => {
    try {
      // Load materials from MATERIALS_STORAGE_KEY
      const materialsStr = localStorage.getItem(MATERIALS_STORAGE_KEY);
      if (materialsStr) {
        const materials = JSON.parse(materialsStr);
        setSavedMaterials(materials.slice(0, 2).map((material: any) => ({
          id: material.id,
          title: material.title,
          type: material.category === 'quiz' ? 'quiz' : 'document',
          createdAt: new Date(material.createdAt),
          updatedAt: new Date(material.createdAt)
        })));
      }

      // Load chat history
      const chatHistoryStr = localStorage.getItem('chatHistory');
      if (chatHistoryStr) {
        const chats = JSON.parse(chatHistoryStr);
        setRecentChats(chats.slice(0, 2).map((chat: any) => ({
          id: chat.id || Date.now().toString(),
          student: {
            name: chat.title || 'Student',
            avatar: '/avatars/default.png'
          },
          message: chat.messages?.[0]?.content || chat.content || '',
          timestamp: new Date(chat.createdAt || Date.now())
        })));
      }

      // Load grades
      const gradesStr = localStorage.getItem('gradedExams');
      if (gradesStr) {
        const grades = JSON.parse(gradesStr);
        setRecentGrades(grades.slice(0, 2).map((grade: any) => ({
          id: grade.id,
          student: {
            name: grade.student.name,
            avatar: grade.student.avatar || '/avatars/default.png'
          },
          title: grade.title,
          grade: grade.grade,
          gradedAt: new Date(grade.gradedAt)
        })));
      }
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  useEffect(() => {
    loadRecentActivity();

    // Listen for storage changes
    const handleStorageChange = () => {
      loadRecentActivity();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localDataUpdate', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localDataUpdate', handleStorageChange);
    };
  }, [teacherId]);

  return { recentChats, savedMaterials, recentGrades };
};

// Helper function to trigger updates
export const triggerDashboardUpdate = () => {
  // Dispatch custom event to update all components
  window.dispatchEvent(new CustomEvent('localDataUpdate'));
};

// Define onboarding steps outside the component
const onboardingSteps = [
  {
    id: 'profile',
    title: 'completeProfile',
    description: 'addProfileDetails',
    icon: UserIcon,
    link: '/dashboard/teacher/settings',
    completed: false
  },
  {
    id: 'assistant',
    title: 'personalizeAssistant',
    description: 'customizeAI', 
    icon: ChatBubbleLeftIcon,
    link: '/dashboard/teacher/chat',
    completed: false
  },
  {
    id: 'lesson',
    title: 'createFirstLesson',
    description: 'useLessonPlanner',
    icon: BookOpenIcon,
    link: '/dashboard/teacher/lessons',
    completed: false
  }
];

export default function TeacherDashboard({ teacher, todayEvents, upcomingEvents }: TeacherDashboardProps) {
  const { recentChats, savedMaterials, recentGrades } = useRecentActivity(teacher?.email || '');
  const { t } = useLanguage();
  const router = useRouter();

  // Add state for tracking onboarding steps completion
  const [steps, setSteps] = useState(onboardingSteps);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Check if all steps are completed
  const allStepsCompleted = steps.every(step => step.completed);
  
  // Function to mark a step as completed
  const completeStep = (stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ));
  };

  if (!teacher) {
    return null; // Or a loading state
  }

  const stats = {
    activeStudents: { 
      value: 678, 
      change: '+32%', 
      icon: <UserGroupIcon className="w-6 h-6" />,
      color: 'blue'
    },
    completionRate: { 
      value: '68%', 
      change: '+8%', 
      icon: <ChartBarIcon className="w-6 h-6" />,
      color: 'purple'
    },
    totalClasses: { 
      value: 12, 
      change: '-2%', 
      icon: <BookOpenIcon className="w-6 h-6" />,
      color: 'indigo'
    },
    averageGrade: { 
      value: '85%', 
      change: '+5%', 
      icon: <AcademicCapIcon className="w-6 h-6" />,
      color: 'rose'
    }
  };

  const greeting = "Good morning";
  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString();
  };

  const isNewTeacher = true; // This should be replaced with actual logic to determine if the teacher is new

  function route(arg0: string): unknown {
    throw new Error('Function not implemented.');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-sky-50/30">
      <div className="flex flex-col gap-6 p-6 pb-12">
        {/* SECTION 1: Enhanced Header with added AI Insights and Upcoming Events */}
        <div className="relative bg-gradient-to-br from-[#0099e5] to-[#3ab8fe] p-8 rounded-3xl shadow-md mb-8 overflow-hidden">
          {/* White gradient line at top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-white/0 via-white/50 to-white/0"></div>
          
          {/* Inner white gradient glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          
          {/* Top section with greeting */}
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="hidden sm:block">
                <SparkMascot 
                  width={64} 
                  height={64} 
                  className="drop-shadow-lg" 
                  blinking={true}
                  variant="white"
                />
              </div>
              
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {greeting}, {teacher?.name || t('teacher')}!
                </h1>
                <p className="text-white/90 mt-1 font-medium">
                  {format(new Date(), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>
            
            {/* Notification button */}
            <div className="flex gap-3">
              <button className="p-3 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors backdrop-blur-sm">
                <BellIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Modified Two-column layout for the header content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
            {/* Get Started - More compact */}
            <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-5 border border-white/60 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#3ab8fe]/20 rounded-xl text-[#3ab8fe] mt-1 flex-shrink-0">
                  <LightBulbIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center">
                    <h3 className="font-bold text-[#0099e5] text-base">{t('getStarted')}</h3>
                    <span className="ml-2 text-xs bg-[#3ab8fe] text-white px-2 py-0.5 rounded-full font-medium shadow-sm">{t('newTeacherWelcome')}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-700 font-medium">Complete onboarding to make the most of Spark</p>
                </div>
              </div>
            </div>
            
            {/* Upcoming Events in header */}
            <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-5 border border-white/60 shadow-sm">
              <div className="flex items-start">
                <div className="p-2 bg-[#3ab8fe]/20 rounded-xl text-[#3ab8fe] mt-1 mr-3 flex-shrink-0">
                  <CalendarDaysIcon className="w-5 h-5" />
                </div>
                <div className="w-full">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[#0099e5] text-base">Coming Up</h3>
                    <Link href="/dashboard/teacher/schedule" className="text-xs text-[#3ab8fe] font-medium">
                      View all
                    </Link>
                  </div>
                  
                  {upcomingEvents.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {upcomingEvents.slice(0, 2).map(event => (
                        <div key={event.id} className="flex items-center text-sm">
                          <span className="w-12 text-gray-700 font-medium">{format(new Date(event.date), 'EEE d')}</span>
                          <span className="flex-1 text-gray-700 truncate">{event.title}</span>
                          <span className="text-gray-500">{event.startTime}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-gray-600">No upcoming events</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Onboarding Section */}
        {isNewTeacher && !allStepsCompleted && (
          <div className="mb-8 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative">
            {/* One-time subtle glow effect instead of continuous pulsing */}
            {!showOnboarding && (
              <div className="absolute inset-0 rounded-2xl bg-[#3ab8fe]/5"></div>
            )}
            
            {/* Add highlight border when collapsed */}
            <div 
              className={`flex items-center justify-between p-4 cursor-pointer relative z-10 transition-all duration-300 ${
                !showOnboarding ? 'bg-gradient-to-r from-[#3ab8fe]/5 to-sky-50 border-l-4 border-[#3ab8fe]' : 'bg-gradient-to-r from-white to-sky-50'
              }`}
              onClick={() => setShowOnboarding(!showOnboarding)}
            >
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#3ab8fe]/10 rounded-xl text-[#3ab8fe]">
                  <CheckCircleIcon className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">{t('Onboarding')}</h2>
                <span className="ml-2 px-2 py-0.5 bg-[#3ab8fe]/10 text-[#3ab8fe] text-xs font-medium rounded-full">
                  {onboardingSteps.filter(s => s.completed).length}/{onboardingSteps.length} {t('completed')}
                </span>
              </div>
              <div className="text-gray-500">
                {showOnboarding ? (
                  <ChevronUpIcon className="w-5 h-5" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5" />
                )}
              </div>
            </div>
            
            {showOnboarding && (
              <div className="p-6 pt-3">
                <p className="text-gray-600 mb-6 text-sm leading-relaxed">{t('completeStepsBelow')}</p>
                
                <div className="space-y-4">
                  {onboardingSteps.map((step) => (
                    <div 
                      key={step.id}
                      className={`p-4 rounded-xl border ${
                        step.completed 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-white border-gray-200 hover:border-[#3ab8fe] hover:shadow-sm'
                      } transition-all`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${
                            step.completed ? 'bg-green-100 text-green-600' : 'bg-[#3ab8fe]/10 text-[#3ab8fe]'
                          }`}>
                            <step.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{step.title}</h3>
                            <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{step.description}</p>
                          </div>
                        </div>
                        
                        <Link 
                          href={{ pathname: step.link }}
                          className={`flex items-center gap-1 text-sm font-medium ${
                            step.completed ? 'text-green-600' : 'text-[#3ab8fe] hover:text-[#0099e5]'
                          }`}
                        >
                          {step.completed ? t('completed') : t('getStarted')}
                          {!step.completed && <ArrowRightIcon className="w-4 h-4" />}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: Quick Actions - Updated with Chat with Spark as first item */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('quickActions')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Chat with Spark - Now first item with sky blue color */}
          <Link 
            href="/dashboard/teacher/chat"
            className="bg-gradient-to-br from-[#e6f6ff] to-[#cceeff] hover:from-[#cceeff] hover:to-[#b3e6ff] p-6 rounded-xl border border-[#99d6ff] shadow-sm transition-all group"
          >
            <div className="flex flex-col h-full">
              <div className="p-3 bg-[#3ab8fe]/20 rounded-xl w-fit mb-4 group-hover:bg-[#3ab8fe]/30 transition-colors">
                <ChatBubbleLeftIcon className="w-6 h-6 text-[#3ab8fe]" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Chat with Spark</h3>
              <p className="text-sm text-gray-600 mt-auto leading-relaxed">Get teaching assistance from your AI assistant</p>
            </div>
          </Link>
          
          {/* Create Lesson - now second item */}
          <Link 
            href="/dashboard/teacher/lessons"
            className="bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 p-6 rounded-xl border border-blue-200 shadow-sm transition-all group"
          >
            <div className="flex flex-col h-full">
              <div className="p-3 bg-blue-200 rounded-xl w-fit mb-4 group-hover:bg-blue-300 transition-colors">
                <BookOpenIcon className="w-6 h-6 text-blue-700" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">{t('createLesson')}</h3>
              <p className="text-sm text-gray-600 mt-auto leading-relaxed">Create lesson plans with AI assistance</p>
            </div>
          </Link>
          
          {/* Create Exam */}
          <Link 
            href="/dashboard/teacher/tools/exam-creator"
            className="bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 p-6 rounded-xl border border-amber-200 shadow-sm transition-all group"
          >
            <div className="flex flex-col h-full">
              <div className="p-3 bg-amber-200 rounded-xl w-fit mb-4 group-hover:bg-amber-300 transition-colors">
                <DocumentTextIcon className="w-6 h-6 text-amber-700" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">{t('createExam')}</h3>
              <p className="text-sm text-gray-600 mt-auto leading-relaxed">Generate quizzes and assessments</p>
            </div>
          </Link>
          
          {/* Add Students */}
          <Link 
            href="/dashboard/teacher/students"
            className="bg-gradient-to-br from-rose-50 to-rose-100 hover:from-rose-100 hover:to-rose-200 p-6 rounded-xl border border-rose-200 shadow-sm transition-all group"
          >
            <div className="flex flex-col h-full">
              <div className="p-3 bg-rose-200 rounded-xl w-fit mb-4 group-hover:bg-rose-300 transition-colors">
                <UserGroupIcon className="w-6 h-6 text-rose-700" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">{t('addStudents')}</h3>
              <p className="text-sm text-gray-600 mt-auto leading-relaxed">Manage your class roster</p>
            </div>
          </Link>
        </div>

        {/* SECTION 4: Teaching Tools */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mt-6">
          <div className="flex items-center gap-2 mb-6">
            <LightBulbIcon className="w-5 h-5 text-[#3ab8fe]" />
            <h2 className="text-lg font-semibold text-gray-900">{t('teachingTools')}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <Link href={{ pathname: routes.tools.examGame.quizShow }} className="group">
              <div className="border border-gray-200 rounded-xl p-4 hover:border-[#3ab8fe] hover:bg-[#3ab8fe]/5 transition-colors flex flex-col h-full">
                <div className="bg-[#3ab8fe]/10 p-3 rounded-xl w-fit mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#3ab8fe]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1 group-hover:text-[#3ab8fe]">Quiz Show</h3>
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">Create interactive quiz games with customizable categories and point values.</p>
              </div>
            </Link>
            
            <Link href={{ pathname: "/dashboard/teacher/tools/exam-game" }} className="group">
              <div className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-colors flex flex-col h-full">
                <div className="bg-green-100 p-3 rounded-lg w-fit mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1 group-hover:text-green-600">Word Scramble</h3>
                <p className="text-sm text-gray-500 mb-3">Create word scramble puzzles from your vocabulary lists and terms.</p>
              </div>
            </Link>
            
            <Link href={{ pathname: "/dashboard/teacher/tools/exam-game" }} className="group">
              <div className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-colors flex flex-col h-full">
                <div className="bg-purple-100 p-3 rounded-lg w-fit mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1 group-hover:text-purple-600">Word Search</h3>
                <p className="text-sm text-gray-500 mb-3">Generate printable word search puzzles from your vocabulary terms.</p>
              </div>
            </Link>
            
            <Link href={{ pathname: "/dashboard/teacher/tools/exam-game" }} className="group">
              <div className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-colors flex flex-col h-full">
                <div className="bg-amber-100 p-3 rounded-lg w-fit mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1 group-hover:text-amber-600">Timeline Creator</h3>
                <p className="text-sm text-gray-500 mb-3">Create interactive timelines for historical events and sequences.</p>
              </div>
            </Link>
            
            <Link href={{ pathname: "/dashboard/teacher/chat" }} className="group">
              <div className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-colors flex flex-col h-full">
                <div className="bg-rose-100 p-3 rounded-lg w-fit mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1 group-hover:text-rose-600">AI Assistant</h3>
                <p className="text-sm text-gray-500 mb-3">Get help with lesson planning, assessments, and teaching ideas.</p>
              </div>
            </Link>
            
            <Link href={{ pathname: "/dashboard/teacher/tools/exam-game" }} className="group">
              <div className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-colors flex flex-col h-full">
                <div className="bg-teal-100 p-3 rounded-lg w-fit mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1 group-hover:text-teal-600">Presentation Exporter</h3>
                <p className="text-sm text-gray-500 mb-3">Export your lessons and activities as PowerPoint presentations.</p>
              </div>
            </Link>
          </div>
        </div>

        {/* SECTION 5: Today's Schedule */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">{t('todaySchedule')}</h2>
            </div>
            <Link href="/dashboard/teacher/schedule" 
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
              {t('viewFullSchedule')}
              <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="space-y-3">
            {todayEvents.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {todayEvents.map(event => (
                  <div key={event.id} className="py-3 flex justify-between items-center">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${event.color}`}>
                        {event.eventType === 'class' ? (
                          <BookOpenIcon className="w-5 h-5" />
                        ) : event.eventType === 'meeting' ? (
                          <UsersIcon className="w-5 h-5" />
                        ) : (
                          <ClockIcon className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{event.title}</div>
                        <div className="text-sm text-gray-500">
                          {event.startTime} - {event.endTime} • {event.room || ''}
                        </div>
                      </div>
                    </div>
                    <Link href="/dashboard/teacher/schedule" 
                      className="text-sm text-blue-600 hover:text-blue-700">
                      Details
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarDaysIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">{t('noEventsToday')}</p>
                <button 
                  onClick={() => router.push('/dashboard/teacher/schedule')}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  {t('addEvent')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 6: NEW REPORTS SECTION WITH "STILL COLLECTING" MESSAGE */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Reports & Analytics</h2>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <ChartBarIcon className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Still collecting data</h3>
            <p className="text-gray-500 max-w-md">
              We're gathering information about your teaching activities. 
              Check back soon for detailed reports and analytics.
            </p>
          </div>
        </div>

        {/* SECTION 7: Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Recent Chat History */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <ChatBubbleLeftIcon className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Recent Chats</h2>
              </div>
              <Link href="/dashboard/teacher/chat" 
                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                View All
                <ArrowRightIcon className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-4">
              {recentChats.map((chat) => (
                <div key={chat.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 transition-colors">
                  <Image
                    src={chat.student.avatar}
                    alt={chat.student.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-black">{chat.student.name}</p>
                    <p className="text-sm text-black truncate">{chat.message}</p>
                  </div>
                  <span className="text-xs text-black">
                    {formatDistanceToNow(chat.timestamp, { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Saved Materials */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">Saved Materials</h2>
              </div>
              <Link href="/dashboard/teacher/materials" 
                className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1">
                View All
                <ArrowRightIcon className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-4">
              {savedMaterials.map((material) => (
                <div key={material.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/50 transition-colors">
                  <div className={`p-2 bg-${material.type === 'quiz' ? 'blue' : 'purple'}-100 rounded-xl`}>
                    {material.type === 'quiz' ? <DocumentTextIcon className="w-5 h-5 text-blue-600" /> 
                      : <CheckCircleIcon className="w-5 h-5 text-purple-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-black">{material.title}</p>
                    <div className="flex items-center gap-2 text-sm text-black">
                      <span>{material.type}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(material.updatedAt, { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 8: Footer */}
        <div className="mt-8 text-center border-t border-gray-200 pt-4 pb-6 text-gray-500 text-sm">
          <p>
            &copy; {new Date().getFullYear()} <a href="https://sparkskool.com" className="text-[#3ab8fe] hover:underline">SparkSkool</a>. All rights reserved.
          </p>
          <p className="mt-1">
            Created by <a href="https://leapthelimit.com" className="text-[#3ab8fe] hover:underline">LeapTheLimit</a>
          </p>
        </div>
      </div>
    </div>
  );
} 