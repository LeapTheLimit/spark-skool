'use client';

import { useState, useEffect } from 'react';
import { SavedMaterial } from '@/services/chatService';

const TEACHER_ID = 'teacher123';
const STORAGE_KEY = `materials:${TEACHER_ID}`;

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<SavedMaterial[]>([]);

  useEffect(() => {
    const loadMaterials = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setMaterials(parsed);
        }
      } catch (e) {
        console.error('Failed to load materials:', e);
      }
    };

    loadMaterials();
    window.addEventListener('storage', loadMaterials);
    return () => window.removeEventListener('storage', loadMaterials);
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Saved Materials</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {materials.map((material) => (
          <div
            key={material.id}
            className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">{material.title}</h2>
              <span className={`px-2 py-1 rounded-full text-xs ${
                material.category === 'quiz' 
                  ? 'bg-purple-100 text-purple-700'
                  : material.category === 'lesson'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {material.category}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              {material.content.slice(0, 150)}...
            </p>
            <div className="text-xs text-gray-500">
              Saved on {new Date(material.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 