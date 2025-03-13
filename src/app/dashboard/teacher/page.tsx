'use client';

import { useState, useEffect, Suspense } from 'react';
import TeacherDashboard from './components/TeacherDashboard';
import { useRouter } from 'next/navigation';
import { format, isSameDay, addDays } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  UserIcon, 
  UsersIcon 
} from '@heroicons/react/24/outline';

interface ScheduleEvent {
  id: number;
  title: string;
  eventType: string;
  date: Date;
  startTime: string;
  endTime: string;
  room?: string;
  color: string;
}

export default function TeacherDashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [teacher, setTeacher] = useState<any>(null);
  const [todayEvents, setTodayEvents] = useState<ScheduleEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<ScheduleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get teacher info from localStorage
    try {
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        setTeacher(JSON.parse(userData));
      } else {
        // Create dummy data if none exists
        const dummyTeacher = {
          name: 'Teacher',
          email: 'teacher@example.com',
          school: 'Demo School',
          subject: 'All Subjects'
        };
        localStorage.setItem('currentUser', JSON.stringify(dummyTeacher));
        setTeacher(dummyTeacher);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }

    // Load schedule events
    try {
      const savedClasses = localStorage.getItem('teacherClasses');
      if (savedClasses) {
        const parsedClasses = JSON.parse(savedClasses);
        const classesWithDates = parsedClasses.map((cls: any) => ({
          ...cls,
          date: new Date(cls.date)
        }));

        // Filter today's events
        const today = new Date();
        const todayClasses = classesWithDates.filter((cls: any) => 
          isSameDay(new Date(cls.date), today)
        );
        setTodayEvents(todayClasses);

        // Filter upcoming events (next 7 days, excluding today)
        const next7Days = classesWithDates.filter((cls: any) => {
          const eventDate = new Date(cls.date);
          return eventDate > today && 
                 eventDate <= addDays(today, 7) && 
                 !isSameDay(eventDate, today);
        });
        setUpcomingEvents(next7Days);
      }
    } catch (error) {
      console.error('Error loading schedule data:', error);
    }

    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading dashboard...</div>}>
      <TeacherDashboard 
        teacher={teacher} 
        todayEvents={todayEvents} 
        upcomingEvents={upcomingEvents} 
      />
    </Suspense>
  );
}