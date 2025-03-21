'use client';

import { useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageSelector({ 
  variant = 'dropdown', 
  className = ''
}: { 
  variant?: 'dropdown' | 'buttons',
  className?: string
}) {
  const { language, setLanguage, t } = useLanguage();

  const handleChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = event.target.value as 'en' | 'ar' | 'he';
    setLanguage(newLang);
  }, [setLanguage]);

  const handleButtonClick = useCallback((lang: 'en' | 'ar' | 'he') => {
    setLanguage(lang);
  }, [setLanguage]);
  
  if (variant === 'dropdown') {
    return (
      <div className={`flex items-center ${className}`}>
        <label htmlFor="language-select" className="mr-2 text-sm font-medium text-gray-700">
          {t('language')}:
        </label>
        <div className="relative">
          <select
            id="language-select"
            value={language}
            onChange={handleChange}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="en">{t('english')}</option>
            <option value="ar">{t('arabic')}</option>
            <option value="he">{t('hebrew')}</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    );
  }
  
  // Button variant
  return (
    <div className={`flex space-x-2 ${className}`}>
      <button
        onClick={() => handleButtonClick('en')}
        className={`px-3 py-1 text-sm rounded-md ${
          language === 'en' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        English
      </button>
      <button
        onClick={() => handleButtonClick('ar')}
        className={`px-3 py-1 text-sm rounded-md ${
          language === 'ar' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        العربية
      </button>
      <button
        onClick={() => handleButtonClick('he')}
        className={`px-3 py-1 text-sm rounded-md ${
          language === 'he' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        עברית
      </button>
    </div>
  );
} 