'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import {
  UserCircleIcon,
  Cog6ToothIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
  LanguageIcon,
  SwatchIcon,
  PencilIcon,
  UserIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

interface UserProfile {
  name: string;
  email: string;
  subjects: string[];
  school: string;
  avatar?: string;
  classLevel?: string | string[];
  timezone: string;
  language: string;
  bio?: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  colorScheme: string;
  background: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'app' | 'localization' | 'notifications'>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'system',
    language: 'en',
    notifications: true,
    colorScheme: 'blue',
    background: 'white'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { t, language, setLanguage } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const router = useRouter();
  const { settings: themeSettings, updateSettings: updateThemeSettings } = useTheme();

  // Add state for subject input
  const [subjectInput, setSubjectInput] = useState('');

  // Expanded timezone list with Middle Eastern regions
  const timezones = [
    // Middle East
    'Asia/Jerusalem',
    'Asia/Riyadh',
    'Asia/Amman',
    'Asia/Dubai',
    'Asia/Baghdad',
    'Asia/Tehran',
    'Asia/Qatar',
    'Asia/Beirut',
    
    // North America
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Toronto',
    'America/Vancouver',
    'America/Mexico_City',
    
    // Europe
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Madrid',
    'Europe/Rome',
    'Europe/Moscow',
    'Europe/Istanbul',
    
    // Asia Pacific
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Hong_Kong',
    'Asia/Singapore',
    'Asia/Seoul',
    'Asia/Kolkata',
    
    // Oceania
    'Australia/Sydney',
    'Australia/Melbourne',
    'Australia/Perth',
    'Pacific/Auckland',
    
    // Africa
    'Africa/Cairo',
    'Africa/Johannesburg',
    'Africa/Lagos',
    'Africa/Nairobi'
  ];

  // Common grade level suggestions
  const gradeLevelSuggestions = [
    // Elementary School
    'Kindergarten',
    '1st Grade',
    '2nd Grade',
    '3rd Grade',
    '4th Grade',
    '5th Grade',
    '6th Grade',
    
    // Middle School
    '7th Grade',
    '8th Grade',
    '9th Grade',
    
    // High School
    '10th Grade',
    '11th Grade',
    '12th Grade',
    
    // Advanced Courses
    'AP Physics',
    'AP Chemistry',
    'AP Biology',
    'AP Mathematics',
    'AP Computer Science',
    'AP English',
    'AP History',
    
    // IB Courses
    'IB Physics',
    'IB Chemistry',
    'IB Biology',
    'IB Mathematics',
    'IB Computer Science',
    'IB English',
    'IB History',
    
    // College Prep
    'Honors Physics',
    'Honors Chemistry',
    'Honors Biology',
    'Honors Mathematics',
    'Honors English',
    'Honors History'
  ];

  // Common subject suggestions
  const subjectSuggestions = [
    // Core Subjects
    'Mathematics',
    'English',
    'Science',
    'History',
    'Social Studies',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'Foreign Language',
    
    // Languages
    'Spanish',
    'French',
    'German',
    'Arabic',
    'Chinese',
    'Japanese',
    
    // Arts & Humanities
    'Art',
    'Music',
    'Drama',
    'Physical Education',
    'Health',
    
    // Specialized
    'Economics',
    'Business',
    'Psychology',
    'Philosophy',
    'Religious Studies',
    'Geography',
    'Political Science',
    'Engineering',
    'Environmental Science'
  ];

  // Add color scheme options
  const colorSchemes = [
    { id: 'spark', color: 'bg-[#3AB8FE]', label: 'Spark', primary: '#3AB8FE' },
    { id: 'blue', color: 'bg-blue-500', label: 'Blue', primary: '#3B82F6' },
    { id: 'purple', color: 'bg-purple-500', label: 'Purple', primary: '#8B5CF6' },
    { id: 'green', color: 'bg-green-500', label: 'Green', primary: '#22C55E' },
    { id: 'rose', color: 'bg-rose-500', label: 'Rose', primary: '#F43F5E' }
  ];

