'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, Reorder } from 'framer-motion';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

interface TimelineEvent {
  id: number;
  title: string;
  description: string;
  date: string | number;
  imageUrl?: string;
  correctOrder: number;
}

interface TimelineProps {
  events: TimelineEvent[];
  onGameComplete: (score: number) => void;
}

export default function Timeline({ events, onGameComplete }: TimelineProps) {
  const { t } = useLanguage();
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(300); // 5 minutes
  const [gameStarted, setGameStarted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [feedback, setFeedback] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });

  const checkOrder = useCallback(() => {
    const isCorrect = timelineEvents.every((event, index) => {
      const correctEvent = events.find(e => e.id === event.id);
      return correctEvent?.correctOrder === index + 1;
    });

    if (isCorrect) {
      const timeBonus = Math.floor(timer / 10);
      const finalScore = score + 1000 + timeBonus;
      setScore(finalScore);
      setFeedback({
        show: true,
        message: t('perfectOrder'),
        type: 'success'
      });
      onGameComplete(finalScore);
    } else {
      setFeedback({
        show: true,
        message: t('tryAgain'),
        type: 'error'
      });
    }
  }, [timelineEvents, events, timer, score, onGameComplete, t]);

  // Initialize game
  useEffect(() => {
    if (events.length > 0) {
      // Shuffle events
      const shuffledEvents = [...events].sort(() => Math.random() - 0.5);
      setTimelineEvents(shuffledEvents);
      setGameStarted(true);
    }
  }, [events]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      checkOrder();
    }
    return () => clearInterval(interval);
  }, [gameStarted, timer, checkOrder]);

  const handleReorder = (newOrder: TimelineEvent[]) => {
    setTimelineEvents(newOrder);
  };

  const useHint = () => {
    if (hintsRemaining > 0) {
      setShowHint(true);
      setHintsRemaining(prev => prev - 1);
      setTimeout(() => setShowHint(false), 3000);
    }
  };

  const moveEvent = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === timelineEvents.length - 1)) {
      return;
    }

    const newEvents = [...timelineEvents];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newEvents[index], newEvents[newIndex]] = [newEvents[newIndex], newEvents[index]];
    setTimelineEvents(newEvents);
  };

  return (
    <div className="p-4">
      {/* Game Stats */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-black font-medium">
          {t('time')}: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
        </div>
        <div className="text-black font-medium">
          {t('score')}: {score}
        </div>
        <button
          onClick={useHint}
          disabled={hintsRemaining === 0}
          className={`px-4 py-2 rounded-lg ${
            hintsRemaining > 0
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-black'
          }`}
        >
          {t('hints')}: {hintsRemaining}
        </button>
      </div>

      {/* Timeline */}
      <Reorder.Group
        axis="y"
        values={timelineEvents}
        onReorder={handleReorder}
        className="space-y-4"
      >
        {timelineEvents.map((event, index) => (
          <Reorder.Item
            key={event.id}
            value={event}
            className="bg-white rounded-lg shadow-md"
          >
            <motion.div
              className="p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => moveEvent(index, 'up')}
                    disabled={index === 0}
                    className="p-1 hover:bg-gray-100 rounded text-black"
                  >
                    <ChevronUpIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveEvent(index, 'down')}
                    disabled={index === timelineEvents.length - 1}
                    className="p-1 hover:bg-gray-100 rounded text-black"
                  >
                    <ChevronDownIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-bold text-black">{event.title}</h3>
                  <p className="text-black">{event.description}</p>
                  {showHint && event.date && (
                    <p className="text-blue-600 mt-2">{t('hint')}: {event.date}</p>
                  )}
                </div>

                {event.imageUrl && (
                  <div className="relative w-24 h-24">
                    <Image
                      src={event.imageUrl}
                      alt={event.title}
                      fill
                      className="object-cover rounded"
                      sizes="(max-width: 96px) 100vw, 96px"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* Check Order Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={checkOrder}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
        >
          {t('checkOrder')}
        </button>
      </div>

      {/* Feedback */}
      {feedback.show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed top-4 right-4 p-4 rounded-lg ${
            feedback.type === 'success' ? 'bg-green-100' : 'bg-red-100'
          }`}
        >
          <p className={`text-black font-medium`}>
            {feedback.message}
          </p>
        </motion.div>
      )}
    </div>
  );
} 