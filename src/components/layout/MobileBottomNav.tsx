'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { type Route } from 'next';
import Image from 'next/image';

export default function MobileBottomNav() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [teacher, setTeacher] = useState({
    name: 'Teacher',
    subject: 'Subject',
    avatar: "/avatars/default-teacher.jpg"
  });
  
  // Load teacher data
  useState(() => {
    try {
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        const user = JSON.parse(userData);
        setTeacher({
          name: user.name || 'Teacher',
          subject: user.subject || 'Subject',
          avatar: user.avatar || "/avatars/default-teacher.jpg"
        });
      }
    } catch (error) {
      console.error('Failed to load teacher data:', error);
    }
  });
  
  const mobileMenuItems = [
    {
      id: 'dashboard',
      title: t('dashboard'),
      href: '/dashboard/teacher',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      )
    },
    {
      id: 'tools',
      title: t('tools'),
      href: '/dashboard/teacher/tools',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
        </svg>
      )
    },
    {
      id: 'schedule',
      title: t('schedule'),
      href: '/dashboard/teacher/schedule',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'tasks',
      title: t('tasks'),
      href: '/dashboard/teacher/tasks',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    {
      id: 'more',
      title: t('more'),
      href: '#',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      )
    },
  ];
  
  const allMenuItems = [
    // ... add all menu items from the original TeacherSidebar component
    {
      id: 'dashboard',
      title: t('dashboard'),
      href: '/dashboard/teacher',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      )
    },
    {
      id: 'chat',
      title: t('chat'),
      href: '/dashboard/teacher/chat',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      )
    },
    // ... add all other menu items
  ];
  
  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#111827] border-t border-gray-700">
        <div className="grid grid-cols-5 h-16">
          {mobileMenuItems.map((item) => (
            <Link
              key={item.id}
              href={item.id === 'more' ? '#' : item.href as Route}
              onClick={() => {
                if (item.id === 'more') {
                  setShowMobileDrawer(true);
                } else {
                  setActiveTab(item.id);
                }
              }}
              className={`flex flex-col items-center justify-center ${
                activeTab === item.id 
                  ? 'text-[#3ab8fe]' 
                  : 'text-gray-400'
              }`}
            >
              <span className={`${activeTab === item.id ? 'text-[#3ab8fe]' : 'text-gray-400'}`}>
                {item.icon}
              </span>
              <span className="text-xs mt-1">{typeof item.title === 'string' ? item.title : t('more')}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile drawer */}
      {showMobileDrawer && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setShowMobileDrawer(false)}>
          <div className="absolute bottom-16 left-0 right-0 bg-[#111827] p-4 rounded-t-xl max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">Menu</h3>
              <button onClick={() => setShowMobileDrawer(false)} className="text-gray-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {allMenuItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href as Route}
                  onClick={() => {
                    setActiveTab(item.id);
                    setShowMobileDrawer(false);
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg ${
                    activeTab === item.id 
                      ? 'bg-white/10 text-[#3ab8fe]' 
                      : 'text-gray-400'
                  }`}
                >
                  <span className={`${activeTab === item.id ? 'text-[#3ab8fe]' : 'text-gray-400'}`}>
                    {item.icon}
                  </span>
                  <span className="text-xs mt-1 text-center">{typeof item.title === 'string' ? item.title : t('more')}</span>
                </Link>
              ))}
            </div>
            
            {/* Profile section in mobile drawer */}
            <div className="mt-6 p-4 bg-[#2563eb]/20 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image
                    src={teacher?.avatar || "/avatars/default-teacher.jpg"}
                    alt={teacher?.name || "Teacher"}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div>
                    <div className="text-white font-medium truncate">
                      {teacher?.name}
                    </div>
                    <div className="text-gray-300 text-sm truncate">
                      {teacher?.subject} Teacher
                    </div>
                  </div>
                </div>
                <Link 
                  href="/dashboard/teacher/settings" 
                  className="p-2 hover:bg-white/10 rounded-full text-[#3ab8fe] hover:text-white transition-colors"
                  onClick={() => setShowMobileDrawer(false)}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 