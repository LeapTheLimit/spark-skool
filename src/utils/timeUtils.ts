import { format } from 'date-fns';
import { ar, he } from 'date-fns/locale';

export function getTimeBasedGreeting(language: string, userName?: string): string {
  const hour = new Date().getHours();
  const greeting = {
    en: hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening',
    ar: hour < 12 ? 'صباح الخير' : hour < 18 ? 'مساء الخير' : 'مساء الخير',
    he: hour < 12 ? 'בוקר טוב' : hour < 18 ? 'צהריים טובים' : 'ערב טוב'
  };

  return userName ? `${greeting[language as keyof typeof greeting]}, ${userName}!` : greeting[language as keyof typeof greeting];
}

export function formatDateByLanguage(date: Date, language: string, formatStr?: string): string {
  const locales = {
    en: undefined, // Use default locale
    ar: ar,
    he: he
  };

  const defaultFormat = language === 'en' ? 'EEEE, MMMM d, yyyy' : 'EEEE, d MMMM yyyy';
  
  return format(
    date,
    formatStr || defaultFormat,
    { locale: locales[language as keyof typeof locales] }
  );
}

export function formatDateLocalized(date: Date, language: string) {
  try {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    // Use different locales based on language
    let locale = 'en-US';
    if (language === 'ar') locale = 'ar-SA';
    if (language === 'he') locale = 'he-IL';
    
    return date.toLocaleDateString(locale, options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return date.toDateString(); // Fallback
  }
} 