'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';

interface MatchingGameProps {
  pairs: {
    id: number;
    term: string;
    definition: string;
    category?: string;
    imageUrl?: string;
  }[];
  onGameComplete: (score: number) => void;
  difficulty: 'easy' | 'medium' | 'hard';
  theme?: {
    mainColor: string;
    accentColor: string;
    icon: string;
  };
}

interface MatchState {
  id: number;
  content: string;
  type: 'term' | 'definition';
  isMatched: boolean;
  isSelected: boolean;
  category?: string;
  imageUrl?: string;
}

export default function MatchingGame({ pairs, onGameComplete, difficulty, theme }: MatchingGameProps) {
  const { t } = useLanguage();
  const [matchItems, setMatchItems] = useState<MatchState[]>([]);
  const [selectedItem, setSelectedItem] = useState<MatchState | null>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(difficulty === 'easy' ? 300 : difficulty === 'medium' ? 240 : 180);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState<'correct' | 'wrong' | null>(null);
  const [streak, setStreak] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Initialize game
  useEffect(() => {
    // Create shuffled array of terms and definitions
    const items: MatchState[] = [
      ...pairs.map(p => ({
        id: p.id,
        content: p.term,
        type: 'term' as const,
        isMatched: false,
        isSelected: false,
        category: p.category,
        imageUrl: p.imageUrl
      })),
      ...pairs.map(p => ({
        id: p.id,
        content: p.definition,
        type: 'definition' as const,
        isMatched: false,
        isSelected: false,
        category: p.category
      }))
    ].sort(() => Math.random() - 0.5);

    setMatchItems(items);

    // Extract unique categories
    const uniqueCategories = Array.from(new Set(pairs.map(p => p.category).filter(Boolean)));
    setCategories(uniqueCategories as string[]);
  }, [pairs]);

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleGameOver();
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle item selection
  const handleItemSelect = (item: MatchState) => {
    if (!isPlaying || item.isMatched) return;

    if (!selectedItem) {
      // First selection
      setSelectedItem(item);
      setMatchItems(prev =>
        prev.map(i =>
          i.id === item.id && i.type === item.type
            ? { ...i, isSelected: true }
            : i
        )
      );
    } else {
      // Second selection - check for match
      setMoves(prev => prev + 1);

      if (
        selectedItem.id === item.id &&
        selectedItem.type !== item.type &&
        !item.isMatched
      ) {
        // Correct match
        setMatchItems(prev =>
          prev.map(i =>
            i.id === item.id
              ? { ...i, isMatched: true, isSelected: false }
              : i
          )
        );
        
        // Calculate points with bonuses
        const timeBonus = Math.floor((timeLeft / (difficulty === 'easy' ? 300 : difficulty === 'medium' ? 240 : 180)) * 50);
        const streakBonus = streak * 10;
        const points = 100 + timeBonus + streakBonus;
        
        setScore(prev => prev + points);
        setStreak(prev => prev + 1);
        
        // Show success animation
        setAnimationType('correct');
        setShowAnimation(true);
        setTimeout(() => setShowAnimation(false), 1000);
      } else {
        // Wrong match
        setTimeout(() => {
          setMatchItems(prev =>
            prev.map(i =>
              i.isSelected && !i.isMatched
                ? { ...i, isSelected: false }
                : i
            )
          );
        }, 1000);
        
        setStreak(0);
        
        // Show error animation
        setAnimationType('wrong');
        setShowAnimation(true);
        setTimeout(() => setShowAnimation(false), 1000);
      }
      
      setSelectedItem(null);
    }

    // Check if game is complete
    if (matchItems.every(item => item.isMatched)) {
      handleGameOver();
    }
  };

  // Handle game over
  const handleGameOver = () => {
    setIsPlaying(false);
    const finalScore = score;
    onGameComplete(finalScore);
  };

  // Filter items by category
  const filteredItems = selectedCategory
    ? matchItems.filter(item => item.category === selectedCategory)
    : matchItems;

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Game Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-black">{t('score')}: {score}</div>
          <div className="text-lg text-black">
            {t('moves')}: {moves}
          </div>
          <div className="text-lg text-black">
            {t('streak')}: {streak} 🔥
          </div>
        </div>
        <motion.div
          animate={{
            scale: timeLeft <= 30 ? [1, 1.1, 1] : 1,
            color: timeLeft <= 30 ? '#ef4444' : '#000000'
          }}
          transition={{ repeat: timeLeft <= 30 ? Infinity : 0, duration: 0.5 }}
          className="text-xl font-bold text-black"
        >
          {formatTime(timeLeft)}
        </motion.div>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === null
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-black hover:bg-gray-200'
            }`}
          >
            {t('all')}
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-black hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Game Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filteredItems.map((item, index) => (
          <motion.div
            key={`${item.id}-${item.type}`}
            onClick={() => !item.isSelected && !item.isMatched && handleItemSelect(item)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            animate={{
              scale: item.isMatched ? 0.95 : 1,
              opacity: item.isMatched ? 0.7 : 1
            }}
            className={`relative aspect-[3/4] cursor-pointer ${
              item.isMatched ? 'pointer-events-none' : ''
            }`}
          >
            <div
              className={`absolute inset-0 rounded-xl shadow-lg p-4 transition-all duration-300 ${
                item.isSelected
                  ? 'bg-blue-100 border-2 border-blue-500'
                  : item.isMatched
                  ? 'bg-green-100 border-2 border-green-500'
                  : 'bg-white border-2 border-gray-200 hover:border-blue-500'
              }`}
            >
              <div className="flex flex-col items-center justify-center h-full">
                {item.type === 'term' && item.imageUrl && (
                  <div className="relative w-full h-32 mb-4">
                    <Image
                      src={item.imageUrl}
                      alt={item.content}
                      fill
                      className="object-cover rounded-lg"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                )}
                <p className="text-center font-medium text-black">
                  {item.content}
                </p>
                {item.category && (
                  <span className="mt-2 px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                    {item.category}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Animations */}
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

      {/* Game Over */}
      {!isPlaying && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-black">{t('gameOver')}</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-black">{t('finalScore')}:</span>
                <span className="text-2xl font-bold text-black">{score}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-black">{t('moves')}:</span>
                <span className="text-lg text-black">{moves}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-black">{t('timeLeft')}:</span>
                <span className="text-lg text-black">{formatTime(timeLeft)}</span>
              </div>
            </div>
            <button
              onClick={() => onGameComplete(score)}
              className="mt-6 w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {t('continue')}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
} 