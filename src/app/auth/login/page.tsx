'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';
import TeacherMascot from '@/components/TeacherMascot';
import MascotImage from '@/components/MascotImage';
import type { Route } from 'next';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { t, language } = useLanguage();

  // Add RTL support
  useEffect(() => {
    // Set document direction based on language
    const isRtl = language === 'ar' || language === 'he';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error(t('pleaseEnterEmailAndPassword'));
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate API call for authentication
      // Replace with your actual authentication logic
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const userData = {
        id: '1',
        name: 'John Doe',
        email: email,
        subject: 'Science',
        school: 'Spark High School',
        language: language // Store the selected language in user data
      };
      
      // Store user data in localStorage
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      // Show success message
      toast.success(t('loginSuccessful'));
      
      // Redirect to dashboard
      router.push('/dashboard/teacher');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(t('loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center px-4 sm:px-6 lg:px-8">
        {/* Left side with mascot */}
        <div className="w-full md:w-1/2 text-center md:text-left text-white p-8">
          <h1 className="text-3xl font-bold text-white mb-2">Meet <span className="text-[#3ab8fe]">Spark</span></h1>
          <p className="text-base text-gray-300 mb-4">{t('yourClassroomAICopilot')}</p>
          
          <div className="flex justify-center md:justify-start">
            {/* Primary option: Use TeacherMascot SVG */}
            <TeacherMascot 
              width={300} 
              height={300} 
              variant="blue" 
              className="animate-pulse duration-3000"
            />
            
            {/* Fallback option: Hidden by default, can be shown if needed */}
            <div className="hidden">
              <MascotImage
                src="/assets/mascots/spark-mascot.png"
                alt="Spark Mascot"
                width={300}
                height={300}
                className="animate-pulse duration-3000"
              />
            </div>
          </div>
        </div>
        
        {/* Right side with login form */}
        <div className="w-full md:w-1/2 md:max-w-md">
          <div className="bg-gray-900/80 border border-gray-800 shadow-xl rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-8">{t('signInToYourAccount')}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="sr-only">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400"
                    aria-label="Toggle password visibility"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-700 rounded bg-gray-800"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                    {t('rememberMe')}
                  </label>
                </div>
                
                <div className="text-sm">
                  <Link href={'/auth/forgot-password' as Route} className="text-blue-400 hover:text-blue-300">
                    {t('forgotYourPassword')}
                  </Link>
                </div>
              </div>
              
              <div className="text-center text-gray-400 text-sm">
                {t('noCreditCardRequired')}
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 sm:py-3 px-4 bg-[#3ab8fe] hover:bg-[#3ab8fe]/90
                    text-white font-bold rounded-full shadow-lg shadow-[#3ab8fe]/20
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3ab8fe]
                    disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isLoading ? t('signingIn') : t('signIn')}
                </button>
              </div>
            </form>
            
            <div className="text-center text-sm text-gray-400 mt-4">
              {t('dontHaveAccount')} <Link href="/auth/register" className="text-[#3ab8fe] hover:text-[#3ab8fe]/80 transition-colors">{t('createAccount')}</Link>
            </div>
            
            <div className="mt-6 text-center text-xs text-gray-500">
              {t('bySigningInYouAgree')}{' '}
              <Link href={'/terms' as Route} className="text-gray-400 hover:text-gray-300">
                {t('termsOfUse')}
              </Link>{' '}
              {t('and')}{' '}
              <Link href={'/privacy' as Route} className="text-gray-400 hover:text-gray-300">
                {t('privacyPolicy')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}