'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AcademicCapIcon,
  BeakerIcon,
  BookOpenIcon,
  LanguageIcon,
  UserGroupIcon,
  AdjustmentsHorizontalIcon,
  SparklesIcon,
  GlobeAltIcon,
  MusicalNoteIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';

interface AIGenerationOptions {
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionTypes: string[];
  language: string;
  numberOfQuestions: number;
  includeImages: boolean;
  includeExplanations: boolean;
  targetAge: number;
  gameType: 'kahoot' | 'memory' | 'wordsearch' | 'puzzle' | 'crossword' | 'timeline' | 'matching' | 'sorting' | 'scramble' | 'quiz_show' | 'flashcards' | 'hangman';
  customPrompt: string;
  learningObjectives: string[];
  contentStyle: 'formal' | 'casual' | 'fun' | 'technical';
  culturalContext: string;
  timeframe: string;
  multimedia: {
    useImages: boolean;
    useAudio: boolean;
    useVideo: boolean;
    useAnimations: boolean;
  };
  accessibility: {
    textToSpeech: boolean;
    highContrast: boolean;
    largeText: boolean;
    alternativeText: boolean;
  };
  gameFeatures: {
    useTimer: boolean;
    useHints: boolean;
    useLeaderboard: boolean;
    useAchievements: boolean;
    usePowerups: boolean;
    useMultiplayer: boolean;
  };
  difficultyProgression: {
    type: 'linear' | 'adaptive' | 'custom';
    startLevel: number;
    endLevel: number;
    adaptiveFactors: string[];
  };
  feedback: {
    immediate: boolean;
    detailed: boolean;
    encouraging: boolean;
    suggestImprovements: boolean;
  };
}

interface AIGeneratorProps {
  onGenerate: (questions: any[]) => void;
  onError: (error: string) => void;
}

interface StepProps {
  options: AIGenerationOptions;
  setOptions: React.Dispatch<React.SetStateAction<AIGenerationOptions>>;
}

