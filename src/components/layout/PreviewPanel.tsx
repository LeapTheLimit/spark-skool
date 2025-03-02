'use client';

import { useState, useEffect } from 'react';
import { ChatMessage, ChatPreferences, SavedMaterial } from '@/services/chatService';
import ChatHistory from '@/components/ChatHistory';
import { MATERIALS_STORAGE_KEY } from '@/lib/constants';
import { useLanguage } from '@/contexts/LanguageContext';

// Base structure for all items in the panel
type BaseItem = {
  type: string;
  timestamp: string;
  icon: JSX.Element;
}

// For items that show a subject and status (like quizzes and lessons)
type SessionItem = BaseItem & {
  subject: string;
  status: string;
  description?: never;  // Ensures this type can't have a description
}

// For items that show a description (like settings changes)
type ChangeItem = BaseItem & {
  description: string;
  subject?: never;    // Ensures this type can't have a subject
  status?: never;     // Ensures this type can't have a status
}

// Union type - an item can be either a SessionItem or a ChangeItem
type Item = SessionItem | ChangeItem;

// Enhanced control types to affect chat behavior
type ControlOption = {
  label: string;
  value: string;
  promptModifier: {
    age?: string;
    style?: string;
    curriculum?: string;
    complexity?: string;
  };
}

// Structure for each section in the panel
type Section = {
  title: string;
  items?: Item[];                    // Array of items (optional)
  controls?: {                       // Control settings (optional)
    name: string;
    type: 'pills' | 'select' | 'segmented';  // Specific control types
    options: ControlOption[];
    selected?: string;               // For pills
    value?: string;                  // For select/segmented
    icon: JSX.Element;
    category: 'age' | 'style' | 'curriculum' | 'complexity';
  }[];
}

interface PreviewPanelProps {
  userId: string;
  onNewChat?: () => void;
  messages: ChatMessage[];
  onLoadChat?: (messages: ChatMessage[]) => void;
}

/**
 * PreviewPanel Component
 * Displays a control panel with:
 * - Current session items (quizzes, lessons)
 * - AI settings controls
 * - Recent changes log
 */
