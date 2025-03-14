'use client';

import { useState, useEffect, Suspense } from 'react';
import TeacherDashboard from './components/TeacherDashboard';
import { useRouter } from 'next/navigation';
import { format, isSameDay, addDays } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  UserIcon, 
  UsersIcon,
  CalendarDaysIcon,
  ClockIcon,
  BookOpenIcon
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
    // Create dummy data for development purposes
    const createDummyData = () => {
      const dummyTeacher = {
        name: 'Alex Teacher',
        email: 'teacher@example.com',
        school: 'Demo School',
        subject: 'Mathematics'
      };
      
      // Sample schedule events
      const dummyEvents = [
    {
      id: 1,
          title: 'Math Class - Algebra',
          eventType: 'class',
          date: new Date(),
          startTime: '09:00',
          endTime: '10:30',
          room: 'Room 101',
          color: 'bg-blue-100 text-blue-700',
          students: 25,
          isRecurring: false
    },
    {
      id: 2,
          title: 'Team Meeting',
          eventType: 'meeting',
          date: new Date(),
          startTime: '13:00',
          endTime: '14:00',
          room: 'Conference Room A',
          color: 'bg-purple-100 text-purple-700',
          students: 0,
          isRecurring: false
        }
      ];
      
      // Future events
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      
      const futureEvents = [
    {
      id: 3,
          title: 'Science Class - Chemistry',
          eventType: 'class',
          date: tomorrow,
          startTime: '10:00',
          endTime: '11:30',
          room: 'Lab 202',
          color: 'bg-green-100 text-green-700',
          students: 28,
          isRecurring: true
        },
        {
          id: 4,
          title: 'Parent Conference',
          eventType: 'meeting',
          date: dayAfterTomorrow,
          startTime: '15:00',
          endTime: '16:00',
          room: 'Office',
          color: 'bg-amber-100 text-amber-700',
          students: 0,
          isRecurring: false
        }
      ];
      
      // Save to localStorage for persistence
      localStorage.setItem('currentUser', JSON.stringify(dummyTeacher));
      localStorage.setItem('teacherClasses', JSON.stringify([...dummyEvents, ...futureEvents]));
      
      return {
        teacher: dummyTeacher,
        todayEvents: dummyEvents,
        upcomingEvents: futureEvents
      };
    };

    try {
      // Get teacher info from localStorage or create dummy data
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        setTeacher(JSON.parse(userData));
      } else {
        const { teacher } = createDummyData();
        setTeacher(teacher);
      }

      // Load schedule events
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
      } else {
        const { todayEvents, upcomingEvents } = createDummyData();
        setTodayEvents(todayEvents);
        setUpcomingEvents(upcomingEvents);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Create dummy data if there's an error
      const { teacher, todayEvents, upcomingEvents } = createDummyData();
      setTeacher(teacher);
      setTodayEvents(todayEvents);
      setUpcomingEvents(upcomingEvents);
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