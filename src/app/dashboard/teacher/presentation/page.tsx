"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PresentationViewer from '@/components/PresentationViewer';
import type { Slide } from '@/types/presentation';
import { PageTitle } from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';

// Create a wrapper component that uses searchParams
function PresentationEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const presentationId = searchParams?.get('id') || 'default-presentation';
  const [isEditing, setIsEditing] = useState(false);
  
  // In a real app, you would fetch this data from an API
  const [presentation, setPresentation] = useState({
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
    setIsEditing(true);
  };

  const handleSave = (updatedSlides?: Slide[]) => {
    if (updatedSlides) {
      setPresentation({
        ...presentation,
        slides: updatedSlides
      });
    }
    setIsEditing(false);
    toast.success(t('presentationSaved'));
  };

  const handlePublish = () => {
    // In a real app, you would publish this presentation to make it available to students
    toast.success(t('presentationPublished'));
  };

  // Responsive layout for mobile and desktop views
  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-4 md:p-6 border-b bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <PageTitle 
            title={t('presentationEditor')} 
            description={t('createEditPresentation')} 
          />
          
          <div className="flex space-x-3">
            {isEditing ? (
              <Button 
                onClick={() => handleSave()}
              >
                {t('saveChanges')}
              </Button>
            ) : (
              <>
                <Button 
                  onClick={handleEdit}
                  variant="outline"
                >
                  {t('edit')}
                </Button>
                <Button 
                  onClick={handlePublish}
                >
                  {t('publish')}
                </Button>
              </>
            )}
          </div>
        </div>
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
export default function TeacherPresentationPage() {
  const { t } = useLanguage();
  
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">{t('loading')}</span>
      </div>
    }>
      <PresentationEditorContent />
    </Suspense>
  );
} 