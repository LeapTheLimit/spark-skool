'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import SparkMascot from '@/components/SparkMascot';
import {
  AcademicCapIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  BellIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  PlusCircleIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ChatBubbleLeftIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface Activity {
  id: string;
  type: 'submission' | 'question' | 'assignment' | 'grade';
  student: string;
  action: string;
  timestamp: string;
}

interface ChatPreview {
  id: string;
  student: string;
  message: string;
  timestamp: string;
  isNew?: boolean;
}

export default function TeacherDashboard() {
  const { t } = useLanguage();
  const router = useRouter();
  const [teacher, setTeacher] = useState<any>(null);
  const [isNewTeacher, setIsNewTeacher] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [stats, setStats] = useState({
    students: 0,
    lessons: 0,
    materials: 0,
    upcomingLessons: 0
  });
  
  const [onboardingSteps, setOnboardingSteps] = useState([
    { 
      id: 'profile', 
      title: 'completeProfile', 
      description: 'addProfileDetails', 
      completed: false, 
      progress: 35, // They've already added basic info
      link: '/dashboard/teacher/settings' as const,
      requirements: [
        { id: 'photo', label: 'Profile photo', completed: false },
        { id: 'subjects', label: 'Teaching subjects', completed: true },
        { id: 'levels', label: 'Class levels', completed: true },
        { id: 'bio', label: 'Short bio', completed: false }
      ]
    },
    { 
      id: 'assistant', 
      title: 'personalizeAssistant', 
      description: 'customizeAI', 
      completed: false, 
      progress: 0,
      link: '/dashboard/teacher/chat' as const,
      requirements: [
        { id: 'style', label: 'Teaching style', completed: false },
        { id: 'preferences', label: 'AI preferences', completed: false },
        { id: 'curriculum', label: 'Curriculum alignment', completed: false }
      ]
    },
    { 
      id: 'lesson', 
      title: 'createFirstLesson', 
      description: 'useLessonPlanner', 
      completed: false, 
      progress: 0,
      link: '/dashboard/teacher/lessons' as const,
      requirements: [
        { id: 'lesson', label: 'Create a lesson', completed: false },
        { id: 'materials', label: 'Add teaching materials', completed: false }
      ]
    },
  ]);
  
  const [recentActivity, setRecentActivity] = useState([
    {
      id: 1,
      type: 'submission',
      student: 'Alex Johnson',
      item: 'Midterm Exam',
      time: '2 hours ago'
    },
    {
      id: 2,
      type: 'message',
      student: 'Maria Garcia',
      item: 'Question about homework',
      time: '4 hours ago'
    },
    {
      id: 3,
      type: 'grade',
      student: 'James Wilson',
      item: 'Essay Assignment',
      time: 'Yesterday'
    }
  ]);

  const [recentChats, setRecentChats] = useState([
    {
      id: 1,
      student: 'Maria Garcia',
      message: 'I have a question about the homework',
      time: '4 hours ago',
      unread: true
    },
    {
      id: 2,
      student: 'David Lee',
      message: 'Thanks for the feedback on my project',
      time: 'Yesterday',
      unread: false
    },
    {
      id: 3,
      student: 'Sarah Johnson',
      message: 'When is the next quiz?',
      time: '2 days ago',
      unread: false
    }
  ]);

  const [insights, setInsights] = useState([
    "Students performed 15% better on the latest quiz compared to the previous one",
    "3 students haven't submitted their homework yet",
    "Maria Garcia has shown significant improvement in the last month"
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [recentChatsPreview, setRecentChatsPreview] = useState<ChatPreview[]>([]);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return t('goodMorning');
    } else if (hour >= 12 && hour < 18) {
      return t('goodAfternoon');
    } else {
      return t('goodEvening');
    }
  };

  // Load teacher data and set greeting
  useEffect(() => {
    try {
      // Mock data loading
      setTimeout(() => {
        setTeacher({
          name: 'MJ',
          email: 'teacher@example.com',
          subject: 'English',
          school: 'LEAP Academy'
        });
        
        // For demo purposes, we're setting isNewTeacher to true
        // In a real app, this would be determined by user data
        setIsNewTeacher(true);
        
        // Set time-based greeting
        setGreeting(getGreeting());
        
        // Update greeting every minute
        const intervalId = setInterval(() => {
          setGreeting(getGreeting());
        }, 60000);
        
        return () => clearInterval(intervalId);
      }, 500);
    } catch (error) {
      console.error('Failed to load teacher data:', error);
    }
  }, [t]);

  // Format date with user's locale
  const formatDate = () => {
    return new Date().toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Mark onboarding step as completed with progress tracking
  const completeStep = (stepId: string) => {
    setOnboardingSteps(steps => 
      steps.map(step => 
        step.id === stepId 
          ? { 
              ...step, 
              progress: step.progress + 25, // Increment progress
              completed: step.progress + 25 >= 100 // Mark as completed if progress reaches 100%
            } 
          : step
      )
    );
  };

  // Mark specific requirement as completed
  const completeRequirement = (stepId: string, reqId: string) => {
    setOnboardingSteps(steps => 
      steps.map(step => {
        if (step.id === stepId) {
          const updatedReqs = step.requirements.map(req => 
            req.id === reqId ? { ...req, completed: true } : req
          );
          
          // Calculate new progress based on completed requirements
          const totalReqs = step.requirements.length;
          const completedReqs = updatedReqs.filter(r => r.completed).length;
          const newProgress = Math.round((completedReqs / totalReqs) * 100);
          
          return {
            ...step,
            requirements: updatedReqs,
            progress: newProgress,
            completed: newProgress === 100
          };
        }
        return step;
      })
    );
  };

  // Quick action cards
  const quickActions = [
    {
      title: t('createLesson'),
      icon: <BookOpenIcon className="w-6 h-6 text-indigo-600" />,
      href: '/dashboard/teacher/lessons/create',
      color: 'bg-indigo-50'
    },
    {
      title: t('createExam'),
      icon: <ClipboardDocumentCheckIcon className="w-6 h-6 text-blue-600" />,
      href: '/dashboard/teacher/tools/exam-creator',
      color: 'bg-blue-50'
    },
    {
      title: t('addStudents'),
      icon: <UserGroupIcon className="w-6 h-6 text-green-600" />,
      href: '/dashboard/teacher/students',
      color: 'bg-green-50'
    },
    {
      title: t('scheduleClass'),
      icon: <CalendarDaysIcon className="w-6 h-6 text-purple-600" />,
      href: '/dashboard/teacher/calendar',
      color: 'bg-purple-50'
    }
  ];

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setActivities([]);
      setRecentChatsPreview([]);
      setIsLoading(false);
    }, 1500);
  }, []);

  return (
    <div className="p-0">
      {/* Updated Header with Blue to White Gradient */}
      <div className="bg-gradient-to-b from-[#3AB7FF] to-white p-8 rounded-b-3xl shadow-sm mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
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
              <p className="text-blue-100 mt-1">
                {formatDate()}
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button className="p-3 rounded-full bg-blue-600/20 hover:bg-blue-600/30 text-white">
              <BellIcon className="w-5 h-5" />
            </button>
            <button className="p-3 rounded-full bg-blue-600/20 hover:bg-blue-600/30 text-white">
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
            </button>
            <button 
              className="p-3 rounded-full bg-blue-600/20 hover:bg-blue-600/30 text-white"
              onClick={() => router.push('/dashboard/teacher/settings')}
            >
              <UserIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Get Started Section with Navy Text */}
        <div className="mt-6 bg-[#7EB3F7]/70 backdrop-blur-sm rounded-xl p-4 border border-[#7EB3F7]/50">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-[#7EB3F7]/70 rounded-lg text-navy-800 mt-1">
              <LightBulbIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center">
                <h3 className="font-bold text-navy-800 text-lg">{t('getStarted')}</h3>
                <span className="ml-2 text-xs bg-blue-800/30 text-navy-800 px-2 py-0.5 rounded-full font-medium">{t('newTeacherWelcome')}</span>
              </div>
              <p className="mt-1 text-sm text-navy-800 font-semibold">{t('personalizeSparkMessage')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8">
        {/* Onboarding Section with Progress Indicators */}
        {isNewTeacher && (
          <div className="mb-8 bg-[#EBF3FF] rounded-xl p-6 border border-[#D1E3FF]">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('Onboarding')}</h2>
            <p className="text-gray-600 mb-6">{t('completeStepsBelow')}</p>
            
            <div className="space-y-4">
              {onboardingSteps.map((step) => (
                <div 
                  key={step.id}
                  className={`p-4 rounded-lg border ${
                    step.completed 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-white border-gray-200 hover:border-[#7EB3F7] hover:shadow-sm'
                  } transition-all`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          step.completed ? 'bg-green-100 text-green-600' : 'bg-[#D1E3FF] text-[#4A89F3]'
                        }`}>
                          {step.completed ? (
                            <CheckCircleIcon className="w-5 h-5" />
                          ) : (
                            step.id === 'profile' ? <UserIcon className="w-5 h-5" /> :
                            step.id === 'assistant' ? <UserIcon className="w-5 h-5" /> :
                            <BookOpenIcon className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{step.title}</h3>
                          <p className="text-sm text-gray-500">{step.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium text-gray-500">
                          {step.progress}% {t('complete')}
                        </div>
                        <Link 
                          href={step.link}
                          className={`flex items-center gap-1 text-sm font-medium ${
                            step.completed ? 'text-green-600' : 'text-[#4A89F3] hover:text-[#3A6CD1]'
                          }`}
                          onClick={() => !step.completed && completeStep(step.id)}
                        >
                          {step.completed ? t('completed') : t('continue')}
                          {!step.completed && <ArrowRightIcon className="w-4 h-4" />}
                        </Link>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                      <div 
                        className={`h-1.5 rounded-full ${step.completed ? 'bg-green-500' : 'bg-[#4A89F3]'}`}
                        style={{ width: `${step.progress}%` }}
                      ></div>
                    </div>
                    
                    {/* Requirements list */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {step.requirements.map(req => (
                        <div key={req.id} className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            req.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                          }`}>
                            {req.completed && <CheckCircleIcon className="w-3 h-3" />}
                          </div>
                          <span className={`text-xs ${req.completed ? 'text-green-600' : 'text-gray-500'}`}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions with Multiple Colors */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('quickActions')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link 
            href="/dashboard/teacher/lessons"
            className="bg-blue-50 hover:bg-blue-100 p-6 rounded-xl flex flex-col items-center text-center transition-colors"
          >
            <BookOpenIcon className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-medium text-gray-900">{t('createLesson')}</h3>
          </Link>
          
          <Link 
            href="/dashboard/teacher/tools/exam-creator"
            className="bg-amber-50 hover:bg-amber-100 p-6 rounded-xl flex flex-col items-center text-center transition-colors"
          >
            <DocumentTextIcon className="w-8 h-8 text-amber-600 mb-2" />
            <h3 className="font-medium text-gray-900">{t('createExam')}</h3>
          </Link>
          
          <Link 
            href="/dashboard/teacher/students"
            className="bg-rose-50 hover:bg-rose-100 p-6 rounded-xl flex flex-col items-center text-center transition-colors"
          >
            <UserGroupIcon className="w-8 h-8 text-rose-600 mb-2" />
            <h3 className="font-medium text-gray-900">{t('addStudents')}</h3>
          </Link>
          
          <Link 
            href="/dashboard/teacher/chat"
            className="bg-teal-50 hover:bg-teal-100 p-6 rounded-xl flex flex-col items-center text-center transition-colors"
          >
            <CalendarDaysIcon className="w-8 h-8 text-teal-600 mb-2" />
            <h3 className="font-medium text-gray-900">{t('scheduleClass')}</h3>
          </Link>
        </div>

        {/* Activity and Chats in Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-black mb-4">{t('recentActivity')}</h2>
            
            {isLoading ? (
              // Loading skeleton
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length > 0 ? (
              // Show actual activities
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'submission' ? 'bg-blue-100' :
                      activity.type === 'question' ? 'bg-purple-100' :
                      activity.type === 'assignment' ? 'bg-yellow-100' :
                      'bg-green-100'
                    }`}>
                      {activity.type === 'submission' ? <DocumentTextIcon className="w-6 h-6 text-blue-600" /> :
                       activity.type === 'question' ? <ChatBubbleLeftIcon className="w-6 h-6 text-purple-600" /> :
                       activity.type === 'assignment' ? <ClockIcon className="w-6 h-6 text-yellow-600" /> :
                       <ChartBarIcon className="w-6 h-6 text-green-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.student}</span> {activity.action}
                      </p>
                      <p className="text-xs text-gray-500">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Empty state
              <div className="text-center py-12">
                <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">{t('noRecentActivity')}</p>
                <p className="text-sm text-gray-500 mt-2">{t('activityWillAppearHere')}</p>
              </div>
            )}
          </div>

          {/* Recent Chats */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-black mb-4">{t('recentChats')}</h2>
            
            {isLoading ? (
              // Loading skeleton
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                      <div className="h-2 bg-gray-200 rounded animate-pulse w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentChatsPreview.length > 0 ? (
              // Show actual chats
              <div className="space-y-4">
                {recentChatsPreview.map((chat) => (
                  <Link 
                    key={chat.id}
                    href="/dashboard/teacher/chat"
                    className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {chat.student.charAt(0)}
                        </span>
                      </div>
                      {chat.isNew && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{chat.student}</p>
                      <p className="text-xs text-gray-500 truncate">{chat.message}</p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {chat.timestamp}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              // Empty state
              <div className="text-center py-12">
                <ChatBubbleLeftIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">{t('noRecentChats')}</p>
                <p className="text-sm text-gray-500 mt-2">{t('startChattingWithStudents')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}