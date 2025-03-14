'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function StudentsPage() {
  const { t, language } = useLanguage();
  const [showOverlay, setShowOverlay] = useState(true);
  
  const students = [
    {
      name: 'Alex Johnson',
      email: 'alex.j@school.edu',
      grade: '10th',
      class: 'Physics A',
      avatar: '/avatars/student1.jpg',
      performance: 92,
      status: 'Active',
      lastActive: '2 hours ago'
    },
    {
      name: 'Sarah Williams',
      email: 'sarah.w@school.edu',
      grade: '10th',
      class: 'Physics A',
      avatar: '/avatars/student2.jpg',
      performance: 88,
      status: 'In Class',
      lastActive: '5 mins ago'
    },
    // Add more students
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

      {/* Main Content - Fixed text colors */}
      <div className="flex h-full gap-6 p-6">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-black">Students</h1>
              <p className="text-black">Manage your class roster and student performance</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 text-black bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                Import Students
              </button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Add Student
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-4 px-6 text-sm font-medium text-black">Student</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-black">Class</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-black">Performance</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-black">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-black">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <Image
                            src={student.avatar}
                            alt={student.name}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                          <div>
                            <div className="font-medium text-black">{student.name}</div>
                            <div className="text-sm text-black">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-black">{student.class}</div>
                        <div className="text-xs text-black">{student.grade} Grade</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500" 
                              style={{ width: `${student.performance}%` }}
                            />
                          </div>
                          <span className="text-sm text-black">{student.performance}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${student.status === 'Active' ? 'bg-green-100 text-green-800' : 
                            student.status === 'In Class' ? 'bg-blue-100 text-blue-800' : 
                            'bg-gray-100 text-black'}`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button className="p-1 hover:bg-gray-100 rounded-lg" title="View Grades">
                            <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded-lg" title="Send Message">
                            <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded-lg" title="More Actions">
                            <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 