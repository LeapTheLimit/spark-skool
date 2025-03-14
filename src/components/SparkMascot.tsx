'use client';

import React, { useState, useEffect } from 'react';

interface SparkMascotProps {
  width?: number;
  height?: number;
  className?: string;
  blinking?: boolean;
  variant?: 'blue' | 'white' | 'yellow' | 'teal' | 'purple' | 'orange' | 'rose' | 'indigo' | 'emerald' | 'amber';
  toolType?: 'grader' | 'creator' | 'games' | 'homework' | 'feedback' | 'analytics' | 'planner' | 'rubric' | 'default';
  isTeacherContext?: boolean;
}

const SparkMascot: React.FC<SparkMascotProps> = ({
  width = 120,
  height = 120,
  className = '',
  blinking = false,
  variant = 'blue',
  toolType = 'default',
  isTeacherContext = true
}) => {
  // For teacher context, completely disable the blinking state
  // Don't even initialize the blinking state or effect for teacher context
  const [isBlinking, setIsBlinking] = useState(false);
  
  useEffect(() => {
    // Only run animation code if NOT in teacher context
    if (isTeacherContext) return;
    
    if (!blinking) return;
    
    // Random blinking effect
    const blinkInterval = setInterval(() => {
      // Random blink
      setIsBlinking(true);
      
      // Reset after 200ms
      setTimeout(() => {
        setIsBlinking(false);
      }, 200);
    }, Math.random() * 5000 + 3000); // Blink every 3-8 seconds
    
    return () => clearInterval(blinkInterval);
  }, [blinking, isTeacherContext]);

  // Choose color based on variant
  const getColor = () => {
    switch (variant) {
      case 'white': return '#FFFFFF';
      case 'yellow': return '#FCD34D';
      case 'teal': return '#0D9488';
      case 'purple': return '#8B5CF6';
      case 'orange': return '#FB923C';
      case 'rose': return '#FB7185';
      case 'indigo': return '#6366F1';
      case 'emerald': return '#10B981';
      case 'amber': return '#F59E0B';
      default: return '#3AB7FF'; // blue
    }
  };

  // Force eyes to be fully open for teacher context
  const eyeHeight = isTeacherContext ? 12 : (isBlinking ? 2 : 12);
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 140 140" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Head */}
      <circle cx="70" cy="70" r="70" fill={getColor()} />
      
      {/* Left Eye */}
      <circle cx="45" cy="60" r="12" fill="white" />
      <ellipse cx="45" cy="60" rx="8" ry={eyeHeight} fill="black" />
      
      {/* Right Eye */}
      <circle cx="95" cy="60" r="12" fill="white" />
      <ellipse cx="95" cy="60" rx="8" ry={eyeHeight} fill="black" />
      
      {/* Smile */}
      <path d="M45 90C55 106 85 106 95 90" stroke="black" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
};

export default SparkMascot; 