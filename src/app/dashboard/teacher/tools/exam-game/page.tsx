'use client';

import { useState, useEffect, useContext, useMemo } from 'react';
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
import { toast } from 'react-hot-toast';

// Import new game components
import QuizBattle from './quiz-battle';
import FlashcardMemory from './flashcard-memory';
import FillBlanks from './fill-blanks';
import MatchingGame from './matching-game';
import SimulationGame from './simulation-game';
import ChemicalMixingGame from './chemical-mixing-game';
import CircuitConnectionGame from './circuit-connection-game';
import BallDropGame from './ball-drop-game';
import TimelineGame from './timeline-game';
import SequenceGame from './sequence-game';

// Add import for Groq integration
import { generateExamFromText } from '@/services/groq';

// Import SparkMascot and MascotImage components
import SparkMascot from '@/components/SparkMascot';
import MascotImage from '@/components/MascotImage';

// Type definitions
type SubjectType = 'math' | 'science' | 'language' | 'history' | 'computer';
type AnimationType = 'bounce' | 'pulse' | 'shake' | 'spin' | 'fade' | 'slide' | 'type';

// Add new game type definitions
type GameType = 
  | 'quiz-battle'
  | 'flashcard-memory'
  | 'fill-blanks'
  | 'matching'
  | 'simulation'
  | 'chemical-mixing'
  | 'circuit-connection'
  | 'ball-drop'
  | 'timeline'
  | 'sequence';

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
  explanation?: string;
  context?: string;
}

// Update GameState interface
interface GameState {
  isPlaying: boolean;
  score: number;
  streak: number;
  timeStarted: Date;
  timeEnded: Date;
  gameType: GameType;
  timeRemaining: number;
  usedQuestionIds: string[];
  currentQuestionIndex: number;
  activeStudent: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: SubjectType;
  topic: string;
}

// Update initial game state
const initialGameState: GameState = {
  gameType: 'quiz-battle',
  isPlaying: false,
  score: 0,
  streak: 0,
  timeStarted: new Date(),
  timeEnded: new Date(),
  timeRemaining: 60,
  usedQuestionIds: [],
  currentQuestionIndex: 0,
  activeStudent: null,
  difficulty: 'medium',
  subject: 'math',
  topic: 'Algebra'
};

// Update GameStats interface
interface GameStats {
  score: number;
  timeStarted: Date;
  timeEnded: Date;
  questionAttempts: QuestionAttempt[];
  totalScore: number;
  correctAnswers: number;
  wrongAnswers: number;
  averageTime: number;
  longestStreak: number;
  totalTimeTaken: number;
  completed: boolean;
  startTime: Date;
  endTime: Date;
}

// Update initialGameStats
const initialGameStats: GameStats = {
  score: 0,
  timeStarted: new Date(),
  timeEnded: new Date(),
  questionAttempts: [],
  totalScore: 0,
  correctAnswers: 0,
  wrongAnswers: 0,
  averageTime: 0,
  longestStreak: 0,
  totalTimeTaken: 0,
  completed: false,
  startTime: new Date(),
  endTime: new Date()
};

// Update QuestionAttempt interface
interface QuestionAttempt {
  questionId: string;
  questionText: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeTaken: number;
}

// Update GameUIState interface
interface GameUIState {
  timeRemaining: number;
  usedQuestionIds: number[];
  showAnswer: boolean;
  selectedAnswer: string | null;
}

// Update initial states
const initialGameUIState: GameUIState = {
  timeRemaining: 60,
  usedQuestionIds: [],
  showAnswer: false,
  selectedAnswer: null,
};

// Define subject options with icons
const subjects = [
  { id: 'math' as SubjectType, name: 'Mathematics', icon: '📐', topics: ['Algebra', 'Geometry', 'Calculus', 'Statistics'] },
  { id: 'science' as SubjectType, name: 'Science', icon: '🔬', topics: ['Physics', 'Chemistry', 'Biology', 'Earth Science'] },
  { id: 'language' as SubjectType, name: 'Language', icon: '📚', topics: ['Grammar', 'Literature', 'Writing', 'Vocabulary'] },
  { id: 'history' as SubjectType, name: 'History', icon: '🏛️', topics: ['World History', 'Ancient History', 'Modern History', 'Geography'] },
  { id: 'computer' as SubjectType, name: 'Computer Science', icon: '💻', topics: ['Programming', 'Web Development', 'Databases', 'Networking'] }
];

