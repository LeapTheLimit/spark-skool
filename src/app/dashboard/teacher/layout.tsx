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
  
  useEffect(() => {
    setIsMounted(true);
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
    <div className="flex h-screen bg-[#111827] p-6">
      <TeacherSidebar />
      <div className="flex flex-1 bg-white rounded-3xl overflow-hidden relative">
        {/* Mascot positioned in the bottom right */}
        {/* <div className="absolute bottom-4 right-4 z-10"><svg width="100" height="100" viewBox="0 0 570 466" fill="none" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-lg">...</svg></div> */}
        
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 