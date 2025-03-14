'use client';

import { useState, useEffect } from 'react';

interface TypingEffectProps {
  phrases?: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  delayAfterPhrase?: number;
}

const TypingEffect = ({
  phrases = [
    "Creating personalized learning materials...",
    "Generating adaptive assessments...",
    "Analyzing student performance data...",
    "Providing instant feedback on assignments...",
    "Designing custom curriculum pathways...",
    "Grading essays with detailed comments...",
    "Recommending targeted practice exercises..."
  ],
  typingSpeed = 100,
  deletingSpeed = 50,
  delayAfterPhrase = 2000
}: TypingEffectProps) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [delay, setDelay] = useState(typingSpeed);
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isDeleting) {
      // Faster when deleting
      setDelay(deletingSpeed);
      timeout = setTimeout(() => {
        setDisplayText(prev => prev.substring(0, prev.length - 1));
        
        if (displayText === '') {
          setIsDeleting(false);
          setCurrentIndex((prev) => (prev + 1) % phrases.length);
        }
      }, delay);
    } else {
      // Random variation in typing speed
      setDelay(typingSpeed + Math.random() * 50);
      
      const currentPhrase = phrases[currentIndex];
      if (displayText.length < currentPhrase.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentPhrase.substring(0, displayText.length + 1));
        }, delay);
      } else {
        // Pause at the end of typing before deleting
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, delayAfterPhrase);
      }
    }
    
    return () => clearTimeout(timeout);
  }, [displayText, currentIndex, isDeleting, delay, phrases, typingSpeed, deletingSpeed, delayAfterPhrase]);
  
  return (
    <div>
      <span className="text-green-400">AI</span>
      <span className="text-gray-400">@</span>
      <span className="text-blue-400">sparkskool</span>
      <span className="text-gray-400">:~$</span>{' '}
      <span className="text-white">{displayText}</span>
      <span className="inline-block w-2 h-4 ml-1 bg-blue-400 animate-pulse"></span>
    </div>
  );
};

export default TypingEffect; 