'use client';

import { useState, useEffect } from 'react';
import TeacherDashboard from './components/TeacherDashboard';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';

export default function TeacherPortal() {
  const [teacher, setTeacher] = useState(null);
  const router = useRouter();
  
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

  // Show loading state while checking auth
  if (!teacher) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return <TeacherDashboard teacher={teacher} todayEvents={[]} upcomingEvents={[]} />;
}