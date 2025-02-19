'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Login attempt:', { email });
      
      // Check if user exists in localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u.email === email);

      if (!user) {
        console.error('User not found:', email);
        toast.error('User not found');
        setIsLoading(false);
        return;
      }

      if (user.password !== password) {
        console.error('Invalid password for:', email);
        toast.error('Invalid password');
        setIsLoading(false);
        return;
      }

      // Store user in both localStorage and cookies
      localStorage.setItem('currentUser', JSON.stringify(user));
      document.cookie = `currentUser=${JSON.stringify(user)}; path=/`;
      
      // Force page reload to dashboard
      if (user.role === 'teacher') {
        window.location.href = '/dashboard/teacher';
      } else {
        window.location.href = '/dashboard/student';
      }

      // Show success message after redirect is initiated
      toast.success('Login successful!');
      return; // Immediate return after redirect

    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">
            Sign in to SPARK SKOOL
          </h1>
          <p className="mt-2 text-gray-400">
            Enter your details to access your account
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl 
                  text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl 
                  text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-blue-600"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-white">
                Remember me
              </label>
            </div>

            <Link href={"/auth/forgot-password" as Route} className="text-sm text-blue-500 hover:text-blue-400">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl 
              font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400">
          Don't have an account?{' '}
          <Link href={"/auth/register" as Route} className="text-blue-500 hover:text-blue-400">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}