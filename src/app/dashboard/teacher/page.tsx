'use client';

import { useState, useEffect } from 'react';
import TeacherDashboard from './components/TeacherDashboard';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTimeBasedGreeting, formatDateByLanguage } from '@/utils/timeUtils';

export default function TeacherPortal() {
  const [teacher, setTeacher] = useState(null);
  const router = useRouter();
  const { language, t } = useLanguage();
  const [userName, setUserName] = useState('');
  
  useEffect(() => {
    // Check for user data on client side
    const currentUser = localStorage.getItem('currentUser');
    
    if (!currentUser) {
      // Redirect to login if no user found
      router.push('/auth/login' as Route);
      return;
    }

    try {
      const userData = JSON.parse(currentUser);
      setTeacher(userData);
      setUserName(userData.name || '');
    } catch (error) {
      console.error('Failed to parse user data:', error);
      router.push('/auth/login' as Route);
    }
  }, [router]);

  // Add RTL support
  useEffect(() => {
    // Set document direction based on language
    const isRtl = language === 'ar' || language === 'he';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [language]);

  // Show loading state while checking auth
  if (!teacher) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        <span className="ml-3 text-gray-600">{t('loading', { defaultValue: 'Loading...' })}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row items-center justify-between p-4 md:p-6 space-y-4 md:space-y-0">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">
          {getTimeBasedGreeting(language, userName)}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {formatDateByLanguage(new Date(), language)}
        </p>
      </div>
      <TeacherDashboard teacher={teacher} todayEvents={[]} upcomingEvents={[]} />
    </div>
  );
}