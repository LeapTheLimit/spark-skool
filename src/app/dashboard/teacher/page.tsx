'use client';

import { useState, useEffect } from 'react';
import TeacherDashboard from './components/TeacherDashboard';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useLanguage } from '@/contexts/LanguageContext';
import Head from 'next/head';

export default function TeacherPortal() {
  const [teacher, setTeacher] = useState(null);
  const router = useRouter();
  const { language } = useLanguage();
  
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
  
  // Add viewport meta tag for mobile responsiveness
  useEffect(() => {
    // Make sure viewport meta tag is set for mobile responsiveness
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0';
    document.getElementsByTagName('head')[0].appendChild(meta);
    
    return () => {
      document.getElementsByTagName('head')[0].removeChild(meta);
    };
  }, []);

  // Show loading state while checking auth
  if (!teacher) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>
      <TeacherDashboard teacher={teacher} todayEvents={[]} upcomingEvents={[]} />
    </>
  );
}