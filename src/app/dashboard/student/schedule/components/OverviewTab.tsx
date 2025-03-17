'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

const upcomingEvents = [
  {
    title: 'Math Study Group',
    description: 'Join live practice session with classmates',
    enrolled: 8,
    color: 'bg-blue-500',
    link: '/sessions/math-practice'
  },
  {
    title: 'Biology Review',
    description: 'Chapter 5: Cell Structure review',
    enrolled: 12,
    color: 'bg-purple-500',
    link: '/sessions/biology-study'
  }
];

export default function OverviewTab() {
  return (
    <div className="space-y-6">
      {/* ... rest of your code ... */}
    </div>
  );
} 