"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PresentationViewer from '@/components/PresentationViewer';
import type { Slide } from '@/types/presentation';
import { PageTitle } from '@/components/ui/PageTitle';
import { useLanguage } from '@/contexts/LanguageContext';

// Create a wrapper component that uses searchParams
function PresentationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const presentationId = searchParams?.get('id') || 'default-presentation';
  
  // In a real app, you would fetch this data from an API
  const [presentation] = useState({
    id: presentationId,
    title: 'Science Class: Introduction to Physics',
    slides: [
      {
        id: 'slide-1',
        title: 'Introduction to Physics',
        content: ['Understanding the fundamental laws of nature', 'How physics explains the world around us', 'Key concepts we will explore in this course'],
        slideType: 'title-slide' as const
      },
      {
        id: 'slide-2',
        title: 'What is Physics?',
        content: [
          'Physics is the natural science that studies matter, its motion and behavior through space and time',
          'It examines the related entities of energy and force',
          'Physics is one of the most fundamental scientific disciplines'
        ],
        slideType: 'standard' as const
      },
      {
        id: 'slide-3',
        title: 'Key Branches of Physics',
        content: [
          'Mechanics: Study of motion and forces',
          'Thermodynamics: Heat, energy, and work',
          'Electromagnetism: Electricity and magnetism',
          'Quantum Physics: Behavior of matter at smallest scales',
          'Relativity: Space-time and gravity'
        ],
        slideType: 'standard' as const
      },
      {
        id: 'slide-4',
        title: 'Famous Physicists',
        content: [
          'Isaac Newton: Laws of motion and universal gravitation',
          'Albert Einstein: Theory of relativity',
          'Marie Curie: Research on radioactivity',
          'Niels Bohr: Quantum theory and atomic structure',
          'Richard Feynman: Quantum electrodynamics'
        ],
        slideType: 'standard' as const
      },
      {
        id: 'slide-5',
        title: 'Course Outline',
        content: [
          'Week 1-2: Foundations and classical mechanics',
          'Week 3-4: Energy, work, and thermodynamics',
          'Week 5-6: Waves, sound, and light',
          'Week 7-8: Electricity and magnetism',
          'Week 9-10: Modern physics concepts'
        ],
        slideType: 'standard' as const
      }
    ] as Slide[],
    templateSettings: {
      layout: 'modern',
      fonts: {
        heading: 'Arial',
        body: 'Arial'
      },
      colors: {
        primary: '#3b82f6',
        secondary: '#93c5fd',
        background: '#ffffff',
        text: '#1e293b'
      }
    }
  });

  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    console.log('Edit presentation');
    // In a real app, you would save these changes to your backend
  };

  // Responsive layout for mobile and desktop views
  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-4 md:p-6 border-b">
        <PageTitle title={t('presentation')} />
      </div>
      
      <div className="flex-1 overflow-hidden">
        <PresentationViewer
          title={presentation.title}
          slides={presentation.slides}
          templateSettings={presentation.templateSettings}
          onEdit={handleEdit}
          onBack={handleBack}
        />
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function PresentationPage() {
  const { t } = useLanguage();
  
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">{t('loading')}</span>
      </div>
    }>
      <PresentationContent />
    </Suspense>
  );
} 