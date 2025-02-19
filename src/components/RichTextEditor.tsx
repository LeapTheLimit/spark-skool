'use client';

import React from 'react';

export default function RichTextEditor({ initialContent, onSave }: { 
  initialContent: string;
  onSave: (content: string) => void;
}) {
  return (
    <div className="border rounded-lg p-4">
      {/* Basic textarea as placeholder - implement rich text editor here */}
      <textarea 
        className="w-full h-64 p-2"
        value={initialContent}
        onChange={(e) => onSave(e.target.value)}
      />
    </div>
  );
} 