// Update subject-specific game types
const subjectGameMapping: Record<SubjectType, GameType[]> = {
  'math': ['quiz-battle', 'fill-blanks', 'simulation'],
  'science': ['quiz-battle', 'chemical-mixing', 'circuit-connection', 'ball-drop'],
  'language': ['flashcard-memory', 'fill-blanks', 'matching'],
  'history': ['timeline', 'sequence', 'quiz-battle'],
  'computer': ['quiz-battle', 'fill-blanks', 'simulation']
};

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

// Add component props interfaces
interface QuizBattleProps {
  questions: GameQuestion[];
  onGameComplete: (score: number) => void;
  difficulty: 'easy' | 'medium' | 'hard';
  theme?: {
    mainColor: string;
    accentColor: string;
    icon: string;
  };
}

// Add function for game page generation
const generateGamePage = () => {
  // Implementation for generating standalone game page
  console.log('Generating game page...');
};

// Add GameComponents mapping
const GameComponents: Record<GameType, React.ComponentType<any>> = {
  'quiz-battle': QuizBattle,
  'flashcard-memory': FlashcardMemory,
  'fill-blanks': FillBlanks,
  'matching': MatchingGame,
  'simulation': SimulationGame,
  'chemical-mixing': ChemicalMixingGame,
  'circuit-connection': CircuitConnectionGame,
  'ball-drop': BallDropGame,
  'timeline': TimelineGame,
  'sequence': SequenceGame
};

// Add type definitions for game components
interface GameTypeDefinition {
  id: GameType;
  name: string;
  icon: string;
  color: string;
  component: React.ComponentType<any>;
  description: string;
}

// Update GameHeader component to receive setShowTutorial as a prop
interface GameHeaderProps {
  setShowTutorial: (show: boolean) => void;
}

