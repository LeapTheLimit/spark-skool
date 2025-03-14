'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [reshufflesRemaining, setReshufflesRemaining] = useState(3);
  const [isGameInitialized, setIsGameInitialized] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [skipsRemaining, setSkipsRemaining] = useState(2); // New state for skip button

  // Ensure a word is suitable for scrambling (max 2 words, reasonable length)
  const processWord = (text: string): string => {
    // Remove extra whitespace
    const trimmed = text.trim().replace(/\s+/g, ' ');
    
    // Split by space
    const words = trimmed.split(' ');
    
    // If more than 2 words, take only first two
    const limitedText = words.length <= 2 ? trimmed : words.slice(0, 2).join(' ');
    
    // If longer than 15 chars, truncate
    return limitedText.length <= 15 ? limitedText : limitedText.substring(0, 15);
  };

  // Initialize game once
  useEffect(() => {
    if (words.length > 0 && !isGameInitialized) {
      // Process words to ensure they're suitable for scrambling
      const processedWords = words.map(word => ({
        ...word,
        word: processWord(word.word)
      }));
      
      // Create initial scrambled versions - these won't change during gameplay
      const initialWords = processedWords.map(word => {
        const original = word.word.toUpperCase();
        return {
          original: original,
          scrambled: scrambleWord(original),
          hint: word.hint,
          category: word.category,
          isCorrect: false,
          attempts: 0
        };
      });
      
      setScrambledWords(initialWords);
      setGameStarted(true);
      setIsGameInitialized(true);
    }
  }, [words, isGameInitialized]);

  // Game over handler
  const handleGameOver = useCallback(() => {
    if (gameOver) return;
    
    const finalScore = score + (timer * 2);
    setGameOver(true);
    onGameComplete(finalScore);
  }, [score, timer, onGameComplete, gameOver]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && timer > 0 && !gameOver) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0 && !gameOver) {
      handleGameOver();
    }
    return () => clearInterval(interval);
  }, [gameStarted, timer, handleGameOver, gameOver]);

  // Stable scramble function
  const scrambleWord = (word: string): string => {
    if (word.length <= 3) {
      // For very short words, special handling
      return word.length === 1 ? word : word.split('').reverse().join('');
    }
    
    // For multiple word phrases
    if (word.includes(' ')) {
      // Split by space
      const parts = word.split(' ');
      // Scramble each part separately and combine
      return parts.map(part => scrambleWord(part)).join(' ');
    }
    
    // For single words - keep first and last letter, scramble middle
    // This makes the puzzle more solvable
    const first = word.charAt(0);
    const last = word.charAt(word.length - 1);
    const middle = word.substring(1, word.length - 1);
    
    // If middle is just 1 character, no need to scramble
    if (middle.length <= 1) {
      return word;
    }
    
    // Scramble middle (ensure different from original)
    let scrambledMiddle;
    let attempts = 0;
    
    do {
      scrambledMiddle = middle.split('')
        .sort(() => Math.random() - 0.5)
        .join('');
      attempts++;
    } while (scrambledMiddle === middle && attempts < 5);
    
    return first + scrambledMiddle + last;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value.toUpperCase());
  };

  const handleSubmit = () => {
    const currentWord = scrambledWords[currentIndex];
    
    // Check answer (allow for slight variations in spacing)
    const normalizedInput = userInput.trim();
    const normalizedOriginal = currentWord.original.trim();
    const isCorrect = normalizedInput === normalizedOriginal;
    
    if (isCorrect) {
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
        }, 1800);
      } else {
        setTimeout(() => {
          handleGameOver();
        }, 1500);
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

  // Limited reshuffle functionality
  const handleReshuffle = () => {
    if (reshufflesRemaining <= 0) {
      setFeedback("No reshuffles remaining!");
      return;
    }
    
    setReshufflesRemaining(prev => prev - 1);
    
    const currentWord = scrambledWords[currentIndex];
    setScrambledWords(prev => prev.map((word, idx) => 
      idx === currentIndex
        ? { ...word, scrambled: scrambleWord(word.original) }
        : word
    ));
    
    setFeedback(`Reshuffled! ${reshufflesRemaining - 1} remaining.`);
    setTimeout(() => {
      setFeedback('');
    }, 1500);
  };

  // Skip current word functionality
  const handleSkip = () => {
    if (skipsRemaining <= 0) {
      setFeedback("No skips remaining!");
      return;
    }
    
    setSkipsRemaining(prev => prev - 1);
    
    // Mark current word as incorrect for scoring purposes
    setScrambledWords(prev => prev.map((word, idx) => 
      idx === currentIndex ? { ...word, attempts: 999 } : word
    ));
    
    // Move to next word
    if (currentIndex < scrambledWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserInput('');
      setFeedback(`Word skipped! ${skipsRemaining - 1} skips remaining.`);
      setShowHint(false);
    } else {
      // If last word, end the game
      handleGameOver();
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      {/* Game Stats */}
      <div className="flex justify-between items-center mb-6 bg-white p-3 rounded-lg shadow-sm">
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
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold tracking-widest text-black mb-6">
            {scrambledWords[currentIndex]?.scrambled.split('').join(' ')}
          </h2>
          {scrambledWords[currentIndex]?.category && (
            <div className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium mb-2">
              {scrambledWords[currentIndex].category}
            </div>
          )}
          {showHint && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mt-4 text-black text-left">
              <p>Hint: {scrambledWords[currentIndex]?.hint}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 mb-6">
          <div className="relative">
            <input
              type="text"
              value={userInput}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full p-4 border-2 border-gray-300 rounded-lg text-black text-xl text-center uppercase"
              placeholder="Type your answer..."
              maxLength={20}
              autoFocus
            />
            <button
              onClick={handleSubmit}
              className="absolute right-2 top-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Submit
            </button>
          </div>
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
            disabled={reshufflesRemaining === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              reshufflesRemaining > 0
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-300 text-gray-500'
            }`}
          >
            <ArrowPathIcon className="w-5 h-5" />
            Reshuffle: {reshufflesRemaining}
          </button>
          <button
            onClick={handleSkip}
            disabled={skipsRemaining === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              skipsRemaining > 0
                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                : 'bg-gray-300 text-gray-500'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            Skip: {skipsRemaining}
          </button>
        </div>

        {feedback && (
          <div
            className={`mt-4 p-3 rounded-lg text-center ${
              feedback.includes('Correct')
                ? 'bg-green-100 text-green-800'
                : feedback.includes('Reshuffled')
                ? 'bg-blue-100 text-blue-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {feedback}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-3 rounded-lg shadow-sm">
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 rounded-full"
            style={{ width: `${(currentIndex / scrambledWords.length) * 100}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between mt-2">
          <span className="text-xs text-black">Start</span>
          <span className="text-xs text-black">Finish</span>
        </div>
      </div>

      {/* Word List - small indicators */}
      <div className="flex justify-center mt-4 space-x-2">
        {scrambledWords.map((word, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full ${
              index === currentIndex
                ? 'bg-blue-600'
                : word.isCorrect
                ? 'bg-green-600'
                : 'bg-gray-300'
            }`}
            title={word.original}
          />
        ))}
      </div>
    </div>
  );
} 