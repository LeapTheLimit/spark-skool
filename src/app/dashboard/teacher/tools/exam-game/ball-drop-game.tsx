'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';
import MascotImage from '@/components/MascotImage';

interface BallDropGameProps {
  questions: Array<{
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
  }>;
  onGameComplete: (score: number) => void;
  difficulty: 'easy' | 'medium' | 'hard';
  theme?: {
    mainColor: string;
    accentColor: string;
    icon: string;
  };
  multiplayer?: boolean;
  players?: Array<{
    id: string;
    name: string;
    score: number;
    avatar?: string;
  }>;
  onLeaderboardUpdate?: (player: { name: string; score: number; time: number }) => void;
}

interface Ball {
  id: number;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  radius: number;
  color: string;
}

interface Platform {
  id: number;
  position: { x: number; y: number };
  width: number;
  height: number;
  type: 'normal' | 'bouncy' | 'breakable';
}

export default function BallDropGame({
  questions,
  onGameComplete,
  difficulty,
  theme,
  multiplayer,
  players,
  onLeaderboardUpdate
}: BallDropGameProps) {
  const { t } = useLanguage();
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(questions[0]?.timeLimit || 60);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Physics constants
  const GRAVITY = 0.5;
  const BOUNCE_FACTOR = 0.7;
  const FRICTION = 0.99;

  // Sample platforms
  const initialPlatforms: Platform[] = [
    {
      id: 1,
      position: { x: 0, y: 400 },
      width: 800,
      height: 20,
      type: 'normal'
    },
    {
      id: 2,
      position: { x: 200, y: 300 },
      width: 200,
      height: 20,
      type: 'bouncy'
    },
    {
      id: 3,
      position: { x: 400, y: 200 },
      width: 200,
      height: 20,
      type: 'breakable'
    }
  ];

  useEffect(() => {
    setPlatforms(initialPlatforms);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!gameOver && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleGameOver();
    }
    return () => clearInterval(timer);
  }, [timeLeft, gameOver]);

  useEffect(() => {
    let animationFrame: number;
    if (isPlaying && !gameOver) {
      const updateGame = () => {
        setBalls(prevBalls => {
          return prevBalls.map(ball => {
            // Update position
            const newPosition = {
              x: ball.position.x + ball.velocity.x,
              y: ball.position.y + ball.velocity.y
            };

            // Apply gravity
            const newVelocity = {
              x: ball.velocity.x * FRICTION,
              y: ball.velocity.y + GRAVITY
            };

            // Check platform collisions
            for (const platform of platforms) {
              if (checkCollision(ball, platform)) {
                // Handle collision
                if (platform.type === 'bouncy') {
                  newVelocity.y = -Math.abs(ball.velocity.y) * BOUNCE_FACTOR * 1.5;
                } else if (platform.type === 'breakable') {
                  setPlatforms(prev => prev.filter(p => p.id !== platform.id));
                  setScore(prev => prev + 50);
                } else {
                  newVelocity.y = -Math.abs(ball.velocity.y) * BOUNCE_FACTOR;
                }
                newPosition.y = platform.position.y - ball.radius;
              }
            }

            // Check if ball is out of bounds
            if (newPosition.y > 500) {
              return {
                ...ball,
                position: { x: Math.random() * 700, y: 0 },
                velocity: { x: (Math.random() - 0.5) * 5, y: 0 }
              };
            }

            return {
              ...ball,
              position: newPosition,
              velocity: newVelocity
            };
          });
        });

        animationFrame = requestAnimationFrame(updateGame);
      };

      animationFrame = requestAnimationFrame(updateGame);
    }
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying, gameOver, platforms]);

  const checkCollision = (ball: Ball, platform: Platform) => {
    return (
      ball.position.y + ball.radius >= platform.position.y &&
      ball.position.y - ball.radius <= platform.position.y + platform.height &&
      ball.position.x + ball.radius >= platform.position.x &&
      ball.position.x - ball.radius <= platform.position.x + platform.width
    );
  };

  const handleStart = () => {
    setIsPlaying(true);
    setBalls([
      {
        id: 1,
        position: { x: 400, y: 0 },
        velocity: { x: 0, y: 0 },
        radius: 20,
        color: '#FF6B6B'
      }
    ]);
  };

  const handleGameOver = () => {
    setGameOver(true);
    setIsPlaying(false);
    onGameComplete(score);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Game Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold">{t('score')}: {score}</div>
          <div className="text-lg">{t('timeLeft')}: {timeLeft}s</div>
        </div>
        {multiplayer && (
          <div className="flex items-center gap-2">
            {players?.map(player => (
              <div key={player.id} className="flex items-center gap-1">
                {player.avatar && (
                  <MascotImage
                    src={player.avatar}
                    alt={player.name}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                )}
                <span>{player.name}: {player.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Game Area */}
      <div
        ref={containerRef}
        className="bg-gray-100 rounded-lg p-6 mb-6 relative h-[500px] overflow-hidden"
      >
        {/* Platforms */}
        {platforms.map(platform => (
          <motion.div
            key={platform.id}
            className={`absolute ${
              platform.type === 'bouncy' ? 'bg-green-500' :
              platform.type === 'breakable' ? 'bg-red-500' :
              'bg-blue-500'
            }`}
            style={{
              left: platform.position.x,
              top: platform.position.y,
              width: platform.width,
              height: platform.height
            }}
          />
        ))}

        {/* Balls */}
        {balls.map(ball => (
          <motion.div
            key={ball.id}
            className="absolute rounded-full"
            style={{
              left: ball.position.x - ball.radius,
              top: ball.position.y - ball.radius,
              width: ball.radius * 2,
              height: ball.radius * 2,
              backgroundColor: ball.color
            }}
          />
        ))}

        {/* Start Button */}
        {!isPlaying && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.button
              onClick={handleStart}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg text-xl font-bold"
            >
              {t('start')}
            </motion.button>
          </div>
        )}
      </div>

      {/* Game Over */}
      {gameOver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">{t('gameOver')}</h2>
            <p className="text-xl mb-4">{t('finalScore')}: {score}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              {t('playAgain')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 