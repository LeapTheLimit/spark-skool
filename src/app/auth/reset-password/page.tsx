'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';

// Create a separate client component for handling the search params
function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenMissing, setTokenMissing] = useState(false);
  const router = useRouter();
  const { t, language } = useLanguage();
  
  // We'll get the token from URL in useEffect instead of using useSearchParams directly
  const [token, setToken] = useState<string | null>(null);

  // Get token from URL after component mounts (client-side only)
  useEffect(() => {
    // This code only runs in the browser
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    setToken(urlToken);
    
    if (!urlToken) {
      setTokenMissing(true);
      toast.error(t('invalidResetToken'));
      
      // Use a timeout to prevent immediate redirect
      const redirectTimer = setTimeout(() => {
        router.push('/auth/forgot-password');
      }, 1500);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [router, t]);

  // Add RTL support
  useEffect(() => {
    const isRtl = language === 'ar' || language === 'he';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!password || !confirmPassword) {
      toast.error(t('pleaseCompleteAllFields'));
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error(t('passwordsDontMatch'));
      return;
    }
    
    if (password.length < 8) {
      toast.error(t('passwordTooShort'));
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate API call for password reset
      // Replace with your actual password reset logic
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success message
      toast.success(t('passwordResetSuccessfully'));
      setIsSuccess(true);
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error(t('failedToResetPassword'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle the case where there's no token
  if (tokenMissing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {t('invalidToken')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('invalidTokenDescription')}
            </p>
            <div className="mt-4">
              <Link href="/auth/forgot-password" className="text-blue-600 hover:text-blue-500">
                {t('requestNewResetLink')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {t('resetYourPassword')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('enterNewPassword')}
          </p>
        </div>
        
        {isSuccess ? (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mt-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {t('passwordResetSuccessText')}
                </p>
              </div>
            </div>
            <div className="mt-4 text-center">
              <Link href="/auth/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                {t('backToLogin')}
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="password" className="sr-only">{t('newPassword')}</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder={t('newPassword')}
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="sr-only">{t('confirmPassword')}</label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder={t('confirmPassword')}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  t('resetPassword')
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// Main export - this is what Next.js will use for the page
export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
} 