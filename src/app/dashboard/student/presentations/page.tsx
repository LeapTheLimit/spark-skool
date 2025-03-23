"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageTitle } from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

// Mock data for presentations
const MOCK_PRESENTATIONS = [
  {
    id: 'physics-intro',
    title: 'Introduction to Physics',
    thumbnailUrl: '/images/presentations/physics.jpg',
    date: '2023-11-15',
    slides: 15,
    subject: 'Science'
  },
  {
    id: 'world-history',
    title: 'World History: Ancient Civilizations',
    thumbnailUrl: '/images/presentations/history.jpg',
    date: '2023-11-10',
    slides: 22,
    subject: 'History'
  },
  {
    id: 'math-algebra',
    title: 'Algebra Fundamentals',
    thumbnailUrl: '/images/presentations/math.jpg',
    date: '2023-11-08',
    slides: 18,
    subject: 'Math'
  },
  {
    id: 'literature-analysis',
    title: 'Literary Analysis Techniques',
    thumbnailUrl: '/images/presentations/literature.jpg',
    date: '2023-11-05',
    slides: 12,
    subject: 'English'
  }
];

export default function StudentPresentationsPage() {
  const router = useRouter();
  const [presentations] = useState(MOCK_PRESENTATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter presentations based on search query
  const filteredPresentations = presentations.filter(presentation => 
    presentation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    presentation.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <PageTitle 
            title="Class Presentations" 
            description="Browse and view presentations from your teachers"
          />
          
          <div className="relative">
            <input
              type="text"
              placeholder="Search presentations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64 text-black bg-white"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPresentations.map((presentation) => (
            <div 
              key={presentation.id}
              className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1"
            >
              <div className="h-40 bg-gray-200 relative">
                {/* Use a default placeholder for demo, in real app use actual thumbnails */}
                <div className="absolute inset-0 flex items-center justify-center bg-blue-50">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                  </div>
                </div>
                <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                  {presentation.subject}
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-medium text-lg mb-1 text-black line-clamp-2">{presentation.title}</h3>
                <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
                  <span>{new Date(presentation.date).toLocaleDateString()}</span>
                  <span>{presentation.slides} slides</span>
                </div>
                
                <Link 
                  href={`/dashboard/student/presentation?id=${presentation.id}`}
                  className="w-full block"
                >
                  <Button className="w-full">
                    View Presentation
                  </Button>
                </Link>
              </div>
            </div>
          ))}
          
          {filteredPresentations.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-gray-100 rounded-full p-4 mb-4">
                <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-black mb-1">No presentations found</h3>
              <p className="text-gray-600">Try adjusting your search or check back later for new content</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 