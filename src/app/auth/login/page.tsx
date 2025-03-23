'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import TeacherMascot from '@/components/TeacherMascot';
import MascotImage from '@/components/MascotImage';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // For demonstration purposes, storing in localStorage
      // In a real app, you would validate with a backend API
      const userData = {
        name: 'Demo Teacher',
        email: email,
        school: 'Demo School',
        subject: 'All Subjects',
      };
      
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      // Redirect to teacher dashboard after successful login
      router.push('/dashboard/teacher' as Route);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center px-4 sm:px-6 lg:px-8">
        {/* Left side with mascot */}
        <div className="w-full md:w-1/2 text-center md:text-left text-white p-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome <span className="text-[#3ab8fe]">Back</span>
          </h1>
          <p className="text-xl mb-16">Sign in to your AI copilot</p>
          
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
            <h2 className="text-2xl font-bold text-white mb-8">Sign in to your account</h2>
            
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
                    Remember me
                  </label>
                </div>
                
                <div className="text-sm">
                  <Link href={'/auth/forgot-password' as Route} className="text-blue-400 hover:text-blue-300">
                    Forgot password?
                  </Link>
                </div>
              </div>
              
              <div className="text-center text-gray-400 text-sm">
                No credit card required
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-[#3ab8fe] hover:bg-[#2a9fe6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : 'Sign in'}
                </button>
              </div>
            </form>
            
            <div className="mt-4 text-center">
              <span className="text-gray-400">Don't have an account?</span>{' '}
              <Link href={'/auth/register' as Route} className="text-blue-400 hover:text-blue-300">
                Sign up
              </Link>
            </div>
            
            <div className="mt-6 text-center text-xs text-gray-500">
              By signing in, you agree to the{' '}
              <Link href={'/terms' as Route} className="text-gray-400 hover:text-gray-300">
                Terms of Use
              </Link>{' '}
              and{' '}
              <Link href={'/privacy' as Route} className="text-gray-400 hover:text-gray-300">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}