const GameHeader: React.FC<GameHeaderProps> = ({ setShowTutorial }) => {
  const { t } = useLanguage();
  
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-gray-800">{t('game.selectGameMode')}</h1>
      <div className="flex items-center gap-4">
        <button
          onClick={() => setShowTutorial(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {t('game.howToPlay')}
        </button>
      </div>
    </div>
  );
};

// Add LeaderboardModal component
interface LeaderboardModalProps {
  leaderboard: LeaderboardEntry[];
  onClose: () => void;
}

const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ leaderboard, onClose }) => {
  const { t } = useLanguage();
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">{t('leaderboard')}</h2>
        <div className="space-y-2">
          {leaderboard.map((entry: LeaderboardEntry, index: number) => (
            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span>{index + 1}. {entry.name}</span>
              <span>{entry.score} pts</span>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          {t('close')}
        </button>
      </div>
    </div>
  );
};

// Add type for leaderboard entry
interface LeaderboardEntry {
  name: string;
  score: number;
  time: number;
  date: Date;
}

// Add this style at the top of the component
const textStyles = {
  color: '#000000',
  fontWeight: 500
};

export default function ExamGamePage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [showTutorial, setShowTutorial] = useState(false);

  // Move state declarations inside the component
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [gameUIState, setGameUIState] = useState<GameUIState>(initialGameUIState);
  const [students, setStudents] = useState<string[]>([]);
  const [newStudent, setNewStudent] = useState('');
  const [studentAnswer, setStudentAnswer] = useState('');
  const [gameStats, setGameStats] = useState<GameStats>(initialGameStats);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
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
  const [gameSettings, setGameSettings] = useState({
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
    schoolName: '',
    multiplayer: false,
    leaderboard: true,
    adaptiveDifficulty: true
  });
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [examFile, setExamFile] = useState<File | null>(null);
  const [aiContext, setAiContext] = useState('');
  const [gamePhase, setGamePhase] = useState<'setup' | 'playing' | 'results'>('setup');
  const [selectedSubject, setSelectedSubject] = useState<SubjectType | ''>('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [examContext, setExamContext] = useState('');
  const [compactView, setCompactView] = useState(true);
  const [currentTheme, setCurrentTheme] = useState(subjectThemes['math']);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState<AnimationType | ''>('');
  const [gameStartAnimation, setGameStartAnimation] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [isRTL, setIsRTL] = useState(false);
  const [multiplayerState, setMultiplayerState] = useState<{
    isActive: boolean;
    players: Array<{
      id: string;
      name: string;
      score: number;
      avatar?: string;
    }>;
  }>({
    isActive: false,
    players: []
  });

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
    // Filter out questions that have already been used
    const availableQuestions = questions.filter(
      q => !gameState.usedQuestionIds.includes(q.id.toString())
    );
    
    if (availableQuestions.length === 0) {
      // If all questions have been used, show completion or reset used questions
      if (gameState.usedQuestionIds.length === questions.length) {
        return -1; // All questions used, signal completion
      }
      // Reset used questions and start over
      setGameState(prev => ({
        ...prev,
        usedQuestionIds: []
      }));
      return getNextUniqueQuestion();
    }
    
    // Get a random question from available ones
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    return availableQuestions[randomIndex].id.toString();
  };

  // Update handleComplete function
  const handleComplete = (stats: GameStats) => {
    const updatedStats: GameStats = {
      ...stats,
      startTime: stats.timeStarted,
      endTime: stats.timeEnded
    };
    setGameStats(updatedStats);
      setGameState(prev => ({
        ...prev,
      isPlaying: false,
      timeEnded: new Date()
    }));
  };

  // Update handleAnswerReveal function
  const handleAnswerReveal = (answer: string | null) => {
    setGameUIState(prev => ({
        ...prev,
      showAnswer: true,
      selectedAnswer: answer,
    }));
  };

  const finishExam = () => {
    const stats: GameStats = {
      score: gameState.score,
      timeStarted: gameState.timeStarted,
      timeEnded: new Date(),
      questionAttempts: [],
      totalScore: gameState.score,
        correctAnswers: 0,
        wrongAnswers: 0,
        averageTime: 0,
      longestStreak: gameState.streak,
        totalTimeTaken: 0,
      completed: true,
      startTime: gameState.timeStarted,
      endTime: new Date()
    };
    handleComplete(stats);
  };

  // Update navigation functions
  const goToPrevQuestion = () => {
    if (gameState.currentQuestionIndex > 0) {
    setGameState(prev => ({
      ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1,
      }));
      setGameUIState(prev => ({
        ...prev,
        showAnswer: false,
        selectedAnswer: null,
      }));
    }
  };

  const goToNextQuestion = () => {
    if (gameState.currentQuestionIndex < questions.length - 1) {
    setGameState(prev => ({
      ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      }));
      setGameUIState(prev => ({
          ...prev,
          showAnswer: false,
        selectedAnswer: null,
        }));
      }
  };

  // Update renderGameComponent function
  const renderGameComponent = () => {
    if (!gameState.gameType || !GameComponents[gameState.gameType]) {
      console.error('Invalid game type:', gameState.gameType);
      return (
        <div className="text-center py-8">
          <p className="text-red-600">{t('errors.invalidGameType')}</p>
          <button
            onClick={() => setGamePhase('setup')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {t('actions.backToSelection')}
          </button>
          </div>
      );
    }

    // Ensure we have questions before rendering the game component
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-red-600">{t('errors.noQuestionsAvailable')}</p>
          <button
            onClick={() => setGamePhase('setup')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {t('actions.backToSelection')}
          </button>
        </div>
      );
    }

    const GameComponent = GameComponents[gameState.gameType];
    
    try {
      return (
        <GameComponent
          questions={questions}
          onGameComplete={handleGameComplete}
          difficulty={gameState.difficulty}
          theme={currentTheme}
          multiplayer={multiplayerState.isActive}
          players={multiplayerState.players}
          onLeaderboardUpdate={updateLeaderboard}
        />
      );
    } catch (error) {
      console.error('Error rendering game component:', error);
      return (
        <div className="text-center py-8">
          <p className="text-red-600">{t('errors.gameLoadError')}</p>
            <button
            onClick={() => setGamePhase('setup')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {t('actions.tryAgain')}
            </button>
    </div>
  );
    }
  };

  // Update getGameIcon function
  const getGameIcon = (gameType: GameState['gameType']) => {
    switch (gameType) {
      case 'quiz-battle':
        return '🎯';
      case 'flashcard-memory':
        return '🎴';
      case 'fill-blanks':
        return '📝';
      case 'matching':
        return '🔄';
      case 'simulation':
        return '🎮';
      default:
        return '❓';
    }
  };

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
    
    const currentQ = questions[gameState.currentQuestionIndex];
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
      questionId: currentQ.id.toString(),
      questionText: currentQ.question,
      selectedAnswer: gameUIState.selectedAnswer || '',
      correctAnswer: currentQ.correctAnswer,
      isCorrect: isCorrect,
      timeTaken: timeTaken,
    };
    
    // Update game stats
    setGameStats((prev: GameStats) => ({
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
      selectedAnswer: gameUIState.selectedAnswer || ''
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

  // QuizBattle specific controls component
  const QuizBattleControls = () => {
    if (gameState.gameType !== 'quiz-battle') return null;
    
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

  // Modified GamePlayingUI to include QuizBattle controls
  const GamePlayingUI = () => {
    const safeQuestions = questions || []; // Ensure questions is never undefined
    const currentQuestionIndex = Math.min(gameState.currentQuestionIndex, safeQuestions.length - 1);
    
    return (
      <div>
        {/* Game progress */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg font-bold">
            {t('question')} {currentQuestionIndex + 1} / {safeQuestions.length}
        </div>
          <div className="text-lg">
          {t('score')}: {gameState.score}
        </div>
          <div className="text-lg">
            {t('time')}: {gameUIState.timeRemaining}s
          </div>
      </div>

        {/* Game content */}
        {renderGameComponent()}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-4">
            <button
            onClick={goToPrevQuestion}
            disabled={currentQuestionIndex === 0 || gameState.gameType === 'quiz-battle'}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
          >
            {t('previous')}
            </button>
            <button
            onClick={goToNextQuestion}
            disabled={currentQuestionIndex === safeQuestions.length - 1}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
            {t('next')}
            </button>
        </div>
        
        {/* Quiz Battle controls */}
        {gameState.gameType === 'quiz-battle' && <QuizBattleControls />}
    </div>
  );
  };

  // Add animation components
  const SubjectAnimation = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
    >
      <div className="text-6xl">🎓</div>
    </motion.div>
  );

  const StartGameAnimation = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
    >
      <div className="text-6xl">🎮</div>
    </motion.div>
  );

  const ConfettiAnimation = () => (
        <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 pointer-events-none"
    >
      <div className="text-6xl">🎉</div>
        </motion.div>
  );

  // Add GameTutorial component
  const GameTutorial = () => (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-lg p-6 max-w-md">
        <h2 className="text-xl font-bold mb-4">{t('howToPlay')}</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">1</div>
            <p className="text-black">{t('game.tutorialStep1', { defaultValue: 'Select a game mode from the available options that best suits your learning style.' })}</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">2</div>
            <p className="text-black">{t('game.tutorialStep2', { defaultValue: 'Choose your subject, topic, and difficulty level. You can also set the number of questions.' })}</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">3</div>
            <p className="text-black">{t('game.tutorialStep3', { defaultValue: 'Use the AI generation feature by providing context about your topic to create custom questions.' })}</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">4</div>
            <p className="text-black">{t('game.tutorialStep4', { defaultValue: 'Answer questions within the time limit and use power-ups to help you succeed.' })}</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">5</div>
            <p className="text-black">{t('game.tutorialStep5', { defaultValue: 'Track your progress and compete for high scores on the leaderboard.' })}</p>
          </div>
        </div>
          <button
          onClick={() => setShowTutorial(false)}
          className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full"
          >
          {t('game.gotIt')}
          </button>
      </div>
    </motion.div>
  );

  // Add getLocalizedText function
  const getLocalizedText = (key: string, en: string, ar: string, he: string) => {
    switch (language) {
      case 'ar':
        return ar;
      case 'he':
        return he;
      default:
        return en;
    }
  };

  // Define game types with icons, descriptions and animations
  const gameTypes: GameTypeDefinition[] = useMemo(() => [
    {
      id: 'quiz-battle',
      name: t('gameTypes.quizBattle'),
      icon: 'target',
      color: '#FF5722',
      component: QuizBattle,
      description: t('gameTypes.quizBattleDesc'),
    },
    {
      id: 'flashcard-memory',
      name: t('gameTypes.flashcardMemory'),
      icon: 'brain',
      color: '#9C27B0',
      component: FlashcardMemory,
      description: t('gameTypes.flashcardMemoryDesc'),
    },
    {
      id: 'fill-blanks',
      name: t('gameTypes.fillBlanks'),
      icon: 'pencil',
      color: '#2196F3',
      component: FillBlanks,
      description: t('gameTypes.fillBlanksDesc'),
    },
    {
      id: 'matching',
      name: t('gameTypes.matching'),
      icon: 'puzzle',
      color: '#4CAF50',
      component: MatchingGame,
      description: t('gameTypes.matchingDesc'),
    },
    {
      id: 'simulation',
      name: t('gameTypes.simulation'),
      icon: 'beaker',
      color: '#FF9800',
      component: SimulationGame,
      description: t('gameTypes.simulationDesc'),
    },
    {
      id: 'chemical-mixing',
      name: t('gameTypes.chemicalMixing'),
      icon: 'flask',
      color: '#673AB7',
      component: ChemicalMixingGame,
      description: t('gameTypes.chemicalMixingDesc'),
    },
    {
      id: 'circuit-connection',
      name: t('gameTypes.circuitConnection'),
      icon: 'bolt',
      color: '#795548',
      component: CircuitConnectionGame,
      description: t('gameTypes.circuitConnectionDesc'),
    },
    {
      id: 'ball-drop',
      name: t('gameTypes.ballDrop'),
      icon: 'ball',
      color: '#607D8B',
      component: BallDropGame,
      description: t('gameTypes.ballDropDesc'),
    },
    {
      id: 'timeline',
      name: t('gameTypes.timeline'),
      icon: 'timeline',
      color: '#4CAF50',
      component: TimelineGame,
      description: t('gameTypes.timelineDesc'),
    },
    {
      id: 'sequence',
      name: t('gameTypes.sequence'),
      icon: 'list',
      color: '#009688',
      component: SequenceGame,
      description: t('gameTypes.sequenceDesc'),
    }
  ], [t]);

  // Update GameModeSelector to use proper types and styling
  const GameModeSelector = () => {
    const { t } = useLanguage();
    
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SparkMascot width={60} height={60} variant="blue" blinking />
            <h2 className="text-2xl font-bold text-black">{t('game.selectGameMode')}</h2>
          </div>
            </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gameTypes.map((type: GameTypeDefinition) => (
            <motion.div
              key={type.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative group"
            >
              <button
                onClick={() => {
                  setGameState(prev => ({
                    ...prev,
                    gameType: type.id as GameType
                  }));
                  setShowSetup(true);
                }}
                className="w-full h-full bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 text-left border-2 border-transparent hover:border-blue-500"
              >
                <div className="absolute top-4 right-4 text-2xl">
                  {type.icon}
        </div>
        
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-black">{type.name}</h3>
                  <p className="text-black">{type.description}</p>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`px-2 py-1 rounded-full text-white bg-${type.color}-500`}>
                      {t(`gameTypes.${type.id}Tag1`)}
                    </span>
                    <span className={`px-2 py-1 rounded-full bg-${type.color}-100 text-${type.color}-700`}>
                      {t(`gameTypes.${type.id}Tag2`)}
                    </span>
          </div>
          </div>
              </button>
            </motion.div>
          ))}
          </div>
        </div>
    );
  };

  // Update GameResultsUI component
  const GameResultsUI = ({ stats }: { stats: GameStats }) => {
    const { t } = useLanguage();
    
    return (
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-black">{t('game.gameResults')}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-black">{t('game.score')}</p>
            <p className="text-2xl font-bold text-black">{stats.score}</p>
                </div>
          <div>
            <p className="text-black">{t('game.timeTaken')}</p>
            <p className="text-2xl font-bold text-black">{stats.totalTimeTaken}s</p>
              </div>
          <div>
            <p className="text-black">{t('game.correctAnswers')}</p>
            <p className="text-2xl font-bold text-black">{stats.correctAnswers}</p>
              </div>
          <div>
            <p className="text-black">{t('game.wrongAnswers')}</p>
            <p className="text-2xl font-bold text-black">{stats.wrongAnswers}</p>
            </div>
        </div>
        
        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={() => {
              setGamePhase('setup');
              setShowSetup(false);
              setQuestions([]);
              setGameState(initialGameState);
            }}
            className="px-6 py-3 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors"
          >
            {t('game.playAgain')}
          </button>
          <button
            onClick={() => router.push('/dashboard' as any)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('game.backToDashboard')}
          </button>
        </div>
      </div>
    );
  };

  // Add new function for handling multiplayer
  const handleMultiplayerToggle = () => {
    setMultiplayerState(prev => ({
      ...prev,
      isActive: !prev.isActive
    }));
  };

  // Add new function for updating leaderboard
  const updateLeaderboard = (player: { name: string; score: number; time: number }) => {
    setLeaderboard(prev => {
      const newLeaderboard = [...prev, { ...player, date: new Date() }]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      return newLeaderboard;
    });
  };

  // Add new function for adaptive difficulty
  const adjustDifficulty = (performance: number) => {
    if (!gameSettings.adaptiveDifficulty) return;
    
    if (performance > 0.8) {
      setDifficulty('hard');
    } else if (performance > 0.6) {
      setDifficulty('medium');
    } else {
      setDifficulty('easy');
    }
  };

  // Update startGame function with proper type
  const startGame = (gameType: GameType = 'quiz-battle') => {
    setGameState({
      isPlaying: true,
      score: 0,
      streak: 0,
      timeStarted: new Date(),
      timeEnded: new Date(),
      gameType,
      timeRemaining: 60,
      usedQuestionIds: [],
      currentQuestionIndex: 0,
      activeStudent: null,
      difficulty: 'medium',
      subject: 'math',
      topic: 'Algebra'
    });
    setGameStats(initialGameStats);
  };

  // Add GameSetupModal component
  const GameSetupModal = () => {
            return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">{t('gameSetup')}</h2>
          {/* Add your game setup form here */}
      </div>
    </div>
  );
  };

  // Update handleGameComplete function
  const handleGameComplete = (score: number) => {
    const stats: GameStats = {
      score,
      timeStarted: gameState.timeStarted,
      timeEnded: new Date(),
      questionAttempts: [],
      totalScore: score,
      correctAnswers: 0,
      wrongAnswers: 0,
      averageTime: 0,
      longestStreak: gameState.streak,
      totalTimeTaken: 0,
      completed: true,
      startTime: gameState.timeStarted,
      endTime: new Date()
    };
    handleComplete(stats);
  };

  // Update handleAIGeneration function
  const handleAIGeneration = async () => {
    if (!selectedSubject || !selectedTopic || !difficulty) {
      toast.error(t('game.pleaseCompleteAllFields'));
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: selectedSubject,
          difficulty: difficulty,
          count: questionCount,
          topic: selectedTopic,
          context: examContext
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }
      
      const data = await response.json();
      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error('Invalid questions data received');
      }
      
      // Initialize game questions with proper structure
      const gameQuestions = data.questions.map((q: any, index: number) => ({
            id: index,
        question: q.question || '',
        options: Array.isArray(q.options) ? q.options : [],
        correctAnswer: q.answer || '',
            points: q.points || 100,
            timeLimit: difficulty === 'easy' ? 30 : difficulty === 'medium' ? 20 : 15,
        type: q.type || 'multiple_choice',
        imageUrl: q.imageUrl || '',
        explanation: q.explanation || ''
          }));
          
          setQuestions(gameQuestions);
      setGamePhase('playing');
      toast.success(t('game.questionsGenerated'));
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error(t('game.errorGeneratingQuestions'));
      setQuestions([]); // Reset questions to empty array on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 overflow-auto pb-12">
      <div className="max-w-7xl mx-auto p-6">
        <GameHeader setShowTutorial={setShowTutorial} />
        
        {/* Game Phase Management */}
        {gamePhase === 'setup' && (
          <div className="space-y-8">
            <GameModeSelector />
            
            {showSetup && (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-8"
              >
                <div className="flex items-center gap-4 mb-6">
                  <SparkMascot width={50} height={50} variant="blue" blinking />
                  <h2 className="text-2xl font-bold text-black">{t('gameSetup.title')}</h2>
          </div>
          
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-black font-medium">{t('gameSetup.subject')}</span>
                      <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value as SubjectType)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-black"
                      >
                        <option value="">{t('gameSetup.selectSubject')}</option>
                    {subjects.map(subject => (
                          <option key={subject.id} value={subject.id} className="bg-white text-black">
                            {subject.icon} {subject.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-black font-medium">{t('gameSetup.topic')}</span>
                    <select
                      value={selectedTopic}
                      onChange={(e) => setSelectedTopic(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-black"
                      >
                        <option value="">{t('gameSetup.selectTopic')}</option>
                        {selectedSubject && subjects.find(s => s.id === selectedSubject)?.topics.map(topic => (
                          <option key={topic} value={topic} className="bg-white text-black">{topic}</option>
                      ))}
                    </select>
                    </label>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-black font-medium">{t('gameSetup.difficulty')}</span>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-black"
                      >
                        <option value="easy" className="bg-white text-black">{t('gameSetup.difficultyLevels.easy')}</option>
                        <option value="medium" className="bg-white text-black">{t('gameSetup.difficultyLevels.medium')}</option>
                        <option value="hard" className="bg-white text-black">{t('gameSetup.difficultyLevels.hard')}</option>
                    </select>
                    </label>

                    <label className="block">
                      <span className="text-black font-medium">{t('gameSetup.questionCount')}</span>
                      <input
                        type="number"
                        value={questionCount}
                        onChange={(e) => setQuestionCount(Number(e.target.value))}
                        min="1"
                        max="20"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-black"
                      />
                    </label>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block">
                    <span className="text-black font-medium">{t('gameSetup.aiGeneration')}</span>
                  <textarea
                    value={examContext}
                    onChange={(e) => setExamContext(e.target.value)}
                      placeholder={t('gameSetup.enterContext')}
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-black"
                    />
                  </label>
            </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleAIGeneration}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        {t('gameSetup.generating')}
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-5 h-5" />
                        {t('gameSetup.generateQuestions')}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Game Playing Section */}
        {gamePhase === 'playing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <SparkMascot width={50} height={50} variant="blue" blinking />
                <h2 className="text-2xl font-bold text-black">{t('playing')}</h2>
          </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-semibold text-black">
                  {t('score')}: {gameState.score}
                </span>
                <span className="text-lg font-semibold text-black">
                  {t('time')}: {gameUIState.timeRemaining}s
                </span>
              </div>
            </div>

            {renderGameComponent()}
          </motion.div>
        )}

        {/* Results Section */}
        {gamePhase === 'results' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <SparkMascot width={50} height={50} variant="blue" blinking />
              <h2 className="text-2xl font-bold text-black">{t('results')}</h2>
          </div>

            <GameResultsUI stats={gameStats} />
          </motion.div>
        )}

        {/* Tutorial Modal */}
        <AnimatePresence>
          {showTutorial && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <div className="bg-white rounded-lg p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold mb-6 text-black">{t('game.howToPlay')}</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">1</div>
                    <p className="text-black">{t('game.tutorialStep1', { defaultValue: 'Select a game mode from the available options that best suits your learning style.' })}</p>
              </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">2</div>
                    <p className="text-black">{t('game.tutorialStep2', { defaultValue: 'Choose your subject, topic, and difficulty level. You can also set the number of questions.' })}</p>
          </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">3</div>
                    <p className="text-black">{t('game.tutorialStep3', { defaultValue: 'Use the AI generation feature by providing context about your topic to create custom questions.' })}</p>
          </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">4</div>
                    <p className="text-black">{t('game.tutorialStep4', { defaultValue: 'Answer questions within the time limit and use power-ups to help you succeed.' })}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">5</div>
                    <p className="text-black">{t('game.tutorialStep5', { defaultValue: 'Track your progress and compete for high scores on the leaderboard.' })}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTutorial(false)}
                  className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full"
                >
                  {t('game.gotIt')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 