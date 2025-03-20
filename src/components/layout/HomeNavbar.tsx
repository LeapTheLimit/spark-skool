'use client';

import Link from 'next/link';
import React from 'react';
import type { Route } from 'next';

export default function HomeNavbar() {
  return (
    <nav className="border-b bg-white/80 backdrop-blur-md dark:bg-gray-900/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href={'/auth/login' as Route} className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              SPARK SKOOL
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <Link href={'/dashboard/teacher' as Route} className="text-sm hover:text-blue-600">
              Teachers
            </Link>
            <Link href={'/dashboard/student' as Route} className="text-sm hover:text-purple-600">
              Students
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 