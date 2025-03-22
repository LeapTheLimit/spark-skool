'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePathname } from 'next/navigation';
import MobileNavBar from '@/components/MobileNavBar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
  const pathname = usePathname();
  
  // Apply RTL layout when language changes
  useEffect(() => {
    const isRtl = language === 'ar' || language === 'he';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    // Add a class to handle RTL-specific styling if needed
    if (isRtl) {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
  }, [language]);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pb-16 md:pb-0">
        {children}
      </main>
      <MobileNavBar />
    </div>
  );
} 