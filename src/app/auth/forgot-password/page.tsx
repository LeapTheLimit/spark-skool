'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if user exists in localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u.email === email);

      if (!user) {
        toast.error('No account found with this email');
        setIsLoading(false);
        return;
      }

      // Generate a reset token
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const resetExpiry = Date.now() + 3600000; // 1 hour from now
      
      // Update user with reset token
      user.resetToken = resetToken;
      user.resetExpiry = resetExpiry;
      
      // Save updated user data
      localStorage.setItem('users', JSON.stringify(users));

      // Create reset link
      const resetLink = `${window.location.origin}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
      
      // For development, we'll just log the reset link instead of actually sending an email
      console.log('Password reset link:', resetLink);
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEmailSent(true);
      toast.success('Password reset instructions sent to your email');

    } catch (error) {
      console.error('Error sending reset email:', error);
      toast.error('Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-gray-800/50 backdrop-blur-lg p-8 rounded-3xl border border-gray-700 shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">
            {emailSent ? 'Check Your Email' : 'Forgot Password'}
          </h1>
          <p className="mt-2 text-gray-400">
            {emailSent 
              ? 'We sent password reset instructions to your email' 
              : 'Enter your email and we\'ll send you instructions to reset your password'}
          </p>
        </div>

        {!emailSent ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-gray-900/70 border border-gray-700 rounded-xl 
                  text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3ab8fe] focus:border-transparent
                  transition-all duration-200"
                placeholder="Enter your email"
              />
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className="w-full py-3 px-4 bg-[#3ab8fe] hover:bg-[#3ab8fe]/90
                text-white rounded-xl font-medium shadow-lg shadow-[#3ab8fe]/20
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3ab8fe]
                disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? 'Sending...' : 'Send Reset Instructions'}
            </motion.button>
          </form>
        ) : (
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 bg-[#3ab8fe]/20 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#3ab8fe]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-gray-300 mb-6">
              If an account exists with this email, you'll receive instructions to reset your password.
            </p>
            <button
              onClick={() => router.push('/auth/login')}
              className="text-[#3ab8fe] hover:text-[#3ab8fe]/80 transition-colors"
            >
              Return to login
            </button>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/auth/login" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Back to login
          </Link>
        </div>
      </motion.div>
    </div>
  );
} 