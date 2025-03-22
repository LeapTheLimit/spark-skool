import { Redis } from '@upstash/redis';
import { toast } from 'react-hot-toast';

// Define the Redis client
const redis = new Redis({
  url: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL || '',
  token: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN || '',
});

// Define interfaces
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  school: string;
  subjects: string[];
  classLevel: string[] | string;
  avatar?: string;
  bio?: string;
  language: 'en' | 'ar' | 'he';
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

// Get user from localStorage
export async function getUser(userId: string): Promise<UserProfile | null> {
  try {
    // Try localStorage for immediate response
    if (typeof window !== 'undefined') {
      const localUser = localStorage.getItem('currentUser');
      if (localUser) {
        return JSON.parse(localUser);
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

// Save user to localStorage
export async function saveUser(user: UserProfile): Promise<boolean> {
  try {
    // Log the data being saved
    console.log('Saving user data:', user);
    
    // Save to localStorage for immediate use
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error saving user:', error);
    return false;
  }
}

// Get user app settings
export async function getUserSettings(userId: string) {
  try {
    // Try localStorage
    if (typeof window !== 'undefined') {
      const localSettings = localStorage.getItem('appSettings');
      if (localSettings) {
        return JSON.parse(localSettings);
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting user settings:', error);
    return null;
  }
}

// Save user settings to localStorage
export async function saveUserSettings(userId: string, settings: any): Promise<boolean> {
  try {
    // Log the settings being saved
    console.log('Saving settings:', settings);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('appSettings', JSON.stringify(settings));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error saving user settings:', error);
    return false;
  }
} 