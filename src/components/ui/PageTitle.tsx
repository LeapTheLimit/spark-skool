import React from 'react';

interface PageTitleProps {
  title: string;
  description?: string;
}

export const PageTitle: React.FC<PageTitleProps> = ({ title, description }) => {
  return (
    <div className="mb-4">
      <h1 className="text-2xl md:text-3xl font-semibold text-black">{title}</h1>
      {description && (
        <p className="mt-1 text-sm md:text-base text-gray-600">{description}</p>
      )}
    </div>
  );
}; 