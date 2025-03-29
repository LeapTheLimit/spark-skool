'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface TimelineEvent {
  id: number;
  title: string;
  date: string | number;
  description: string;
  imageUrl?: string;
  category?: string;
}

interface TimelineGameProps {
  events: TimelineEvent[];
  onGameComplete: (score: number) => void;
  difficulty: 'easy' | 'medium' | 'hard';
  theme?: {
    mainColor: string;
    accentColor: string;
    icon: string;
  };
}

export default function TimelineGame({ events, onGameComplete, difficulty, theme }: TimelineGameProps) {
  const { t } = useLanguage();
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(difficulty === 'easy' ? 300 : difficulty === 'medium' ? 240 : 180);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [correctOrder, setCorrectOrder] = useState<TimelineEvent[]>([]);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState<'correct' | 'wrong' | null>(null);

  // Initialize game
  useEffect(() => {
    if (!events || events.length === 0) return;

    // Sort events by date for correct order
    const sorted = [...events].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });
    setCorrectOrder(sorted);

    // Shuffle events for game start
    const shuffled = [...events].sort(() => Math.random() - 0.5);
    setTimelineEvents(shuffled);
  }, [events]);

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleGameComplete();
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Check if current order is correct
  const checkOrder = () => {
    const isCorrect = timelineEvents.every((event, index) => event.id === correctOrder[index].id);
    setShowResult(true);
    setShowAnimation(true);
    setAnimationType(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      const timeBonus = Math.floor((timeLeft / (difficulty === 'easy' ? 300 : difficulty === 'medium' ? 240 : 180)) * 100);
      const movesPenalty = Math.max(0, moves - events.length) * 5;
      const finalScore = 1000 + timeBonus - movesPenalty;
      setScore(finalScore);
      
      setTimeout(() => {
        handleGameComplete();
      }, 2000);
    } else {
      setTimeout(() => {
        setShowAnimation(false);
        setShowResult(false);
      }, 2000);
    }
  };

  // Handle game completion
  const handleGameComplete = () => {
    setIsPlaying(false);
    onGameComplete(score);
  };

  // Reset game
  const resetGame = () => {
    const shuffled = [...events].sort(() => Math.random() - 0.5);
    setTimelineEvents(shuffled);
    setScore(0);
    setMoves(0);
    setTimeLeft(difficulty === 'easy' ? 300 : difficulty === 'medium' ? 240 : 180);
    setIsPlaying(true);
    setShowResult(false);
    setShowAnimation(false);
    setAnimationType(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Game Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-black">{t('gameTypes.timelineScore')}: {score}</div>
          <div className="text-lg text-black">{t('gameTypes.timelineMoves')}: {moves}</div>
          <button
            onClick={resetGame}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            {t('gameTypes.timelineResetGame')}
          </button>
        </div>
        <div className="text-xl font-bold text-black">
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-black mb-4">{t('gameTypes.timelineArrangeInOrder')}</h2>
        
        <Reorder.Group
          axis="y"
          values={timelineEvents}
          onReorder={setTimelineEvents}
          className="space-y-4"
        >
          {timelineEvents.map((event) => (
            <Reorder.Item
              key={event.id}
              value={event}
              className="bg-white rounded-lg border-2 border-gray-200 p-4 cursor-move"
              onDragEnd={() => setMoves(prev => prev + 1)}
            >
              <div className="flex items-start gap-4">
                {event.imageUrl && (
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-black">{event.title}</h3>
                  <p className="text-black font-medium">{event.date}</p>
                  <p className="text-black mt-2">{event.description}</p>
                  {event.category && (
                    <span className="mt-2 inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                      {event.category}
                    </span>
                  )}
                </div>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>

        <button
          onClick={checkOrder}
          disabled={!isPlaying || showResult}
          className="mt-6 w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t('gameTypes.timelineCheckOrder')}
        </button>
      </div>

      {/* Animation */}
      <AnimatePresence>
        {showAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className={`text-6xl ${
              animationType === 'correct' ? 'text-green-500' : 'text-red-500'
            }`}>
              {animationType === 'correct' ? '✅' : '❌'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 