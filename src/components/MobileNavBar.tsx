'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  HomeIcon,
  CalendarIcon,
  DocumentTextIcon,
  CogIcon,
  ClipboardDocumentListIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';

export default function MobileNavBar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const isActive = (path: string) => {
    return pathname ? pathname.includes(path) : false;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-6 md:hidden z-50">
      <div className="flex justify-between items-center">
        <Link href="/dashboard/teacher" className={`flex flex-col items-center ${isActive('/dashboard/teacher') && !isActive('/dashboard/teacher/') ? 'text-blue-600' : 'text-gray-600'}`}>
          <HomeIcon className="w-6 h-6" />
          <span className="text-xs mt-1">{t('dashboard')}</span>
        </Link>
        
        <Link href="/dashboard/teacher/schedule" className={`flex flex-col items-center ${isActive('/schedule') ? 'text-blue-600' : 'text-gray-600'}`}>
          <CalendarIcon className="w-6 h-6" />
          <span className="text-xs mt-1">{t('schedule')}</span>
        </Link>
        
        <Link href="/dashboard/teacher/tasks" className={`flex flex-col items-center ${isActive('/tasks') ? 'text-blue-600' : 'text-gray-600'}`}>
          <ClipboardDocumentListIcon className="w-6 h-6" />
          <span className="text-xs mt-1">{t('tasks')}</span>
        </Link>
        
        <Link href="/dashboard/teacher/notes" className={`flex flex-col items-center ${isActive('/notes') ? 'text-blue-600' : 'text-gray-600'}`}>
          <DocumentTextIcon className="w-6 h-6" />
          <span className="text-xs mt-1">{t('notes')}</span>
        </Link>
        
        <Link href="/dashboard/teacher/tools" className={`flex flex-col items-center ${isActive('/tools') ? 'text-blue-600' : 'text-gray-600'}`}>
          <BeakerIcon className="w-6 h-6" />
          <span className="text-xs mt-1">{t('tools')}</span>
        </Link>
        
        <Link href="/dashboard/teacher/settings" className={`flex flex-col items-center ${isActive('/settings') ? 'text-blue-600' : 'text-gray-600'}`}>
          <CogIcon className="w-6 h-6" />
          <span className="text-xs mt-1">{t('settings')}</span>
        </Link>
      </div>
    </div>
  );
} 