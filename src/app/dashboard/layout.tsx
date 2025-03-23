'use client';

import { ReactNode } from 'react';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { useEffect, useState } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Set initial value
    checkMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content Area - NO SIDEBAR HERE */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile-only: Top header with logo */}
        {isMobile && (
          <header className="bg-[#111827] text-white p-4 flex items-center justify-center">
            <div className="flex items-center">
              <svg
                className="w-8 h-8 mr-2"
                viewBox="0 0 127 45"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M13.53 19.06q.78 1.47.36 3.72h-.03q-1.05.18-2.25.24-1.2.03-2.25-.27.18-.81-.33-1.35a2.3 2.3 0 0 0-1.23-.69q-.72-.15-1.41.15-.66.3-.78 1.14-.06.21-.06.42.03.18.06.39.24.72.78.96t1.17.33q1.59.18 2.94 1.02a7.2 7.2 0 0 1 2.25 2.13q.54.69.81 1.5.27.78.3 1.62.06.84-.12 1.71-.15.84-.51 1.62-.36.93-.96 1.59t-1.38 1.08q-.75.42-1.65.63-.87.18-1.8.15-1.32-.03-2.64-.45a8.2 8.2 0 0 1-2.31-1.23 5.9 5.9 0 0 1-1.62-1.89Q.27 32.44.36 31v-.18q1.05-.15 2.31-.06 1.26.06 2.28.03.06.96.75 1.44.72.48 1.5.48.81-.03 1.38-.54.6-.51.42-1.56-.09-.72-.54-1.14-.45-.45-1.08-.72-.6-.27-1.32-.39-.72-.15-1.35-.27-.6-.12-1.11-.39t-.93-.63q-1.38-1.32-1.8-2.91-.39-1.59-.03-3.09t1.35-2.73a6.3 6.3 0 0 1 2.46-1.83q.72-.3 1.59-.39.87-.12 1.74-.06.9.03 1.74.24.87.21 1.59.54 1.44.75 2.22 2.22" fill="#3AB7FF"/>
              </svg>
              <span className="text-lg font-bold">Spark Skool</span>
              <span className="ml-2 px-1.5 py-0.5 text-xs font-bold bg-[#3ab8fe]/20 text-[#3ab8fe] rounded-md border border-[#3ab8fe]/30">
                Beta
              </span>
            </div>
          </header>
        )}
        
        {/* Content - This will contain the teacher layout with sidebar */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
        
        {/* Mobile Bottom Navigation - ONLY for mobile */}
        {isMobile && <MobileBottomNav />}
      </div>
    </div>
  );
} 