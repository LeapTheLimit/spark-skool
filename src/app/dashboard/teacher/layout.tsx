'use client';

import React, { useEffect, useState } from 'react';
import TeacherSidebar from '@/components/layout/TeacherSidebar';
import AnimatedSparkMascot from '@/components/AnimatedSparkMascot';
import { useLanguage } from '@/contexts/LanguageContext';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Client-side only rendering to prevent hydration mismatches
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { language } = useLanguage();
  
  useEffect(() => {
    setIsMounted(true);
    
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Listen for sidebar collapse state changes
    const handleSidebarChange = (e: CustomEvent) => {
      setIsSidebarCollapsed(e.detail.collapsed);
    };
    
    window.addEventListener('sidebarStateChange' as any, handleSidebarChange);
    
    // Add extra event listener for settings page clicks
    const handleSettingsClick = (event: MouseEvent) => {
      // Check if the click is targeted at a navigation element
      const target = event.target as HTMLElement;
      const isNavigationClick = 
        target.closest('a[href]') || 
        target.closest('button') || 
        target.closest('nav') ||
        target.closest('.navigation-element');
      
      if (isNavigationClick) {
        // Allow the event to bubble up
        return true;
      }
    };
    
    // Add the event listener
    window.addEventListener('click', handleSettingsClick, true);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('sidebarStateChange' as any, handleSidebarChange);
      window.removeEventListener('click', handleSettingsClick, true);
    };
  }, []);
  
  if (!isMounted) {
    // Show a simple loading state until client-side code takes over
    return (
      <div className="flex h-screen bg-[#111827] p-6">
        <div className="flex flex-1 bg-white rounded-3xl overflow-hidden relative">
          <div className="flex items-center justify-center w-full">
            <div className="animate-pulse text-gray-400">Loading...</div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-full">
      {/* Position the sidebar with fixed position to ensure it stays accessible */}
      {!isMobile && (
        <div className={`fixed ${language === 'ar' || language === 'he' ? 'right-0' : 'left-0'} top-0 h-screen z-[9999] pointer-events-auto navigation-element`}>
          <TeacherSidebar onCollapse={(collapsed) => {
            setIsSidebarCollapsed(collapsed);
            // Dispatch a custom event to notify other components
            window.dispatchEvent(new CustomEvent('sidebarStateChange', { 
              detail: { collapsed } 
            }));
          }} />
        </div>
      )}
      
      {/* Add margin to main content to account for sidebar width and RTL layout */}
      <div className={`flex flex-1 ${!isMobile ? (isSidebarCollapsed ? 
        (language === 'ar' || language === 'he' ? 'mr-[70px]' : 'ml-[70px]') : 
        (language === 'ar' || language === 'he' ? 'mr-[280px]' : 'ml-[280px]')) : ''} transition-all duration-300`}>
        <div className="flex flex-1 bg-white rounded-3xl overflow-hidden relative">
          {/* Main content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
} 