export default function AIGenerator({ onGenerate, onError }: AIGeneratorProps) {
  const [options, setOptions] = useState<AIGenerationOptions>({
    subject: '',
    topic: '',
    difficulty: 'medium',
    questionTypes: ['multiple_choice'],
    language: 'en',
    numberOfQuestions: 10,
    includeImages: false,
    includeExplanations: true,
    targetAge: 12,
    gameType: 'kahoot',
    customPrompt: '',
    learningObjectives: [],
    contentStyle: 'formal',
    culturalContext: '',
    timeframe: '',
    multimedia: {
      useImages: false,
      useAudio: false,
      useVideo: false,
      useAnimations: false
    },
    accessibility: {
      textToSpeech: false,
      highContrast: false,
      largeText: false,
      alternativeText: false
    },
    gameFeatures: {
      useTimer: false,
      useHints: false,
      useLeaderboard: false,
      useAchievements: false,
      usePowerups: false,
      useMultiplayer: false
    },
    difficultyProgression: {
      type: 'linear',
      startLevel: 1,
      endLevel: 10,
      adaptiveFactors: []
    },
    feedback: {
      immediate: true,
      detailed: true,
      encouraging: true,
      suggestImprovements: true
    }
  });

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const subjects = [
    { id: 'math', name: 'Mathematics', icon: AcademicCapIcon },
    { id: 'science', name: 'Science', icon: BeakerIcon },
    { id: 'language', name: 'Language Arts', icon: LanguageIcon },
    { id: 'social', name: 'Social Studies', icon: UserGroupIcon },
    { id: 'history', name: 'History', icon: BookOpenIcon },
    { id: 'geography', name: 'Geography', icon: GlobeAltIcon },
    { id: 'art', name: 'Art & Music', icon: MusicalNoteIcon },
    { id: 'technology', name: 'Technology', icon: ComputerDesktopIcon }
  ];

  const questionTypes = [
    { id: 'multiple_choice', name: 'Multiple Choice' },
    { id: 'true_false', name: 'True/False' },
    { id: 'matching', name: 'Matching' },
    { id: 'short_answer', name: 'Short Answer' }
  ];

  const gameTypes = [
    { id: 'kahoot', name: 'Kahoot-style Quiz' },
    { id: 'memory', name: 'Memory Match' },
    { id: 'wordsearch', name: 'Word Search' },
    { id: 'puzzle', name: 'Puzzle Game' },
    { id: 'crossword', name: 'Crossword Puzzle' },
    { id: 'timeline', name: 'Timeline Ordering' },
    { id: 'matching', name: 'Matching Cards' },
    { id: 'sorting', name: 'Category Sorting' },
    { id: 'scramble', name: 'Word Scramble' },
    { id: 'quiz_show', name: 'Quiz Show' },
    { id: 'flashcards', name: 'Interactive Flashcards' },
    { id: 'hangman', name: 'Educational Hangman' }
  ];

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // Here you would call your AI service
      // For now, we'll simulate the API call
      const response = await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Sample questions (replace with actual AI generation)
      const questions = [
        {
          type: 'multiple_choice',
          question: 'Sample AI generated question',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 'A'
        }
      ];
      
      onGenerate(questions);
    } catch (error) {
      onError('Failed to generate questions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      {/* Progress Steps */}
      <div className="flex justify-between mb-8">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className={`flex-1 h-2 rounded-full mx-1 ${
              s <= step ? 'bg-purple-600' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-xl font-medium text-black mb-6">Subject & Topic</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            {subjects.map(subject => (
              <button
                key={subject.id}
                onClick={() => setOptions({ ...options, subject: subject.id })}
                className={`p-4 rounded-lg border-2 ${
                  options.subject === subject.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 bg-white'
                } transition-colors hover:bg-purple-50`}
              >
                <subject.icon className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <div className="text-gray-900 font-medium">{subject.name}</div>
              </button>
            ))}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-black mb-2">
              Specific Topic
            </label>
            <input
              type="text"
              value={options.topic}
              onChange={(e) => setOptions({ ...options, topic: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., Algebra, Solar System, etc."
            />
          </div>
        </motion.div>
      )}

      {/* Step 2: Game Settings */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-xl font-medium text-black mb-6">Game Settings</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            {gameTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setOptions({ ...options, gameType: type.id as any })}
                className={`p-4 rounded-lg border-2 ${
                  options.gameType === type.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 bg-white'
                } transition-colors hover:bg-purple-50`}
              >
                <div className="text-gray-900 font-medium">{type.name}</div>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Number of Questions
              </label>
              <input
                type="number"
                value={options.numberOfQuestions}
                onChange={(e) => setOptions({ ...options, numberOfQuestions: parseInt(e.target.value) })}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                min="5"
                max="50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Difficulty Level
              </label>
              <select
                value={options.difficulty}
                onChange={(e) => setOptions({ ...options, difficulty: e.target.value as any })}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}

      {/* Step 3: Advanced Options */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-xl font-medium text-black mb-6">Advanced Options</h3>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Question Types
              </label>
              <div className="space-y-2">
                {questionTypes.map(type => (
                  <label key={type.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.questionTypes.includes(type.id)}
                      onChange={(e) => {
                        const types = e.target.checked
                          ? [...options.questionTypes, type.id]
                          : options.questionTypes.filter(t => t !== type.id);
                        setOptions({ ...options, questionTypes: types });
                      }}
                      className="mr-2"
                    />
                    <span className="text-black">{type.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Custom Instructions (Optional)
              </label>
              <textarea
                value={options.customPrompt}
                onChange={(e) => setOptions({ ...options, customPrompt: e.target.value })}
                className="w-full p-2 border rounded-lg"
                rows={4}
                placeholder="Add any specific instructions for the AI..."
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeImages}
                  onChange={(e) => setOptions({ ...options, includeImages: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-black">Include Images</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeExplanations}
                  onChange={(e) => setOptions({ ...options, includeExplanations: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-black">Include Explanations</span>
              </label>
            </div>
          </div>
        </motion.div>
      )}

      {/* Step 4: Learning Objectives */}
      {step === 4 && (
        <LearningObjectivesStep options={options} setOptions={setOptions} />
      )}

      {/* Step 5: Accessibility Options */}
      {step === 5 && (
        <AccessibilityStep options={options} setOptions={setOptions} />
      )}

      {/* Step 6: Game Features */}
      {step === 6 && (
        <GameFeaturesStep options={options} setOptions={setOptions} />
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
        )}
        {step < 6 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors ml-auto"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors ml-auto flex items-center"
          >
            <SparklesIcon className="w-5 h-5 mr-2" />
            {loading ? 'Generating...' : 'Generate Questions'}
          </button>
        )}
      </div>
    </div>
  );
}

const LearningObjectivesStep = ({ options, setOptions }: StepProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <h3 className="text-xl font-medium text-black mb-6">Learning Objectives</h3>
    
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Key Learning Outcomes
        </label>
        <textarea
          value={options.learningObjectives.join('\n')}
          onChange={(e) => setOptions({
            ...options,
            learningObjectives: e.target.value.split('\n').filter(Boolean)
          })}
          className="w-full p-2 border rounded-lg"
          rows={4}
          placeholder="Enter each learning objective on a new line..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Content Style
        </label>
        <select
          value={options.contentStyle}
          onChange={(e) => setOptions({
            ...options,
            contentStyle: e.target.value as any
          })}
          className="w-full p-2 border rounded-lg"
        >
          <option value="formal">Formal Academic</option>
          <option value="casual">Casual & Friendly</option>
          <option value="fun">Fun & Engaging</option>
          <option value="technical">Technical & Detailed</option>
        </select>
      </div>
    </div>
  </motion.div>
);

const AccessibilityStep = ({ options, setOptions }: StepProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <h3 className="text-xl font-medium text-black mb-6">Accessibility Options</h3>
    
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={options.accessibility.textToSpeech}
            onChange={(e) => setOptions({
              ...options,
              accessibility: {
                ...options.accessibility,
                textToSpeech: e.target.checked
              }
            })}
            className="mr-2"
          />
          <span className="text-black">Text to Speech</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={options.accessibility.highContrast}
            onChange={(e) => setOptions({
              ...options,
              accessibility: {
                ...options.accessibility,
                highContrast: e.target.checked
              }
            })}
            className="mr-2"
          />
          <span className="text-black">High Contrast</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={options.accessibility.largeText}
            onChange={(e) => setOptions({
              ...options,
              accessibility: {
                ...options.accessibility,
                largeText: e.target.checked
              }
            })}
            className="mr-2"
          />
          <span className="text-black">Large Text</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={options.accessibility.alternativeText}
            onChange={(e) => setOptions({
              ...options,
              accessibility: {
                ...options.accessibility,
                alternativeText: e.target.checked
              }
            })}
            className="mr-2"
          />
          <span className="text-black">Alternative Text</span>
        </label>
      </div>
    </div>
  </motion.div>
);

const GameFeaturesStep = ({ options, setOptions }: StepProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <h3 className="text-xl font-medium text-black mb-6">Game Features</h3>
    
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={options.gameFeatures.useTimer}
            onChange={(e) => setOptions({
              ...options,
              gameFeatures: {
                ...options.gameFeatures,
                useTimer: e.target.checked
              }
            })}
            className="mr-2"
          />
          <span className="text-black">Timer</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={options.gameFeatures.useHints}
            onChange={(e) => setOptions({
              ...options,
              gameFeatures: {
                ...options.gameFeatures,
                useHints: e.target.checked
              }
            })}
            className="mr-2"
          />
          <span className="text-black">Hints</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={options.gameFeatures.useLeaderboard}
            onChange={(e) => setOptions({
              ...options,
              gameFeatures: {
                ...options.gameFeatures,
                useLeaderboard: e.target.checked
              }
            })}
            className="mr-2"
          />
          <span className="text-black">Leaderboard</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={options.gameFeatures.useAchievements}
            onChange={(e) => setOptions({
              ...options,
              gameFeatures: {
                ...options.gameFeatures,
                useAchievements: e.target.checked
              }
            })}
            className="mr-2"
          />
          <span className="text-black">Achievements</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={options.gameFeatures.usePowerups}
            onChange={(e) => setOptions({
              ...options,
              gameFeatures: {
                ...options.gameFeatures,
                usePowerups: e.target.checked
              }
            })}
            className="mr-2"
          />
          <span className="text-black">Power-ups</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={options.gameFeatures.useMultiplayer}
            onChange={(e) => setOptions({
              ...options,
              gameFeatures: {
                ...options.gameFeatures,
                useMultiplayer: e.target.checked
              }
            })}
            className="mr-2"
          />
          <span className="text-black">Multiplayer</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Difficulty Progression
        </label>
        <select
          value={options.difficultyProgression.type}
          onChange={(e) => setOptions({
            ...options,
            difficultyProgression: {
              ...options.difficultyProgression,
              type: e.target.value as any
            }
          })}
          className="w-full p-2 border rounded-lg"
        >
          <option value="linear">Linear (Gradual Increase)</option>
          <option value="adaptive">Adaptive (Based on Performance)</option>
          <option value="custom">Custom (Manual Settings)</option>
        </select>
      </div>
    </div>
  </motion.div>
); 