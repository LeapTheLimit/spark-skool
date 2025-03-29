'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface FillBlanksProps {
  questions: {
    id: number;
    text: string;
    blanks: {
      word: string;
      hint?: string;
      position: number;
    }[];
    context?: string;
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

interface AnswerState {
  questionId: number;
  blankIndex: number;
  answer: string;
  isCorrect: boolean;
  isChecked: boolean;
}

export default function FillBlanks({ questions, onGameComplete, difficulty, theme }: FillBlanksProps) {
  const { t } = useLanguage();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<AnswerState[]>([]);
  const [score, setScore] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [timeLeft, setTimeLeft] = useState(difficulty === 'easy' ? 300 : difficulty === 'medium' ? 240 : 180);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [streak, setStreak] = useState(0);

  // Initialize answers
  useEffect(() => {
    const initialAnswers = questions.flatMap(q =>
      q.blanks.map((blank, index) => ({
        questionId: q.id,
        blankIndex: index,
        answer: '',
        isCorrect: false,
        isChecked: false
      }))
    );
    setAnswers(initialAnswers);
  }, [questions]);

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSubmit();
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  // Handle answer change
  const handleAnswerChange = (questionId: number, blankIndex: number, value: string) => {
    setAnswers(prev =>
      prev.map(a =>
        a.questionId === questionId && a.blankIndex === blankIndex
          ? { ...a, answer: value, isChecked: false }
          : a
      )
    );
  };

  // Handle hint request
  const handleHintRequest = (questionId: number, blankIndex: number) => {
    if (hintsRemaining > 0) {
      const question = questions.find(q => q.id === questionId);
      const blank = question?.blanks[blankIndex];
      if (blank?.hint) {
        setHintsRemaining(prev => prev - 1);
        // Show hint animation
        setShowFeedback(true);
        setTimeout(() => setShowFeedback(false), 2000);
      }
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle submit
  const handleSubmit = () => {
    setIsPlaying(false);
    let correctAnswers = 0;
    let newAnswers = [...answers];

    questions.forEach(question => {
      question.blanks.forEach((blank, index) => {
        const answer = answers.find(
          a => a.questionId === question.id && a.blankIndex === index
        );
        if (answer) {
          const isCorrect = answer.answer.toLowerCase().trim() === blank.word.toLowerCase();
          newAnswers = newAnswers.map(a =>
            a.questionId === question.id && a.blankIndex === index
              ? { ...a, isCorrect, isChecked: true }
              : a
          );
          if (isCorrect) correctAnswers++;
        }
      });
    });

    setAnswers(newAnswers);
    
    // Calculate score based on correct answers, time remaining, and streak
    const timeBonus = Math.floor((timeLeft / (difficulty === 'easy' ? 300 : difficulty === 'medium' ? 240 : 180)) * 100);
    const streakBonus = streak * 10;
    const finalScore = (correctAnswers * 100) + timeBonus + streakBonus;
    
    setScore(finalScore);
    onGameComplete(finalScore);
  };

  // Get question text with blanks
  const getQuestionDisplay = (question: typeof questions[0]) => {
    let text = question.text;
    let lastIndex = 0;
    const elements: JSX.Element[] = [];

    question.blanks.forEach((blank, index) => {
      // Add text before blank
      elements.push(
        <span key={`text-${index}`}>
          {text.slice(lastIndex, blank.position)}
        </span>
      );

      // Add input field
      const answer = answers.find(
        a => a.questionId === question.id && a.blankIndex === index
      );
      
      elements.push(
        <motion.div
          key={`input-${index}`}
          className="inline-block"
          animate={answer?.isChecked ? {
            scale: [1, 1.1, 1],
            transition: { duration: 0.3 }
          } : {}}
        >
          <input
            type="text"
            value={answer?.answer || ''}
            onChange={(e) => handleAnswerChange(question.id, index, e.target.value)}
            disabled={!isPlaying}
            className={`w-32 px-2 py-1 mx-1 border-2 rounded-md ${
              answer?.isChecked
                ? answer.isCorrect
                  ? 'border-green-500 bg-green-50'
                  : 'border-red-500 bg-red-50'
                : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
            }`}
            placeholder={t('typeAnswer')}
          />
          {hintsRemaining > 0 && blank.hint && (
            <button
              onClick={() => handleHintRequest(question.id, index)}
              className="ml-1 text-blue-500 hover:text-blue-600"
              disabled={!isPlaying}
            >
              💡
            </button>
          )}
        </motion.div>
      );

      lastIndex = blank.position;
    });

    // Add remaining text
    elements.push(
      <span key="text-end">
        {text.slice(lastIndex)}
      </span>
    );

    return elements;
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Game Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold">{t('score')}: {score}</div>
          <div className="text-lg">
            {t('hints')}: {hintsRemaining} 💡
          </div>
        </div>
        <motion.div
          animate={{
            scale: timeLeft <= 30 ? [1, 1.1, 1] : 1,
            color: timeLeft <= 30 ? '#ef4444' : '#000000'
          }}
          transition={{ repeat: timeLeft <= 30 ? Infinity : 0, duration: 0.5 }}
          className="text-xl font-bold"
        >
          {formatTime(timeLeft)}
        </motion.div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        {/* Context if available */}
        {questions[currentQuestion]?.context && (
          <div className="mb-6 bg-blue-50 rounded-lg p-4">
            <h3 className="font-bold mb-2">{t('context')}</h3>
            <p>{questions[currentQuestion].context}</p>
          </div>
        )}

        {/* Question Image if available */}
        {questions[currentQuestion]?.imageUrl && (
          <div className="mb-6">
            <img
              src={questions[currentQuestion].imageUrl}
              alt="Question"
              className="rounded-lg max-h-60 mx-auto"
            />
          </div>
        )}

        {/* Question Text with Blanks */}
        <div className="text-lg leading-relaxed">
          {getQuestionDisplay(questions[currentQuestion])}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <button
          onClick={handleSubmit}
          disabled={!isPlaying}
          className={`px-6 py-3 rounded-lg text-white font-medium ${
            isPlaying
              ? 'bg-blue-500 hover:bg-blue-600'
              : 'bg-gray-400 cursor-not-allowed'
          } transition-colors`}
        >
          {t('submit')}
        </button>
      </div>

      {/* Feedback Animation */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-black bg-opacity-50 text-white px-6 py-3 rounded-lg">
              {t('hintUsed')}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 