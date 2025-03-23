'use client';

import React, { useEffect, useState } from 'react';
import TeacherSidebar from '@/components/layout/TeacherSidebar';
import AnimatedSparkMascot from '@/components/AnimatedSparkMascot';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Client-side only rendering to prevent hydration mismatches
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
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
      {/* Only render the sidebar on desktop */}
      {!isMobile && <TeacherSidebar />}
      
      <div className="flex flex-1 bg-white rounded-3xl overflow-hidden relative">
        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 