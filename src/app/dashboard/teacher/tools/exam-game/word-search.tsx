'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface WordSearchProps {
  words: string[];
  definitions: string[];
  onGameComplete: (score: number) => void;
}

interface Cell {
  letter: string;
  isSelected: boolean;
  isFound: boolean;
  position: {
    row: number;
    col: number;
  };
}

interface Word {
  word: string;
  definition: string;
  isFound: boolean;
  startPos?: {
    row: number;
    col: number;
  };
  endPos?: {
    row: number;
    col: number;
  };
}

export default function WordSearch({ words, definitions, onGameComplete }: WordSearchProps) {
  const GRID_SIZE = 15;
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [wordList, setWordList] = useState<Word[]>([]);
  const [selectedCells, setSelectedCells] = useState<Cell[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(300); // 5 minutes
  const [gameStarted, setGameStarted] = useState(false);

  // Memoize generateGrid function
  const generateGrid = useCallback((wordList: Word[]) => {
    // Create empty grid
    const newGrid: Cell[][] = Array(GRID_SIZE).fill(null).map((_, row) =>
      Array(GRID_SIZE).fill(null).map((_, col) => ({
        letter: '',
        isSelected: false,
        isFound: false,
        position: { row, col }
      }))
    );

    // Place words in grid
    wordList.forEach(wordObj => {
      const word = wordObj.word;
      let placed = false;
      let attempts = 0;
      
      while (!placed && attempts < 100) {
        const direction = Math.floor(Math.random() * 8); // 8 possible directions
        const startRow = Math.floor(Math.random() * GRID_SIZE);
        const startCol = Math.floor(Math.random() * GRID_SIZE);
        
        if (canPlaceWord(newGrid, word, startRow, startCol, direction)) {
          placeWord(newGrid, word, startRow, startCol, direction);
          placed = true;
        }
        attempts++;
      }
    });

    // Fill empty cells with random letters
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (newGrid[row][col].letter === '') {
          newGrid[row][col].letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        }
      }
    }

    setGrid(newGrid);
  }, []); // No dependencies needed as it's a pure function

  // Fix useEffect dependency
  useEffect(() => {
    if (words.length > 0) {
      const initialWordList = words.map((word, index) => ({
        word: word.toUpperCase(),
        definition: definitions[index],
        isFound: false
      }));
      setWordList(initialWordList);
      generateGrid(initialWordList);
      setGameStarted(true);
    }
  }, [words, definitions, generateGrid]); // Add generateGrid to dependencies

  // Timer
  useEffect(() => {
    if (gameStarted && timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      onGameComplete(score);
    }
  }, [gameStarted, timer, score, onGameComplete]);

  const canPlaceWord = (grid: Cell[][], word: string, startRow: number, startCol: number, direction: number) => {
    const dirs = [
      [0, 1],   // right
      [1, 0],   // down
      [1, 1],   // diagonal down-right
      [-1, 1],  // diagonal up-right
      [0, -1],  // left
      [-1, 0],  // up
      [-1, -1], // diagonal up-left
      [1, -1]   // diagonal down-left
    ];

    const [dRow, dCol] = dirs[direction];
    
    for (let i = 0; i < word.length; i++) {
      const row = startRow + (dRow * i);
      const col = startCol + (dCol * i);
      
      if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
        return false;
      }
      
      if (grid[row][col].letter !== '' && grid[row][col].letter !== word[i]) {
        return false;
      }
    }
    
    return true;
  };

  const placeWord = (grid: Cell[][], word: string, startRow: number, startCol: number, direction: number) => {
    const dirs = [
      [0, 1], [1, 0], [1, 1], [-1, 1],
      [0, -1], [-1, 0], [-1, -1], [1, -1]
    ];
    
    const [dRow, dCol] = dirs[direction];
    
    for (let i = 0; i < word.length; i++) {
      const row = startRow + (dRow * i);
      const col = startCol + (dCol * i);
      grid[row][col].letter = word[i];
    }
  };

  const handleCellMouseDown = (cell: Cell) => {
    setIsDragging(true);
    setSelectedCells([cell]);
  };

  const handleCellMouseEnter = (cell: Cell) => {
    if (isDragging) {
      setSelectedCells(prev => [...prev, cell]);
    }
  };

  const handleCellMouseUp = () => {
    setIsDragging(false);
    checkSelection();
  };

  const checkSelection = () => {
    const selectedWord = selectedCells.map(cell => cell.letter).join('');
    const reversedWord = selectedWord.split('').reverse().join('');
    
    const foundWord = wordList.find(w => 
      !w.isFound && (w.word === selectedWord || w.word === reversedWord)
    );

    if (foundWord) {
      // Mark word as found
      setWordList(prev => prev.map(w =>
        w.word === foundWord.word ? { ...w, isFound: true } : w
      ));

      // Update grid to show found word
      setGrid(prev => prev.map(row =>
        row.map(cell =>
          selectedCells.includes(cell)
            ? { ...cell, isFound: true }
            : cell
        )
      ));

      // Update score
      const timeBonus = Math.floor(timer / 10);
      setScore(prev => prev + 100 + timeBonus);

      // Check if all words are found
      const allFound = wordList.every(w => w.isFound || w.word === foundWord.word);
      if (allFound) {
        onGameComplete(score + 100 + timeBonus);
      }
    }

    setSelectedCells([]);
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

      {/* Word List */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {wordList.map((word, index) => (
          <div
            key={index}
            className={`p-2 rounded ${
              word.isFound
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            <p className={`font-medium ${word.isFound ? 'line-through' : ''}`}>
              {word.word}
            </p>
            <p className="text-sm">{word.definition}</p>
          </div>
        ))}
      </div>

      {/* Game Grid */}
      <div 
        className="grid gap-1"
        style={{ 
          gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
          userSelect: 'none'
        }}
        onMouseLeave={() => {
          setIsDragging(false);
          setSelectedCells([]);
        }}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <motion.div
              key={`${rowIndex}-${colIndex}`}
              className={`
                aspect-square flex items-center justify-center
                text-sm font-bold rounded cursor-pointer
                ${cell.isFound ? 'bg-green-200' : 'bg-white'}
                ${selectedCells.includes(cell) ? 'bg-blue-200' : ''}
                border border-gray-200
              `}
              whileHover={{ scale: 1.1 }}
              onMouseDown={() => handleCellMouseDown(cell)}
              onMouseEnter={() => handleCellMouseEnter(cell)}
              onMouseUp={handleCellMouseUp}
            >
              {cell.letter}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
} 