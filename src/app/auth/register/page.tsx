'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { toast } from 'react-hot-toast';

interface SignupForm {
  name: string;
  email: string;
  password: string;
  role: 'teacher' | 'student';
  school?: string;
  subject?: string;
  classLevel?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SignupForm>({
    name: '',
    email: '',
    password: '',
    role: 'student',
    school: '',
    subject: '',
    classLevel: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Registration attempt:', { ...formData, password: '***' });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get existing users
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Check if user already exists
      if (users.some((u: any) => u.email === formData.email)) {
        console.error('User already exists:', formData.email);
        toast.error('Email already registered');
        return;
      }

      // Add new user
      const newUser = { ...formData, id: Date.now() };
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      
      console.log('Registration successful:', { ...newUser, password: '***' });
      toast.success('Registration successful!');

      // Redirect to login
      router.push('/auth/login');

    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="mt-2 text-gray-400">Join SPARK SKOOL today</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl 
                  text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl 
                  text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white">
                Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 block w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl 
                  text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Create a password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white">
                Role
              </label>
              <select
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'teacher' | 'student' })}
                className="mt-1 block w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl 
                  text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>

            {formData.role === 'teacher' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-white">
                    School
                  </label>
                  <input
                    type="text"
                    value={formData.school || ''}
                    onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                    className="mt-1 block w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl 
                      text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your school name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subject || ''}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="mt-1 block w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl 
                      text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your subject"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-white">
                Class Level
              </label>
              <select
                required
                value={formData.classLevel || ''}
                onChange={(e) => setFormData({ ...formData, classLevel: e.target.value })}
                className="mt-1 block w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl 
                  text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Class Level</option>
                <option value="elementary">Elementary School</option>
                <option value="middle">Middle School</option>
                <option value="high">High School</option>
                <option value="college">College</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl 
              font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link href={"/auth/login" as Route} className="text-blue-500 hover:text-blue-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}