'use client';

import { useMemo, useEffect } from 'react';
import Image from 'next/image';

interface ClassDetailsProps {
  classId?: string;
}

export default function ClassDetails({ classId }: ClassDetailsProps) {
  // Calculate class status and time
  const classStatus = useMemo(() => {
    const now = new Date();
    const classTime = new Date(now.setHours(now.getHours() + 1)); // Example: class starts in 1 hour
    const diffInMinutes = Math.floor((classTime.getTime() - now.getTime()) / 60000);
    
    return {
      timeLeft: `${diffInMinutes} min`,
      isStartingSoon: diffInMinutes <= 30
    };
  }, []);

  // Monitor class status
  useEffect(() => {
    if (classStatus.isStartingSoon) {
      // Could show notification or update UI
      console.log('Class starting soon!');
    }
  }, [classStatus.isStartingSoon]);

  return (
    <div className="bg-white p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-6">
        <button className="p-2">
          <span>←</span>
        </button>
        <h1 className="text-xl font-bold">English grammar</h1>
      </div>

      <div className="mb-6">
        <p className="text-blue-600">Will start in {classStatus.timeLeft}</p>
      </div>

      <div className="mb-6">
        <h2 className="font-semibold mb-3">Students</h2>
        <div className="flex -space-x-2">
          {['student1', 'student2', 'student3'].map((student, index) => (
            <Image
              key={index}
              src={`/images/avatars/${student}.jpg`}
              alt={`Student ${index + 1}`}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full border-2 border-white"
            />
          ))}
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
            +12
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="font-semibold mb-3">Lessons theme</h2>
        <p className="text-gray-500">
          Review and extend your knowledge of the present simple, present perfect and
          present continuous tenses.
        </p>
      </div>

      <div className="mb-6">
        <h2 className="font-semibold mb-3">Additional materials</h2>
        <div className="flex gap-4">
          {['book1', 'book2'].map((book, index) => (
            <Image
              key={index}
              src={`/images/books/${book}.jpg`}
              alt={`Book ${index + 1}`}
              width={96}
              height={128}
              className="w-24 h-32 object-cover rounded-lg"
            />
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="font-semibold mb-3">Homework</h2>
        <div className="flex items-center gap-2">
          <span>✓</span>
          <span>Attached</span>
        </div>
      </div>

      <button className="w-full bg-black text-white py-3 rounded-xl">
        Join class
      </button>
    </div>
  );
} 