'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';
import MascotImage from '@/components/MascotImage';

interface SequenceGameProps {
  questions: Array<{
    id: number;
    question: string;
    options: string[];
    correctAnswer: string;
    points: number;
    timeLimit: number;
    type: 'multiple_choice' | 'true_false';
    imageUrl?: string;
    animation?: string;
    soundEffect?: string;
    explanation?: string;
    context?: string;
  }>;
  onGameComplete: (score: number) => void;
  difficulty: 'easy' | 'medium' | 'hard';
  theme?: {
    mainColor: string;
    accentColor: string;
    icon: string;
  };
  multiplayer?: boolean;
  players?: Array<{
    id: string;
    name: string;
    score: number;
    avatar?: string;
  }>;
  onLeaderboardUpdate?: (player: { name: string; score: number; time: number }) => void;
}

interface SequenceItem {
  id: number;
  content: string;
  imageUrl?: string;
  order: number;
}

export default function SequenceGame({
  questions,
  onGameComplete,
  difficulty,
  theme,
  multiplayer,
  players,
  onLeaderboardUpdate
}: SequenceGameProps) {
  const { t } = useLanguage();
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(questions[0]?.timeLimit || 60);
  const [sequence, setSequence] = useState<SequenceItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<SequenceItem[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');

  // Sample sequence items
  const sequenceItems: SequenceItem[] = [
    {
      id: 1,
      content: 'First step',
      imageUrl: '/images/step1.jpg',
      order: 1
    },
    {
      id: 2,
      content: 'Second step',
      imageUrl: '/images/step2.jpg',
      order: 2
    },
    {
      id: 3,
      content: 'Third step',
      imageUrl: '/images/step3.jpg',
      order: 3
    },
    {
      id: 4,
      content: 'Fourth step',
      imageUrl: '/images/step4.jpg',
      order: 4
    }
  ];

  useEffect(() => {
    // Shuffle sequence items
    const shuffledItems = [...sequenceItems].sort(() => Math.random() - 0.5);
    setSequence(shuffledItems);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!gameOver && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleGameOver();
    }
    return () => clearInterval(timer);
  }, [timeLeft, gameOver]);

  const handleItemSelect = (item: SequenceItem) => {
    if (!selectedItems.find(selected => selected.id === item.id)) {
      const newSelectedItems = [...selectedItems, item];
      setSelectedItems(newSelectedItems);

      // Check if sequence is complete
      if (newSelectedItems.length === sequence.length) {
        const isCorrect = newSelectedItems.every(
          (selected, index) => selected.order === index + 1
        );

        if (isCorrect) {
          setScore(prev => prev + 100);
          setFeedbackType('success');
          setFeedbackMessage(t('correctSequence'));
          
          if (multiplayer && onLeaderboardUpdate) {
            onLeaderboardUpdate({
              name: players?.[0]?.name || 'Player',
              score: 100,
              time: questions[0].timeLimit - timeLeft
            });
          }
        } else {
          setFeedbackType('error');
          setFeedbackMessage(t('incorrectSequence'));
        }

        setShowFeedback(true);
        setTimeout(() => {
          setShowFeedback(false);
          setSelectedItems([]);
        }, 2000);
      }
    }
  };

  const handleGameOver = () => {
    setGameOver(true);
    onGameComplete(score);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Game Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold">{t('score')}: {score}</div>
          <div className="text-lg">{t('timeLeft')}: {timeLeft}s</div>
        </div>
        {multiplayer && (
          <div className="flex items-center gap-2">
            {players?.map(player => (
              <div key={player.id} className="flex items-center gap-1">
                {player.avatar && (
                  <Image
                    src={player.avatar}
                    alt={player.name}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                )}
                <span>{player.name}: {player.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sequence Area */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Available Items */}
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="text-lg font-bold mb-4">{t('availableItems')}</h3>
          <div className="space-y-2">
            {sequence.map(item => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleItemSelect(item)}
                className={`p-4 rounded-lg cursor-pointer ${
                  selectedItems.find(selected => selected.id === item.id)
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : 'bg-white border-2 border-gray-300 hover:border-blue-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  {item.imageUrl && (
                    <div className="relative w-16 h-16">
                      <MascotImage
                        src={item.imageUrl}
                        alt={item.content}
                        width={64}
                        height={64}
                        className="object-cover rounded"
                      />
                    </div>
                  )}
                  <span>{item.content}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Selected Sequence */}
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="text-lg font-bold mb-4">{t('selectedSequence')}</h3>
          <div className="space-y-2">
            {selectedItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-white rounded-lg border-2 border-blue-500"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold">{index + 1}.</span>
                  {item.imageUrl && (
                    <div className="relative w-16 h-16">
                      <MascotImage
                        src={item.imageUrl}
                        alt={item.content}
                        width={64}
                        height={64}
                        className="object-cover rounded"
                      />
                    </div>
                  )}
                  <span>{item.content}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg ${
              feedbackType === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white`}
          >
            {feedbackMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over */}
      {gameOver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">{t('gameOver')}</h2>
            <p className="text-xl mb-4">{t('finalScore')}: {score}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              {t('playAgain')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 