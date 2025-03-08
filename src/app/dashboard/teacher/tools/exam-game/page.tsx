'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { MATERIALS_STORAGE_KEY } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeftIcon,
  CloudArrowUpIcon,
  SparklesIcon,
  DocumentTextIcon,
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  XMarkIcon,
  CheckIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// Add imports for all game types
import MemoryGame from './memory-game';
import WordSearch from './word-search';
import WordScramble from './word-scramble';
import QuizShow from './quiz-show';
import Crossword from './crossword';
import Timeline from './timeline';

// Add import for Groq integration
import { generateExamFromText } from '@/services/groq';

interface GameQuestion {
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
}

interface GameState {
  currentQuestion: number;
  score: number;
  timeRemaining: number;
  isPlaying: boolean;
  showAnswer: boolean;
  selectedAnswer: string | null;
  streak: number;
  totalQuestions: number;
  gameType: 'kahoot' | 'memory' | 'wordsearch' | 'wordscramble' | 'quizshow' | 'crossword' | 'timeline';
  usedQuestionIds: number[]; // Add tracking for used questions to prevent repetition
  activeStudent: string | null; // Track which student raised their hand
}

// Add QuestionAttempt interface to track detailed analytics
interface QuestionAttempt {
  questionId: number;
  questionText: string;
  correctAnswer: string;
  selectedAnswer: string | null;
  isCorrect: boolean;
  timeTaken: number;
  points: number;
}

interface GameSettings {
  timePerQuestion: number;
  pointsPerQuestion: number;
  bonusPoints: {
    streak: number;
    speed: number;
  };
  showTimer: boolean;
  showHints: boolean;
  allowSkip: boolean;
  backgroundMusic: boolean;
  soundEffects: boolean;
  difficultyProgression: boolean;
  passingScore: number;
  gameTitle: string;
  gameDescription: string;
  teacherName: string;
  schoolName: string;
}

interface GameStats {
  totalScore: number;
  correctAnswers: number;
  wrongAnswers: number;
  averageTime: number;
  longestStreak: number;
  totalTimeTaken: number;
  completed: boolean;
  questionAttempts: QuestionAttempt[]; // Add detailed tracking of each question
  startTime?: Date;
  endTime?: Date;
}

// Define animation type at the top level
type AnimationType = 'bounce' | 'pulse' | 'shake' | 'spin' | 'fade' | 'slide' | 'type';

// Define subject type to ensure type safety
type SubjectType = 'math' | 'science' | 'language' | 'history' | 'computer';

// Add subject options with icons
const subjects = [
  { id: 'math' as SubjectType, name: 'Mathematics', icon: '📐', topics: ['Algebra', 'Geometry', 'Calculus', 'Statistics'] },
  { id: 'science' as SubjectType, name: 'Science', icon: '🔬', topics: ['Physics', 'Chemistry', 'Biology', 'Earth Science'] },
  { id: 'language' as SubjectType, name: 'Language', icon: '📚', topics: ['Grammar', 'Literature', 'Writing', 'Vocabulary'] },
  { id: 'history' as SubjectType, name: 'History', icon: '🏛️', topics: ['World History', 'Ancient History', 'Modern History', 'Geography'] },
  { id: 'computer' as SubjectType, name: 'Computer Science', icon: '💻', topics: ['Programming', 'Web Development', 'Databases', 'Networking'] }
];

// Define subject-specific game types to filter appropriate games for each subject
const subjectGameMapping: Record<SubjectType, string[]> = {
  'math': ['kahoot', 'crossword', 'memory', 'quizshow'],
  'science': ['kahoot', 'quizshow', 'memory', 'timeline', 'crossword'],
  'language': ['wordscramble', 'wordsearch', 'crossword', 'kahoot', 'memory'],
  'history': ['timeline', 'kahoot', 'memory', 'quizshow'],
  'computer': ['kahoot', 'memory', 'quizshow', 'crossword']
};

// Define game types with icons, descriptions and animations
const gameTypes = [
  { 
    id: 'kahoot', 
    name: 'Quiz Game', 
    icon: '🎮', 
    description: 'Classic quiz with multiple choice questions',
    animation: 'pulse',
    color: 'blue' 
  },
  { 
    id: 'memory', 
    name: 'Memory Match', 
    icon: '🃏', 
    description: 'Match questions with their answers',
    animation: 'flip',
    color: 'green'
  },
  { 
    id: 'wordsearch', 
    name: 'Word Search', 
    icon: '🔍', 
    description: 'Find words hidden in a grid',
    animation: 'bounce',
    color: 'purple'
  },
  { 
    id: 'wordscramble', 
    name: 'Word Scramble', 
    icon: '🔤', 
    description: 'Unscramble words related to the topic',
    animation: 'spin',
    color: 'orange'
  },
  { 
    id: 'quizshow', 
    name: 'Quiz Show', 
    icon: '🎭', 
    description: 'Multiplayer quiz show experience',
    animation: 'slide',
    color: 'yellow'
  },
  { 
    id: 'crossword', 
    name: 'Crossword', 
    icon: '📝', 
    description: 'Fill in the crossword puzzle',
    animation: 'fade',
    color: 'red'
  },
  { 
    id: 'timeline', 
    name: 'Timeline', 
    icon: '⏱️', 
    description: 'Arrange events in chronological order',
    animation: 'scale',
    color: 'indigo'
  }
];

// Define subject-specific themes
const subjectThemes: Record<SubjectType, {
  mainColor: string;
  accentColor: string;
  icon: string;
  animation: AnimationType;
  sound: string;
}> = {
  'math': {
    mainColor: 'from-blue-50 to-indigo-100',
    accentColor: 'blue',
    icon: '📐',
    animation: 'bounce',
    sound: 'calculator'
  },
  'science': {
    mainColor: 'from-green-50 to-teal-100',
    accentColor: 'green',
    icon: '🔬',
    animation: 'pulse',
    sound: 'bubbles'
  },
  'language': {
    mainColor: 'from-purple-50 to-pink-100',
    accentColor: 'purple',
    icon: '📚',
    animation: 'slide',
    sound: 'page'
  },
  'history': {
    mainColor: 'from-amber-50 to-yellow-100',
    accentColor: 'amber',
    icon: '🏛️',
    animation: 'fade',
    sound: 'drum'
  },
  'computer': {
    mainColor: 'from-gray-50 to-blue-100',
    accentColor: 'slate',
    icon: '💻',
    animation: 'type',
    sound: 'beep'
  }
};

// Add an interface for the Player type
interface Player {
  id: string | number;
  name: string;
  score: number;
  avatar?: string;
}

