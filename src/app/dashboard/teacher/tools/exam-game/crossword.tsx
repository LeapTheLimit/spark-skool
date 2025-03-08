'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CrosswordCell {
  letter: string;
  isActive: boolean;
  isRevealed: boolean;
  number?: number;
  position: {
    row: number;
    col: number;
  };
}

interface CrosswordClue {
  number: number;
  clue: string;
  answer: string;
  direction: 'across' | 'down';
  startPosition: {
    row: number;
    col: number;
  };
}

interface CrosswordProps {
  clues: {
    question: string;
    answer: string;
  }[];
  onGameComplete: (score: number) => void;
}

export default function Crossword({ clues, onGameComplete }: CrosswordProps) {
  const GRID_SIZE = 15;
  const [grid, setGrid] = useState<CrosswordCell[][]>([]);
  const [crosswordClues, setCrosswordClues] = useState<CrosswordClue[]>([]);
  const [selectedClue, setSelectedClue] = useState<CrosswordClue | null>(null);
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(600); // 10 minutes
  const [gameStarted, setGameStarted] = useState(false);

  // Initialize game
  useEffect(() => {
    if (clues.length > 0) {
      generateCrossword();
      setGameStarted(true);
    }
  }, [clues]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      checkCompletion();
    }
    return () => clearInterval(interval);
  }, [gameStarted, timer]);

  const generateCrossword = () => {
    // Create empty grid
    const newGrid: CrosswordCell[][] = Array(GRID_SIZE).fill(null).map((_, row) =>
      Array(GRID_SIZE).fill(null).map((_, col) => ({
        letter: '',
        isActive: false,
        isRevealed: false,
        position: { row, col }
      }))
    );

    // Place words in grid
    const newClues: CrosswordClue[] = [];
    let clueNumber = 1;

    clues.forEach((clue, index) => {
      const answer = clue.answer.toUpperCase();
      const direction = index % 2 === 0 ? 'across' : 'down';
      
      // Find suitable position
      let placed = false;
      let attempts = 0;
      
      while (!placed && attempts < 100) {
        const startRow = Math.floor(Math.random() * (GRID_SIZE - answer.length));
        const startCol = Math.floor(Math.random() * (GRID_SIZE - answer.length));
        
        if (canPlaceWord(newGrid, answer, startRow, startCol, direction)) {
          placeWord(newGrid, answer, startRow, startCol, direction);
          newClues.push({
            number: clueNumber,
            clue: clue.question,
            answer: answer,
            direction: direction,
            startPosition: { row: startRow, col: startCol }
          });
          
          // Add number to grid
          newGrid[startRow][startCol].number = clueNumber;
          clueNumber++;
          placed = true;
        }
        attempts++;
      }
    });

    setGrid(newGrid);
    setCrosswordClues(newClues);
  };

  const canPlaceWord = (grid: CrosswordCell[][], word: string, startRow: number, startCol: number, direction: 'across' | 'down'): boolean => {
    if (direction === 'across') {
      if (startCol + word.length > GRID_SIZE) return false;
      
      for (let i = 0; i < word.length; i++) {
        if (grid[startRow][startCol + i].isActive && 
            grid[startRow][startCol + i].letter !== word[i]) {
          return false;
        }
      }
    } else {
      if (startRow + word.length > GRID_SIZE) return false;
      
      for (let i = 0; i < word.length; i++) {
        if (grid[startRow + i][startCol].isActive && 
            grid[startRow + i][startCol].letter !== word[i]) {
          return false;
        }
      }
    }
    
    return true;
  };

  const placeWord = (grid: CrosswordCell[][], word: string, startRow: number, startCol: number, direction: 'across' | 'down') => {
    if (direction === 'across') {
      for (let i = 0; i < word.length; i++) {
        grid[startRow][startCol + i].letter = word[i];
        grid[startRow][startCol + i].isActive = true;
      }
    } else {
      for (let i = 0; i < word.length; i++) {
        grid[startRow + i][startCol].letter = word[i];
        grid[startRow + i][startCol].isActive = true;
      }
    }
  };

  const handleClueSelect = (clue: CrosswordClue) => {
    setSelectedClue(clue);
  };

  const handleAnswerInput = (clueNumber: number, value: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [clueNumber]: value.toUpperCase()
    }));

    // Check if answer is correct
    const clue = crosswordClues.find(c => c.number === clueNumber);
    if (clue && value.toUpperCase() === clue.answer) {
      // Reveal letters in grid
      setGrid(prev => {
        const newGrid = [...prev];
        const { row, col } = clue.startPosition;
        const length = clue.answer.length;

        if (clue.direction === 'across') {
          for (let i = 0; i < length; i++) {
            newGrid[row][col + i].isRevealed = true;
          }
        } else {
          for (let i = 0; i < length; i++) {
            newGrid[row + i][col].isRevealed = true;
          }
        }

        return newGrid;
      });

      // Update score
      const timeBonus = Math.floor(timer / 10);
      setScore(prev => prev + 100 + timeBonus);

      // Check if all words are found
      checkCompletion();
    }
  };

  const checkCompletion = () => {
    const allCorrect = crosswordClues.every(clue => 
      userAnswers[clue.number]?.toUpperCase() === clue.answer
    );

    if (allCorrect) {
      const timeBonus = Math.floor(timer / 10);
      const finalScore = score + timeBonus;
      onGameComplete(finalScore);
    }
  };

  return (
    <div className="p-4">
      {/* Game Stats */}
      <div className="flex justify-between mb-6">
        <div className="text-black">
          Time: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
        </div>
        <div className="text-black">
          Score: {score}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Crossword Grid */}
        <div 
          className="grid gap-1 bg-white p-4 rounded-lg shadow"
          style={{ 
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            aspectRatio: '1'
          }}
        >
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`
                  relative aspect-square flex items-center justify-center
                  text-sm font-bold border
                  ${cell.isActive ? 'border-black' : 'border-transparent bg-gray-100'}
                  ${cell.isRevealed ? 'bg-green-100' : ''}
                `}
              >
                {cell.number && (
                  <span className="absolute top-0 left-0 text-xs text-gray-500">
                    {cell.number}
                  </span>
                )}
                {cell.isRevealed ? cell.letter : ''}
              </div>
            ))
          )}
        </div>

        {/* Clues */}
        <div className="space-y-6">
          {/* Across Clues */}
          <div>
            <h3 className="font-bold text-black mb-2">Across</h3>
            <div className="space-y-2">
              {crosswordClues
                .filter(clue => clue.direction === 'across')
                .map(clue => (
                  <div
                    key={clue.number}
                    className={`p-2 rounded ${
                      selectedClue?.number === clue.number
                        ? 'bg-blue-100'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleClueSelect(clue)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-black">{clue.number}.</span>
                      <span className="text-black">{clue.clue}</span>
                    </div>
                    <input
                      type="text"
                      value={userAnswers[clue.number] || ''}
                      onChange={(e) => handleAnswerInput(clue.number, e.target.value)}
                      className="mt-1 w-full p-1 border rounded"
                      maxLength={clue.answer.length}
                    />
                  </div>
                ))}
            </div>
          </div>

          {/* Down Clues */}
          <div>
            <h3 className="font-bold text-black mb-2">Down</h3>
            <div className="space-y-2">
              {crosswordClues
                .filter(clue => clue.direction === 'down')
                .map(clue => (
                  <div
                    key={clue.number}
                    className={`p-2 rounded ${
                      selectedClue?.number === clue.number
                        ? 'bg-blue-100'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleClueSelect(clue)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-black">{clue.number}.</span>
                      <span className="text-black">{clue.clue}</span>
                    </div>
                    <input
                      type="text"
                      value={userAnswers[clue.number] || ''}
                      onChange={(e) => handleAnswerInput(clue.number, e.target.value)}
                      className="mt-1 w-full p-1 border rounded"
                      maxLength={clue.answer.length}
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 