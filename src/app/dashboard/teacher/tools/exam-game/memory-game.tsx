'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MemoryCard {
  id: number;
  content: string;
  type: 'question' | 'answer';
  isFlipped: boolean;
  isMatched: boolean;
}

interface MemoryGameProps {
  questions: Array<{
    question: string;
    answer: string;
  }>;
  onGameComplete: (score: number) => void;
}

export default function MemoryGame({ questions, onGameComplete }: MemoryGameProps) {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0);

  // Initialize game
  useEffect(() => {
    if (questions.length > 0) {
      const gameCards: MemoryCard[] = questions.flatMap((q, index) => [
        {
          id: index * 2,
          content: q.question,
          type: 'question',
          isFlipped: false,
          isMatched: false
        },
        {
          id: index * 2 + 1,
          content: q.answer,
          type: 'answer',
          isFlipped: false,
          isMatched: false
        }
      ]);
      
      // Shuffle cards
      const shuffledCards = gameCards.sort(() => Math.random() - 0.5);
      setCards(shuffledCards);
    }
  }, [questions]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && matchedPairs < questions.length) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, matchedPairs, questions.length]);

  // Handle card click
  const handleCardClick = (cardId: number) => {
    if (!gameStarted) {
      setGameStarted(true);
    }

    const card = cards.find(c => c.id === cardId);
    if (!card || card.isMatched || flippedCards.includes(cardId)) {
      return;
    }

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setMoves(prev => prev + 1);
      const [firstId, secondId] = newFlippedCards;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);

      if (firstCard && secondCard) {
        // Check if cards match (question-answer pair)
        const isMatch = questions.some(q => 
          (firstCard.content === q.question && secondCard.content === q.answer) ||
          (firstCard.content === q.answer && secondCard.content === q.question)
        );

        if (isMatch) {
          // Handle match
          setCards(prev => prev.map(card => 
            card.id === firstId || card.id === secondId
              ? { ...card, isMatched: true }
              : card
          ));
          setMatchedPairs(prev => prev + 1);
          setScore(prev => prev + 100);
          setFlippedCards([]);
        } else {
          // Hide cards after delay
          setTimeout(() => {
            setFlippedCards([]);
          }, 1000);
        }
      }
    }
  };

  // Check game completion
  useEffect(() => {
    if (matchedPairs === questions.length) {
      const finalScore = Math.max(0, score - (moves * 10) - (timer * 2));
      onGameComplete(finalScore);
    }
  }, [matchedPairs, questions.length, moves, timer, score, onGameComplete]);

  return (
    <div className="p-4">
      {/* Game Stats */}
      <div className="flex justify-between mb-6">
        <div className="text-black">
          Moves: {moves}
        </div>
        <div className="text-black">
          Time: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
        </div>
        <div className="text-black">
          Score: {score}
        </div>
      </div>

      {/* Game Grid */}
      <div className="grid grid-cols-4 gap-4">
        <AnimatePresence>
          {cards.map(card => (
            <motion.div
              key={card.id}
              className={`aspect-w-3 aspect-h-4 cursor-pointer ${
                card.isMatched ? 'opacity-50' : ''
              }`}
              initial={{ rotateY: 0 }}
              animate={{ rotateY: card.isMatched || flippedCards.includes(card.id) ? 180 : 0 }}
              transition={{ duration: 0.6 }}
              onClick={() => handleCardClick(card.id)}
            >
              <div className={`w-full h-full rounded-lg border-2 ${
                card.isMatched || flippedCards.includes(card.id)
                  ? 'bg-white border-green-500'
                  : 'bg-purple-100 border-purple-300'
              } flex items-center justify-center p-4 shadow-md transform transition-transform duration-300 hover:scale-105`}>
                <div className={`text-center ${
                  card.isMatched || flippedCards.includes(card.id) ? '' : 'opacity-0'
                }`}>
                  <p className="text-sm font-medium text-black">
                    {card.content}
                  </p>
                  <span className="text-xs text-gray-500">
                    {card.type === 'question' ? 'Question' : 'Answer'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Game Complete Message */}
      {matchedPairs === questions.length && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-6 rounded-xl text-center"
          >
            <h2 className="text-2xl font-bold text-black mb-4">Congratulations!</h2>
            <p className="text-black mb-2">You completed the memory game!</p>
            <p className="text-black mb-4">
              Final Score: {Math.max(0, score - (moves * 10) - (timer * 2))}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Play Again
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
} 