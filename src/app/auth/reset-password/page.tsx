'use client';

<<<<<<< HEAD
import { useState, useEffect, Suspense } from 'react';
=======
import { useState, useEffect } from 'react';
>>>>>>> 90ba128b77a37239696f731a4cbfd4c1385d90f6
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

<<<<<<< HEAD
function ResetPasswordContent() {
=======
export default function ResetPasswordPage() {
>>>>>>> 90ba128b77a37239696f731a4cbfd4c1385d90f6
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isTokenChecked, setIsTokenChecked] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams?.get('token');
    const emailParam = searchParams?.get('email');
    
    if (tokenParam && emailParam) {
      setToken(tokenParam);
      setEmail(emailParam);
      
      // Validate token
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u.email === emailParam);
      
      if (user && user.resetToken === tokenParam && user.resetExpiry > Date.now()) {
        setIsTokenValid(true);
      }
    }
    
    setIsTokenChecked(true);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get users from localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex((u: any) => u.email === email);
      
      if (userIndex === -1) {
        toast.error('User not found');
        setIsLoading(false);
        return;
      }
      
      // Update user's password
      users[userIndex].password = password;
      
      // Clear reset token
      delete users[userIndex].resetToken;
      delete users[userIndex].resetExpiry;
      
      // Save updated users
      localStorage.setItem('users', JSON.stringify(users));
      
      toast.success('Password reset successfully');
      
      // Redirect to login
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
      
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password');
      setIsLoading(false);
    }
  };

  if (!isTokenChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-gray-800/50 backdrop-blur-lg p-8 rounded-3xl border border-gray-700 shadow-2xl"
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white">Invalid or Expired Link</h1>
            <p className="mt-2 text-gray-400">
              This password reset link is invalid or has expired.
            </p>
          </div>
          
          <div className="text-center mt-8">
            <Link href="/auth/forgot-password" className="px-6 py-2 bg-[#3ab8fe] hover:bg-[#3ab8fe]/90 text-white rounded-xl transition-colors inline-block">
              Request New Link
            </Link>
            
            <div className="mt-4">
              <Link href="/auth/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                ← Back to login
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-gray-800/50 backdrop-blur-lg p-8 rounded-3xl border border-gray-700 shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Reset Your Password</h1>
          <p className="mt-2 text-gray-400">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              New Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-3 bg-gray-900/70 border border-gray-700 rounded-xl 
                text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3ab8fe] focus:border-transparent
                transition-all duration-200"
              placeholder="Enter new password"
            />
          </div>
          
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300">
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-3 bg-gray-900/70 border border-gray-700 rounded-xl 
                text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3ab8fe] focus:border-transparent
                transition-all duration-200"
              placeholder="Confirm new password"
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
            {isLoading ? 'Resetting Password...' : 'Reset Password'}
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/auth/login" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Back to login
          </Link>
        </div>
      </motion.div>
    </div>
  );
<<<<<<< HEAD
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
=======
>>>>>>> 90ba128b77a37239696f731a4cbfd4c1385d90f6
} 