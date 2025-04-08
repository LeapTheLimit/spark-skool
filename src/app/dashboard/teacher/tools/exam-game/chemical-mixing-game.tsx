'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';
import MascotImage from '@/components/MascotImage';

interface ChemicalMixingGameProps {
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

interface Chemical {
  id: string;
  name: string;
  formula: string;
  color: string;
  properties: string[];
  reactions: Array<{
    with: string;
    result: string;
    type: 'exothermic' | 'endothermic';
  }>;
}

export default function ChemicalMixingGame({
  questions,
  onGameComplete,
  difficulty,
  theme,
  multiplayer,
  players,
  onLeaderboardUpdate
}: ChemicalMixingGameProps) {
  const { t } = useLanguage();
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(questions[0]?.timeLimit || 60);
  const [score, setScore] = useState(0);
  const [selectedChemicals, setSelectedChemicals] = useState<Chemical[]>([]);
  const [showReaction, setShowReaction] = useState(false);
  const [reactionResult, setReactionResult] = useState<string | null>(null);

  // Sample chemicals data
  const chemicals: Chemical[] = [
    {
      id: 'h2o',
      name: 'Water',
      formula: 'H₂O',
      color: '#4A90E2',
      properties: ['Liquid', 'Colorless', 'Odorless'],
      reactions: [
        { with: 'Na', result: 'NaOH + H₂', type: 'exothermic' },
        { with: 'CO₂', result: 'H₂CO₃', type: 'endothermic' }
      ]
    },
    {
      id: 'hcl',
      name: 'Hydrochloric Acid',
      formula: 'HCl',
      color: '#FF6B6B',
      properties: ['Liquid', 'Colorless', 'Strong Acid'],
      reactions: [
        { with: 'NaOH', result: 'NaCl + H₂O', type: 'exothermic' },
        { with: 'CaCO₃', result: 'CaCl₂ + CO₂ + H₂O', type: 'exothermic' }
      ]
    },
    // Add more chemicals as needed
  ];

  const handleGameOver = useCallback(() => {
    setGameOver(true);
    onGameComplete(score);
  }, [onGameComplete, score]);

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
  }, [timeLeft, gameOver, handleGameOver, score]);

  const handleChemicalSelect = (chemical: Chemical) => {
    if (selectedChemicals.length < 2) {
      setSelectedChemicals(prev => [...prev, chemical]);
    }
  };

  const handleMix = () => {
    if (selectedChemicals.length !== 2) return;

    const [chemical1, chemical2] = selectedChemicals;
    const reaction = chemical1.reactions.find(r => r.with === chemical2.formula) ||
                    chemical2.reactions.find(r => r.with === chemical1.formula);

    if (reaction) {
      setReactionResult(reaction.result);
      setShowReaction(true);
      setScore(prev => prev + 100);
      
      // Update leaderboard if multiplayer
      if (multiplayer && onLeaderboardUpdate) {
        onLeaderboardUpdate({
          name: players?.[0]?.name || 'Player',
          score: 100,
          time: questions[0].timeLimit - timeLeft
        });
      }
    }

    setTimeout(() => {
      setShowReaction(false);
      setSelectedChemicals([]);
      setReactionResult(null);
    }, 2000);
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
                  <MascotImage
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

      {/* Chemical Selection Area */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {chemicals.map(chemical => (
          <motion.div
            key={chemical.id}
            onClick={() => handleChemicalSelect(chemical)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-4 rounded-lg cursor-pointer ${
              selectedChemicals.includes(chemical)
                ? 'bg-blue-100 border-2 border-blue-500'
                : 'bg-white border-2 border-gray-300 hover:border-blue-500'
            }`}
          >
            <div
              className="w-full h-24 rounded mb-2"
              style={{ backgroundColor: chemical.color }}
            />
            <h3 className="font-bold">{chemical.name}</h3>
            <p className="text-sm text-gray-600">{chemical.formula}</p>
          </motion.div>
        ))}
      </div>

      {/* Mixing Area */}
      <div className="bg-gray-100 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">{t('mixingArea')}</h2>
        <div className="flex items-center justify-center gap-4">
          {selectedChemicals.map((chemical, index) => (
            <motion.div
              key={chemical.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <div
                className="w-12 h-12 rounded"
                style={{ backgroundColor: chemical.color }}
              />
              <span className="font-bold">{chemical.formula}</span>
              {index === 0 && selectedChemicals.length === 2 && (
                <span className="text-2xl">+</span>
              )}
            </motion.div>
          ))}
          {selectedChemicals.length === 2 && (
            <motion.button
              onClick={handleMix}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              {t('mix')}
            </motion.button>
          )}
        </div>
      </div>

      {/* Reaction Result */}
      <AnimatePresence>
        {showReaction && reactionResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h3 className="text-2xl font-bold mb-2">{t('reactionResult')}</h3>
              <p className="text-xl">{reactionResult}</p>
            </div>
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