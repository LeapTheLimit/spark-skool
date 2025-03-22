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
  SparklesIcon,
  PuzzlePieceIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ChatBubbleLeftIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow, format } from 'date-fns';
import { MATERIALS_STORAGE_KEY } from '@/lib/constants';
import { useLanguage } from '@/contexts/LanguageContext';
import SparkMascot from '@/components/SparkMascot';
import { useRouter } from 'next/navigation';
import routes from '@/app/routes';
import React from 'react';
import TeacherMascot from '@/components/TeacherMascot';
import type { Route } from 'next';
import type { UrlObject } from 'url';
import type { ComponentType } from 'react';
import { getTimeBasedGreeting, formatDateByLanguage } from '@/utils/timeUtils';
import { isProfileComplete, getProfileStatus } from '@/utils/profileUtils';

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
    completed: getProfileStatus()
  },
  {
    id: 'subjects',
    title: 'addSubjects',
    description: 'selectTeachingSubjects',
    icon: BookOpenIcon,
    link: '/dashboard/teacher/settings',
    completed: getProfileStatus()
  },
  {
    id: 'schedule',
    title: 'setupSchedule',
    description: 'addYourClassSchedule',
    icon: CalendarDaysIcon,
    link: '/dashboard/teacher/schedule',
    completed: false
  }
];

// Define proper types for your icons and routes
interface QuickAction {
  title: string;
  description: string;
  href: string | UrlObject;
  iconName: string;
  iconBg: string;
  iconColor: string;
}

interface TeachingTool {
  name: string;
  description: string;
  href: string | UrlObject;
  iconName: string;
  bgColor: string;
  iconColor: string;
}

// Icon mapper function - this safely maps string names to actual components
const getIconComponent = (iconName: string) => {
  const iconMap: {[key: string]: React.FC<{className?: string}>} = {
    'ChatBubbleLeftIcon': ChatBubbleLeftIcon,
    'DocumentTextIcon': DocumentTextIcon,
    'ChartBarIcon': ChartBarIcon,
    'UserGroupIcon': UserGroupIcon,
    'BookOpenIcon': BookOpenIcon,
    'AcademicCapIcon': AcademicCapIcon,
    // Add all other icons you use
  };
  
  return iconMap[iconName] || ChartBarIcon; // Default fallback
};

// Add this function near the top of the file to fetch upcoming events
const useUpcomingEvents = () => {
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  
  useEffect(() => {
    try {
      // Load classes from localStorage
      const savedClasses = localStorage.getItem('teacherClasses');
      if (savedClasses) {
        const allClasses = JSON.parse(savedClasses);
        
        // Find upcoming classes (today and future)
        const now = new Date();
        const upcoming = allClasses
          .filter((cls: any) => {
            const classDate = new Date(cls.date);
            const [hours, minutes] = cls.startTime.split(':').map(Number);
            classDate.setHours(hours, minutes);
            return classDate > now;
          })
          .sort((a: any, b: any) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            const [hoursA, minutesA] = a.startTime.split(':').map(Number);
            const [hoursB, minutesB] = b.startTime.split(':').map(Number);
            dateA.setHours(hoursA, minutesA);
            dateB.setHours(hoursB, minutesB);
            return dateA.getTime() - dateB.getTime();
          })
          .slice(0, 3); // Get only the next 3 events
          
        setUpcomingEvents(upcoming);
      }
    } catch (error) {
      console.error('Error loading upcoming events:', error);
    }
  }, []);
  
  return upcomingEvents;
};

// Add this function before the return statement in the TeacherDashboard component
const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case 'class':
      return <BookOpenIcon className="w-4 h-4 text-white" />;
    case 'meeting':
      return <UsersIcon className="w-4 h-4 text-white" />;
    case 'break':
      return <ClockIcon className="w-4 h-4 text-white" />;
    case 'office-hours':
      return <CalendarDaysIcon className="w-4 h-4 text-white" />;
    default:
      return <CalendarDaysIcon className="w-4 h-4 text-white" />;
  }
};

