'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ChevronLeftIcon,
  PlayIcon,
  TrophyIcon,
  ClockIcon,
  UserGroupIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface GameInfo {
  id: string;
  title: string;
  description: string;
  teacherName: string;
  schoolName: string;
  type: 'kahoot' | 'memory' | 'puzzle' | 'quiz';
  totalQuestions: number;
  timeLimit: number;
  playCount: number;
  highScore: number;
}

export default function StudentGames() {
  const router = useRouter();
  const { t } = useLanguage();
  const [availableGames, setAvailableGames] = useState<GameInfo[]>([]);
  const [gameCode, setGameCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load available games
  useEffect(() => {
    // Here you would fetch games from your backend
    // For now, using sample data
    const sampleGames: GameInfo[] = [
      {
        id: '123',
        title: 'Math Quiz Challenge',
        description: 'Test your math skills!',
        teacherName: 'Mr. Smith',
        schoolName: 'Sample School',
        type: 'kahoot',
        totalQuestions: 10,
        timeLimit: 300,
        playCount: 25,
        highScore: 950
      },
      {
        id: '124',
        title: 'Science Memory Game',
        description: 'Match scientific terms with their definitions',
        teacherName: 'Mrs. Johnson',
        schoolName: 'Sample School',
        type: 'memory',
        totalQuestions: 15,
        timeLimit: 600,
        playCount: 18,
        highScore: 880
      }
    ];
    setAvailableGames(sampleGames);
  }, []);

  // Join game by code
  const handleJoinGame = () => {
    if (!gameCode.trim()) {
      setError(t('enterGameCode'));
      return;
    }
    setLoading(true);
    // Here you would validate the game code and join the game
    setTimeout(() => {
      setLoading(false);
      router.push(`/dashboard/student/games/play/${gameCode}` as any);
    }, 1000);
  };

  // Also fix the game card click handler
  const handleGameClick = (gameId: string) => {
    router.push(`/dashboard/student/games/play/${gameId}` as any);
  };

  const GameTypeIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'kahoot':
        return <PlayIcon className="w-6 h-6 text-purple-600" />;
      case 'memory':
        return <TrophyIcon className="w-6 h-6 text-green-600" />;
      case 'puzzle':
        return <UserGroupIcon className="w-6 h-6 text-blue-600" />;
      default:
        return <PlayIcon className="w-6 h-6 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center text-black mb-4"
            >
              <ChevronLeftIcon className="w-5 h-5 mr-1" />
              {t('back')}
            </button>
            <h1 className="text-2xl font-bold text-black">{t('learningGames')}</h1>
            <p className="text-black">{t('playAndLearn')}</p>
          </div>
        </div>

        {/* Join Game by Code */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
          <h2 className="text-xl font-medium text-black mb-4">{t('joinGame')}</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              placeholder={t('enterGameCode')}
              className="flex-1 p-2 border border-gray-300 rounded-lg"
              maxLength={6}
            />
            <button
              onClick={handleJoinGame}
              disabled={loading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              ) : (
                t('join')
              )}
            </button>
          </div>
          {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}
        </div>

        {/* Available Games */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-medium text-black mb-4">{t('availableGames')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableGames.map((game) => (
              <div
                key={game.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-purple-500 transition-colors cursor-pointer"
                onClick={() => handleGameClick(game.id)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <GameTypeIcon type={game.type} />
                  <h3 className="font-medium text-black">{game.title}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">{game.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4" />
                    {Math.floor(game.timeLimit / 60)}m
                  </div>
                  <div className="flex items-center gap-2">
                    <TrophyIcon className="w-4 h-4" />
                    {game.highScore}
                  </div>
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="w-4 h-4" />
                    {game.playCount}
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {game.teacherName} • {game.schoolName}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 