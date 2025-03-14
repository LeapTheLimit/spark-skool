'use client';

import React from 'react';
import { StudentBottomNav } from '@/components/student/BottomNav';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8F9FE]">
      <main className="pb-20">
        {children}
      </main>
      <StudentBottomNav />
    </div>
  );
} 