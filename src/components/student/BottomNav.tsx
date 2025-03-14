'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HomeIcon,
  BookOpenIcon,
  CalendarIcon,
  AcademicCapIcon,
  SparklesIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  BookmarkIcon,
  PencilIcon,
  CalculatorIcon,
  LanguageIcon,
  BeakerIcon,
  PaintBrushIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import type { Route } from 'next';

const subjects = [
  { 
    icon: CalculatorIcon, 
    label: 'Math', 
    color: 'bg-blue-500',
    textColor: 'text-blue-500',
    href: '/dashboard/student/directory/math' as Route,
    fullName: 'Mathematics'
  },
  { 
    icon: BeakerIcon, 
    label: 'Chemistry', 
    color: 'bg-green-500',
    textColor: 'text-green-500',
    href: '/dashboard/student/directory/chemistry' as Route
  },
  { 
    icon: BeakerIcon, 
    label: 'Physics', 
    color: 'bg-purple-500',
    textColor: 'text-purple-500',
    href: '/dashboard/student/directory/physics' as Route
  },
  { 
    icon: BeakerIcon, 
    label: 'Biology', 
    color: 'bg-rose-500',
    textColor: 'text-rose-500',
    href: '/dashboard/student/directory/biology' as Route
  },
  { 
    icon: ComputerDesktopIcon, 
    label: 'CS',
    color: 'bg-indigo-500',
    textColor: 'text-indigo-500',
    href: '/dashboard/student/directory/computer-science' as Route,
    fullName: 'Computer Science'
  },
  { 
    icon: LanguageIcon, 
    label: 'English', 
    color: 'bg-pink-500',
    textColor: 'text-pink-500',
    href: '/dashboard/student/directory/english' as Route
  },
  { 
    icon: LanguageIcon, 
    label: 'Arabic', 
    color: 'bg-amber-500',
    textColor: 'text-amber-500',
    href: '/dashboard/student/directory/arabic' as Route
  },
  { 
    icon: LanguageIcon, 
    label: 'Hebrew', 
    color: 'bg-cyan-500',
    textColor: 'text-cyan-500',
    href: '/dashboard/student/directory/hebrew' as Route
  }
] as const;

const mainNavItems = [
  { icon: HomeIcon, label: 'Home', href: '/dashboard/student' as Route },
  { icon: BookOpenIcon, label: 'Directory', href: '/dashboard/student/directory' as Route },
  { 
    icon: SparklesIcon, 
    label: 'AI', 
    href: '/dashboard/student/chat' as Route, 
    hasNotification: true 
  },
  { icon: CalendarIcon, label: 'Schedule', href: '/dashboard/student/schedule' as Route },
  { icon: AcademicCapIcon, label: 'Classroom', href: '/dashboard/student/classroom' as Route },
];

export function StudentBottomNav() {
  const pathname = usePathname() || '';
  const [showSubjects, setShowSubjects] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const isDirectoryPage = pathname?.includes('/dashboard/student/directory') || false;

  // Get current subject from pathname
  const currentSubject = pathname?.split('/').pop() || '';

  // Updated gradient with exact colors from the image
  const getAllSubjectsGradient = () => {
    if (!isDirectoryPage) return '';
    
    return `bg-gradient-to-r 
      from-[#006FE8] 1%
      via-[#006FE8] 5%
      via-[#00B4D8] 15%
      via-[#02C39A] 30%
      via-[#90BE6D] 45%
      via-[#F9C74F] 60%
      via-[#F8961E] 75%
      to-[#F94144] 90%`;
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (isDirectoryPage) {
        setShowSubjects(currentScrollY < lastScrollY || currentScrollY < 100);
        setLastScrollY(currentScrollY);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isDirectoryPage]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Gradient Line - Now thinner */}
      <AnimatePresence>
        {isDirectoryPage && !showSubjects && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "2px" }}
            exit={{ opacity: 0, height: 0 }}
            className={`w-full cursor-pointer ${getAllSubjectsGradient()}`}
            onClick={() => setShowSubjects(true)}
          />
        )}
      </AnimatePresence>

      <div className="bg-white shadow-lg">
        {/* Subject Pills */}
        <AnimatePresence>
          {showSubjects && isDirectoryPage && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="w-full border-b border-gray-100"
            >
              <motion.div 
                className="py-2 flex items-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
              >
                <div className="flex gap-4 overflow-x-auto no-scrollbar px-8 py-2">
                  {subjects.map((subject, index) => (
                    <Link href={subject.href} key={index}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex-shrink-0 ${subject.color} bg-opacity-5 px-8 py-3 rounded-2xl 
                          flex items-center gap-3 cursor-pointer transition-all min-w-[140px]
                          hover:shadow-md
                          ${pathname.includes(subject.href) ? `${subject.color} bg-opacity-10 shadow-sm` : ''}`}
                      >
                        <subject.icon className={`w-5 h-5 ${subject.textColor}`} />
                        <span className={`text-sm font-medium ${subject.textColor}`}>
                          {subject.label}
                        </span>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Navigation */}
        <motion.div className="flex justify-between items-center px-8 py-3">
          {mainNavItems.map((item, index) => (
            <Link key={index} href={item.href}>
              <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center gap-0.5 relative
                  ${pathname === item.href ? 'text-violet-600' : 'text-gray-400'}
                  transition-colors duration-200`}
              >
                <div className="relative">
                  <item.icon className="w-5 h-5" />
                  {item.hasNotification && item.label === 'AI' && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full" />
                  )}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  );
}