export default function PreviewPanel({ 
  userId, 
  onNewChat, 
  messages, 
  onLoadChat 
}: PreviewPanelProps) {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar' || language === 'he';
  const [showHistory, setShowHistory] = useState(false);
  const [preferences, setPreferences] = useState<ChatPreferences>({
    age: 'middle-school',
    style: 'formal',
    curriculum: 'common-core',
    complexity: 'moderate'
  });
  const [materials, setMaterials] = useState<SavedMaterial[]>([]);

  // Move autoSaveChat to useEffect
  useEffect(() => {
    const autoSaveChat = async () => {
      if (messages.length > 0) {
        try {
          await fetch('/api/chat-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages,
              userId,
              title: messages[0].content.slice(0, 50)
            })
          });
        } catch (error) {
          console.error('Failed to auto-save chat:', error);
        }
      }
    };

    autoSaveChat();
  }, [messages, userId]);

  // Load materials from localStorage
  useEffect(() => {
    const loadMaterials = () => {
      try {
        const stored = localStorage.getItem(MATERIALS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setMaterials(parsed);
          console.log('Loaded materials from localStorage:', parsed.length);
        }
      } catch (e) {
        console.error('Failed to load materials:', e);
      }
    };

    loadMaterials();
    
    // Listen for storage changes from other tabs/windows
    window.addEventListener('storage', loadMaterials);
    return () => window.removeEventListener('storage', loadMaterials);
  }, []);

  const sections: Section[] = [
    {
      title: t('studentLevel'),
      controls: [{
        name: t('gradeLevel'),
        type: "pills",
        category: "age",
        icon: (
          <svg className="w-5 h-5 text-cyan-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        ),
        options: [
          { label: t('elementary'), value: "elementary", promptModifier: { age: t('elementarySchool') } },
          { label: t('middleSchool'), value: "middle-school", promptModifier: { age: t('middleSchoolLevel') } },
          { label: t('highSchool'), value: "high-school", promptModifier: { age: t('highSchoolLevel') } }
        ]
      }]
    },
    {
      title: t('teachingStyle'),
      controls: [{
        name: t('style'),
        type: "select",
        category: "style",
        icon: (
          <svg className="w-5 h-5 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        ),
        options: [
          { label: t('formal'), value: "formal", promptModifier: { style: t('formalStyle') } },
          { label: t('conversational'), value: "conversational", promptModifier: { style: t('conversationalStyle') } },
          { label: t('socratic'), value: "socratic", promptModifier: { style: t('socraticStyle') } }
        ]
      }]
    },
    {
      title: t('curriculumAlignment'),
      controls: [{
        name: t('curriculum'),
        type: "select",
        category: "curriculum",
        icon: (
          <svg className="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        ),
        options: [
          { label: t('commonCore'), value: "common-core", promptModifier: { curriculum: t('commonCoreDesc') } },
          { label: t('ibProgram'), value: "ib", promptModifier: { curriculum: t('ibProgramDesc') } },
          { label: t('custom'), value: "custom", promptModifier: { curriculum: t('customCurriculumDesc') } }
        ]
      }]
    },
    {
      title: t('recentSessions'),
      items: messages.length > 0 ? [{
        type: t('currentChat'),
        timestamp: new Date().toLocaleTimeString(language === 'ar' ? 'ar-SA' : language === 'he' ? 'he-IL' : 'en-US'),
        subject: t('generalChat'),
        status: t('active'),
        icon: (
          <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )
      }] : []
    }
  ];

  const handlePreferenceChange = (category: keyof ChatPreferences, value: string) => {
    const newPreferences = { ...preferences, [category]: value };
    setPreferences(newPreferences);
    // Emit preferences change to parent component
    window.dispatchEvent(new CustomEvent('preferencesChanged', {
      detail: newPreferences
    }));
  };

  return (
    <div className={`h-full bg-gray-50 border-l ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="h-full flex flex-col">
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className="p-1.5 hover:bg-white/80 rounded-lg transition-colors"
              >
                {showHistory ? (
                  <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </button>
              <h2 className="font-medium text-gray-900 text-sm">
                {showHistory ? t('chatHistory') : t('controlPanel')}
              </h2>
            </div>
            <button 
              onClick={onNewChat}
              className="flex items-center gap-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{t('newChat')}</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-3 space-y-4">
            {sections.map((section) => (
              section.controls && (
                <div key={section.title} className="space-y-3">
                  {section.controls.map((control, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center gap-2">
                        {control.icon}
                        <label className="text-sm text-gray-700">{control.name}</label>
                      </div>
                      
                      {control.type === 'pills' && (
                        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                          {control.options.map((option) => (
                            <button
                              key={option.value}
                              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                preferences[control.category] === option.value
                                  ? 'bg-white text-gray-900 shadow-sm'
                                  : 'text-gray-500 hover:text-gray-900'
                              }`}
                              onClick={() => handlePreferenceChange(control.category, option.value)}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {control.type === 'select' && (
                        <select 
                          className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black"
                          value={preferences[control.category]}
                          onChange={(e) => handlePreferenceChange(control.category, e.target.value)}
                        >
                          {control.options.map((option) => (
                            <option key={option.value} value={option.value} className="text-black">
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              )
            ))}
          </div>

          <div className="p-4 border-t border-gray-200/50">
            <h3 className="text-sm font-medium text-gray-700 mb-2">{t('recentSessions')}</h3>
            <div className="space-y-2 max-h-[150px] overflow-y-auto">
              {messages.length > 0 ? (
                messages.slice(0, 3).map((msg, index) => (
                  <div
                    key={index}
                    className="p-2 bg-white rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <p className="text-sm text-gray-900 truncate">
                      {msg.content.slice(0, 50)}...
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date().toLocaleTimeString(
                        language === 'ar' ? 'ar-SA' : language === 'he' ? 'he-IL' : 'en-US'
                      )}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-2">
                  {t('noRecentSessions')}
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-gray-200/50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">{t('recentMaterials')}</h3>
              <button 
                onClick={() => window.location.href = '/dashboard/teacher/materials'}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {t('viewAll')} →
              </button>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {materials.length === 0 ? (
                <div className="text-center text-gray-500 py-2">
                  No materials saved yet
                </div>
              ) : (
                materials.slice(0, 5).map((material) => (
                  <div
                    key={material.id}
                    className="p-2 bg-white rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => window.location.href = `/dashboard/teacher/materials#${material.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {material.title}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {new Date(material.createdAt).toLocaleDateString()} • {material.category}
                        </p>
                      </div>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                        material.category === 'quiz' 
                          ? 'bg-purple-100 text-purple-700'
                          : material.category === 'lesson'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {material.category}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 