'use client';

import { useState } from 'react';
import { extractTextFromImage } from '@/services/imageProcessingService';
import { toast } from 'react-hot-toast';
import { 
  DocumentTextIcon,
  PhotoIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import { triggerDashboardUpdate, saveGrade } from '@/services/dashboardService';

export default function GradingPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const text = await extractTextFromImage(file);
      setExtractedText(text);
      toast.success('Questions and answers extracted successfully');
    } catch (error) {
      console.error('Image processing failed:', error);
      toast.error('Failed to extract text from image');
    } finally {
      setIsProcessing(false);
    }
  };

  const isArabicFile = (filename: string): boolean => {
    return filename.toLowerCase().includes('arabic') || 
           filename.includes('عربي') || 
           filename.includes('عربية');
  };

  const handleGradeSubmit = async (grade: any) => {
    try {
      await saveGrade(grade);
      toast.success('Grade saved successfully');
    } catch (error) {
      console.error('Failed to save grade:', error);
      toast.error('Failed to save grade');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Auto Grading</h1>
        
        {/* Image Upload Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
            disabled={isProcessing}
          />
          <label
            htmlFor="image-upload"
            className="cursor-pointer flex flex-col items-center justify-center"
          >
            {isProcessing ? (
              <div className="animate-pulse">
                <DocumentTextIcon className="w-12 h-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Processing image...</p>
              </div>
            ) : (
              <>
                <PhotoIcon className="w-12 h-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  Click to upload an image of student work
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Supports handwritten text
                </p>
              </>
            )}
          </label>
        </div>

        {/* Extracted Text Display */}
        {extractedText && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Extracted Text</h2>
            <div className="bg-white rounded-lg shadow p-4">
              <pre className="whitespace-pre-wrap text-sm">{extractedText}</pre>
            </div>
          </div>
        )}

        {/* Grading Interface */}
        {/* Add your existing grading interface here */}
      </div>
    </div>
  );
} 