'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';

interface FlashcardMemoryProps {
  cards: {
    id: number;
    front: string;
    back: string;
    imageUrl?: string;
    category?: string;
  }[];
  onGameComplete: (score: number) => void;
  theme?: {
    mainColor: string;
    accentColor: string;
    icon: string;
  };
}

interface CardState {
  id: number;
  isFlipped: boolean;
  isMatched: boolean;
  isRevealed: boolean;
}

export default function FlashcardMemory({ cards, onGameComplete, theme }: FlashcardMemoryProps) {
  const { t } = useLanguage();
  const [gameCards, setGameCards] = useState<CardState[]>([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [currentCard, setCurrentCard] = useState<number | null>(null);
  const [showFront, setShowFront] = useState(true);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [mastered, setMastered] = useState<number[]>([]);
  const [needsPractice, setNeedsPractice] = useState<number[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Initialize game
  useEffect(() => {
    const initialCards = cards.map(card => ({
      id: card.id,
      isFlipped: false,
      isMatched: false,
      isRevealed: false
    }));
    setGameCards(initialCards);
  }, [cards]);

  // Handle card flip
  const handleCardFlip = (cardId: number) => {
    if (!gameStarted) {
      setGameStarted(true);
    }

    const card = gameCards.find(c => c.id === cardId);
    if (!card || card.isMatched) return;

    setMoves(prev => prev + 1);
    setGameCards(prev =>
      prev.map(c =>
        c.id === cardId
          ? { ...c, isFlipped: !c.isFlipped }
          : c
      )
    );

    if (currentCard === null) {
      setCurrentCard(cardId);
    } else {
      // Check for match
      const firstCard = cards.find(c => c.id === currentCard);
      const secondCard = cards.find(c => c.id === cardId);
      
      if (firstCard && secondCard) {
        if (showFront ? firstCard.back === secondCard.back : firstCard.front === secondCard.front) {
          // Match found
          setGameCards(prev =>
            prev.map(c =>
              c.id === cardId || c.id === currentCard
                ? { ...c, isMatched: true }
                : c
            )
          );
          setScore(prev => prev + 100);
          setMastered(prev => [...prev, cardId, currentCard]);
        } else {
          // No match
          setTimeout(() => {
            setGameCards(prev =>
              prev.map(c =>
                c.id === cardId || c.id === currentCard
                  ? { ...c, isFlipped: false }
                  : c
              )
            );
            setNeedsPractice(prev => [...prev, cardId, currentCard]);
          }, 1000);
        }
      }
      setCurrentCard(null);
    }
  };

  // Handle review mode
  const handleReviewMode = () => {
    setIsReviewMode(true);
    setReviewIndex(0);
    setGameCards(prev =>
      prev.map(c => ({ ...c, isFlipped: false, isRevealed: false }))
    );
  };

  const handleNextCard = () => {
    if (reviewIndex < cards.length - 1) {
      setReviewIndex(prev => prev + 1);
      setShowHint(false);
    } else {
      setIsReviewMode(false);
    }
  };

  const handlePrevCard = () => {
    if (reviewIndex > 0) {
      setReviewIndex(prev => prev - 1);
      setShowHint(false);
    }
  };

  // Check game completion
  useEffect(() => {
    if (gameCards.every(card => card.isMatched)) {
      const finalScore = Math.max(0, score - (moves * 5));
      onGameComplete(finalScore);
    }
  }, [gameCards, score, moves, onGameComplete]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Game Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-black">{t('score')}: {score}</div>
          <div className="text-lg text-black">{t('moves')}: {moves}</div>
        </div>
        <button
          onClick={handleReviewMode}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {t('reviewCards')}
        </button>
      </div>

      {/* Game Board */}
      {!isReviewMode ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {gameCards.map((card, index) => {
            const cardData = cards.find(c => c.id === card.id);
            return (
              <motion.div
                key={card.id}
                onClick={() => !card.isFlipped && !card.isMatched && handleCardFlip(card.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                animate={{
                  rotateY: card.isFlipped ? 180 : 0,
                  scale: card.isMatched ? 0.95 : 1
                }}
                className={`aspect-[3/4] cursor-pointer perspective-1000 ${
                  card.isMatched ? 'opacity-60' : ''
                }`}
              >
                <div
                  className={`relative w-full h-full transition-transform duration-300 transform-style-3d ${
                    card.isFlipped ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* Card Front */}
                  <div className="absolute inset-0 bg-white rounded-xl shadow-lg p-4 backface-hidden">
                    <div className="flex flex-col items-center justify-center h-full">
                      {cardData?.imageUrl && (
                        <div className="relative w-full h-48 mb-4">
                          <Image
                            src={cardData.imageUrl}
                            alt={cardData.front}
                            fill
                            className="object-cover rounded-lg"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                      )}
                      <p className="text-center font-medium text-black">
                        {showFront ? cardData?.front : cardData?.back}
                      </p>
                    </div>
                  </div>

                  {/* Card Back */}
                  <div className="absolute inset-0 bg-white rounded-xl shadow-lg p-4 backface-hidden rotate-y-180">
                    <div className="flex flex-col items-center justify-center h-full">
                      <p className="text-center font-medium text-black">
                        {showFront ? cardData?.back : cardData?.front}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Review Mode */
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col items-center">
            <div className="relative w-full max-w-md aspect-[3/4] mb-6">
              {cards[reviewIndex]?.imageUrl && (
                <Image
                  src={cards[reviewIndex].imageUrl}
                  alt={cards[reviewIndex].front}
                  fill
                  className="object-cover rounded-lg"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-white bg-opacity-90">
                <p className="text-2xl font-bold text-black mb-4">
                  {showFront ? cards[reviewIndex]?.front : cards[reviewIndex]?.back}
                </p>
                {showHint && (
                  <p className="text-lg text-black">
                    {showFront ? cards[reviewIndex]?.back : cards[reviewIndex]?.front}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handlePrevCard}
                disabled={reviewIndex === 0}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                {t('previous')}
              </button>
              <button
                onClick={() => setShowHint(!showHint)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {showHint ? t('hideHint') : t('showHint')}
              </button>
              <button
                onClick={handleNextCard}
                disabled={reviewIndex === cards.length - 1}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {reviewIndex === cards.length - 1 ? t('finish') : t('next')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-lg font-medium text-black">
            {t('progress')}: {Math.round((mastered.length / (cards.length * 2)) * 100)}%
          </span>
          <span className="text-lg font-medium text-black">
            {mastered.length / 2} / {cards.length} {t('pairs')}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${(mastered.length / (cards.length * 2)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
} 