import React from 'react';
import TeacherSidebar from '@/components/layout/TeacherSidebar';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#0a0a0a] p-6">
      <TeacherSidebar />
      <div className="flex flex-1 bg-white rounded-3xl overflow-hidden">
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
} 