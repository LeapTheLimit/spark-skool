import Link from 'next/link';
import React from 'react';

export default function Navbar() {
  return (
    <nav className="border-b bg-white/80 backdrop-blur-md dark:bg-gray-900/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                S
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-gray-900">SPARK SKOOL BETA</h1>
                <p className="text-sm text-gray-500">Demo Version 1.0.0</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/dashboard/teacher" className="text-sm hover:text-blue-600">
              Teachers
            </Link>
            <Link href="/dashboard/student" className="text-sm hover:text-purple-600">
              Students
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 