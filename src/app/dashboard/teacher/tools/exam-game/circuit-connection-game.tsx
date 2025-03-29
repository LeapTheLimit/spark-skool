'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';
import MascotImage from '@/components/MascotImage';

interface CircuitConnectionGameProps {
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

interface CircuitComponent {
  id: string;
  type: 'battery' | 'resistor' | 'led' | 'switch' | 'wire';
  position: { x: number; y: number };
  connections: string[];
  value?: string;
  color?: string;
}

interface Connection {
  from: string;
  to: string;
  path: string;
}

export default function CircuitConnectionGame({
  questions,
  onGameComplete,
  difficulty,
  theme,
  multiplayer,
  players,
  onLeaderboardUpdate
}: CircuitConnectionGameProps) {
  const { t } = useLanguage();
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(questions[0]?.timeLimit || 60);
  const [components, setComponents] = useState<CircuitComponent[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);

  // Sample circuit components
  const circuitComponents: CircuitComponent[] = [
    {
      id: 'battery1',
      type: 'battery',
      position: { x: 50, y: 50 },
      connections: ['wire1'],
      value: '9V'
    },
    {
      id: 'resistor1',
      type: 'resistor',
      position: { x: 150, y: 50 },
      connections: ['wire1', 'wire2'],
      value: '100Ω'
    },
    {
      id: 'led1',
      type: 'led',
      position: { x: 250, y: 50 },
      connections: ['wire2'],
      color: '#FFD700'
    },
    {
      id: 'switch1',
      type: 'switch',
      position: { x: 200, y: 150 },
      connections: ['wire3', 'wire4']
    }
  ];

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

  const handleComponentSelect = (componentId: string) => {
    if (!selectedComponent) {
      setSelectedComponent(componentId);
    } else {
      // Create connection
      const newConnection: Connection = {
        from: selectedComponent,
        to: componentId,
        path: `M ${components.find(c => c.id === selectedComponent)?.position.x} ${components.find(c => c.id === selectedComponent)?.position.y} L ${components.find(c => c.id === componentId)?.position.x} ${components.find(c => c.id === componentId)?.position.y}`
      };
      
      setConnections(prev => [...prev, newConnection]);
      setSelectedComponent(null);

      // Check if circuit is complete
      if (isCircuitComplete()) {
        setScore(prev => prev + 100);
        if (multiplayer && onLeaderboardUpdate) {
          onLeaderboardUpdate({
            name: players?.[0]?.name || 'Player',
            score: 100,
            time: questions[0].timeLimit - timeLeft
          });
        }
      }
    }
  };

  const isCircuitComplete = () => {
    // Check if all components are connected in a valid circuit
    const battery = components.find(c => c.type === 'battery');
    const led = components.find(c => c.type === 'led');
    
    if (!battery || !led) return false;

    // Check if there's a path from battery to LED
    const path = findPath(battery.id, led.id);
    return path.length > 0;
  };

  const findPath = (start: string, end: string): string[] => {
    const visited = new Set<string>();
    const path: string[] = [];

    const dfs = (current: string): boolean => {
      if (current === end) return true;
      visited.add(current);

      const component = components.find(c => c.id === current);
      if (!component) return false;

      for (const connection of connections) {
        if (connection.from === current && !visited.has(connection.to)) {
          path.push(connection.to);
          if (dfs(connection.to)) return true;
          path.pop();
        }
      }

      return false;
    };

    path.push(start);
    dfs(start);
    return path;
  };

  const handleGameOver = () => {
    setGameOver(true);
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

      {/* Circuit Board */}
      <div className="bg-gray-100 rounded-lg p-6 mb-6 relative h-[400px]">
        <svg className="absolute inset-0 w-full h-full">
          {connections.map((connection, index) => (
            <path
              key={index}
              d={connection.path}
              stroke={selectedComponent === connection.from ? '#4A90E2' : '#666'}
              strokeWidth="2"
              fill="none"
            />
          ))}
        </svg>
        
        {components.map(component => (
          <motion.div
            key={component.id}
            onClick={() => handleComponentSelect(component.id)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`absolute cursor-pointer ${
              selectedComponent === component.id ? 'ring-2 ring-blue-500' : ''
            }`}
            style={{
              left: component.position.x,
              top: component.position.y
            }}
          >
            {component.type === 'battery' && (
              <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold">{component.value}</span>
              </div>
            )}
            {component.type === 'resistor' && (
              <div className="w-12 h-12 bg-brown-400 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold">{component.value}</span>
              </div>
            )}
            {component.type === 'led' && (
              <div
                className="w-8 h-8 rounded-full"
                style={{ backgroundColor: component.color }}
              />
            )}
            {component.type === 'switch' && (
              <div className="w-12 h-12 bg-gray-400 rounded-lg flex items-center justify-center">
                <div className="w-8 h-1 bg-black" />
              </div>
            )}
          </motion.div>
        ))}
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