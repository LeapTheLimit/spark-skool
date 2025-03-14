'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import Image from 'next/image';

export default function LessonsPage() {
  const { t, language } = useLanguage();
  const [showOverlay, setShowOverlay] = useState(true);

  // Sample lessons data
  const lessons = [
    {
      id: 'les-001',
      title: 'Introduction to Newton\'s Laws',
      subject: 'Physics',
      lastEdited: '2 days ago',
      thumbnail: '/thumbnails/physics.jpg',
    },
    {
      id: 'les-002',
      title: 'Chemical Reactions and Equations',
      subject: 'Chemistry',
      lastEdited: 'Yesterday',
      thumbnail: '/thumbnails/chemistry.jpg',
    },
    {
      id: 'les-003',
      title: 'Cell Structure and Function',
      subject: 'Biology',
      lastEdited: '1 week ago',
      thumbnail: '/thumbnails/biology.jpg',
    }
  ];

  return (
    <div className="relative min-h-screen">
      {/* Coming Soon Overlay */}
      {showOverlay && (
        <div className="absolute inset-0 bg-white bg-opacity-80 z-50 flex flex-col items-center justify-center">
          <div className="text-center max-w-xl px-6">
            <div className="inline-block p-4 bg-orange-500 text-white rounded-full mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-black mb-4">
              {language === 'ar' ? 'قريباً' : language === 'he' ? 'בקרוב' : 'Coming Soon'}
            </h2>
            <p className="text-lg text-black mb-8">
              {language === 'ar' 
                ? 'نحن نعمل على هذه الميزة وستكون متاحة قريبًا. تفقد مرة أخرى لاحقًا!'
                : language === 'he'
                ? 'אנו עובדים על תכונה זו והיא תהיה זמינה בקרוב. בדוק שוב מאוחר יותר!'
                : 'We are working on this feature and it will be available soon. Check back later!'}
            </p>
            <button 
              onClick={() => setShowOverlay(false)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {language === 'ar' 
                ? 'إلقاء نظرة على الواجهة'
                : language === 'he'
                ? 'הצץ בממשק'
                : 'Preview Interface'}
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex h-full gap-6 p-6">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-black">Lessons</h1>
              <p className="text-black">Create and manage your lesson plans</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 text-black bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                Import Lesson
              </button>
              <Link href="#" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Create Lesson
              </Link>
            </div>
          </div>

          {/* Lesson Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson) => (
              <div key={lesson.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-36 bg-gray-200 relative">
                  {lesson.thumbnail && (
                    <Image
                      src={lesson.thumbnail}
                      alt={lesson.title}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-black mb-1">{lesson.title}</h3>
                  <p className="text-sm text-black mb-3">{lesson.subject}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-black">Last edited: {lesson.lastEdited}</span>
                    <div className="flex gap-2">
                      <button className="p-1 hover:bg-gray-100 rounded text-black" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded text-black" title="Share">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded text-black" title="More">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add New Lesson Card */}
            <Link href="#">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors h-full flex flex-col items-center justify-center p-8">
                <div className="bg-blue-100 p-3 rounded-full mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="font-semibold text-black mb-1">Create New Lesson</h3>
                <p className="text-sm text-black text-center">Start building a new lesson plan from scratch</p>
              </div>
            </Link>
          </div>

          {/* Empty State (if no lessons) */}
          {lessons.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="bg-blue-100 p-3 inline-flex rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="font-semibold text-black mb-2">No Lessons Created Yet</h3>
              <p className="text-black mb-6">Start by creating your first lesson plan</p>
              <Link href="#" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Create Lesson
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 