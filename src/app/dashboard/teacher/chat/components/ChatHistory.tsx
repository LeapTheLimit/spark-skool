'use client';

import { useState } from 'react';

export default function ChatHistory() {
  const [searchQuery, setSearchQuery] = useState('');

  const chatCategories = [
    {
      title: "Lesson Plans",
      chats: [
        {
          id: 1,
          title: "Physics Forces Unit Plan",
          preview: "Generated complete unit plan for Newton's Laws",
          date: "2 hours ago",
          tags: ["Physics", "Unit Planning"]
        },
        {
          id: 2,
          title: "Chemistry Lab Safety",
          preview: "Created lab safety guidelines and procedures",
          date: "Yesterday",
          tags: ["Chemistry", "Safety"]
        }
      ]
    },
    {
      title: "Assessments",
      chats: [
        {
          id: 3,
          title: "Biology Mid-term Quiz",
          preview: "Generated 25 multiple choice questions",
          date: "3 days ago",
          tags: ["Biology", "Quiz"]
        }
      ]
    },
    {
      title: "Student Feedback",
      chats: [
        {
          id: 4,
          title: "Term Project Feedback",
          preview: "Generated personalized feedback for 24 students",
          date: "1 week ago",
          tags: ["Feedback", "Projects"]
        }
      ]
    }
  ];

  const filteredCategories = chatCategories.map(category => ({
    ...category,
    chats: category.chats.filter(chat => 
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })).filter(category => category.chats.length > 0);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4">
        <div className="relative">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chat history..."
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <svg
            className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filteredCategories.map((category) => (
          <div key={category.title} className="mb-8">
            <h2 className="text-sm font-medium text-gray-500 mb-4">{category.title}</h2>
            <div className="space-y-3">
              {category.chats.map((chat) => (
                <div
                  key={chat.id}
                  className="p-4 bg-white rounded-xl hover:bg-gray-50 cursor-pointer transition-all border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{chat.title}</h3>
                    <span className="text-sm text-gray-500">{chat.date}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{chat.preview}</p>
                  <div className="flex gap-2">
                    {chat.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 