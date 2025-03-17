'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserGroupIcon,
  TrophyIcon,
  BoltIcon,
  HandRaisedIcon
} from '@heroicons/react/24/outline';

interface Player {
  id: string;
  name: string;
  score: number;
  buzzed: boolean;
  powerups: {
    doublePoints: number;
    skipQuestion: number;
    extraTime: number;
  };
}

interface QuizQuestion {
  id: number;
  question: string;
  answer: string;
  points: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  hint?: string;
}

interface QuizShowProps {
  questions: QuizQuestion[];
  onGameComplete: (winners: Player[]) => void;
  isMultiplayer?: boolean;
}

export default function QuizShow({ questions, onGameComplete, isMultiplayer = true }: QuizShowProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timer, setTimer] = useState(0);
  const [gamePhase, setGamePhase] = useState<'lobby' | 'question' | 'buzzer' | 'answer' | 'scores'>('lobby');
  const [activePlayers, setActivePlayers] = useState<string[]>([]);
  const [buzzOrder, setBuzzOrder] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);

  // Initialize game
  useEffect(() => {
    if (questions.length > 0) {
      setCurrentQuestion(questions[0]);
    }
  }, [questions]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gamePhase === 'question' && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0 && gamePhase === 'question') {
      setGamePhase('buzzer');
    }
    return () => clearInterval(interval);
  }, [gamePhase, timer]);

  const addPlayer = (name: string) => {
    const newPlayer: Player = {
      id: Date.now().toString(),
      name,
      score: 0,
      buzzed: false,
      powerups: {
        doublePoints: 2,
        skipQuestion: 1,
        extraTime: 1
      }
    };
    setPlayers(prev => [...prev, newPlayer]);
  };

  const startGame = () => {
    if (players.length < 2) {
      alert('Need at least 2 players to start!');
      return;
    }
    setGamePhase('question');
    setTimer(currentQuestion?.timeLimit || 30);
  };

  const handleBuzz = (playerId: string) => {
    if (!buzzOrder.includes(playerId)) {
      setBuzzOrder(prev => [...prev, playerId]);
      setPlayers(prev => prev.map(p => 
        p.id === playerId ? { ...p, buzzed: true } : p
      ));
    }
  };

  const handleAnswer = (isCorrect: boolean) => {
    const currentPlayerId = buzzOrder[0];
    const currentPoints = currentQuestion?.points || 0;
    
    setPlayers(prev => prev.map(player => {
      if (player.id === currentPlayerId) {
        return {
          ...player,
          score: player.score + (isCorrect ? currentPoints : -Math.floor(currentPoints / 2)),
          buzzed: false
        };
      }
      return player;
    }));

    setBuzzOrder([]);
    setShowAnswer(true);
    
    setTimeout(() => {
      if (questionIndex < questions.length - 1) {
        setQuestionIndex(prev => prev + 1);
        setCurrentQuestion(questions[questionIndex + 1]);
        setGamePhase('question');
        setTimer(questions[questionIndex + 1].timeLimit);
        setShowAnswer(false);
        setCurrentAnswer('');
        setPlayers(prev => prev.map(p => ({ ...p, buzzed: false })));
      } else {
        handleGameOver();
      }
    }, 3000);
  };

  const handlePowerup = (playerId: string, powerup: keyof Player['powerups']) => {
    const player = players.find(p => p.id === playerId);
    if (player && player.powerups[powerup] > 0) {
      setPlayers(prev => prev.map(p => {
        if (p.id === playerId) {
          return {
            ...p,
            powerups: {
              ...p.powerups,
              [powerup]: p.powerups[powerup] - 1
            }
          };
        }
        return p;
      }));

      switch (powerup) {
        case 'doublePoints':
          if (currentQuestion) {
            setCurrentQuestion({
              ...currentQuestion,
              points: currentQuestion.points * 2
            });
          }
          break;
        case 'skipQuestion':
          if (questionIndex < questions.length - 1) {
            setQuestionIndex(prev => prev + 1);
            setCurrentQuestion(questions[questionIndex + 1]);
            setGamePhase('question');
            setTimer(questions[questionIndex + 1].timeLimit);
          }
          break;
        case 'extraTime':
          setTimer(prev => prev + 30);
          break;
      }
    }
  };

  const handleGameOver = () => {
    // Sort players by score
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    onGameComplete(sortedPlayers);
  };

  return (
    <div className="p-4">
      <AnimatePresence>
        {/* Lobby */}
        {gamePhase === 'lobby' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-black mb-6">Quiz Show Lobby</h2>
            
            {/* Player List */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {players.map(player => (
                <div
                  key={player.id}
                  className="p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="w-6 h-6 text-purple-600" />
                    <span className="text-black font-medium">{player.name}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Player Form */}
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="Enter player name"
                className="flex-1 p-2 border rounded-lg"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    addPlayer(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector('input');
                  if (input && input.value) {
                    addPlayer(input.value);
                    input.value = '';
                  }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg"
              >
                Add Player
              </button>
            </div>

            <button
              onClick={startGame}
              disabled={players.length < 2}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg disabled:bg-gray-300"
            >
              Start Game
            </button>
          </motion.div>
        )}

        {/* Question Phase */}
        {gamePhase === 'question' && currentQuestion && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="text-black">
                Question {questionIndex + 1} of {questions.length}
              </div>
              <div className="text-black">
                Time: {timer}s
              </div>
              <div className="text-black">
                Points: {currentQuestion.points}
              </div>
            </div>

            <div className="mb-6">
              <div className="text-sm text-purple-600 mb-2">
                {currentQuestion.category} - {currentQuestion.difficulty}
              </div>
              <h3 className="text-xl font-bold text-black">
                {currentQuestion.question}
              </h3>
            </div>

            {/* Buzzer Buttons */}
            <div className="grid grid-cols-2 gap-4">
              {players.map(player => (
                <button
                  key={player.id}
                  onClick={() => handleBuzz(player.id)}
                  disabled={player.buzzed}
                  className={`p-4 rounded-lg flex items-center justify-center gap-2 ${
                    player.buzzed
                      ? 'bg-gray-200 text-gray-500'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <HandRaisedIcon className="w-6 h-6" />
                  {player.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Answer Phase */}
        {gamePhase === 'buzzer' && buzzOrder.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h3 className="text-xl font-bold text-black mb-4">
              {players.find(p => p.id === buzzOrder[0])?.name}'s Turn to Answer
            </h3>

            <div className="mb-6">
              <input
                type="text"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                className="w-full p-3 border rounded-lg text-black"
                placeholder="Type your answer..."
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => handleAnswer(true)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg"
              >
                Correct
              </button>
              <button
                onClick={() => handleAnswer(false)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                Incorrect
              </button>
            </div>
          </motion.div>
        )}

        {/* Scoreboard */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-4">
          <h3 className="text-lg font-bold text-black mb-4">Scoreboard</h3>
          <div className="space-y-2">
            {[...players].sort((a, b) => b.score - a.score).map(player => (
              <div
                key={player.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <TrophyIcon className="w-5 h-5 text-yellow-500" />
                  <span className="text-black">{player.name}</span>
                </div>
                <div className="text-black font-bold">{player.score}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Power-ups */}
        <div className="mt-4 bg-white rounded-xl shadow-lg p-4">
          <h3 className="text-lg font-bold text-black mb-4">Power-ups</h3>
          <div className="grid grid-cols-2 gap-4">
            {players.map(player => (
              <div key={player.id} className="p-2 border rounded-lg">
                <div className="text-black font-medium mb-2">{player.name}</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePowerup(player.id, 'doublePoints')}
                    disabled={player.powerups.doublePoints === 0}
                    className="p-1 rounded bg-yellow-100 text-yellow-800 disabled:opacity-50"
                    title="Double Points"
                  >
                    <BoltIcon className="w-4 h-4" />
                    ×{player.powerups.doublePoints}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AnimatePresence>
    </div>
  );
} 