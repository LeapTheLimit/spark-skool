'use client';

import { useState, useEffect, useRef } from 'react';
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
  PencilIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserProfile {
  name: string;
  email: string;
  subject: string;
  school: string;
  avatar?: string;
  classLevel?: string;
}

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  colorScheme: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'app'>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'system',
    language: 'en',
    notifications: true,
    colorScheme: 'blue'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { t, language, setLanguage } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState(language);

  // Load user data and settings
  useEffect(() => {
    try {
      // Load user profile
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        const user = JSON.parse(userData);
        setProfile(user);
        setEditedProfile(user);
      }

      // Load app settings
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings');
    }
  }, []);

  useEffect(() => {
    setSelectedLanguage(language);
  }, [language]);

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
    try {
      const updatedSettings = { ...settings, ...newSettings };
      localStorage.setItem('appSettings', JSON.stringify(updatedSettings));
      setSettings(updatedSettings);
      
      // Update language if it was changed
      if (newSettings.language) {
        setLanguage(newSettings.language as 'en' | 'ar' | 'he');
      }
      
      toast.success(t('settingsUpdated'));
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error(t('failedToSave'));
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setEditedProfile(prev => ({
          ...prev!,
          avatar: base64String
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value as 'en' | 'ar' | 'he';
    setSelectedLanguage(newLanguage);
    setLanguage(newLanguage);
    localStorage.setItem('appSettings', JSON.stringify({ language: newLanguage }));
    toast.success(t('settingsUpdated'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-black">{t('settings')}</h1>
          <p className="text-black">{t('settingsDescription')}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'profile' 
                ? 'bg-black text-white' 
                : 'bg-white text-black hover:bg-gray-50'
            }`}
          >
            <UserCircleIcon className="w-5 h-5" />
            {t('profile')}
          </button>
          <button
            onClick={() => setActiveTab('app')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'app' 
                ? 'bg-black text-white' 
                : 'bg-white text-black hover:bg-gray-50'
            }`}
          >
            <Cog6ToothIcon className="w-5 h-5" />
            {t('appSettings')}
          </button>
        </div>

        {/* Profile Settings - Added max height and scrollbar */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-sm p-6 max-h-[70vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 py-2">
              <h2 className="text-xl font-semibold text-black">{t('profileInformation')}</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800"
              >
                {isEditing ? t('cancel') : t('editProfile')}
              </button>
            </div>

            {isEditing ? (
              // Edit Form - Updated text colors
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <Image
                      src={imagePreview || profile?.avatar || "/avatars/default-teacher.jpg"}
                      alt={profile?.name || "Teacher"}
                      width={80}
                      height={80}
                      className="rounded-full"
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-1 bg-black text-white rounded-full hover:bg-gray-800"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-black">{profile?.name}</h3>
                    <p className="text-black">{profile?.email}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    {t('fullName')}
                  </label>
                  <input
                    type="text"
                    value={editedProfile?.name || ''}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev!, name: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder={t('enterFullName')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    {t('email')}
                  </label>
                  <input
                    type="email"
                    value={editedProfile?.email || ''}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev!, email: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    {t('subject')}
                  </label>
                  <input
                    type="text"
                    value={editedProfile?.subject || ''}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev!, subject: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    {t('school')}
                  </label>
                  <input
                    type="text"
                    value={editedProfile?.school || ''}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev!, school: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>

                <button
                  onClick={handleSaveProfile}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t('saveChanges')}
                </button>
              </div>
            ) : (
              // Profile Display
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Image
                    src={profile?.avatar || "/avatars/default-teacher.jpg"}
                    alt={profile?.name || "Teacher"}
                    width={80}
                    height={80}
                    className="rounded-full"
                  />
                  <div>
                    <h3 className="text-xl font-medium text-black">{profile?.name}</h3>
                    <p className="text-black">{profile?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-black">{t('subject')}</p>
                    <p className="font-medium text-black">{profile?.subject}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-black">{t('school')}</p>
                    <p className="font-medium text-black">{profile?.school}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* App Settings - Added max height and scrollbar */}
        {activeTab === 'app' && (
          <div className="bg-white rounded-xl shadow-sm p-6 max-h-[70vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-6 text-black">{t('applicationSettings')}</h2>
            
            <div className="space-y-6">
              {/* Theme Setting */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {settings.theme === 'dark' ? (
                    <MoonIcon className="w-5 h-5" />
                  ) : (
                    <SunIcon className="w-5 h-5" />
                  )}
                  <div>
                    <p className="font-medium text-black">{t('theme')}</p>
                    <p className="text-sm text-black">{t('choosePreferredTheme')}</p>
                  </div>
                </div>
                <select
                  value={settings.theme}
                  onChange={(e) => handleSaveSettings({ theme: e.target.value as 'light' | 'dark' | 'system' })}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="light">{t('light')}</option>
                  <option value="dark">{t('dark')}</option>
                  <option value="system">{t('system')}</option>
                </select>
              </div>

              {/* Language Setting - Updated Options */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LanguageIcon className="w-5 h-5" />
                  <div>
                    <p className="font-medium text-black">{t('language')}</p>
                    <p className="text-sm text-black">{t('selectPreferredLanguage')}</p>
                  </div>
                </div>
                <select
                  value={selectedLanguage}
                  onChange={handleLanguageChange}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="en">{t('english')}</option>
                  <option value="ar">{t('arabic')}</option>
                  <option value="he">{t('hebrew')}</option>
                </select>
              </div>

              {/* Notifications Setting */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BellIcon className="w-5 h-5" />
                  <div>
                    <p className="font-medium text-black">{t('notifications')}</p>
                    <p className="text-sm text-black">{t('manageNotificationPreferences')}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => handleSaveSettings({ notifications: e.target.checked })}
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

              {/* Color Scheme Setting */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SwatchIcon className="w-5 h-5" />
                  <div>
                    <p className="font-medium text-black">{t('colorScheme')}</p>
                    <p className="text-sm text-black">{t('chooseAccentColor')}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {['blue', 'purple', 'green', 'rose'].map((color) => (
                    <button
                      key={color}
                      onClick={() => handleSaveSettings({ colorScheme: color })}
                      className={`w-6 h-6 rounded-full bg-${color}-500 ${
                        settings.colorScheme === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}