  // Add background options
  const backgroundOptions = [
    { id: 'white', color: 'bg-white', label: 'Clean White', preview: 'bg-white' },
    { id: 'light', color: 'bg-gray-50', label: 'Light Gray', preview: 'bg-gray-50' },
    { id: 'cool', color: 'bg-blue-50', label: 'Cool Blue', preview: 'bg-blue-50' },
    { id: 'warm', color: 'bg-orange-50', label: 'Warm', preview: 'bg-orange-50' }
  ];

  // Use useMemo for defaultProfile
  const defaultProfile = useMemo(() => ({
    name: '',
    email: '',
    subjects: [],
    school: '',
    bio: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: language,
    notifications: {
      email: true,
      push: true,
      sms: false
    }
  }), [language]);

  // Load user data and settings
  useEffect(() => {
    try {
      // Load user profile
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        const user = JSON.parse(userData);
        
        // Ensure subjects array exists
        if (!user.subjects) {
          user.subjects = [];
        }
        
        // Ensure notifications object exists
        if (!user.notifications) {
          user.notifications = {
            email: true,
            push: true,
            sms: false
          };
        }
        
        // Ensure timezone exists
        if (!user.timezone) {
          user.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        }
        
        setProfile(user);
        setEditedProfile(user);
        setSelectedLanguage(user.language || language);
      } else {
        // If no user data, initialize with defaults
        setProfile(defaultProfile);
        setEditedProfile(defaultProfile);
      }

      // Load app settings
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings');
      
      // Initialize with defaults on error
      setProfile(defaultProfile);
      setEditedProfile(defaultProfile);
    }
  }, [defaultProfile]);

  useEffect(() => {
    setSelectedLanguage(language);
  }, [language]);

  // Handle profile input changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!editedProfile) return;
    
    const { name, value } = e.target;
    setEditedProfile({
      ...editedProfile,
      [name]: value
    });
  };

  // Handle file upload for avatar
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editedProfile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImagePreview(result);
      setEditedProfile({
        ...editedProfile,
        avatar: result
      });
    };
    reader.readAsDataURL(file);
  };

  // Handle notification toggle
  const handleNotificationToggle = (type: 'email' | 'push' | 'sms') => {
    if (!editedProfile) return;
    
    // Ensure notifications object exists
    const notifications = editedProfile.notifications || { email: false, push: false, sms: false };
    
    setEditedProfile({
      ...editedProfile,
      notifications: {
        ...notifications,
        [type]: !notifications[type]
      }
    });
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    try {
      if (!editedProfile) return;

      // Save to localStorage
      localStorage.setItem('currentUser', JSON.stringify(editedProfile));
      
      // Update state
      setProfile(editedProfile);
      setIsEditing(false);
      
      // Trigger update event for sidebar
      window.dispatchEvent(new Event('storage'));
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to save profile');
    }
  };

  // Save app settings
  const handleSaveSettings = (newSettings: Partial<AppSettings>) => {
    // Update local state
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    // Update global theme settings
    updateThemeSettings(newSettings);
    
    toast.success(t('settingsUpdated'));
  };

  // Handle language change
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value as any;
    setSelectedLanguage(newLanguage);
    handleSaveSettings({ language: newLanguage });
    
    if (editedProfile) {
      setEditedProfile({
        ...editedProfile,
        language: newLanguage
      });
    }
  };

  // Handle timezone change
  const handleTimezoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTimezone = e.target.value;
    
    if (editedProfile) {
      setEditedProfile({
        ...editedProfile,
        timezone: newTimezone
      });
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    router.push('/auth/login');
  };

  // Save settings
  const saveSettings = () => {
    handleSaveProfile();
  };

  // Handle adding a new class level
  const handleAddClassLevel = () => {
    if (!editedProfile || !editedProfile.classLevel) return;
    
    // If classLevel is a string, convert to array with existing value
    const currentLevels = Array.isArray(editedProfile.classLevel) 
      ? [...editedProfile.classLevel] 
      : [editedProfile.classLevel];
    
    // Add a new empty class level
    setEditedProfile({
      ...editedProfile,
      classLevel: [...currentLevels, '']
    });
  };

  // Handle class level change
  const handleClassLevelChange = (index: number, value: string) => {
    if (!editedProfile || !editedProfile.classLevel) return;
    
    const levels = Array.isArray(editedProfile.classLevel) 
      ? [...editedProfile.classLevel] 
      : [editedProfile.classLevel];
    
    levels[index] = value;
    
    setEditedProfile({
      ...editedProfile,
      classLevel: levels
    });
  };

  // Handle removing a class level
  const handleRemoveClassLevel = (index: number) => {
    if (!editedProfile || !editedProfile.classLevel) return;
    
    const levels = Array.isArray(editedProfile.classLevel) 
      ? [...editedProfile.classLevel] 
      : [editedProfile.classLevel];
    
    levels.splice(index, 1);
    
    setEditedProfile({
      ...editedProfile,
      classLevel: levels.length === 1 ? levels[0] : levels
    });
  };

  // Handle adding a new class level with suggestion
  const handleAddClassLevelWithSuggestion = (suggestion: string) => {
    if (!editedProfile) return;
    
    // If classLevel is undefined, initialize as array with suggestion
    if (!editedProfile.classLevel) {
      setEditedProfile({
        ...editedProfile,
        classLevel: [suggestion]
      });
      return;
    }
    
    // If classLevel is a string, convert to array with existing value and add suggestion
    const currentLevels = Array.isArray(editedProfile.classLevel) 
      ? [...editedProfile.classLevel] 
      : [editedProfile.classLevel];
    
    // Add the suggestion if it's not already in the list
    if (!currentLevels.includes(suggestion)) {
      setEditedProfile({
        ...editedProfile,
        classLevel: [...currentLevels, suggestion]
      });
    }
  };

  // Add subject handler
  const handleAddSubject = (subject: string) => {
    if (!editedProfile) return;
    if (!editedProfile.subjects.includes(subject)) {
      setEditedProfile({
        ...editedProfile,
        subjects: [...editedProfile.subjects, subject]
      });
    }
    setSubjectInput('');
  };

  // Remove subject handler
  const handleRemoveSubject = (subjectToRemove: string) => {
    if (!editedProfile) return;
    setEditedProfile({
      ...editedProfile,
      subjects: editedProfile.subjects.filter(subject => subject !== subjectToRemove)
    });
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-black mb-6">{t('settings')}</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-white rounded-xl shadow-sm p-4 h-fit">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-left ${
                activeTab === 'profile' ? 'bg-blue-50 text-blue-600' : 'text-black hover:bg-gray-50'
              }`}
            >
              <UserIcon className="w-5 h-5 mr-3" />
              {t('profile')}
            </button>
            
            <button
              onClick={() => setActiveTab('localization')}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-left ${
                activeTab === 'localization' ? 'bg-blue-50 text-blue-600' : 'text-black hover:bg-gray-50'
              }`}
            >
              <GlobeAltIcon className="w-5 h-5 mr-3" />
              {t('localizationSettings')}
            </button>
            
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-left ${
                activeTab === 'notifications' ? 'bg-blue-50 text-blue-600' : 'text-black hover:bg-gray-50'
              }`}
            >
              <BellIcon className="w-5 h-5 mr-3" />
              {t('notifications')}
            </button>
            
            <button
              onClick={() => setActiveTab('app')}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-left ${
                activeTab === 'app' ? 'bg-blue-50 text-blue-600' : 'text-black hover:bg-gray-50'
              }`}
            >
              <Cog6ToothIcon className="w-5 h-5 mr-3" />
              {t('appSettings')}
            </button>
          </nav>
          
          {/* Logout button in sidebar */}
          <div className="mt-8 pt-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              {t('logout')}
            </button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl shadow-sm">
              {/* Profile Header with Avatar */}
              <div className="relative h-32 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-xl">
                <div className="absolute -bottom-12 left-6 flex items-end">
                  <div className="relative">
                    {profile?.avatar ? (
                      <Image
                        src={profile.avatar}
                        alt={profile.name}
                        width={96}
                        height={96}
                        className="w-24 h-24 rounded-full border-4 border-white shadow-md"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center shadow-md">
                        <UserIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    {isEditing && (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white hover:bg-blue-700 shadow-lg"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Content */}
              <div className="pt-16 p-6">
                {!isEditing ? (
                  <div className="space-y-6">
                    {/* Name and Title */}
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{profile?.name}</h2>
                      <p className="text-gray-600">
                        {(profile?.subjects ?? []).length > 0 
                          ? `${profile?.subjects?.join(', ')} ${t('teacher')}` 
                          : t('teacher')}
                        {profile?.school ? ` ${t('at')} ${profile.school}` : ''}
                      </p>
                    </div>

                    {/* Bio Section */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-blue-900 mb-2">{t('bio')}</h3>
                      <p className="text-blue-800">
                        {profile?.bio || t('noBioYet')}
                      </p>
                    </div>

                    {/* Subjects and Class Levels */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Subjects */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-3">{t('subjects')}</h3>
                        <div className="flex flex-wrap gap-2">
                          {profile?.subjects?.map((subject) => (
                            <span 
                              key={subject}
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                            >
                              {subject}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Class Levels */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-3">{t('classLevels')}</h3>
                        <div className="flex flex-wrap gap-2">
                          {profile?.classLevel && (Array.isArray(profile.classLevel) ? profile.classLevel : [profile.classLevel]).map((level) => (
                            <span 
                              key={level}
                              className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                            >
                              {level}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="border-t pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">{t('email')}</h3>
                          <p className="text-gray-900">{profile?.email}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">{t('school')}</h3>
                          <p className="text-gray-900">{profile?.school || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Edit Button */}
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {t('editProfile')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-black mb-2">
                        {t('fullName')}
                      </label>
                      <input
                        id="name"
                        type="text"
                        name="name"
                        value={editedProfile?.name || ''}
                        onChange={handleProfileChange}
                        className="w-full p-2.5 bg-gray-100 border border-gray-300 text-black rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
                        {t('email')}
                      </label>
                      <input
                        id="email"
                        type="email"
                        name="email"
                        value={editedProfile?.email || ''}
                        disabled
                        className="w-full p-2.5 bg-gray-100 border border-gray-300 text-black rounded-lg cursor-not-allowed opacity-75"
                      />
                      <p className="mt-1 text-sm text-blue-600">
                        {t('contactSupportToChangeEmail')}
                      </p>
                    </div>
                    
                    <div>
                      <label htmlFor="subjects" className="block text-sm font-medium text-black mb-2">
                        {t('subjects')}
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {editedProfile?.subjects.map((subject) => (
                          <div 
                            key={subject}
                            className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full flex items-center gap-2"
                          >
                            <span>{subject}</span>
                            <button 
                              onClick={() => handleRemoveSubject(subject)}
                              className="hover:text-blue-900"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={subjectInput}
                          onChange={(e) => setSubjectInput(e.target.value)}
                          placeholder={t('enterSubject')}
                          className="flex-1 p-2.5 bg-gray-100 border border-gray-300 text-black rounded-lg"
                        />
                        <button
                          onClick={() => handleAddSubject(subjectInput)}
                          disabled={!subjectInput.trim()}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {t('add')}
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        {subjectSuggestions.map((subject) => (
                          <button
                            key={subject}
                            onClick={() => handleAddSubject(subject)}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-black rounded-full text-sm"
                          >
                            {subject}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="school" className="block text-sm font-medium text-black mb-2">
                        {t('school')}
                      </label>
                      <input
                        id="school"
                        type="text"
                        name="school"
                        value={editedProfile?.school || ''}
                        onChange={handleProfileChange}
                        className="w-full p-2.5 bg-gray-100 border border-gray-300 text-black rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-black">
                          {t('classLevels')}
                        </label>
                        <button
                          type="button"
                          onClick={handleAddClassLevel}
                          className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          {t('addClass')}
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        {editedProfile?.classLevel && (
                          Array.isArray(editedProfile.classLevel) ? (
                            editedProfile.classLevel.map((level, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={level}
                                  onChange={(e) => handleClassLevelChange(index, e.target.value)}
                                  placeholder={t('enterClassLevel')}
                                  className="flex-1 p-2.5 bg-gray-100 border border-gray-300 text-black rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                  list="grade-suggestions"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveClassLevel(index)}
                                  className="p-2 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-50"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                  </svg>
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editedProfile.classLevel}
                                onChange={(e) => handleClassLevelChange(0, e.target.value)}
                                placeholder={t('enterClassLevel')}
                                className="flex-1 p-2.5 bg-gray-100 border border-gray-300 text-black rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                list="grade-suggestions"
                              />
                            </div>
                          )
                        )}
                        
                        {/* Datalist for grade level suggestions */}
                        <datalist id="grade-suggestions">
                          {gradeLevelSuggestions.map((grade, index) => (
                            <option key={index} value={grade} />
                          ))}
                        </datalist>
                      </div>
                      
                      {/* Quick grade level suggestions */}
                      <div className="mt-2">
                        <p className="text-sm text-black mb-2">{t('quickAdd')}:</p>
                        <div className="flex flex-wrap gap-2">
                          {['1st Grade', '5th Grade', '7th Grade', '9th Grade', '11th Grade', 'AP Physics'].map((grade) => (
                            <button
                              key={grade}
                              type="button"
                              onClick={() => handleAddClassLevelWithSuggestion(grade)}
                              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-black rounded-full text-sm"
                            >
                              {grade}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Add Bio section */}
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-black">
                        {t('bio')}
                      </label>
                      <textarea
                        name="bio"
                        value={editedProfile?.bio || ''}
                        onChange={handleProfileChange}
                        placeholder={t('enterBio')}
                        maxLength={200}
                        rows={4}
                        className="w-full p-2.5 bg-gray-100 border border-gray-300 text-black rounded-lg resize-none"
                      />
                      <p className="text-sm text-gray-500">
                        {((editedProfile?.bio?.length || 0) + '/200')} {t('characters')}
                      </p>
                    </div>
                    
                    <button
                      onClick={saveSettings}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {t('Save Profile')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'localization' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-black mb-6">{t('localizationSettings')}</h2>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-black mb-2">
                    {t('language')}
                  </label>
                  <select
                    id="language"
                    name="language"
                    value={selectedLanguage}
                    onChange={(e) => {
                      setSelectedLanguage(e.target.value as any);
                      if (editedProfile) {
                        setEditedProfile({
                          ...editedProfile,
                          language: e.target.value
                        });
                      }
                    }}
                    className="w-full p-2.5 bg-gray-100 border border-gray-300 text-black rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="ar">العربية (Arabic)</option>
                    <option value="he">עברית (Hebrew)</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-black mb-2">
                    {t('timezone')}
                  </label>
                  <select
                    id="timezone"
                    name="timezone"
                    value={editedProfile?.timezone || ''}
                    onChange={handleProfileChange}
                    className="w-full p-2.5 bg-gray-100 border border-gray-300 text-black rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <optgroup label="Middle East">
                      {timezones.slice(0, 8).map((tz) => (
                        <option key={tz} value={tz}>
                          {tz} ({new Date().toLocaleTimeString(undefined, {timeZone: tz, hour: '2-digit', minute: '2-digit'})})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="North America">
                      {timezones.slice(8, 15).map((tz) => (
                        <option key={tz} value={tz}>
                          {tz} ({new Date().toLocaleTimeString(undefined, {timeZone: tz, hour: '2-digit', minute: '2-digit'})})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Europe">
                      {timezones.slice(15, 22).map((tz) => (
                        <option key={tz} value={tz}>
                          {tz} ({new Date().toLocaleTimeString(undefined, {timeZone: tz, hour: '2-digit', minute: '2-digit'})})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Asia Pacific">
                      {timezones.slice(22, 28).map((tz) => (
                        <option key={tz} value={tz}>
                          {tz} ({new Date().toLocaleTimeString(undefined, {timeZone: tz, hour: '2-digit', minute: '2-digit'})})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Oceania">
                      {timezones.slice(28, 32).map((tz) => (
                        <option key={tz} value={tz}>
                          {tz} ({new Date().toLocaleTimeString(undefined, {timeZone: tz, hour: '2-digit', minute: '2-digit'})})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Africa">
                      {timezones.slice(32).map((tz) => (
                        <option key={tz} value={tz}>
                          {tz} ({new Date().toLocaleTimeString(undefined, {timeZone: tz, hour: '2-digit', minute: '2-digit'})})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  
                  <p className="mt-2 text-sm text-black">
                    {t('currentTime')}: {new Date().toLocaleString(undefined, {
                      timeZone: editedProfile?.timezone,
                      dateStyle: 'full',
                      timeStyle: 'medium'
                    })}
                  </p>
                </div>
                
                <button
                  onClick={saveSettings}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t('saveChanges')}
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-black mb-6">{t('notifications')}</h2>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-black">{t('emailNotifications')}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editedProfile?.notifications?.email || false}
                        onChange={() => handleNotificationToggle('email')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                        peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full 
                        peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
                        after:left-[2px] after:bg-white after:border-gray-300 after:border 
                        after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600">
                      </div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-black">{t('pushNotifications')}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editedProfile?.notifications?.push || false}
                        onChange={() => handleNotificationToggle('push')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                        peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full 
                        peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
                        after:left-[2px] after:bg-white after:border-gray-300 after:border 
                        after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600">
                      </div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-black">{t('smsNotifications')}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editedProfile?.notifications?.sms || false}
                        onChange={() => handleNotificationToggle('sms')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                        peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full 
                        peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
                        after:left-[2px] after:bg-white after:border-gray-300 after:border 
                        after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600">
                      </div>
                    </label>
                  </div>
                </div>
                
                <button
                  onClick={saveSettings}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t('saveChanges')}
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'app' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-black mb-6">{t('appSettings')}</h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium text-black mb-4">{t('theme')}</h3>
                  <p className="text-black mb-4">{t('choosePreferredTheme')}</p>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSaveSettings({ theme: 'light' })}
                      className={`flex-1 p-4 border rounded-lg flex flex-col items-center ${
                        settings.theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <SunIcon className="w-6 h-6 text-black mb-2" />
                      <span className="text-sm font-medium text-black">{t('light')}</span>
                    </button>
                    
                    <button
                      onClick={() => handleSaveSettings({ theme: 'dark' })}
                      className={`flex-1 p-4 border rounded-lg flex flex-col items-center ${
                        settings.theme === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <MoonIcon className="w-6 h-6 text-black mb-2" />
                      <span className="text-sm font-medium text-black">{t('dark')}</span>
                    </button>
                    
                    <button
                      onClick={() => handleSaveSettings({ theme: 'system' })}
                      className={`flex-1 p-4 border rounded-lg flex flex-col items-center ${
                        settings.theme === 'system' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <Cog6ToothIcon className="w-6 h-6 text-black mb-2" />
                      <span className="text-sm font-medium text-black">{t('system')}</span>
                    </button>
                  </div>
                </div>
                
                {/* Color Scheme */}
                <div>
                  <h3 className="text-lg font-medium text-black mb-4">{t('colorScheme')}</h3>
                  <p className="text-gray-600 mb-4">{t('selectColorScheme')}</p>
                  
                  <div className="grid grid-cols-5 gap-4">
                    {colorSchemes.map((scheme) => (
                      <button
                        key={scheme.id}
                        onClick={() => handleSaveSettings({ colorScheme: scheme.id })}
                        className="flex flex-col items-center gap-2"
                      >
                        <div className={`w-12 h-12 rounded-xl ${scheme.color} flex items-center justify-center
                          ${settings.colorScheme === scheme.id ? 'ring-2 ring-offset-2 ring-gray-400' : ''}
                          hover:ring-1 hover:ring-offset-1 hover:ring-gray-300 transition-all shadow-sm`}
                        >
                          {settings.colorScheme === scheme.id && (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                              <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm text-gray-600">{scheme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background Selection */}
                <div>
                  <h3 className="text-lg font-medium text-black mb-4">{t('background')}</h3>
                  <p className="text-gray-600 mb-4">{t('selectBackground')}</p>
                  
                  <div className="grid grid-cols-4 gap-4">
                    {backgroundOptions.map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => handleSaveSettings({ background: bg.id })}
                        className="flex flex-col items-center gap-2"
                      >
                        <div className={`w-full aspect-video rounded-lg ${bg.preview} flex items-center justify-center
                          ${settings.background === bg.id ? 'ring-2 ring-offset-2 ring-[#3AB8FE]' : 'ring-1 ring-gray-200'}
                          hover:ring-2 hover:ring-[#3AB8FE] transition-all`}
                        >
                          {settings.background === bg.id && (
                            <div className="w-6 h-6 rounded-full bg-[#3AB8FE] flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                                <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-gray-600">{bg.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}