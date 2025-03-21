'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function GlobalLanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="fixed bottom-8 right-8 z-50" ref={dropdownRef}>
      {/* Globe button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-12 h-12 bg-[#3ab8fe] rounded-full text-white shadow-lg hover:bg-[#3ab8fe]/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3ab8fe]"
        aria-label="Change language"
      >
        <div className="relative w-6 h-6">
          {/* Globe icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
          
          {/* Current language indicator */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center border-2 border-[#3ab8fe]">
            <span className="text-[7px] font-bold text-[#3ab8fe]">
              {language.toUpperCase()}
            </span>
          </div>
        </div>
      </button>

      {/* Language selector dropdown */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 bg-gray-800 rounded-lg shadow-xl p-2 min-w-[160px] border border-gray-700">
          <div className="flex flex-col space-y-1">
            <button
              onClick={() => {
                setLanguage('en');
                setIsOpen(false);
              }}
              className={`flex items-center px-4 py-2 text-sm rounded-md hover:bg-gray-700 ${
                language === 'en' ? 'bg-[#3ab8fe]/10 text-[#3ab8fe]' : 'text-white'
              }`}
            >
              <span className="mr-2 w-5">🇺🇸</span>
              <span>English</span>
            </button>
            <button
              onClick={() => {
                setLanguage('ar');
                setIsOpen(false);
              }}
              className={`flex items-center px-4 py-2 text-sm rounded-md hover:bg-gray-700 ${
                language === 'ar' ? 'bg-[#3ab8fe]/10 text-[#3ab8fe]' : 'text-white'
              }`}
            >
              <span className="mr-2 w-5">🇦🇪</span>
              <span>العربية</span>
            </button>
            <button
              onClick={() => {
                setLanguage('he');
                setIsOpen(false);
              }}
              className={`flex items-center px-4 py-2 text-sm rounded-md hover:bg-gray-700 ${
                language === 'he' ? 'bg-[#3ab8fe]/10 text-[#3ab8fe]' : 'text-white'
              }`}
            >
              <span className="mr-2 w-5">🇮🇱</span>
              <span>עברית</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 