'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function DetailedSchedule() {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-gray-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold">Today</h1>
            <div className="text-sm text-gray-500">June 28th</div>
          </div>
        </div>
        <button className="px-4 py-2 bg-blue-500 text-white rounded-full flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Add task
        </button>
      </div>
    </div>
  );
} 