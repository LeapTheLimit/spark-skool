'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  UserIcon,
  Cog6ToothIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
  GlobeAltIcon,
  ArrowLeftIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

// Basic types
type SupportedLanguage = 'en' | 'ar' | 'he';

interface UserProfile {
  name: string;
  email: string;
  subjects: string[];
  school: string;
  avatar?: string;
  timezone: string;
  language: SupportedLanguage;
  bio?: string;
  classLevel?: string | string[];
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const { settings: themeSettings, updateSettings } = useTheme();
  
  // States
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedSchool, setEditedSchool] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [editedSubjects, setEditedSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(language as SupportedLanguage);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [theme, setTheme] = useState(themeSettings?.theme || 'system');

  // Common subject suggestions
  const subjectSuggestions = [
    'Mathematics', 'English', 'Science', 'History', 
    'Physics', 'Chemistry', 'Biology', 'Computer Science'
  ];
  
  // Load user data on component mount
  useEffect(() => {
    try {
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        const user = JSON.parse(userData);
        setProfile(user);
        setEditedName(user.name || '');
        setEditedSchool(user.school || '');
        setEditedBio(user.bio || '');
        setEditedSubjects(user.subjects || []);
        setEmailNotifications(user.notifications?.email ?? true);
        setPushNotifications(user.notifications?.push ?? true);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  }, []);

  // Effect for RTL support
  useEffect(() => {
    // Set document direction based on language
    const isRtl = language === 'ar' || language === 'he';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [language]);

  // Back to dashboard
  const goToDashboard = () => {
    router.push('/dashboard/teacher');
  };
  
  // Add subject
  const addSubject = (subject: string) => {
    if (!subject.trim() || editedSubjects.includes(subject)) return;
    setEditedSubjects([...editedSubjects, subject]);
    setNewSubject('');
  };

  // Remove subject
  const removeSubject = (subject: string) => {
    setEditedSubjects(editedSubjects.filter(s => s !== subject));
  };
  
  // Save profile changes
  const saveProfile = () => {
    if (!profile) return;

    try {
      const updatedProfile = {
        ...profile,
        name: editedName,
        school: editedSchool,
        bio: editedBio,
        subjects: editedSubjects,
      notifications: {
          ...profile.notifications,
          email: emailNotifications,
          push: pushNotifications
        }
      };
      
      localStorage.setItem('currentUser', JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
      setIsEditing(false);
      toast.success(t('profileUpdated', { defaultValue: 'Profile updated successfully' }));
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error(t('errorSaving', { defaultValue: 'Error saving changes' }));
    }
  };
  
  // Change language
  const changeLanguage = (lang: SupportedLanguage) => {
    setSelectedLanguage(lang);
    setLanguage(lang);
    
    if (profile) {
      const updatedProfile = {
        ...profile,
        language: lang
      };
      localStorage.setItem('currentUser', JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
    }
    
    toast.success(t('languageChanged', { defaultValue: 'Language updated' }));
  };
  
  // Change theme
  const changeTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    updateSettings({ theme: newTheme });
    toast.success(t('themeChanged', { defaultValue: 'Theme updated' }));
  };
  
  // Logout
  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    router.push('/auth/login');
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Back button */}
      <div className="mb-6 flex justify-between items-center">
        <button 
          onClick={goToDashboard}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>{t('backToDashboard', { defaultValue: 'Back to Dashboard' })}</span>
        </button>
        
        <h1 className="text-2xl font-bold text-black">{t('settings', { defaultValue: 'Settings' })}</h1>
        
        <div className="w-24"></div> {/* Spacer for alignment */}
      </div>
      
      {/* Settings content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
            <h2 className="font-bold text-lg">{t('profileSettings', { defaultValue: 'Profile Settings' })}</h2>
          </div>
          
          <div className="p-4">
            <div className="mb-6 flex flex-col items-center">
              <div className="mb-3 relative">
                    {profile?.avatar ? (
                      <Image
                        src={profile.avatar}
                        alt={profile.name}
                    width={80}
                    height={80}
                    className="rounded-full border-2 border-gray-200"
                      />
                    ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserIcon className="w-10 h-10 text-gray-400" />
                      </div>
                    )}
              </div>

                {!isEditing ? (
                <div className="text-center">
                  <h3 className="font-medium text-lg">{profile?.name}</h3>
                  <p className="text-gray-500 text-sm">{profile?.email}</p>
                  {profile?.school && <p className="text-gray-600 mt-1">{profile.school}</p>}
                  
                    <button
                      onClick={() => setIsEditing(true)}
                    className="mt-4 flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm mx-auto"
                    >
                    <PencilIcon className="w-3 h-3" />
                    {t('edit', { defaultValue: 'Edit Profile' })}
                    </button>
                  </div>
                ) : (
                <div className="w-full mt-2 space-y-4">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('name', { defaultValue: 'Name' })}
                      </label>
                      <input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm bg-white text-black"
                      />
                    </div>
                    
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('school', { defaultValue: 'School' })}
                      </label>
                      <input
                      value={editedSchool}
                      onChange={(e) => setEditedSchool(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm bg-white text-black"
                    />
                    </div>
                    
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('bio', { defaultValue: 'Bio' })}
                      </label>
                    <textarea
                      value={editedBio}
                      onChange={(e) => setEditedBio(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm bg-white text-black resize-none"
                      placeholder={t('bioPlaceholder', { defaultValue: 'Write a short bio about yourself' })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('subjects', { defaultValue: 'Subjects' })}
                    </label>
                    
                      <div className="flex flex-wrap gap-2 mb-2">
                      {editedSubjects.map(subject => (
                        <div key={subject} className="flex items-center bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                            <span>{subject}</span>
                            <button 
                            onClick={() => removeSubject(subject)}
                            className="ml-1 text-blue-700 hover:text-blue-900"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex gap-2">
                        <input
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm bg-white text-black"
                        placeholder={t('addSubject', { defaultValue: 'Add a subject' })}
                        />
                        <button
                        onClick={() => addSubject(newSubject)}
                        disabled={!newSubject.trim()}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50"
                      >
                        +
                        </button>
                      </div>
                      
                    <div className="mt-2 flex flex-wrap gap-1">
                      {subjectSuggestions.map(subject => (
                          <button
                            key={subject}
                          onClick={() => addSubject(subject)}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs hover:bg-gray-200"
                          >
                            {subject}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                  <div className="flex gap-2 pt-2">
                        <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm"
                        >
                      {t('cancel', { defaultValue: 'Cancel' })}
                        </button>
                    
                                <button
                      onClick={saveProfile}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm"
                                >
                      {t('save', { defaultValue: 'Save' })}
                                </button>
                              </div>
                            </div>
              )}
                        </div>
                      </div>
                    </div>
                    
        {/* Language & Notifications Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 text-white">
            <h2 className="font-bold text-lg">{t('preferences', { defaultValue: 'Preferences' })}</h2>
                    </div>
                    
          <div className="p-4 space-y-6">
            {/* Language */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <GlobeAltIcon className="w-5 h-5 text-purple-500" />
                {t('language', { defaultValue: 'Language' })}
              </h3>
              
              <div className="grid grid-cols-3 gap-2">
                    <button
                  onClick={() => changeLanguage('en')}
                  className={`py-2 px-3 text-sm font-medium rounded-md flex justify-center ${
                    selectedLanguage === 'en' 
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300' 
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  English
                    </button>
                
                <button
                  onClick={() => changeLanguage('ar')}
                  className={`py-2 px-3 text-sm font-medium rounded-md flex justify-center ${
                    selectedLanguage === 'ar' 
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300' 
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  العربية
                </button>
                
                <button
                  onClick={() => changeLanguage('he')}
                  className={`py-2 px-3 text-sm font-medium rounded-md flex justify-center ${
                    selectedLanguage === 'he' 
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300' 
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  עברית
                </button>
              </div>
            </div>
              
            {/* Notifications */}
                <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <BellIcon className="w-5 h-5 text-purple-500" />
                {t('notifications', { defaultValue: 'Notifications' })}
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{t('emailNotifications', { defaultValue: 'Email Notifications' })}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                      checked={emailNotifications} 
                      onChange={() => setEmailNotifications(!emailNotifications)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                      peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full 
                        peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
                        after:left-[2px] after:bg-white after:border-gray-300 after:border 
                      after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600">
                      </div>
                    </label>
                  </div>
                  
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{t('pushNotifications', { defaultValue: 'Push Notifications' })}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                      checked={pushNotifications} 
                      onChange={() => setPushNotifications(!pushNotifications)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                      peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full 
                        peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
                        after:left-[2px] after:bg-white after:border-gray-300 after:border 
                      after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600">
                      </div>
                    </label>
                  </div>
                      </div>
            </div>
                  </div>
                </div>
                
        {/* Theme Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white">
            <h2 className="font-bold text-lg">{t('appearance', { defaultValue: 'Appearance' })}</h2>
              </div>
          
          <div className="p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Cog6ToothIcon className="w-5 h-5 text-green-500" />
              {t('theme', { defaultValue: 'Theme' })}
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
                    <button
                onClick={() => changeTheme('light')}
                className={`py-3 px-4 flex items-center gap-3 rounded-md ${
                  theme === 'light' 
                    ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <SunIcon className="w-5 h-5" />
                <span>{t('lightTheme', { defaultValue: 'Light Theme' })}</span>
                    </button>
                    
                    <button
                onClick={() => changeTheme('dark')}
                className={`py-3 px-4 flex items-center gap-3 rounded-md ${
                  theme === 'dark' 
                    ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <MoonIcon className="w-5 h-5" />
                <span>{t('darkTheme', { defaultValue: 'Dark Theme' })}</span>
                    </button>
                    
                    <button
                onClick={() => changeTheme('system')}
                className={`py-3 px-4 flex items-center gap-3 rounded-md ${
                  theme === 'system' 
                    ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <Cog6ToothIcon className="w-5 h-5" />
                <span>{t('systemDefault', { defaultValue: 'System Default' })}</span>
                    </button>
                </div>
                
            {/* Logout button */}
            <div className="mt-8 pt-4 border-t border-gray-100">
                      <button
                onClick={handleLogout}
                className="w-full py-2 px-4 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
              >
                {t('logout', { defaultValue: 'Logout' })}
                      </button>
                  </div>
                </div>
                            </div>
                        </div>
      
      {/* Back button at bottom for easy access */}
      <div className="mt-6 text-center">
            <button
          onClick={goToDashboard}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          {t('backToDashboard', { defaultValue: 'Back to Dashboard' })}
            </button>
      </div>
    </div>
  );
}