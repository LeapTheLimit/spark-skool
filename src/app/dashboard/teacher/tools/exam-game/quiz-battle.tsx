'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import confetti from 'canvas-confetti';

interface QuizBattleProps {
  questions: {
    id: number;
    question: string;
    options: string[];
    correctAnswer: string;
    points: number;
    timeLimit: number;
    imageUrl?: string;
    explanation?: string;
  }[];
  onGameComplete: (score: number) => void;
  difficulty: 'easy' | 'medium' | 'hard';
  theme?: {
    mainColor: string;
    accentColor: string;
    icon: string;
  };
}

interface PlayerState {
  score: number;
  streak: number;
  powerups: {
    timeFreeze: number;
    pointBoost: number;
    hint: number;
  };
}

export default function QuizBattle({ questions, onGameComplete, difficulty, theme }: QuizBattleProps) {
  const { t } = useLanguage();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(() => {
    // Safely initialize timeLeft with a default value if questions array is empty
    return questions && questions.length > 0 && questions[0]?.timeLimit 
      ? questions[0].timeLimit 
      : difficulty === 'easy' ? 30 : difficulty === 'medium' ? 20 : 15;
  });
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [player, setPlayer] = useState<PlayerState>({
    score: 0,
    streak: 0,
    powerups: {
      timeFreeze: 2,
      pointBoost: 2,
      hint: 2
    }
  });
  const [showExplanation, setShowExplanation] = useState(false);
  const [isTimeFrozen, setIsTimeFrozen] = useState(false);
  const [pointMultiplier, setPointMultiplier] = useState(1);
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState<'correct' | 'wrong' | null>(null);

  // Ensure questions are properly formatted
  useEffect(() => {
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      console.error('No questions provided or invalid questions format');
      onGameComplete(0);
      return;
    }

    // Validate each question has required properties
    const invalidQuestions = questions.filter(q => 
      !q.question || !q.options || !Array.isArray(q.options) || q.options.length === 0 || !q.correctAnswer
    );

    if (invalidQuestions.length > 0) {
      console.error('Invalid questions found:', invalidQuestions);
      onGameComplete(0);
      return;
    }

    // Initialize game state
    setIsPlaying(true);
    setCurrentQuestion(0);
    setShowResult(false);
    setSelectedAnswer(null);
    setPlayer({
      score: 0,
      streak: 0,
      powerups: {
        timeFreeze: 2,
        pointBoost: 2,
        hint: 2
      }
    });
  }, [questions]);

  // Reset game function
  const resetGame = () => {
    setCurrentQuestion(0);
    setTimeLeft(
      questions && questions.length > 0 && questions[0]?.timeLimit 
        ? questions[0].timeLimit 
        : difficulty === 'easy' ? 30 : difficulty === 'medium' ? 20 : 15
    );
    setIsPlaying(true);
    setSelectedAnswer(null);
    setShowResult(false);
    setPlayer({
      score: 0,
      streak: 0,
      powerups: {
        timeFreeze: 2,
        pointBoost: 2,
        hint: 2
      }
    });
    setShowExplanation(false);
    setIsTimeFrozen(false);
    setPointMultiplier(1);
    setEliminatedOptions([]);
    setShowAnimation(false);
    setAnimationType(null);
  };

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0 && !isTimeFrozen) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isPlaying) {
      handleAnswerSubmit(null);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, isTimeFrozen]);

  // Handle answer submission
  const handleAnswerSubmit = (answer: string | null) => {
    const currentQ = questions[currentQuestion];
    if (!currentQ) return;

    setIsPlaying(false);
    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === currentQ.correctAnswer;
    setAnimationType(isCorrect ? 'correct' : 'wrong');
    setShowAnimation(true);

    // Calculate points
    let pointsEarned = 0;
    if (isCorrect) {
      const timeBonus = Math.floor((timeLeft / currentQ.timeLimit) * 50);
      const streakBonus = Math.floor(player.streak * 10);
      pointsEarned = (currentQ.points + timeBonus + streakBonus) * pointMultiplier;

      // Trigger confetti for correct answers
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      setPlayer(prev => ({
        ...prev,
        score: prev.score + pointsEarned,
        streak: prev.streak + 1
      }));
    } else {
      setPlayer(prev => ({
        ...prev,
        streak: 0
      }));
    }

    // Show result briefly before moving to next question
    setTimeout(() => {
      setShowAnimation(false);
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setTimeLeft(questions[currentQuestion + 1].timeLimit);
        setSelectedAnswer(null);
        setShowResult(false);
        setIsPlaying(true);
        setPointMultiplier(1);
        setEliminatedOptions([]);
        setIsTimeFrozen(false);
      } else {
        onGameComplete(player.score);
      }
    }, 2000);
  };

  // Power-up handlers
  const handleTimeFreeze = () => {
    if (player.powerups.timeFreeze > 0) {
      setIsTimeFrozen(true);
      setPlayer(prev => ({
        ...prev,
        powerups: {
          ...prev.powerups,
          timeFreeze: prev.powerups.timeFreeze - 1
        }
      }));
      setTimeout(() => setIsTimeFrozen(false), 5000);
    }
  };

  const handlePointBoost = () => {
    if (player.powerups.pointBoost > 0) {
      setPointMultiplier(2);
      setPlayer(prev => ({
        ...prev,
        powerups: {
          ...prev.powerups,
          pointBoost: prev.powerups.pointBoost - 1
        }
      }));
    }
  };

  const handleHint = () => {
    if (player.powerups.hint > 0 && questions[currentQuestion]) {
      const currentQ = questions[currentQuestion];
      const incorrectOptions = currentQ.options.filter(opt => opt !== currentQ.correctAnswer);
      const optionsToEliminate = incorrectOptions.slice(0, 2);
      setEliminatedOptions(optionsToEliminate);
      setPlayer(prev => ({
        ...prev,
        powerups: {
          ...prev.powerups,
          hint: prev.powerups.hint - 1
        }
      }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Game Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-black">{t('score')}: {player.score}</div>
          <div className="text-lg text-black">
            {t('streak')}: {player.streak} 🔥
          </div>
          <button
            onClick={resetGame}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            {t('resetGame')}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <motion.div
            animate={{
              scale: timeLeft <= 5 ? [1, 1.2, 1] : 1,
              color: timeLeft <= 5 ? '#ef4444' : '#000000'
            }}
            transition={{ repeat: timeLeft <= 5 ? Infinity : 0, duration: 0.5 }}
            className="text-xl font-bold text-black"
          >
            {timeLeft}s
          </motion.div>
        </div>
      </div>

      {/* Power-ups */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={handleTimeFreeze}
          disabled={player.powerups.timeFreeze === 0}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          ⏸️ {player.powerups.timeFreeze}
        </button>
        <button
          onClick={handlePointBoost}
          disabled={player.powerups.pointBoost === 0}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          2️⃣ {player.powerups.pointBoost}
        </button>
        <button
          onClick={handleHint}
          disabled={player.powerups.hint === 0}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          💡 {player.powerups.hint}
        </button>
      </div>

      {/* Question */}
      {questions && questions[currentQuestion] ? (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="mb-6">
            <div className="text-lg font-medium text-black mb-2">
              {t('question')} {currentQuestion + 1}/{questions.length}
            </div>
            <div className="text-2xl font-bold text-black">
              {questions[currentQuestion].question}
            </div>
            {questions[currentQuestion].imageUrl && (
              <div className="mt-4 relative w-full h-64">
                <img
                  src={questions[currentQuestion].imageUrl}
                  alt="Question"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['A', 'B', 'C', 'D'].map((letter, index) => {
              const option = questions[currentQuestion].options[index];
              if (!option) return null;

              return (
                <button
                  key={letter}
                  onClick={() => !showResult && handleAnswerSubmit(option)}
                  disabled={showResult || eliminatedOptions.includes(option)}
                  className={`p-6 rounded-lg text-left transition-colors ${
                    showResult
                      ? option === questions[currentQuestion].correctAnswer
                        ? 'bg-green-100 border-2 border-green-500 text-green-700'
                        : option === selectedAnswer
                        ? 'bg-red-100 border-2 border-red-500 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                      : eliminatedOptions.includes(option)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 text-black'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-black font-bold">
                      {letter}
                    </div>
                    <span className="text-lg">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-red-600">{t('noQuestionsAvailable')}</p>
        </div>
      )}

      {/* Explanation */}
      {showResult && questions[currentQuestion]?.explanation && (
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <div className="font-medium text-black mb-2">{t('explanation')}:</div>
          <div className="text-black">{questions[currentQuestion].explanation}</div>
        </div>
      )}

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

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
} 