'use client';

import { useState } from 'react';
import { DocumentTextIcon, PencilIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface AIResponseActionsProps {
  content: string;
  onEdit: () => void;
  onSave: () => void;
  onDownload: () => void;
}

export default function AIResponseActions({ content, onEdit, onSave, onDownload }: AIResponseActionsProps) {
  return (
    <div className="mt-4 flex items-center gap-2 border-t pt-4">
      <button
        onClick={onEdit}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <PencilIcon className="w-4 h-4" />
        Edit in Canvas
      </button>
      
      <button
        onClick={onSave}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <DocumentTextIcon className="w-4 h-4" />
        Save to Materials
      </button>
      
      <button
        onClick={onDownload}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ArrowDownTrayIcon className="w-4 h-4" />
        Download PDF
      </button>
    </div>
  );
} 