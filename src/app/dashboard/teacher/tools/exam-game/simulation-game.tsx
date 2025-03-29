'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface SimulationGameProps {
  scenarios: {
    id: number;
    description: string;
    options: {
      id: number;
      text: string;
      consequences: string[];
      score: number;
      feedback: string;
    }[];
    context?: string;
    imageUrl?: string;
    timeLimit?: number;
  }[];
  onGameComplete: (score: number) => void;
  difficulty: 'easy' | 'medium' | 'hard';
  theme?: {
    mainColor: string;
    accentColor: string;
    icon: string;
  };
}

interface GameState {
  currentScenario: number;
  score: number;
  timeLeft: number;
  selectedOption: number | null;
  consequences: string[];
  feedback: string;
  showFeedback: boolean;
  isPlaying: boolean;
  streak: number;
  decisions: {
    scenarioId: number;
    optionId: number;
    score: number;
  }[];
}

export default function SimulationGame({ scenarios, onGameComplete, difficulty, theme }: SimulationGameProps) {
  const { t } = useLanguage();
  const [gameState, setGameState] = useState<GameState>({
    currentScenario: 0,
    score: 0,
    timeLeft: scenarios[0]?.timeLimit || 60,
    selectedOption: null,
    consequences: [],
    feedback: '',
    showFeedback: false,
    isPlaying: true,
    streak: 0,
    decisions: []
  });

  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState<'positive' | 'negative' | null>(null);

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState.isPlaying && gameState.timeLeft > 0) {
      timer = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }));
      }, 1000);
    } else if (gameState.timeLeft === 0 && gameState.isPlaying) {
      handleTimeUp();
    }
    return () => clearInterval(timer);
  }, [gameState.isPlaying, gameState.timeLeft]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle time up
  const handleTimeUp = () => {
    if (gameState.selectedOption === null) {
      handleOptionSelect(
        scenarios[gameState.currentScenario].options[0].id,
        true
      );
    }
  };

  // Handle option selection
  const handleOptionSelect = (optionId: number, isTimeout: boolean = false) => {
    const currentScenario = scenarios[gameState.currentScenario];
    const selectedOption = currentScenario.options.find(opt => opt.id === optionId);
    
    if (!selectedOption) return;

    const isGoodChoice = selectedOption.score > 0;
    
    // Calculate points with bonuses
    const timeBonus = Math.floor((gameState.timeLeft / (currentScenario.timeLimit || 60)) * 50);
    const streakBonus = gameState.streak * 10;
    const points = isTimeout ? 0 : selectedOption.score + (isGoodChoice ? timeBonus + streakBonus : 0);

    setGameState(prev => ({
      ...prev,
      selectedOption: optionId,
      consequences: selectedOption.consequences,
      feedback: selectedOption.feedback,
      showFeedback: true,
      isPlaying: false,
      score: prev.score + points,
      streak: isGoodChoice ? prev.streak + 1 : 0,
      decisions: [
        ...prev.decisions,
        {
          scenarioId: currentScenario.id,
          optionId: optionId,
          score: points
        }
      ]
    }));

    // Show animation
    setAnimationType(isGoodChoice ? 'positive' : 'negative');
    setShowAnimation(true);
    setTimeout(() => setShowAnimation(false), 1000);

    // Move to next scenario after delay
    setTimeout(() => {
      if (gameState.currentScenario < scenarios.length - 1) {
        const nextScenario = scenarios[gameState.currentScenario + 1];
        setGameState(prev => ({
          ...prev,
          currentScenario: prev.currentScenario + 1,
          timeLeft: nextScenario.timeLimit || 60,
          selectedOption: null,
          consequences: [],
          feedback: '',
          showFeedback: false,
          isPlaying: true
        }));
      } else {
        onGameComplete(gameState.score);
      }
    }, 3000);
  };

  // Get current scenario
  const currentScenario = scenarios[gameState.currentScenario];

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Game Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold">{t('score')}: {gameState.score}</div>
          <div className="text-lg">
            {t('streak')}: {gameState.streak} 🔥
          </div>
        </div>
        <motion.div
          animate={{
            scale: gameState.timeLeft <= 10 ? [1, 1.1, 1] : 1,
            color: gameState.timeLeft <= 10 ? '#ef4444' : '#000000'
          }}
          transition={{ repeat: gameState.timeLeft <= 10 ? Infinity : 0, duration: 0.5 }}
          className="text-xl font-bold"
        >
          {formatTime(gameState.timeLeft)}
        </motion.div>
      </div>

      {/* Scenario Card */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>{t('scenario')} {gameState.currentScenario + 1}/{scenarios.length}</span>
            <span>{t('difficulty')}: {difficulty}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${((gameState.currentScenario + 1) / scenarios.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Context if available */}
        {currentScenario.context && (
          <div className="mb-6 bg-blue-50 rounded-lg p-4">
            <h3 className="font-bold mb-2">{t('context')}</h3>
            <p>{currentScenario.context}</p>
          </div>
        )}

        {/* Scenario Image if available */}
        {currentScenario.imageUrl && (
          <div className="mb-6">
            <img
              src={currentScenario.imageUrl}
              alt="Scenario"
              className="rounded-lg max-h-60 mx-auto"
            />
          </div>
        )}

        {/* Scenario Description */}
        <p className="text-lg mb-6">{currentScenario.description}</p>

        {/* Options */}
        <div className="space-y-4">
          {currentScenario.options.map(option => (
            <motion.button
              key={option.id}
              onClick={() => gameState.isPlaying && handleOptionSelect(option.id)}
              disabled={!gameState.isPlaying || gameState.selectedOption !== null}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full p-4 rounded-lg text-left transition-all ${
                gameState.selectedOption === option.id
                  ? option.score > 0
                    ? 'bg-green-100 border-2 border-green-500'
                    : 'bg-red-100 border-2 border-red-500'
                  : 'bg-white border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50'
              }`}
            >
              {option.text}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Feedback Panel */}
      <AnimatePresence>
        {gameState.showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gray-50 rounded-xl p-6"
          >
            <h3 className="font-bold mb-4">{t('consequences')}</h3>
            <ul className="list-disc list-inside space-y-2 mb-4">
              {gameState.consequences.map((consequence, index) => (
                <li key={index}>{consequence}</li>
              ))}
            </ul>
            <p className="text-gray-700">{gameState.feedback}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Choice Animation */}
      <AnimatePresence>
        {showAnimation && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none"
          >
            <div
              className={`text-6xl ${
                animationType === 'positive' ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {animationType === 'positive' ? '🎯' : '💭'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 