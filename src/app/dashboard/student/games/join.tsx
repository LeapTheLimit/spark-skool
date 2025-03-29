'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import SparkMascot from '@/components/SparkMascot';

export default function JoinGame() {
  const { t } = useLanguage();
  const router = useRouter();
  const [accessCode, setAccessCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsJoining(true);

    try {
      const response = await fetch('/api/games/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessCode,
          studentName,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to join game');
      }

      const { gameId, gameType } = await response.json();
      
      // Store student info in localStorage
      localStorage.setItem('studentGame', JSON.stringify({
        gameId,
        studentName,
        accessCode,
        joinedAt: new Date().toISOString()
      }));

      // Redirect to the appropriate game using route configuration
      router.push({
        pathname: '/dashboard/student/games/[type]/[id]',
        query: { type: gameType, id: gameId }
      } as any); // Type assertion needed due to Next.js route typing limitations
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to join game');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full"
      >
        <div className="flex items-center gap-4 mb-8">
          <SparkMascot width={60} height={60} variant="blue" blinking />
          <h1 className="text-2xl font-bold text-black">{t('joinGame')}</h1>
        </div>

        <form onSubmit={handleJoinGame} className="space-y-6">
          <div>
            <label className="block text-black font-medium mb-2" htmlFor="accessCode">
              {t('accessCode')}
            </label>
            <input
              id="accessCode"
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              placeholder={t('enterAccessCode')}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white text-black"
              required
              maxLength={6}
            />
          </div>

          <div>
            <label className="block text-black font-medium mb-2" htmlFor="studentName">
              {t('yourName')}
            </label>
            <input
              id="studentName"
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder={t('enterYourName')}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white text-black"
              required
            />
          </div>

          {error && (
            <div className="p-4 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isJoining}
            className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isJoining ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t('joining')}
              </>
            ) : (
              t('joinGame')
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-black">
            {t('joinGameInstructions')}
          </p>
        </div>
      </motion.div>
    </div>
  );
} 