export default function ExamGamePage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    currentQuestion: 0,
    score: 0,
    timeRemaining: 0,
    isPlaying: false,
    showAnswer: false,
    selectedAnswer: null,
    streak: 0,
    totalQuestions: 0,
    gameType: 'kahoot', // Default game type
    usedQuestionIds: [], // Initialize empty array to track used questions
    activeStudent: null // Initialize with no active student
  });
  const [showMaterialSelector, setShowMaterialSelector] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'info'
  });
  const [correctAnimation, setCorrectAnimation] = useState(false);

  const [gameSettings, setGameSettings] = useState<GameSettings>({
    timePerQuestion: 20,
    pointsPerQuestion: 100,
    bonusPoints: {
      streak: 10,
      speed: 50
    },
    showTimer: true,
    showHints: false,
    allowSkip: false,
    backgroundMusic: false,
    soundEffects: true,
    difficultyProgression: true,
    passingScore: 70,
    gameTitle: '',
    gameDescription: '',
    teacherName: '',
    schoolName: ''
  });

  const [gameStats, setGameStats] = useState<GameStats>({
    totalScore: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    averageTime: 0,
    longestStreak: 0,
    totalTimeTaken: 0,
    completed: false,
    questionAttempts: [], // Initialize empty array for tracking attempts
    startTime: undefined,
    endTime: undefined
  });

  // Add state to track time spent on each question
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);

  const [showSetup, setShowSetup] = useState(false);
  const [examFile, setExamFile] = useState<File | null>(null);
  const [aiContext, setAiContext] = useState('');

  // Game Phases
  const [gamePhase, setGamePhase] = useState<'setup' | 'playing' | 'results'>('setup');

  // Add new state for AI generation
  const [selectedSubject, setSelectedSubject] = useState<SubjectType | ''>('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [aiPrompt, setAiPrompt] = useState('');
  const [examContext, setExamContext] = useState(''); // Add exam context state

  // Add state for compact view
  const [compactView, setCompactView] = useState(true);

  // Add state for theme and animations
  const [currentTheme, setCurrentTheme] = useState(subjectThemes['math']);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState<AnimationType | ''>('');
  const [gameStartAnimation, setGameStartAnimation] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Default theme for initialization
  const defaultTheme = subjectThemes['math'];
  
  // Update effect for theme change when subject changes
  useEffect(() => {
    if (selectedSubject && selectedSubject in subjectThemes) {
      setCurrentTheme(subjectThemes[selectedSubject]);
      
      // Show subject selection animation
      setAnimationType(subjectThemes[selectedSubject].animation);
      setShowAnimation(true);
      setTimeout(() => {
        setShowAnimation(false);
      }, 1000);
    }
  }, [selectedSubject]);

  // Load materials when selector opens
  useEffect(() => {
    if (showMaterialSelector) {
      const stored = localStorage.getItem(MATERIALS_STORAGE_KEY);
      if (stored) {
        const allMaterials = JSON.parse(stored);
        setMaterials(allMaterials);
      }
    }
  }, [showMaterialSelector]);

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState.isPlaying && gameState.timeRemaining > 0) {
      timer = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          timeRemaining: prev.timeRemaining - 1
        }));
      }, 1000);
    } else if (gameState.timeRemaining === 0 && gameState.isPlaying) {
      handleAnswerReveal(null);
    }
    return () => clearInterval(timer);
  }, [gameState.isPlaying, gameState.timeRemaining]);

  // Improved sample question generator with randomized answer positions
  const generateSampleQuestions = (subject: string, topic: string, difficulty: string, count: number) => {
    // Helper function to randomize answer options and correct answer index
    const randomizeAnswerOptions = (question: string, correctAnswer: string, otherOptions: string[]) => {
      // Create combined array with all options
      const allOptions = [correctAnswer, ...otherOptions];
      
      // Shuffle the options
      for (let i = allOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
      }
      
      // Return the randomized data
      return {
        question: question,
        options: allOptions,
        answer: correctAnswer,
        type: 'multiple_choice'
      };
    };

    // Get subject-specific questions with randomized answers
    const getSubjectQuestions = () => {
      if (subject === 'math') {
        if (topic === 'Algebra') {
          return [
            randomizeAnswerOptions(
              'Solve for x: 2x + 5 = 13', 
              'x = 4', 
              ['x = 5', 'x = 3', 'x = 6']
            ),
            randomizeAnswerOptions(
              'Simplify the expression: 3(x - 2) + 4x', 
              '7x - 6', 
              ['7x - 2', '3x - 6', '3x - 2']
            ),
            randomizeAnswerOptions(
              'Factor the expression: x² - 9', 
              '(x+3)(x-3)', 
              ['(x+9)(x-1)', '(x+3)²', '(x-3)²']
            ),
            randomizeAnswerOptions(
              'If 3x - 7 = 8, what is the value of x?', 
              'x = 5', 
              ['x = 3', 'x = 15/3', 'x = 4.5']
            ),
            randomizeAnswerOptions(
              'Solve the system of equations: y = 2x + 1 and y = -x + 7', 
              'x = 2, y = 5', 
              ['x = 3, y = 7', 'x = 1, y = 3', 'x = -2, y = -3']
            )
          ];
        }
        if (topic === 'Geometry') {
          return [
            randomizeAnswerOptions(
              'What is the area of a circle with radius 5 cm?', 
              '25π cm²', 
              ['10π cm²', '5π cm²', '50π cm²']
            ),
            randomizeAnswerOptions(
              'The sum of interior angles in a triangle is:', 
              '180°', 
              ['360°', '90°', '270°']
            ),
            randomizeAnswerOptions(
              'What is the Pythagorean theorem?', 
              'a² + b² = c²', 
              ['a + b = c', 'a² - b² = c²', '2a + 2b + 2c = P']
            ),
            randomizeAnswerOptions(
              'The volume of a cube with side length 4 is:', 
              '64 cubic units', 
              ['16 cubic units', '24 cubic units', '32 cubic units']
            ),
            randomizeAnswerOptions(
              'In a right triangle, if one angle is 30°, another angle is:', 
              '60°', 
              ['45°', '90°', '180°']
            )
          ];
        }
        if (topic === 'Calculus') {
          return [
            randomizeAnswerOptions(
              'What is the derivative of x²?', 
              '2x', 
              ['x', 'x²', '0']
            ),
            randomizeAnswerOptions(
              'The integral of 2x is:', 
              'x² + C', 
              ['2x² + C', 'x + C', '2lnx + C']
            ),
            randomizeAnswerOptions(
              'When f(x) = 3x² + 2x - 5, f\'(x) = ', 
              '6x + 2', 
              ['3x² + 2', '6x² + 2x', '6x']
            )
          ];
        }
      }
      
      if (subject === 'science') {
        if (topic === 'Physics') {
          return [
            randomizeAnswerOptions(
              'What is Newton\'s Second Law of Motion?', 
              'F = ma', 
              ['E = mc²', 'F = G(m₁m₂)/r²', 'p = mv']
            ),
            randomizeAnswerOptions(
              'Light travels fastest in:', 
              'Vacuum', 
              ['Water', 'Glass', 'Air']
            ),
            randomizeAnswerOptions(
              'The SI unit of electric current is:', 
              'Ampere', 
              ['Volt', 'Ohm', 'Watt']
            ),
            randomizeAnswerOptions(
              'The formula for kinetic energy is:', 
              '½mv²', 
              ['mgh', 'F = ma', 'P = VI']
            )
          ];
        }
        if (topic === 'Chemistry') {
          return [
            randomizeAnswerOptions(
              'The atomic number of an element represents:', 
              'The number of protons', 
              ['The number of neutrons', 'The number of electrons', 'The sum of protons and neutrons']
            ),
            randomizeAnswerOptions(
              'Which of these is a noble gas?', 
              'Argon', 
              ['Oxygen', 'Chlorine', 'Sodium']
            ),
            randomizeAnswerOptions(
              'The pH of a neutral solution is:', 
              '7', 
              ['0', '14', '7.8']
            )
          ];
        }
      }
      
      // Default questions if specific topic not found - also randomized
      return Array(count).fill(null).map((_, index) => {
        const correctIndex = Math.floor(Math.random() * 4); // 0-3
        const options = ['Option A', 'Option B', 'Option C', 'Option D'];
        const correctAnswer = options[correctIndex];
        
        return {
          question: `${topic} question ${index + 1} (${difficulty} level)`,
          options: options,
          answer: correctAnswer,
          type: 'multiple_choice'
        };
      });
    };
    
    // Get subject-specific questions or generate default ones
    const subjectQuestions = getSubjectQuestions();
    
    // If we don't have enough subject-specific questions, generate more generic ones
    if (subjectQuestions.length < count) {
      const additionalQuestions = Array(count - subjectQuestions.length).fill(null).map((_, index) => {
        const options = ['Option A', 'Option B', 'Option C', 'Option D'];
        const correctIndex = Math.floor(Math.random() * 4); // Random index 0-3
        
        return {
          question: `${topic} question ${index + subjectQuestions.length + 1} (${difficulty} level)`,
          options: options,
          answer: options[correctIndex],
          type: 'multiple_choice'
        };
      });
      
      return [...subjectQuestions, ...additionalQuestions];
    }
    
    // If we have too many questions, return a random subset of the requested count
    if (subjectQuestions.length > count) {
      // Shuffle the questions to get a random subset
      for (let i = subjectQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [subjectQuestions[i], subjectQuestions[j]] = [subjectQuestions[j], subjectQuestions[i]];
      }
    }
    
    return subjectQuestions.slice(0, count);
  };

  // Update the convertToGameQuestions function to maintain the randomized options
  const convertToGameQuestions = (examQuestions: any[]): GameQuestion[] => {
    return examQuestions.map((q, index) => {
      let gameQuestion: GameQuestion = {
        id: index,
        question: q.question,
        options: q.options || [],
        correctAnswer: q.answer,
        points: q.points || 100,
        timeLimit: difficulty === 'easy' ? 30 : difficulty === 'medium' ? 20 : 15, // Adjust time based on difficulty
        type: 'multiple_choice',
        imageUrl: q.imageUrl,
        animation: getRandomAnimation(),
        soundEffect: getRandomSoundEffect()
      };

      if (q.type === 'true_false') {
        gameQuestion.options = ['True', 'False'];
        gameQuestion.correctAnswer = q.answer === 'True' ? 'True' : 'False';
        gameQuestion.type = 'true_false';
      }

      return gameQuestion;
    });
  };

  // Get random animation style
  const getRandomAnimation = () => {
    const animations = ['bounce', 'spin', 'flip', 'scale', 'shake'];
    return animations[Math.floor(Math.random() * animations.length)];
  };

  // Get random sound effect
  const getRandomSoundEffect = () => {
    const sounds = ['correct', 'wrong', 'tick', 'cheer', 'applause'];
    return sounds[Math.floor(Math.random() * sounds.length)];
  };

  // Handle material selection
  const handleSelectMaterial = async (material: any) => {
    try {
      setLoading(true);
      const content = typeof material.content === 'string' 
        ? JSON.parse(material.content) 
        : material.content;
      
      if (content.questions && Array.isArray(content.questions)) {
        const gameQuestions = convertToGameQuestions(content.questions);
        setQuestions(gameQuestions);
        setGameState(prev => ({
          ...prev,
          totalQuestions: gameQuestions.length
        }));
        setShowMaterialSelector(false);
        setNotification({
          show: true,
          message: t('gameQuestionsReady'),
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error loading material:', error);
      setNotification({
        show: true,
        message: t('errorLoadingMaterial'),
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload with preview
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setExamFile(file);
      setLoading(true);
      try {
        // Read file content
        const text = await file.text();
        const examData = JSON.parse(text);
        
        if (examData.questions) {
          const gameQuestions = convertToGameQuestions(examData.questions);
          setQuestions(gameQuestions);
          setGameState(prev => ({
            ...prev,
            totalQuestions: gameQuestions.length
          }));
          setShowSetup(true);
        }
      } catch (error) {
        setNotification({
          show: true,
          message: t('errorProcessingFile'),
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Get available game modes for the selected subject
  const getAvailableGameModes = () => {
    if (!selectedSubject || !(selectedSubject in subjectGameMapping)) {
      return gameTypes; // Return all if no subject selected
    }
    
    const availableModes = subjectGameMapping[selectedSubject];
    return gameTypes.filter(game => availableModes.includes(game.id));
  };

  // Function to export game
  const exportGame = () => {
    const gameData = {
      settings: gameSettings,
      questions: questions,
      stats: gameStats,
      metadata: {
        createdAt: new Date().toISOString(),
        version: '1.0',
        language: language
      }
    };

    // Create a downloadable link
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gameData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${gameSettings.gameTitle || 'exam-game'}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Fix for the timeLimit TypeError issue
  const safeGetTimeLimit = (questionIndex: number) => {
    if (!questions || 
        !Array.isArray(questions) || 
        questionIndex < 0 || 
        questionIndex >= questions.length || 
        !questions[questionIndex]) {
      return gameSettings.timePerQuestion || 20;
    }
    return questions[questionIndex].timeLimit || gameSettings.timePerQuestion || 20;
  };

  // Get next unique question
  const getNextUniqueQuestion = () => {
    if (!questions || questions.length === 0) return -1;
    
    // Filter out questions that have already been used
    const availableQuestions = questions.filter(
      q => !gameState.usedQuestionIds.includes(q.id)
    );
    
    if (availableQuestions.length === 0) {
      // If all questions have been used, show completion or reset used questions
      if (gameState.usedQuestionIds.length === questions.length) {
        return -1; // All questions used, signal completion
      }
      // Alternatively, reset used questions and start over
      setGameState(prev => ({...prev, usedQuestionIds: []}));
      return questions[0].id;
    }
    
    // Randomly select from available questions
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    return availableQuestions[randomIndex].id;
  };

  // Enhanced navigation functions - Fixed to prevent repeating questions
  const goToNextQuestion = () => {
    if (gameState.currentQuestion < questions.length - 1) {
      // Get the index of a question that hasn't been used
      const nextQuestionId = getNextUniqueQuestion();
      
      if (nextQuestionId === -1) {
        // If all questions have been used, show results
        finishExam();
        return;
      }
      
      // Find the index of this question in the questions array
      const nextIndex = questions.findIndex(q => q.id === nextQuestionId);
      
      // Add current question to used questions
      const currentQuestionId = questions[gameState.currentQuestion]?.id;
      const updatedUsedIds = currentQuestionId 
        ? [...gameState.usedQuestionIds, currentQuestionId]
        : gameState.usedQuestionIds;
        
      setGameState(prev => ({
        ...prev,
        currentQuestion: nextIndex,
        timeRemaining: safeGetTimeLimit(nextIndex),
        isPlaying: true,
        showAnswer: false,
        selectedAnswer: null,
        usedQuestionIds: updatedUsedIds,
        activeStudent: null // Reset active student
      }));
      setStudentAnswer(''); // Clear previous student answer
      setQuestionStartTime(new Date());
    } else {
      // If last question, show results
      finishExam();
    }
  };
  
  const goToPrevQuestion = () => {
    if (gameState.currentQuestion > 0) {
      setGameState(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion - 1,
        timeRemaining: gameSettings.timePerQuestion,
        isPlaying: true,
        showAnswer: false,
        selectedAnswer: null
      }));
      setQuestionStartTime(new Date());
    }
  };

  // Add the missing startGame function
  const startGame = (gameType = gameState.gameType) => {
    if (questions.length === 0) {
      setNotification({
        show: true,
        message: t('noQuestionsAvailable'),
        type: 'error'
      });
      return;
    }

    // Start animation
    setGameStartAnimation(true);
    setTimeout(() => {
      setGameStartAnimation(false);
      
      // Reset game stats
      setGameStats({
        totalScore: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        averageTime: 0,
        longestStreak: 0,
        totalTimeTaken: 0,
        completed: false,
        questionAttempts: [],
        startTime: new Date(), // Track when the game started
        endTime: undefined
      });
      
      setGameState({
        currentQuestion: 0,
        score: 0,
        timeRemaining: safeGetTimeLimit(0), // Use safe function to get timeLimit
        isPlaying: true,
        showAnswer: false,
        selectedAnswer: null,
        streak: 0,
        totalQuestions: questions.length,
        gameType: gameType,
        usedQuestionIds: [], // Reset used questions
        activeStudent: null // Reset active student
      });
      
      // Track when the first question started
      setQuestionStartTime(new Date());
      
      setGamePhase('playing');
      
      // Show quick tutorial once game starts
      setTimeout(() => {
        setShowTutorial(true);
        setTimeout(() => {
          setShowTutorial(false);
        }, 3000);
      }, 500);
    }, 1500);
  };

  // Finish exam function
  const finishExam = () => {
    // Calculate final stats
    const endTime = new Date();
    const totalTime = gameStats.startTime ? 
      (endTime.getTime() - gameStats.startTime.getTime()) / 1000 : 0;
    
    // Calculate average time per question
    const avgTime = gameStats.questionAttempts.length > 0 ? 
      gameStats.questionAttempts.reduce((sum, q) => sum + q.timeTaken, 0) / gameStats.questionAttempts.length : 0;
    
    setGameStats(prev => ({
      ...prev,
      totalTimeTaken: Math.round(totalTime),
      averageTime: Math.round(avgTime),
      completed: true,
      endTime: endTime
    }));
    
    setGamePhase('results');
  };

  // Add the missing toggle play/pause function
  const toggleGamePlay = () => {
    setGameState(prev => ({
      ...prev,
      isPlaying: !prev.isPlaying
    }));
  };

  // Enhanced answer reveal with detailed tracking - fixed for timeLimit errors
  const handleAnswerReveal = (selectedAnswer: string | null) => {
    const currentQ = questions[gameState.currentQuestion];
    if (!currentQ) return; // Guard against undefined question
    
    const isCorrect = selectedAnswer === currentQ.correctAnswer;
    
    // Calculate time taken on this question
    const timeTaken = questionStartTime ? 
      Math.round((new Date().getTime() - questionStartTime.getTime()) / 1000) : 
      gameSettings.timePerQuestion - gameState.timeRemaining;
    
    // Calculate points based on time remaining and streak
    let pointsEarned = 0;
    if (isCorrect) {
      const timeBonus = Math.floor(gameState.timeRemaining / (currentQ.timeLimit || 20) * 50);
      const streakBonus = Math.floor(gameState.streak * 10);
      pointsEarned = (currentQ.points || 100) + timeBonus + streakBonus;
      
      // Instead of using confetti, we'll use state to trigger animations
      setCorrectAnimation(true);
      
      // Reset the animation after a delay
      setTimeout(() => {
        setCorrectAnimation(false);
      }, 2000);
    }

    // Track this question attempt
    const questionAttempt: QuestionAttempt = {
      questionId: currentQ.id,
      questionText: currentQ.question,
      correctAnswer: currentQ.correctAnswer,
      selectedAnswer: selectedAnswer,
      isCorrect: isCorrect,
      timeTaken: timeTaken,
      points: isCorrect ? pointsEarned : 0
    };
    
    // Update game stats with this attempt
    setGameStats(prev => ({
      ...prev,
      totalScore: isCorrect ? prev.totalScore + pointsEarned : prev.totalScore,
      correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
      wrongAnswers: !isCorrect ? prev.wrongAnswers + 1 : prev.wrongAnswers,
      longestStreak: Math.max(prev.longestStreak, isCorrect ? gameState.streak + 1 : gameState.streak),
      questionAttempts: [...prev.questionAttempts, questionAttempt]
    }));

    setGameState(prev => ({
      ...prev,
      score: isCorrect ? prev.score + pointsEarned : prev.score,
      streak: isCorrect ? prev.streak + 1 : 0,
      isPlaying: false,
      showAnswer: true,
      selectedAnswer: selectedAnswer
    }));

    // Prepare for next question
    setQuestionStartTime(new Date());

    // Automatically move to next question after delay
    setTimeout(() => {
      if (gameState.currentQuestion < questions.length - 1) {
        const nextIndex = gameState.currentQuestion + 1;
        setGameState(prev => ({
          ...prev,
          currentQuestion: nextIndex,
          timeRemaining: safeGetTimeLimit(nextIndex),
          isPlaying: true,
          showAnswer: false,
          selectedAnswer: null
        }));
      } else {
        // If this was the last question, show a complete button
        // We don't auto finish so user can review their last answer
      }
    }, 3000);
  };

  // Handle game completion
  const handleGameComplete = (score: number) => {
    setGameStats({
      totalScore: score,
      correctAnswers: Math.floor(questions.length * (score / (questions.length * gameSettings.pointsPerQuestion))),
      wrongAnswers: questions.length - Math.floor(questions.length * (score / (questions.length * gameSettings.pointsPerQuestion))),
      averageTime: 0, // This would be calculated from actual gameplay data
      longestStreak: gameState.streak,
      totalTimeTaken: 0, // This would be calculated from actual gameplay data
      completed: true,
      questionAttempts: [],
      startTime: new Date(),
      endTime: new Date()
    });
    setGamePhase('results');
  };

  // Add adapter function for QuizShow
  const handleQuizShowComplete = (winners: Player[]) => {
    // Extract the highest score from the winners array
    let highestScore = 0;
    if (winners.length > 0) {
      // Find the highest score among all players
      highestScore = Math.max(...winners.map(player => player.score));
    }
    // Set end time for analytics
    setGameStats(prev => ({
      ...prev,
      endTime: new Date()
    }));
    // Call the original handleGameComplete with the score
    handleGameComplete(highestScore);
  };

  // Function to generate a standalone game page
  const generateGamePage = () => {
    const gameHtml = `
      <!DOCTYPE html>
      <html lang="${language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${gameSettings.gameTitle || 'Exam Game'}</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
          /* Add custom game styles here */
          .game-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          /* Add more custom styles */
        </style>
      </head>
      <body class="bg-gradient-to-br from-purple-50 to-blue-50 min-h-screen">
        <div class="game-container">
          <h1 class="text-3xl font-bold text-center mb-8">${gameSettings.gameTitle}</h1>
          <div class="bg-white rounded-xl shadow-lg p-6">
            <!-- Game content will be injected here -->
            <div id="game-root"></div>
          </div>
        </div>
        <script>
          // Inject game data
          window.gameData = ${JSON.stringify({
            settings: gameSettings,
            questions: questions,
            translations: {
              // Add your translations here
            }
          })};
          // Add game logic here
        </script>
      </body>
      </html>
    `;

    const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(gameHtml);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataUrl);
    downloadAnchorNode.setAttribute("download", `${gameSettings.gameTitle || 'exam-game'}.html`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Add GameSetupModal component
  const GameSetupModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-black">{t('gameSetup')}</h2>
          <button
            onClick={() => setShowSetup(false)}
            className="text-black hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-medium text-black mb-3">{t('basicInfo')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  {t('gameTitle')}
                </label>
                <input
                  type="text"
                  value={gameSettings.gameTitle}
                  onChange={(e) => setGameSettings({...gameSettings, gameTitle: e.target.value})}
                  className="w-full p-2 border rounded text-black"
                  placeholder={t('enterGameTitle')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  {t('difficultyLevel')}
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                  className="w-full p-2 border rounded text-black"
                >
                  <option value="easy">{t('easy')}</option>
                  <option value="medium">{t('medium')}</option>
                  <option value="hard">{t('hard')}</option>
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-black mb-1">
                {t('gameDescription')}
              </label>
              <textarea
                value={gameSettings.gameDescription}
                onChange={(e) => setGameSettings({...gameSettings, gameDescription: e.target.value})}
                className="w-full p-2 border rounded text-black"
                rows={2}
                placeholder={t('enterGameDescription')}
              />
            </div>
          </div>

          {/* Game Timing */}
          <div>
            <h3 className="text-lg font-medium text-black mb-3">{t('gameTiming')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  {t('timePerQuestion')} (seconds)
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={gameSettings.timePerQuestion}
                  onChange={(e) => setGameSettings({...gameSettings, timePerQuestion: parseInt(e.target.value)})}
                  className="w-full p-2 border rounded text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  {t('pointsPerQuestion')}
                </label>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  step="10"
                  value={gameSettings.pointsPerQuestion}
                  onChange={(e) => setGameSettings({...gameSettings, pointsPerQuestion: parseInt(e.target.value)})}
                  className="w-full p-2 border rounded text-black"
                />
              </div>
            </div>
          </div>

          {/* Game Features */}
          <div>
            <h3 className="text-lg font-medium text-black mb-3">{t('gameFeatures')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center text-black">
                  <input
                    type="checkbox"
                    checked={gameSettings.showTimer}
                    onChange={(e) => setGameSettings({...gameSettings, showTimer: e.target.checked})}
                    className="mr-2"
                  />
                  {t('showTimer')}
                </label>
              </div>
              <div>
                <label className="flex items-center text-black">
                  <input
                    type="checkbox"
                    checked={gameSettings.showHints}
                    onChange={(e) => setGameSettings({...gameSettings, showHints: e.target.checked})}
                    className="mr-2"
                  />
                  {t('showHints')}
                </label>
              </div>
              <div>
                <label className="flex items-center text-black">
                  <input
                    type="checkbox"
                    checked={gameSettings.allowSkip}
                    onChange={(e) => setGameSettings({...gameSettings, allowSkip: e.target.checked})}
                    className="mr-2"
                  />
                  {t('allowSkip')}
                </label>
              </div>
              <div>
                <label className="flex items-center text-black">
                  <input
                    type="checkbox"
                    checked={gameSettings.soundEffects}
                    onChange={(e) => setGameSettings({...gameSettings, soundEffects: e.target.checked})}
                    className="mr-2"
                  />
                  {t('soundEffects')}
                </label>
              </div>
            </div>
          </div>

          {/* Bonus Points */}
          <div>
            <h3 className="text-lg font-medium text-black mb-3">{t('bonusPoints')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  {t('streakBonus')}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={gameSettings.bonusPoints.streak}
                  onChange={(e) => setGameSettings({
                    ...gameSettings,
                    bonusPoints: {
                      ...gameSettings.bonusPoints,
                      streak: parseInt(e.target.value)
                    }
                  })}
                  className="w-full p-2 border rounded text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  {t('speedBonus')}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={gameSettings.bonusPoints.speed}
                  onChange={(e) => setGameSettings({
                    ...gameSettings,
                    bonusPoints: {
                      ...gameSettings.bonusPoints,
                      speed: parseInt(e.target.value)
                    }
                  })}
                  className="w-full p-2 border rounded text-black"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={() => setShowSetup(false)}
              className="px-4 py-2 border border-gray-300 rounded text-black hover:bg-gray-100"
            >
              {t('cancel')}
            </button>
            <button
              onClick={() => {
                setShowSetup(false);
                setNotification({
                  show: true,
                  message: t('gameSettingsSaved'),
                  type: 'success'
                });
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {t('saveSettings')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Add export options to the game interface
  const ExportOptions = () => (
    <div className="mt-4 flex gap-4">
      <button
        onClick={exportGame}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        {t('exportGame')}
      </button>
      <button
        onClick={generateGamePage}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        {t('generateStandalone')}
      </button>
    </div>
  );

  // Handle student raising hand
  const handleStudentRaiseHand = (studentName: string) => {
    if (gameState.activeStudent === null && gameState.isPlaying) {
      // Pause the timer
      setGameState(prev => ({
        ...prev,
        isPlaying: false,
        activeStudent: studentName
      }));
      
      // Play a sound to indicate hand raised
      if (gameSettings.soundEffects) {
        // Code to play sound effect
        console.log("Hand raised sound effect");
      }
      
      setNotification({
        show: true,
        message: `${studentName} ${t('raisedHand')}!`,
        type: 'info'
      });
    }
  };

  // Handle student answer evaluation
  const evaluateStudentAnswer = (isCorrect: boolean) => {
    if (!gameState.activeStudent) return;
    
    const currentQ = questions[gameState.currentQuestion];
    if (!currentQ) return;
    
    // Calculate time taken and points
    const timeTaken = questionStartTime ? 
      Math.round((new Date().getTime() - questionStartTime.getTime()) / 1000) : 
      gameSettings.timePerQuestion - gameState.timeRemaining;
    
    // Calculate points based on time remaining and streak
    let pointsEarned = 0;
    if (isCorrect) {
      const timeBonus = Math.floor(gameState.timeRemaining / (currentQ.timeLimit || 20) * 50);
      const streakBonus = Math.floor(gameState.streak * 10);
      pointsEarned = (currentQ.points || 100) + timeBonus + streakBonus;
      
      // Show correct animation
      setCorrectAnimation(true);
      setTimeout(() => {
        setCorrectAnimation(false);
      }, 2000);
    }

    // Track this question attempt
    const questionAttempt: QuestionAttempt = {
      questionId: currentQ.id,
      questionText: currentQ.question,
      correctAnswer: currentQ.correctAnswer,
      selectedAnswer: studentAnswer,
      isCorrect: isCorrect,
      timeTaken: timeTaken,
      points: isCorrect ? pointsEarned : 0
    };
    
    // Update game stats
    setGameStats(prev => ({
      ...prev,
      totalScore: isCorrect ? prev.totalScore + pointsEarned : prev.totalScore,
      correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
      wrongAnswers: !isCorrect ? prev.wrongAnswers + 1 : prev.wrongAnswers,
      longestStreak: Math.max(prev.longestStreak, isCorrect ? gameState.streak + 1 : gameState.streak),
      questionAttempts: [...prev.questionAttempts, questionAttempt]
    }));

    // Update game state
    setGameState(prev => ({
      ...prev,
      score: isCorrect ? prev.score + pointsEarned : prev.score,
      streak: isCorrect ? prev.streak + 1 : 0,
      showAnswer: true,
      selectedAnswer: studentAnswer
    }));

    // Show appropriate notification
    setNotification({
      show: true,
      message: isCorrect 
        ? `${gameState.activeStudent} ${t('answeredCorrectly')}!` 
        : `${gameState.activeStudent} ${t('answeredWrong')}. ${t('correctAnswer')}: ${currentQ.correctAnswer}`,
      type: isCorrect ? 'success' : 'error'
    });

    // After delay, move to next question
    setTimeout(() => {
      goToNextQuestion();
    }, 3000);
  };

  // QuizShow specific controls component
  const QuizShowControls = () => {
    if (gameState.gameType !== 'quizshow') return null;
    
    return (
      <div className="mt-6 border-t pt-4 border-gray-200">
        <h3 className="text-lg font-bold text-black mb-3">{t('students')}</h3>
        
        {/* Add student input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newStudent}
            onChange={(e) => setNewStudent(e.target.value)}
            placeholder={t('enterStudentName')}
            className="flex-grow p-2 border rounded"
          />
          <button
            onClick={() => {
              if (newStudent.trim()) {
                setStudents(prev => [...prev, newStudent.trim()]);
                setNewStudent('');
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {t('addStudent')}
          </button>
        </div>
        
        {/* Student list with raise hand buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {students.map((student, index) => (
            <button
              key={index}
              onClick={() => handleStudentRaiseHand(student)}
              disabled={gameState.activeStudent !== null || !gameState.isPlaying}
              className={`p-3 rounded-lg border-2 text-left ${
                gameState.activeStudent === student
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
              } transition-colors`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{student}</span>
                <span className="text-sm">{t('raiseHand')}</span>
              </div>
            </button>
          ))}
        </div>
        
        {/* Student answer input when hand is raised */}
        {gameState.activeStudent && (
          <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-200">
            <div className="font-medium mb-2">
              {gameState.activeStudent} {t('isAnswering')}:
            </div>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={studentAnswer}
                onChange={(e) => setStudentAnswer(e.target.value)}
                placeholder={t('typeStudentAnswer')}
                className="flex-grow p-2 border rounded"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => evaluateStudentAnswer(true)}
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                {t('correct')}
              </button>
              <button
                onClick={() => evaluateStudentAnswer(false)}
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                {t('incorrect')}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Modified GamePlayingUI to include QuizShow controls
  const GamePlayingUI = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Progress and Stats - Fixed spacing */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-black font-semibold text-base">
          {t('question')} {gameState.currentQuestion + 1}/{questions.length}
        </div>
        <div className="text-black font-semibold text-base">
          {t('score')}: {gameState.score}
        </div>
        {gameSettings.showTimer && (
          <div className="text-black font-semibold text-base">
            {t('time')}: {gameState.timeRemaining}s
          </div>
        )}
      </div>

      {/* Question - Improved typography and spacing */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-black mb-5 leading-relaxed">
          {questions[gameState.currentQuestion]?.question}
        </h3>
        
        {/* Options - Better spacing and interaction */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {questions[gameState.currentQuestion]?.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerReveal(option)}
              disabled={gameState.showAnswer || gameState.gameType === 'quizshow'}
              className={`p-5 rounded-xl text-left transition-all transform hover:scale-102 active:scale-98 ${
                gameState.showAnswer
                  ? option === questions[gameState.currentQuestion].correctAnswer
                    ? 'bg-green-100 border-2 border-green-500 text-green-800'
                    : option === gameState.selectedAnswer
                    ? 'bg-red-100 border-2 border-red-500 text-red-800'
                    : 'bg-gray-100 border-2 border-gray-300'
                  : 'bg-white border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50'
              }`}
            >
              <div className="flex items-center">
                <span className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center mr-4 text-black font-bold">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="text-black font-medium text-lg">{option}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quiz Show Controls for teacher to manage student answers */}
      {gameState.gameType === 'quizshow' && <QuizShowControls />}

      {/* Game Controls - Enhanced with play/pause and navigation */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          {gameSettings.allowSkip && (
            <button
              onClick={() => handleAnswerReveal('')}
              className="px-5 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              {t('skipQuestion')}
            </button>
          )}
          {gameSettings.showHints && (
            <button
              onClick={() => {
                // Simple hint logic - show first letter of correct answer
                setNotification({
                  show: true,
                  message: `Hint: The answer starts with ${questions[gameState.currentQuestion].correctAnswer.charAt(0)}`,
                  type: 'info'
                });
              }}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {t('showHint')}
            </button>
          )}
        </div>
        
        {/* New Play Controls */}
        <div className="flex justify-center items-center gap-4 mt-2 bg-gray-50 p-3 rounded-lg">
          <button
            onClick={goToPrevQuestion}
            disabled={gameState.currentQuestion === 0}
            className="p-2 rounded-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          
          <button
            onClick={toggleGamePlay}
            disabled={gameState.activeStudent !== null}
            className="p-3 rounded-full bg-green-600 text-white hover:bg-green-700 flex items-center justify-center disabled:bg-gray-400"
          >
            {gameState.isPlaying ? (
              <PauseIcon className="w-6 h-6" />
            ) : (
              <PlayIcon className="w-6 h-6" />
            )}
          </button>
          
          <button
            onClick={goToNextQuestion}
            className="p-2 rounded-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            <ForwardIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* Finish Button - Only show on last question */}
        {gameState.currentQuestion === questions.length - 1 && (
          <button
            onClick={finishExam}
            className="mt-4 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium self-center"
          >
            {t('finishExam')}
          </button>
        )}
      </div>
    </div>
  );

  // Enhanced analytics page with visualizations and detailed breakdown
  const GameResultsUI = () => {
    // Calculate percentage score
    const percentageScore = gameState.totalQuestions > 0 
      ? Math.round((gameStats.correctAnswers / gameState.totalQuestions) * 100) 
      : 0;
    
    // Format time for display
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };
    
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-black mb-4 text-center">
          {gameStats.totalScore >= gameSettings.passingScore
            ? t('congratulations')
            : t('goodTry')}
        </h2>
        
        {/* Score Summary Card */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-5 mb-8 text-center shadow-sm">
          <div className="text-3xl font-bold text-blue-800 mb-3">
            {percentageScore}%
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-gray-600 text-sm">{t('score')}</p>
              <p className="text-black font-bold">{gameStats.totalScore}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">{t('correctAnswers')}</p>
              <p className="text-black font-bold">{gameStats.correctAnswers}/{gameState.totalQuestions}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">{t('bestStreak')}</p>
              <p className="text-black font-bold">{gameStats.longestStreak}</p>
            </div>
          </div>
        </div>
        
        {/* Time Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-gray-600 text-sm mb-1">{t('totalTime')}</p>
            <p className="text-black font-bold">{formatTime(gameStats.totalTimeTaken)}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-gray-600 text-sm mb-1">{t('averageTime')}</p>
            <p className="text-black font-bold">{formatTime(gameStats.averageTime)}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-gray-600 text-sm mb-1">{t('fastestAnswer')}</p>
            <p className="text-black font-bold">
              {formatTime(Math.min(...gameStats.questionAttempts.map(q => q.timeTaken)))}
            </p>
          </div>
        </div>
        
        {/* Question-by-question breakdown */}
        <h3 className="text-lg font-bold text-black mb-3">{t('questionBreakdown')}</h3>
        <div className="bg-gray-50 rounded-lg p-4 mb-6 max-h-80 overflow-y-auto">
          {gameStats.questionAttempts.map((attempt, index) => (
            <div 
              key={index}
              className={`mb-3 p-3 rounded-lg ${
                attempt.isCorrect ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium text-black">{t('question')} {index + 1}</div>
                <div className={`text-sm ${attempt.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {attempt.isCorrect ? t('correct') : t('incorrect')} • {formatTime(attempt.timeTaken)}
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-1">{attempt.questionText}</p>
              <div className="text-xs mt-1">
                <span className="text-gray-600">{t('yourAnswer')}: </span>
                <span className={attempt.isCorrect ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  {attempt.selectedAnswer || t('skipped')}
                </span>
                {!attempt.isCorrect && (
                  <span className="ml-2">
                    <span className="text-gray-600">{t('correctAnswer')}: </span>
                    <span className="text-green-600 font-medium">{attempt.correctAnswer}</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <button
            onClick={() => {
              setGamePhase('setup');
              setGameState({
                currentQuestion: 0,
                score: 0,
                timeRemaining: gameSettings.timePerQuestion,
                isPlaying: false,
                showAnswer: false,
                selectedAnswer: null,
                streak: 0,
                totalQuestions: questions.length,
                gameType: 'kahoot',
                usedQuestionIds: [], // Add missing property
                activeStudent: null // Add missing property
              });
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('playAgain')}
          </button>
          <button
            onClick={exportGame}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            {t('exportResults')}
          </button>
          <button
            onClick={() => {
              // Print or show a printable version
              window.print();
            }}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            {t('printResults')}
          </button>
        </div>
      </div>
    );
  };

  // Game mode selection UI - Updated with subject-specific filtering
  const GameModeSelector = () => {
    const availableGames = getAvailableGameModes();
    
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-bold text-black">{t('selectGameMode')}</h3>
          
          {selectedSubject && (
            <div className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
              {t('recommendedFor')} {t(selectedSubject)}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {availableGames.map(type => (
            <motion.button
              key={type.id}
              onClick={() => setGameState(prev => ({ ...prev, gameType: type.id as any }))}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-lg border-2 ${
                gameState.gameType === type.id 
                  ? `border-${type.color}-500 bg-${type.color}-50` 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              } transition-colors flex flex-col items-center text-center gap-1.5`}
            >
              <span className="text-2xl">{type.icon}</span>
              <span className="text-sm font-medium text-black">{type.name}</span>
              <span className="text-xs text-gray-500 hidden sm:block">{type.description}</span>
            </motion.button>
          ))}
        </div>
      </div>
    );
  };

  // Update the renderGameComponent function to use the adapter
  const renderGameComponent = () => {
    switch (gameState.gameType) {
      case 'memory':
        return <MemoryGame 
          questions={questions.map(q => ({ question: q.question, answer: q.correctAnswer }))} 
          onGameComplete={handleGameComplete} 
        />;
      case 'wordsearch':
        return <WordSearch 
          words={questions.map(q => q.correctAnswer)} 
          definitions={questions.map(q => q.question)}
          onGameComplete={handleGameComplete} 
        />;
      case 'wordscramble':
        return <WordScramble 
          words={questions.map(q => ({ 
            word: q.correctAnswer, 
            hint: q.question 
          }))} 
          onGameComplete={handleGameComplete} 
        />;
      case 'quizshow':
        // Fix the difficulty type issue by ensuring it's one of the allowed values
        const safetyDifficulty = difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard' 
          ? difficulty as 'easy' | 'medium' | 'hard'
          : 'medium'; // Default to medium if not one of the allowed values
          
        return <QuizShow 
          questions={questions.map(q => ({ 
            id: q.id,
            question: q.question, 
            answer: q.correctAnswer,
            category: selectedTopic || '',
            difficulty: safetyDifficulty,
            points: q.points,
            timeLimit: q.timeLimit
          }))} 
          onGameComplete={handleQuizShowComplete} // Use the adapter function here
        />;
      case 'crossword':
        return <Crossword 
          clues={questions.map(q => ({ 
            question: q.question, 
            answer: q.correctAnswer 
          }))} 
          onGameComplete={handleGameComplete} 
        />;
      case 'timeline':
        return <Timeline 
          events={questions.map((q, index) => ({ 
            id: q.id,
            title: q.correctAnswer,
            description: q.question,
            date: `Item ${index + 1}`,
            correctOrder: index + 1
          }))} 
          onGameComplete={handleGameComplete} 
        />;
      case 'kahoot':
      default:
        return <GamePlayingUI />;
    }
  };

  // Confetti Animation Component
  const ConfettiAnimation = () => (
    <div className="fixed inset-0 w-full h-full z-50 pointer-events-none">
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            scale: [0.5, 1.2, 1, 0.8],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ duration: 3, times: [0, 0.2, 0.8, 1] }}
          className="relative"
        >
          {/* This creates the confetti effect */}
          {Array.from({ length: 50 }).map((_, i) => {
            const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const randomLeft = `${Math.random() * 100}%`;
            const randomSize = `${Math.random() * 0.5 + 0.2}rem`;
            const randomDuration = `${Math.random() * 3 + 1}s`;
            
            return (
              <motion.div
                key={i}
                className={`absolute ${randomColor} rounded-sm`}
                style={{
                  left: randomLeft,
                  width: randomSize,
                  height: randomSize,
                }}
                initial={{ y: 0, opacity: 0 }}
                animate={{
                  y: [0, -100, 100],
                  x: [0, Math.random() * 100 - 50, Math.random() * 100 - 50],
                  rotate: [0, Math.random() * 360, Math.random() * 720],
                  opacity: [0, 1, 0]
                }}
                transition={{ duration: parseInt(randomDuration), ease: "easeOut" }}
              />
            );
          })}
          <div className="text-3xl font-bold text-center mb-4 text-black">
            {t('questionsReady')}! 🎉
          </div>
        </motion.div>
      </div>
    </div>
  );

  // Tutorial Component
  const GameTutorial = () => (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white bg-opacity-90 rounded-xl shadow-lg p-4 max-w-md"
      >
        <h3 className="text-lg font-bold text-black mb-2">
          {t('howToPlay')} {gameTypes.find(g => g.id === gameState.gameType)?.name}
        </h3>
        <p className="text-black text-sm mb-2">
          {gameState.gameType === 'kahoot' && t('kahootInstructions')}
          {gameState.gameType === 'memory' && t('memoryInstructions')}
          {gameState.gameType === 'wordsearch' && t('wordsearchInstructions')}
          {gameState.gameType === 'wordscramble' && t('wordscrambleInstructions')}
          {gameState.gameType === 'quizshow' && t('quizshowInstructions')}
          {gameState.gameType === 'crossword' && t('crosswordInstructions')}
          {gameState.gameType === 'timeline' && t('timelineInstructions')}
        </p>
        <div className="text-center text-gray-500 text-xs">
          {t('tutorialDismiss')}
        </div>
      </motion.div>
    </div>
  );

  // Subject Icon Animation
  const SubjectAnimation = () => {
    const animations: Record<AnimationType, {
      animate: any;
      transition: {
        duration: number;
        times?: number[];
        staggerChildren?: number;
      };
    }> = {
      'bounce': {
        animate: { 
          y: [0, -30, 0],
          scale: [1, 1.2, 1]
        },
        transition: { 
          duration: 1,
          times: [0, 0.5, 1]
        }
      },
      'pulse': {
        animate: { 
          scale: [1, 1.3, 1], 
          opacity: [1, 0.7, 1] 
        },
        transition: { 
          duration: 1,
          times: [0, 0.5, 1]
        }
      },
      'shake': {
        animate: { 
          rotate: [0, 10, -10, 10, -10, 0] 
        },
        transition: { 
          duration: 1,
          times: [0, 0.2, 0.4, 0.6, 0.8, 1]
        }
      },
      'spin': {
        animate: { 
          rotate: [0, 360] 
        },
        transition: { 
          duration: 1
        }
      },
      'fade': {
        animate: { 
          opacity: [0, 1] 
        },
        transition: { 
          duration: 1
        }
      },
      'slide': {
        animate: { 
          x: [-50, 0],
          opacity: [0, 1]
        },
        transition: { 
          duration: 1
        }
      },
      'type': {
        animate: { 
          opacity: [0, 1],
          scale: [0.95, 1]
        },
        transition: { 
          duration: 1,
          staggerChildren: 0.1
        }
      }
    };

    // No need for type guard since we're properly typed now
    const currentAnimation = animationType 
      ? animations[animationType] 
      : animations['bounce'];

    return (
      <div className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none">
        <motion.div
          key={animationType}
          initial={{ opacity: 0 }}
          animate={{ ...currentAnimation.animate, opacity: [0, 1, 0] }}
          transition={currentAnimation.transition}
          className="text-7xl"
        >
          {currentTheme.icon}
        </motion.div>
      </div>
    );
  };

  // Start Game Animation
  const StartGameAnimation = () => (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40 pointer-events-none">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ 
          scale: [0.5, 1.2, 1],
          opacity: [0, 1, 0]
        }}
        transition={{ 
          duration: 1.5,
          times: [0, 0.7, 1]
        }}
        className="bg-white rounded-3xl px-12 py-8 text-center"
      >
        <div className="text-5xl mb-4">
          {gameTypes.find(g => g.id === gameState.gameType)?.icon}
        </div>
        <div className="text-3xl font-bold text-black mb-2">
          {gameTypes.find(g => g.id === gameState.gameType)?.name}
        </div>
        <div className="text-lg text-gray-700">
          {t('starting')}...
        </div>
      </motion.div>
    </div>
  );

  // Add the missing handleAIGeneration function
  const handleAIGeneration = async () => {
    if (!selectedSubject || !selectedTopic) {
      setNotification({
        show: true,
        message: t('pleaseSelectSubjectAndTopic'),
        type: 'error'
      });
      return;
    }

    setLoading(true);
    // Show animation while generating
    setAnimationType('pulse');
    setShowAnimation(true);
    
    try {
      // Build a base prompt with selected options - add language context and exam context
      const contextInfo = examContext ? `\nExam Context: ${examContext}` : '';
      const basePrompt = `Generate ${questionCount} ${difficulty} difficulty questions about ${selectedTopic} in ${selectedSubject}. The questions should be in ${language === 'ar' ? 'Arabic' : language === 'he' ? 'Hebrew' : 'English'} language.${contextInfo}`;
      
      // Use user-provided prompt if available, otherwise use the base prompt
      const finalPrompt = aiPrompt.trim() ? aiPrompt : basePrompt;
      
      console.log("AI Prompt:", finalPrompt); // Debug info
      
      // First try using Groq API if available
      try {
        const generatedQuestions = await generateExamFromText(finalPrompt, {
          language: language, // Ensure system language is passed
          subject: selectedSubject,
          grade: "high school",
          questionTypes: ["multiple_choice"],
          difficulty: [difficulty]
          // Context is already included in the finalPrompt, so no need to pass it separately
        });
        
        if (generatedQuestions && generatedQuestions.length > 0) {
          // If Groq successfully generated questions
          console.log("Groq generated questions:", generatedQuestions.length);
          
          // Convert to game format and enforce system language
          const gameQuestions = generatedQuestions.map((q, index) => ({
            id: index,
            question: q.question,
            options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: q.answer,
            points: q.points || 100,
            timeLimit: difficulty === 'easy' ? 30 : difficulty === 'medium' ? 20 : 15,
            type: 'multiple_choice' as const,
            animation: getRandomAnimation(),
            soundEffect: getRandomSoundEffect()
          }));
          
          setQuestions(gameQuestions);
          setGameState(prev => ({
            ...prev,
            totalQuestions: gameQuestions.length
          }));
          
          // Suggest appropriate game mode for this subject
          if (selectedSubject && subjectGameMapping[selectedSubject]?.length > 0) {
            const recommendedGame = subjectGameMapping[selectedSubject][0];
            setGameState(prev => ({
              ...prev,
              gameType: recommendedGame as any
            }));
          }
          
          // Fix spacing in title and description
          setGameSettings(prev => ({
            ...prev,
            gameTitle: `${t(selectedSubject)} - ${selectedTopic} ${t('quiz')}`.trim(), 
            gameDescription: `${t('a')} ${t(difficulty)} ${t('levelQuiz')} ${t('about')} ${selectedTopic}`.trim(),
            timePerQuestion: difficulty === 'easy' ? 30 : difficulty === 'medium' ? 20 : 15,
            pointsPerQuestion: difficulty === 'easy' ? 100 : difficulty === 'medium' ? 150 : 200
          }));
          
          // Show success animation
          setConfetti(true);
          setTimeout(() => {
            setConfetti(false);
          }, 3000);
          
          setNotification({
            show: true,
            message: `${gameQuestions.length} ${t('questionsGenerated')}!`,
            type: 'success'
          });
          return;
        }
      } catch (groqError) {
        console.error("Groq API error:", groqError);
        // Continue to fallback if Groq fails
      }
      
      // Fallback to local generation if Groq failed
      console.log("Falling back to local generation");
      const sampleQuestions = generateSampleQuestions(selectedSubject, selectedTopic, difficulty, questionCount);
      const gameQuestions = convertToGameQuestions(sampleQuestions);
      
      setQuestions(gameQuestions);
      setGameState(prev => ({
        ...prev,
        totalQuestions: gameQuestions.length
      }));
      
      // Suggest appropriate game mode for this subject
      if (selectedSubject && subjectGameMapping[selectedSubject]?.length > 0) {
        const recommendedGame = subjectGameMapping[selectedSubject][0];
        setGameState(prev => ({
          ...prev,
          gameType: recommendedGame as any
        }));
      }
      
      setGameSettings(prev => ({
        ...prev,
        gameTitle: `${t(selectedSubject)} - ${selectedTopic} ${t('quiz')}`,
        gameDescription: `${t('a')} ${t(difficulty)} ${t('levelQuiz')} ${t('about')} ${selectedTopic}`,
        timePerQuestion: difficulty === 'easy' ? 30 : difficulty === 'medium' ? 20 : 15,
        pointsPerQuestion: difficulty === 'easy' ? 100 : difficulty === 'medium' ? 150 : 200
      }));

      // Show success animation
      setConfetti(true);
      setTimeout(() => {
        setConfetti(false);
      }, 3000);

      setNotification({
        show: true,
        message: `${gameQuestions.length} ${t('questionsGenerated')}!`,
        type: 'success'
      });
    } catch (error) {
      console.error("Generation error:", error);
      setNotification({
        show: true,
        message: t('errorGeneratingQuestions'),
        type: 'error'
      });
    } finally {
      setLoading(false);
      setShowAnimation(false);
    }
  };

  // Add state for student management
  const [students, setStudents] = useState<string[]>([]);
  const [newStudent, setNewStudent] = useState<string>('');
  const [studentAnswer, setStudentAnswer] = useState<string>('');

  // Add language direction detection
  const isRTL = language === 'ar' || language === 'he';

  // Improved language-aware function for displaying text based on the current system language
  const getLocalizedText = (key: string, enText: string, arText: string, heText: string) => {
    if (language === 'ar') return arText;
    if (language === 'he') return heText;
    return enText;
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentTheme.mainColor} overflow-auto max-h-screen ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-5xl mx-auto p-5">
        {/* Animations */}
        <AnimatePresence>
          {showAnimation && <SubjectAnimation />}
          {gameStartAnimation && <StartGameAnimation />}
          {confetti && <ConfettiAnimation />}
          {showTutorial && <GameTutorial />}
        </AnimatePresence>

        {/* Notification */}
        <AnimatePresence>
          {notification.show && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-4 p-3 rounded-lg ${
                notification.type === 'success' ? 'bg-green-100 border border-green-300' :
                notification.type === 'error' ? 'bg-red-100 border border-red-300' :
                'bg-blue-100 border border-blue-300'
              }`}
            >
              <p className="text-black">{notification.message}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Animation for correct answers */}
        <AnimatePresence>
          {correctAnimation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
            >
              <motion.div 
                className="bg-green-500 text-white text-3xl font-bold rounded-full px-8 py-4"
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ duration: 1, repeat: 1 }}
              >
                <CheckIcon className="w-8 h-8 inline-block mr-2" />
                {t('correct')}!
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header - More compact but with proper spacing */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <button
              onClick={() => router.back()}
              className="flex items-center text-black hover:text-blue-600 transition-colors"
            >
              <ChevronLeftIcon className={`w-5 h-5 ${isRTL ? 'ml-1' : 'mr-1'}`} />
              <span className="whitespace-nowrap">{t('backToTools')}</span>
            </button>
            <h1 className="text-2xl font-bold text-black">{t('examGame')}</h1>
            <p className="text-lg text-black whitespace-normal">{t('examGameDesc')}</p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setCompactView(!compactView)}
              className="px-3 py-1.5 bg-gray-100 text-black rounded hover:bg-gray-200 transition-colors text-sm whitespace-nowrap"
            >
              {compactView ? 
                getLocalizedText('expandedView', 'Expanded View', 'عرض موسع', 'תצוגה מורחבת') : 
                getLocalizedText('compactView', 'Compact View', 'عرض مضغوط', 'תצוגה מצומצמת')
              }
            </button>
            
            {gamePhase === 'setup' && (
              <button
                onClick={() => setShowSetup(true)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
              >
                <AdjustmentsHorizontalIcon className="w-4 h-4" />
                <span>{getLocalizedText('gameSetup', 'Game Setup', 'إعداد اللعبة', 'הגדרת משחק')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Game Phases - with scrollable container and improved padding */}
        {gamePhase === 'setup' && (
          <div className="max-h-[calc(100vh-180px)] overflow-y-auto pr-2 space-y-6 pb-12">
            {/* Quick Action Buttons - New Compact Row with better spacing */}
            <div className="bg-white rounded-lg shadow-md p-4 flex flex-wrap gap-3">
              <button
                onClick={() => setShowMaterialSelector(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm flex items-center gap-2 flex-shrink-0 whitespace-nowrap"
              >
                <DocumentTextIcon className="w-4 h-4" />
                <span>{getLocalizedText('selectMaterial', 'Select Material', 'اختيار المادة', 'בחר חומר')}</span>
              </button>
              
              <label className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors text-sm flex items-center gap-2 cursor-pointer flex-shrink-0 whitespace-nowrap">
                <CloudArrowUpIcon className="w-4 h-4" />
                <span>{getLocalizedText('uploadExam', 'Upload Exam', 'رفع امتحان', 'העלה מבחן')}</span>
                <input
                  type="file"
                  accept=".json,.pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              
              <button
                onClick={handleAIGeneration}
                disabled={!selectedSubject || !selectedTopic}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed flex-shrink-0 whitespace-nowrap"
              >
                <SparklesIcon className="w-4 h-4" />
                <span>{getLocalizedText('generateQuestions', 'Generate Questions', 'إنشاء الأسئلة', 'צור שאלות')}</span>
              </button>
            </div>

            {/* AI Generation Settings - Better organized with proper spacing */}
            <div className={`bg-white rounded-lg shadow-md p-5`}>
              <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-purple-600" />
                <span className="whitespace-normal">
                  {getLocalizedText('generateWithAI', 'Generate with AI', 'إنشاء بالذكاء الاصطناعي', 'צור באמצעות בינה מלאכותית')}
                </span>
              </h3>
              
              <div className="space-y-5">
                {/* Subject Selection - Horizontal grid with better spacing */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2 whitespace-normal">
                    {getLocalizedText('selectSubject', 'Select Subject', 'اختر المادة', 'בחר נושא')}
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {subjects.map(subject => (
                      <motion.button
                        key={subject.id}
                        onClick={() => {
                          setSelectedSubject(subject.id);
                          setSelectedTopic('');
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`p-2 rounded-lg flex flex-row items-center transition-colors ${
                          selectedSubject === subject.id
                            ? 'bg-purple-200 border-purple-300 text-purple-900'
                            : 'bg-white border-gray-200 hover:bg-purple-100 text-gray-700'
                        } border text-center`}
                      >
                        <span className="text-xl mr-2">{subject.icon}</span>
                        <span className="text-black text-sm font-medium whitespace-nowrap">
                          {subject.id === 'math' && isRTL ? 
                            (language === 'ar' ? "الرياضيات" : "מתמטיקה") : 
                           subject.id === 'science' && isRTL ? 
                            (language === 'ar' ? "العلوم" : "מדעים") :
                           subject.id === 'language' && isRTL ? 
                            (language === 'ar' ? "اللغة" : "שפה") :
                           subject.id === 'history' && isRTL ? 
                            (language === 'ar' ? "التاريخ" : "היסטוריה") :
                           subject.id === 'computer' && isRTL ? 
                            (language === 'ar' ? "علوم الحاسوب" : "מדעי המחשב") :
                           t(subject.id)}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Settings Grid - 3 columns with better spacing */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Topic Selection */}
                  <div>
                    <label className="block text-sm font-medium text-black mb-2 whitespace-normal">
                      {getLocalizedText('selectTopic', 'Select Topic', 'اختر الموضوع', 'בחר נושא משנה')}
                    </label>
                    <select
                      value={selectedTopic}
                      onChange={(e) => setSelectedTopic(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-black text-sm"
                      disabled={!selectedSubject}
                    >
                      <option value="">
                        {getLocalizedText('chooseTopic', 'Choose Topic', 'اختر الموضوع', 'בחר נושא')}
                      </option>
                      {subjects.find(s => s.id === selectedSubject)?.topics.map(topic => (
                        <option key={topic} value={topic}>{topic}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Difficulty */}
                  <div>
                    <label className="block text-sm font-medium text-black mb-2 whitespace-normal">
                      {getLocalizedText('selectDifficulty', 'Select Difficulty', 'اختر الصعوبة', 'בחר רמת קושי')}
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                      className="w-full p-2 border border-gray-300 rounded text-black text-sm"
                    >
                      <option value="easy">{getLocalizedText('easy', 'Easy', 'سهل', 'קל')}</option>
                      <option value="medium">{getLocalizedText('medium', 'Medium', 'متوسط', 'בינוני')}</option>
                      <option value="hard">{getLocalizedText('hard', 'Hard', 'صعب', 'קשה')}</option>
                    </select>
                  </div>
                  
                  {/* Question Count */}
                  <div>
                    <label className="block text-sm font-medium text-black mb-2 whitespace-normal">
                      {getLocalizedText('numberOfQuestions', 'Number of Questions', 'عدد الأسئلة', 'מספר שאלות')}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="5"
                        max="20"
                        step="5"
                        value={questionCount}
                        onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                        className="flex-grow h-2"
                      />
                      <span className="text-black text-sm font-medium w-8 text-center">{questionCount}</span>
                    </div>
                  </div>
                </div>

                {/* Custom AI Prompt - Better spacing */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2 whitespace-normal">
                    {getLocalizedText('customPrompt', 'Custom AI Prompt', 'طلب مخصص للذكاء الاصطناعي', 'הנחיה מותאמת אישית לבינה מלאכותית')}
                  </label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder={language === 'ar' 
                      ? `مثال: قم بإنشاء ${questionCount} سؤالاً بصعوبة ${difficulty === 'easy' ? 'سهل' : difficulty === 'medium' ? 'متوسط' : 'صعب'} حول ${selectedTopic || 'الموضوع المختار'} في ${selectedSubject ? (
                        selectedSubject === 'math' ? 'الرياضيات' :
                        selectedSubject === 'science' ? 'العلوم' :
                        selectedSubject === 'language' ? 'اللغة' :
                        selectedSubject === 'history' ? 'التاريخ' :
                        selectedSubject === 'computer' ? 'علوم الحاسوب' : 'المادة المختارة'
                      ) : 'المادة المختارة'}`
                      : language === 'he'
                      ? `לדוגמה: צור ${questionCount} שאלות ברמת קושי ${difficulty === 'easy' ? 'קלה' : difficulty === 'medium' ? 'בינונית' : 'קשה'} בנושא ${selectedTopic || 'הנושא שנבחר'} ב${selectedSubject ? (
                        selectedSubject === 'math' ? 'מתמטיקה' :
                        selectedSubject === 'science' ? 'מדעים' :
                        selectedSubject === 'language' ? 'שפה' :
                        selectedSubject === 'history' ? 'היסטוריה' :
                        selectedSubject === 'computer' ? 'מדעי המחשב' : 'נושא שנבחר'
                      ) : 'נושא שנבחר'}`
                      : `E.g., Generate ${questionCount} ${difficulty} questions about ${selectedTopic || 'your topic'} in ${selectedSubject ? t(selectedSubject) : 'your subject'}`
                    }
                    className="w-full p-3 border border-gray-300 rounded text-black text-sm h-24"
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                </div>

                {/* Exam Context - Added as requested */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2 whitespace-normal">
                    {getLocalizedText('examContext', 'Exam Context (optional)', 'سياق الامتحان (اختياري)', 'הקשר המבחן (אופציונלי)')}
                  </label>
                  <textarea
                    value={examContext}
                    onChange={(e) => setExamContext(e.target.value)}
                    placeholder={language === 'ar' 
                      ? 'أضف سياقًا أو معلومات إضافية للامتحان، مثل: امتحان الفصل الدراسي الثاني للصف العاشر'
                      : language === 'he'
                      ? 'הוסף הקשר או מידע נוסף למבחן, לדוגמה: מבחן סמסטר שני לכיתה י׳'
                      : 'Add context or additional information for the exam, e.g., 10th Grade Biology Midterm, Chapter 4-5'
                    }
                    className="w-full p-3 border border-gray-300 rounded text-black text-sm h-24"
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                </div>
              </div>
            </div>

            {/* Start Game Button with Game Selection - Better organized with spacing */}
            {questions.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-5">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-black whitespace-normal">
                    {getLocalizedText('readyToBegin', 'Ready to Begin', 'جاهز للبدء', 'מוכן להתחיל')}
                  </h2>
                  <span className="text-sm text-black bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap">
                    {questions.length} {getLocalizedText('questions', 'questions', 'سؤال', 'שאלות')} • {gameSettings.timePerQuestion}s
                  </span>
                </div>
                
                {/* Add Game Mode Selector - With proper spacing */}
                <GameModeSelector />
                
                <div className="text-center mt-5">
                  <motion.button
                    onClick={() => startGame()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium inline-flex items-center gap-2"
                  >
                    <PlayIcon className="w-5 h-5" />
                    <span className="whitespace-nowrap">
                      {getLocalizedText('startPlaying', 'Start Playing', 'ابدأ اللعب', 'התחל לשחק')}
                    </span>
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Render appropriate game component based on selected game type */}
        {gamePhase === 'playing' && (
          <div className="pb-8">
            {renderGameComponent()}
          </div>
        )}
        
        {gamePhase === 'results' && (
          <div className="pb-12">
            <GameResultsUI />
          </div>
        )}

        {/* Loading Overlay with animation */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <motion.div 
              className="bg-white p-6 rounded-lg shadow-lg"
              animate={{ 
                scale: [1, 1.02, 1],
              }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-black font-bold text-lg whitespace-normal">{t('processing')}</p>
                <p className="text-gray-600 text-sm text-center max-w-xs whitespace-normal">
                  {t('generating Questions')} {selectedTopic} {t('in Subject')} {t(selectedSubject)}
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Game Setup Modal */}
        {showSetup && <GameSetupModal />}

        {/* AI Generation banner title - Fix spacing */}
        {isRTL && gamePhase === 'setup' && (
          <div className="fixed top-24 right-6 z-10 pointer-events-none">
            <h2 className="text-xl font-bold text-purple-800 opacity-70 tracking-wider letter-spacing-widest whitespace-normal">
              إنشاء الذكاء الاصطناعي
            </h2>
          </div>
        )}
      </div>
    </div>
  );
} 