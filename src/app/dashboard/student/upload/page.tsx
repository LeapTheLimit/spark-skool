'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { extractTextFromImage } from '@/services/ocr';
import { extractTextFromPDF } from '@/services/pdfExtractor';
import { extractQuestionsFromText, gradeStudentSubmission } from '@/services/groq';
import { useRouter } from 'next/navigation';

export default function StudentUploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<any[]>([]);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'info'
  });

  const processFile = async (file: File) => {
    setLoading(true);
    try {
      let text: string | undefined;
      
      if (file.type.includes('image')) {
        text = await extractTextFromImage(file);
      } else if (file.type === 'application/pdf') {
        text = await extractTextFromPDF(file);
      } else {
        throw new Error('Unsupported file type');
      }
      
      if (!text || text.trim() === '') {
        throw new Error('No text could be extracted from the file');
      }

      const extractedAnswers = await extractQuestionsFromText(text);
      setAnswers(extractedAnswers);
      
      setNotification({
        show: true,
        message: 'Answers processed successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error processing file:', error);
      setNotification({
        show: true,
        message: error instanceof Error ? error.message : 'Error processing file',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      await processFile(selectedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    multiple: false
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Here you would implement the grading logic
      // For now, just navigate to a results page
      router.push('/dashboard/student/upload/results');
    } catch (error) {
      setNotification({
        show: true,
        message: 'Error submitting answers',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-8">Submit Your Answers</h1>
        
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div
            {...getRootProps()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-500 transition-colors cursor-pointer"
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className="text-gray-600">Drop the files here ...</p>
            ) : (
              <>
                <div className="mx-auto w-12 h-12 mb-4 text-gray-400">
                  <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-gray-600">Drag and drop your answers here, or click to select</p>
                <p className="text-sm text-gray-500 mt-2">(PDF, Images accepted)</p>
              </>
            )}
          </div>

          {loading && (
            <div className="flex items-center justify-center mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-2 text-gray-600">Processing...</span>
            </div>
          )}

          {answers.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Your Answers</h3>
              <div className="space-y-4">
                {answers.map((answer) => (
                  <div
                    key={answer.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <p className="text-gray-900 mb-2">{answer.question}</p>
                    <p className="text-indigo-600">Your Answer: {answer.answer}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={handleSubmit}
                className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit for Grading'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notification */}
      {notification.show && (
        <div 
          className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
            notification.type === 'success' 
              ? 'bg-green-100 text-green-800' 
              : notification.type === 'error'
              ? 'bg-red-100 text-red-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          <div className="flex items-center">
            <span>{notification.message}</span>
            <button 
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
              className="ml-4 text-current hover:opacity-75"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 