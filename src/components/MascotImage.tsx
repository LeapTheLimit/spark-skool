'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface MascotImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

const MascotImage: React.FC<MascotImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div 
        style={{ 
          width: width, 
          height: height, 
          backgroundColor: '#3ab8fe',
          borderRadius: '50%'
        }}
        className={className}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority
      onError={() => setHasError(true)}
    />
  );
};

export default MascotImage; 