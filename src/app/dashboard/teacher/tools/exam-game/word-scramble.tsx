'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LightBulbIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface WordScrambleProps {
  words: Array<{
    word: string;
    hint: string;
    category?: string;
  }>;
  onGameComplete: (score: number) => void;
}

interface ScrambledWord {
  original: string;
  scrambled: string;
  hint: string;
  category?: string;
  isCorrect: boolean;
  attempts: number;
}

export default function WordScramble({ words, onGameComplete }: WordScrambleProps) {
  const [scrambledWords, setScrambledWords] = useState<ScrambledWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(300); // 5 minutes
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [gameStarted, setGameStarted] = useState(false);

  // Initialize game
  useEffect(() => {
    if (words.length > 0) {
      const initialWords = words.map(word => ({
        original: word.word.toUpperCase(),
        scrambled: scrambleWord(word.word.toUpperCase()),
        hint: word.hint,
        category: word.category,
        isCorrect: false,
        attempts: 0
      }));
      setScrambledWords(initialWords);
      setGameStarted(true);
    }
  }, [words]);

  // Memoize handleGameOver
  const handleGameOver = useCallback(() => {
    const finalScore = score + (timer * 2);
    onGameComplete(finalScore);
  }, [score, timer, onGameComplete]);

  // Fix useEffect dependency
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      handleGameOver();
    }
    return () => clearInterval(interval);
  }, [gameStarted, timer, handleGameOver]); // Add handleGameOver to dependencies

  const scrambleWord = (word: string): string => {
    const arr = word.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value.toUpperCase());
  };

  const handleSubmit = () => {
    const currentWord = scrambledWords[currentIndex];
    if (userInput === currentWord.original) {
      // Calculate score based on attempts and time
      const attemptBonus = Math.max(0, 50 - (currentWord.attempts * 10));
      const timeBonus = Math.floor(timer / 10);
      const wordScore = 100 + attemptBonus + timeBonus;
      
      setScore(prev => prev + wordScore);
      setScrambledWords(prev => prev.map((word, idx) => 
        idx === currentIndex ? { ...word, isCorrect: true } : word
      ));
      setFeedback('Correct! Well done!');
      
      // Move to next word or end game
      if (currentIndex < scrambledWords.length - 1) {
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
          setUserInput('');
          setFeedback('');
        }, 1500);
      } else {
        handleGameOver();
      }
    } else {
      setScrambledWords(prev => prev.map((word, idx) => 
        idx === currentIndex ? { ...word, attempts: word.attempts + 1 } : word
      ));
      setFeedback('Try again!');
      setUserInput('');
    }
  };

  const handleHint = () => {
    if (hintsRemaining > 0) {
      setHintsRemaining(prev => prev - 1);
      setShowHint(true);
      setTimeout(() => setShowHint(false), 3000);
    }
  };

  const handleReshuffle = () => {
    setScrambledWords(prev => prev.map((word, idx) => 
      idx === currentIndex
        ? { ...word, scrambled: scrambleWord(word.original) }
        : word
    ));
  };

  return (
    <div className="p-4">
      {/* Game Stats */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-black">
          Time: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
        </div>
        <div className="text-black">
          Score: {score}
        </div>
        <div className="text-black">
          Word {currentIndex + 1} of {scrambledWords.length}
        </div>
      </div>

      {/* Game Area */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-black mb-4">
            {scrambledWords[currentIndex]?.scrambled}
          </h2>
          {scrambledWords[currentIndex]?.category && (
            <p className="text-gray-600 mb-2">
              Category: {scrambledWords[currentIndex].category}
            </p>
          )}
          {showHint && (
            <p className="text-blue-600 animate-pulse">
              Hint: {scrambledWords[currentIndex]?.hint}
            </p>
          )}
        </div>

        <div className="flex gap-4 mb-6">
          <input
            type="text"
            value={userInput}
            onChange={handleInputChange}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            className="flex-1 p-3 border-2 border-gray-300 rounded-lg text-black text-xl text-center uppercase"
            placeholder="Type your answer..."
          />
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Submit
          </button>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={handleHint}
            disabled={hintsRemaining === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              hintsRemaining > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500'
            }`}
          >
            <LightBulbIcon className="w-5 h-5" />
            Hints: {hintsRemaining}
          </button>
          <button
            onClick={handleReshuffle}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Reshuffle
          </button>
        </div>

        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-3 rounded-lg text-center ${
              feedback === 'Correct! Well done!'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {feedback}
          </motion.div>
        )}
      </div>

      {/* Progress */}
      <div className="grid grid-cols-5 gap-2">
        {scrambledWords.map((word, index) => (
          <div
            key={index}
            className={`h-2 rounded-full ${
              index === currentIndex
                ? 'bg-blue-600'
                : word.isCorrect
                ? 'bg-green-600'
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
} 