export default function TeacherDashboard({ 
  teacher, 
  todayEvents, 
  upcomingEvents: propUpcomingEvents // Rename the prop locally 
}: TeacherDashboardProps) {
  const { recentChats, savedMaterials, recentGrades } = useRecentActivity(teacher?.email || '');
  const { language, t } = useLanguage();
  const router = useRouter();
  
  // Move hook call to the top level to avoid conditional execution
  const fetchedUpcomingEvents = useUpcomingEvents();

  // Add state for tracking onboarding steps completion
  const [onboardingSteps, setOnboardingSteps] = useState([
    {
      id: 'profile',
      title: 'completeProfile',
      description: 'addProfileDetails',
      icon: UserIcon,
      link: '/dashboard/teacher/settings',
      completed: getProfileStatus()
    },
    {
      id: 'subjects',
      title: 'addSubjects',
      description: 'selectTeachingSubjects',
      icon: BookOpenIcon,
      link: '/dashboard/teacher/settings',
      completed: getProfileStatus()
    },
    {
      id: 'schedule',
      title: 'setupSchedule',
      description: 'addYourClassSchedule',
      icon: CalendarDaysIcon,
      link: '/dashboard/teacher/schedule',
      completed: false
    }
  ]);

  // Get completion percentage
  const completedStepsCount = onboardingSteps.filter(step => step.completed).length;
  const completionPercentage = Math.round((completedStepsCount / onboardingSteps.length) * 100);

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

  const quickActions = [
    {
      title: 'Chat with Spark',
      description: 'Get teaching assistance from your AI assistant',
      href: '/dashboard/teacher/chat',
      iconName: 'ChatBubbleLeftIcon',
      iconBg: 'bg-gradient-to-br from-[#e6f6ff] to-[#cceeff]',
      iconColor: 'text-[#3ab8fe]'
    },
    {
      title: 'Create Lesson',
      description: 'Create lesson plans with AI assistance',
      href: '/dashboard/teacher/lessons',
      iconName: 'BookOpenIcon',
      iconBg: 'bg-gradient-to-br from-blue-50 to-blue-100',
      iconColor: 'text-blue-700'
    },
    {
      title: 'Create Exam',
      description: 'Generate quizzes and assessments',
      href: '/dashboard/teacher/tools/exam-creator',
      iconName: 'DocumentTextIcon',
      iconBg: 'bg-gradient-to-br from-amber-50 to-amber-100',
      iconColor: 'text-amber-700'
    },
    {
      title: 'Add Students',
      description: 'Manage your class roster',
      href: '/dashboard/teacher/students',
      iconName: 'UserGroupIcon',
      iconBg: 'bg-gradient-to-br from-rose-50 to-rose-100',
      iconColor: 'text-rose-700'
    }
  ];

  const teachingTools = [
    {
      name: 'Quiz Show',
      description: 'Create interactive quiz games with customizable categories and point values.',
      href: routes.tools.examGame.quizShow,
      iconName: 'ChartBarIcon',
      bgColor: 'bg-[#3ab8fe]/10',
      iconColor: 'text-[#3ab8fe]'
    },
    {
      name: 'Word Scramble',
      description: 'Create word scramble puzzles from your vocabulary lists and terms.',
      href: '/dashboard/teacher/tools/exam-game',
      iconName: 'SparklesIcon',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      name: 'Word Search',
      description: 'Generate printable word search puzzles from your vocabulary terms.',
      href: '/dashboard/teacher/tools/exam-game',
      iconName: 'PuzzlePieceIcon',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      name: 'Timeline Creator',
      description: 'Create interactive timelines for historical events and sequences.',
      href: '/dashboard/teacher/tools/exam-game',
      iconName: 'SparklesIcon',
      bgColor: 'bg-amber-100',
      iconColor: 'text-amber-600'
    },
    {
      name: 'AI Assistant',
      description: 'Get help with lesson planning, assessments, and teaching ideas.',
      href: '/dashboard/teacher/chat',
      iconName: 'ChatBubbleLeftIcon',
      bgColor: 'bg-rose-100',
      iconColor: 'text-rose-600'
    },
    {
      name: 'Presentation Exporter',
      description: 'Export your lessons and activities as PowerPoint presentations.',
      href: '/dashboard/teacher/tools/exam-game',
      iconName: 'ChartBarIcon',
      bgColor: 'bg-teal-100',
      iconColor: 'text-teal-600'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow flex flex-col gap-6 p-6">
        {/* SECTION 1: Modern header with sleek card design and updated gradient background */}
        <div className="bg-gradient-to-br from-[#111827] via-[#192339] to-[#111827] text-white p-8 rounded-xl mb-6 shadow-md overflow-hidden relative">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 to-purple-900/5 mix-blend-overlay"></div>
          
          {/* Glowing accent in top-right */}
          <div className="absolute -top-10 right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-5">
                <div className="hidden sm:block">
                  <TeacherMascot width={60} height={60} variant="white" />
                </div>
                
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2 tracking-wide">
                    {getTimeBasedGreeting(language, teacher.name)}
                  </h1>
                  <p className="text-gray-300 text-lg">
                    {formatDateByLanguage(new Date(), language)}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Wrap the cards in a relative container to ensure they appear above the gradient */}
            <div className="relative z-10">
              {/* Rest of your card layout remains the same */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Get Started Card */}
                <div className="group">
                  <div className="bg-white/10 backdrop-blur rounded-lg p-6 hover:bg-white/15 transition-all">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3ab8fe] to-[#3ab8fe]/80 flex items-center justify-center shadow-md">
                        <LightBulbIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-white">{t('getStarted')}</h2>
                        <p className="text-white/90 text-base mt-1">{t('completeYourSetup')}</p>
                      </div>
                    </div>
                    
                    {/* Onboarding steps progress */}
                    <div className="space-y-3 my-4">
                      {onboardingSteps.map((step, index) => (
                        <div key={step.id} className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 ${
                            step.completed 
                              ? 'bg-green-500 border-green-400 text-white' 
                              : 'border-white/30 text-white/80'
                          }`}>
                            {step.completed ? (
                              <CheckCircleIcon className="w-5 h-5" />
                            ) : (
                              <span>{index + 1}</span>
                            )}
                          </div>
                          <div className="flex-1 text-white/90">
                            <div className="font-medium">{t(step.title)}</div>
                            <div className="text-sm opacity-80">{t(step.description)}</div>
                          </div>
                          <Link 
                            href={(step.link || '/dashboard/teacher/settings') as Route}
                            className={`px-3 py-1.5 rounded text-sm font-medium ${
                              step.completed 
                                ? 'bg-green-600/20 text-green-300' 
                                : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                          >
                            {step.completed ? t('completed') : t('setup')}
                          </Link>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-5 relative h-2 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="absolute left-0 top-0 h-full bg-[#3ab8fe] rounded-full"
                        style={{ width: `${completionPercentage}%` }}
                      ></div>
                    </div>
                    
                    <div className="mt-5 flex items-center">
                      <Link 
                        href={(onboardingSteps.find(step => !step.completed)?.link || '/dashboard/teacher/settings') as Route}
                        className="transition-all inline-flex items-center justify-center px-6 py-3 bg-[#3ab8fe] text-white text-base font-medium rounded-lg hover:bg-[#2a9fe6] focus:outline-none focus:ring-2 focus:ring-[#3ab8fe] focus:ring-opacity-50"
                      >
                        {t('continueSetup')}
                      </Link>
                      <span className="ml-auto text-base text-white/80">
                        {completedStepsCount}/{onboardingSteps.length} {t('completed')}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Coming Up Card */}
                <div className="group">
                  <div className="bg-white/10 backdrop-blur rounded-lg p-6 hover:bg-white/15 transition-all">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-md">
                        <CalendarDaysIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-white">{t('comingUp')}</h2>
                      </div>
                    </div>
                    
                    {fetchedUpcomingEvents.length > 0 ? (
                      <div className="space-y-3">
                        {fetchedUpcomingEvents.slice(0, 2).map((event, index) => (
                          <div key={index} className="flex items-center gap-3 text-white/90 border-b border-white/10 pb-2 last:border-b-0">
                            <div className="p-2 rounded bg-white/10">
                              {getEventIcon(event.eventType || 'class')}
                            </div>
                            <div>
                              <div className="font-medium">{event.title}</div>
                              <div className="text-sm opacity-80">
                                {formatDateByLanguage(new Date(event.date), language, 'E, MMM d')} · {event.startTime}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-white/90 flex items-center justify-center">
                        <CalendarDaysIcon className="w-6 h-6 mr-3 opacity-80" />
                        <span className="text-base">{t('noUpcomingEvents')}</span>
                      </div>
                    )}
                    
                    <div className="mt-5 text-right">
                      <Link 
                        href="/dashboard/teacher/schedule"
                        className="inline-flex items-center text-base text-white/90 hover:text-white transition-colors"
                        aria-label="View your complete schedule"
                      >
                        {t('viewSchedule')}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Quick Actions - Updated with Chat with Spark as first item */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-5 mt-8">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {/* Chat with Spark - Now first item with sky blue color */}
            <Link 
              href="/dashboard/teacher/chat"
              className="bg-gradient-to-br from-[#e6f6ff] to-[#cceeff] hover:from-[#cceeff] hover:to-[#b3e6ff] p-6 rounded-xl border border-[#99d6ff] shadow-sm transition-all group"
            >
              <div className="flex flex-col h-full">
                <div className="p-3 bg-[#3ab8fe]/20 rounded-xl w-fit mb-4 group-hover:bg-[#3ab8fe]/30 transition-colors">
                  {React.createElement(getIconComponent('ChatBubbleLeftIcon'), { className: 'w-6 h-6 text-[#3ab8fe]' })}
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
                  {React.createElement(getIconComponent('BookOpenIcon'), { className: 'w-6 h-6 text-blue-700' })}
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
                  {React.createElement(getIconComponent('DocumentTextIcon'), { className: 'w-6 h-6 text-amber-700' })}
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
                  {React.createElement(getIconComponent('UserGroupIcon'), { className: 'w-6 h-6 text-rose-700' })}
                </div>
                <h3 className="font-medium text-gray-900 mb-2">{t('addStudents')}</h3>
                <p className="text-sm text-gray-600 mt-auto leading-relaxed">Manage your class roster</p>
              </div>
            </Link>
          </div>
        </div>

        {/* SECTION 3: Teaching Tools */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mt-6">
          <div className="flex items-center gap-2 mb-6">
            <LightBulbIcon className="w-5 h-5 text-[#3ab8fe]" />
            <h2 className="text-lg font-semibold text-gray-900">{t('teachingTools')}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {teachingTools.map((tool, index) => (
              <Link 
                key={index} 
                href={tool.href as Route}
                className="p-4 border border-gray-200 rounded-xl bg-white hover:border-emerald-300 hover:bg-emerald-50/50 transition-all flex items-start gap-3"
                aria-label={`${tool.name}: ${tool.description}`}
              >
                <div className={`p-3 rounded-xl ${tool.bgColor} flex-shrink-0`}>
                  {React.createElement(getIconComponent(tool.iconName), { className: `w-6 h-6 ${tool.iconColor}` })}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-base">{tool.name}</h3>
                  <p className="text-gray-600 text-base mt-1">{tool.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* SECTION 4: Today's Schedule */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
            </div>
            <Link href="/dashboard/teacher/schedule" 
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              aria-label="View your full schedule"
            >
              View Full Schedule
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
          
          {todayEvents.length > 0 ? (
            <div className="space-y-4">
              {todayEvents.map((event, index) => (
                <div key={index} className="p-4 border border-gray-100 rounded-xl bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${event.color} text-center flex-shrink-0`}>
                        <ClockIcon className="w-6 h-6 mb-1" />
                        <div className="text-sm font-medium">{event.startTime}</div>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 text-lg">{event.title}</h3>
                        <div className="flex items-center mt-2 text-gray-600 text-base gap-3">
                          {event.room && (
                            <span className="flex items-center gap-1">
                              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              {event.room}
                            </span>
                          )}
                          {event.students && (
                            <span className="flex items-center gap-1">
                              <UsersIcon className="w-5 h-5 text-gray-500" />
                              {event.students} students
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-gray-500 text-base">{event.endTime}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <CalendarDaysIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Events Today</h3>
              <p className="text-gray-500 text-base max-w-md mb-4">
                Your schedule is clear for today. Add an event to get started.
              </p>
              <button 
                onClick={() => router.push('/dashboard/teacher/schedule' as Route)}
                className="px-5 py-3 bg-blue-600 text-white text-base rounded-lg hover:bg-blue-700"
                aria-label="Add a new event to your schedule"
              >
                Add Event
              </button>
            </div>
          )}
        </div>

        {/* SECTION 5: NEW REPORTS SECTION WITH "STILL COLLECTING" MESSAGE */}
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

        {/* SECTION 6: Recent Activity */}
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
                <DocumentIcon className="w-5 h-5 text-purple-600" />
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
                    {material.type === 'quiz' ? React.createElement(getIconComponent('DocumentTextIcon'), { className: 'w-5 h-5 text-blue-600' }) 
                      : React.createElement(getIconComponent('CheckCircleIcon'), { className: 'w-5 h-5 text-purple-600' })}
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
      </div>
      
      {/* Footer with forced white background using inline style */}
      <div 
        className="mt-auto py-6 text-center text-gray-500 text-sm" 
        style={{ backgroundColor: 'white' }}
      >
        <p>
          &copy; {new Date().getFullYear()} <a href="https://sparkskool.com" className="text-[#3ab8fe] hover:underline">SparkSkool</a>. All rights reserved.
        </p>
        <p className="mt-1">
          Created by <a href="https://leapthelimit.com" className="text-[#3ab8fe] hover:underline">LeapTheLimit</a>
        </p>
      </div>
    </div>
  );
} 