'use client';

import React from 'react';
import { motion } from 'framer-motion';
import SparkMascot from './SparkMascot';

interface AnimatedSparkMascotProps {
  className?: string;
  width?: number;
  height?: number;
  blinking?: boolean;
  floating?: boolean;
}

const AnimatedSparkMascot: React.FC<AnimatedSparkMascotProps> = ({
  className = '',
  width = 120,
  height = 120,
  blinking = true,
  floating = false
}) => {
  if (!floating) {
    return <SparkMascot width={width} height={height} className={className} blinking={blinking} />;
  }

  return (
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ 
        scale: 1,
        y: [0, -5, 0]
      }}
      transition={{ 
        y: { 
          duration: 2, 
          repeat: Infinity, 
          repeatType: "reverse",
          ease: "easeInOut"
        },
        scale: {
          duration: 0.5
        }
      }}
      className={className}
    >
      <SparkMascot width={width} height={height} blinking={blinking} />
    </motion.div>
  );
};

export default AnimatedSparkMascot; 