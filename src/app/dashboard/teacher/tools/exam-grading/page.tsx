'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { 
  ChevronLeftIcon, 
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import type { Route } from 'next';
import { useLanguage } from '@/contexts/LanguageContext';
import SparkMascot from '@/components/SparkMascot';
import { MATERIALS_STORAGE_KEY } from '@/lib/constants';

// Adding missing Question type if not imported from services
interface Question {
  id: string | number;
  question: string;
  answer: string;
  type?: string;
  explanation?: string;
}

// Student submission type
interface StudentSubmission {
  id: string;
  studentName: string;
  file: File;
  timestamp: Date;
  status: 'pending' | 'processing' | 'graded' | 'error';
  score?: number;
  totalScore?: number;
  grades?: { questionId: string; score: number }[];
}

// AskSparkHelper component to provide contextual guidance
function AskSparkHelper({ activeTab, isVisible, setIsVisible }: { 
  activeTab: 'answerKey' | 'submissions' | 'grades', 
  isVisible: boolean, 
  setIsVisible: (visible: boolean) => void 
}) {
  const [expanded, setExpanded] = useState(false);
  const [showGlowAnimation, setShowGlowAnimation] = useState(true);
  
  // Set a timeout to disable the glow after a few seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGlowAnimation(false);
    }, 5000); // 5 seconds animation
    
    return () => clearTimeout(timer);
  }, []);
  
  // Get contextual help message based on current tab
  const getHelpMessage = () => {
    switch(activeTab) {
      case 'answerKey':
        return "Upload a PDF or image of your exam answer key. I'll help extract questions and answers automatically!";
      case 'submissions':
        return "Add student submissions here. You can upload their work and I'll help grade them against your answer key.";
      case 'grades':
        return "Here you can view all grades, analyze performance, and export results for your records.";
      default:
        return "How can I help you use GradeWizard?";
    }
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed bottom-20 right-12 z-50 flex flex-col items-end">
      {expanded && (
        <div className="mb-4 bg-white rounded-lg shadow-lg border border-teal-200 p-4 max-w-xs">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-gray-900">Spark Assistant</h4>
            <button 
              onClick={() => setExpanded(false)} 
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-700">{getHelpMessage()}</p>
          
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center text-xs text-gray-500">
              <span>Need more help?</span>
              <button className="ml-2 px-2 py-1 bg-teal-50 text-teal-600 rounded hover:bg-teal-100">
                View Guide
              </button>
            </div>
          </div>
        </div>
      )}
      
      <button 
        onClick={() => setExpanded(!expanded)} 
        className={`bg-white rounded-full p-3 shadow-lg border ${
          showGlowAnimation ? 'animate-spark-glow border-teal-400' : 'border-teal-200'
        } hover:bg-teal-50 transition-colors`}
      >
        <div className="flex items-center">
          <SparkMascot width={40} height={40} variant="teal" blinking={false} />
          {!expanded && (
            <span className="ml-2 mr-3 text-sm font-medium text-gray-700">Ask Spark</span>
          )}
        </div>
      </button>
    </div>
  );
}

export default function ExamGradingPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const isRTL = language === 'ar' || language === 'he';
  
  const [activeTab, setActiveTab] = useState<'answerKey' | 'submissions' | 'grades'>('answerKey');
  const [examContext, setExamContext] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [processingFile, setProcessingFile] = useState(false);
  
  // Add missing state variables
  const [showMaterialSelector, setShowMaterialSelector] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Student submissions state
  const [studentSubmissions, setStudentSubmissions] = useState<StudentSubmission[]>([]);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentFile, setStudentFile] = useState<File | null>(null);
  const [gradingStudent, setGradingStudent] = useState<string | null>(null);
  
  // Add this new state to control the visibility of the helper
  const [showHelper, setShowHelper] = useState(true);
  
  // Load materials when modal opens
  useEffect(() => {
    if (showMaterialSelector) {
      const stored = localStorage.getItem(MATERIALS_STORAGE_KEY);
      if (stored) {
        try {
          const allMaterials = JSON.parse(stored);
          // Filter for quiz materials only
          const quizMaterials = allMaterials.filter((m: any) => m.category === 'quiz');
          setMaterials(quizMaterials);
        } catch (error) {
          console.error('Error parsing materials:', error);
          setMaterials([]);
        }
      }
    }
  }, [showMaterialSelector]);
  
  // File upload handling for answer key
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      
      // Show processing UI
      setProcessingFile(true);
      
      // Simulate processing (in a real app, you'd process the file here)
      setTimeout(() => {
        setProcessingFile(false);
        
        // Simulate extracted questions
        setQuestions([
          { id: 1, question: "What is the capital of France?", answer: "Paris", type: "short answer" },
          { id: 2, question: "Who wrote Romeo and Juliet?", answer: "William Shakespeare", type: "short answer" },
          { id: 3, question: "What is 2+2?", answer: "4", type: "short answer" }
        ]);
      }, 2000);
    }
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 1
  });
  
  // File upload handling for student submissions
  const onStudentDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setStudentFile(acceptedFiles[0]);
    }
  }, []);
  
  const { 
    getRootProps: getStudentRootProps, 
    getInputProps: getStudentInputProps, 
    isDragActive: isStudentDragActive 
  } = useDropzone({
    onDrop: onStudentDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 1
  });
  
  // Add student submission
  const handleAddSubmission = () => {
    if (studentName && studentFile) {
      const newSubmission: StudentSubmission = {
        id: Date.now().toString(),
        studentName,
        file: studentFile,
        timestamp: new Date(),
        status: 'pending'
      };
      
      setStudentSubmissions([...studentSubmissions, newSubmission]);
      setStudentName('');
      setStudentFile(null);
      setShowSubmissionForm(false);
    }
  };
  
  // Grade a student submission
  const handleGradeSubmission = async (id: string) => {
    if (!questions.length) {
      console.error("No answer key available to grade against");
      return;
    }
    
    setGradingStudent(id);
    
    // Find submission to grade
    const submissionIndex = studentSubmissions.findIndex(s => s.id === id);
    if (submissionIndex === -1) return;
    
    try {
      // Update status to processing
      const updatedSubmissions = [...studentSubmissions];
      updatedSubmissions[submissionIndex].status = 'processing';
      setStudentSubmissions(updatedSubmissions);
      
      const submission = studentSubmissions[submissionIndex];
      
      // Extract text from student submission
      let extractedText = '';
      if (submission.file) {
        try {
          if (submission.file.type.includes('pdf')) {
            // For a real implementation, this would use a PDF extraction service
            // extractedText = await extractTextFromPDF(submission.file);
            extractedText = "This is simulated text from a PDF file for grading purposes.";
          } else if (submission.file.type.includes('image')) {
            // For a real implementation, this would use an OCR service
            // extractedText = await extractTextFromImage(submission.file);
            extractedText = "This is simulated text from an image file for grading purposes.";
          }
        } catch (error) {
          console.error('Error extracting text from submission:', error);
          updatedSubmissions[submissionIndex].status = 'error';
          setStudentSubmissions([...updatedSubmissions]);
          return;
        }
      }
      
      // Simulated grading results
      // In a real implementation, this would use an AI grading service
      // const gradingResults = await gradeStudentSubmission(extractedText, questions, examContext || undefined);
      
      // Generate simulated grading results
      const gradingResults = questions.map(question => {
        // Generate a random score between 0 and 100
        const score = Math.floor(Math.random() * 101);
        // More likely to be correct than not
        const isCorrect = score >= 70;
        
        return {
          questionId: question.id,
          score,
          feedback: isCorrect 
            ? "Good job! The answer matches the expected response." 
            : "Your answer needs improvement. Please review the material.",
          isCorrect,
          confidence: Math.random() * 0.3 + 0.7, // Between 0.7 and 1.0
          matchType: score > 90 ? "exact" : score > 70 ? "semantic" : "partial"
        };
      });
      
      // Calculate total score
      const totalPossiblePoints = questions.length * 100;
      const earnedPoints = gradingResults.reduce((sum, result) => sum + result.score, 0);
      const totalScore = Math.round((earnedPoints / totalPossiblePoints) * 100);
      
      // Update the submission with grades
      updatedSubmissions[submissionIndex].status = 'graded';
      // Convert questionId to string to match the expected type
      const formattedGrades = gradingResults.map(result => ({
        ...result,
        questionId: result.questionId.toString()
      }));
      updatedSubmissions[submissionIndex].grades = formattedGrades;
      updatedSubmissions[submissionIndex].totalScore = totalScore;
      
      // Update state
      setStudentSubmissions([...updatedSubmissions]);
      setGradingStudent(null);
      
      // If there are any graded submissions, automatically switch to grades tab after a delay
      if (updatedSubmissions.some(s => s.status === 'graded')) {
        setTimeout(() => {
          setActiveTab('grades');
        }, 1500);
      }
      
    } catch (error) {
      console.error('Error grading submission:', error);
      
      // Update status to error
      const errorSubmissions = [...studentSubmissions];
      errorSubmissions[submissionIndex].status = 'error';
      setStudentSubmissions(errorSubmissions);
      setGradingStudent(null);
    }
  };
  
  // Delete a student submission
  const handleDeleteSubmission = (id: string) => {
    setStudentSubmissions(studentSubmissions.filter(s => s.id !== id));
  };
  
  // Import from materials
  const importFromMaterials = () => {
    setShowMaterialSelector(true);
  };
  
  // Handle selecting material
  const handleSelectMaterial = (material: any) => {
    try {
      // Format the material - simple implementation
      let materialData;
      if (typeof material.content === 'string') {
        materialData = JSON.parse(material.content);
      } else {
        materialData = material.content;
      }
      
      // Update state with selected material data
      if (materialData.questions) {
        setQuestions(materialData.questions);
      }
      if (materialData.examContext) {
        setExamContext(materialData.examContext);
      }
      
      // Close modal
      setShowMaterialSelector(false);
    } catch (error) {
      console.error('Error processing material:', error);
    }
  };
  
  // Save to materials
  const saveExamToMaterials = () => {
    // This is a placeholder implementation
    alert('Exam saved to materials');
  };

  return (
    <div className={`min-h-screen bg-gray-50 p-6 overflow-auto max-h-screen ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header with back button and title */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-white">
            <div className="flex items-center gap-3">
              <SparkMascot width={36} height={36} variant="teal" />
              <h2 className="text-xl font-bold text-gray-900">GradeWizard</h2>
            </div>
            <Link
              href="/dashboard/teacher/tools" as={"/dashboard/teacher/tools" as Route}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5 mr-1" />
              <span>Back to Superpowers</span>
            </Link>
          </div>
          
          {/* Tab navigation - styled to match card design */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex p-4 space-x-4">
              <button
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'answerKey' 
                    ? 'bg-teal-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab('answerKey')}
              >
                Answer Key
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'submissions' 
                    ? 'bg-teal-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab('submissions')}
              >
                Student Submissions
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'grades' 
                    ? 'bg-teal-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab('grades')}
              >
                Grades
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {activeTab === 'answerKey' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Create Answer Key</h3>
                  <button
                    onClick={importFromMaterials}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                  >
                    <DocumentTextIcon className="w-4 h-4 mr-2" />
                    Import from Materials
                  </button>
                </div>
                
                {/* Exam context input - styled to match our card design */}
                <div className="space-y-2">
                  <label htmlFor="examContext" className="block text-sm font-medium text-gray-700">
                    Exam Context (optional)
                  </label>
                  <input
                    id="examContext"
                    value={examContext}
                    onChange={(e) => setExamContext(e.target.value)}
                    placeholder="e.g., 10th Grade Biology Midterm, Chapter 4-5"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all bg-white text-gray-900"
                  />
                </div>
                
                {/* File upload area with functional dropzone */}
                {file && !processingFile ? (
                  <div className="border-2 border-green-300 rounded-xl p-6 bg-green-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-full">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-green-800">{file.name}</p>
                          <p className="text-sm text-green-600">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => setFile(null)}
                          className="px-3 py-1.5 bg-white text-red-600 border border-red-300 rounded-lg text-sm hover:bg-red-50 transition-colors"
                        >
                          Remove
                        </button>
                        <button
                          onClick={() => setActiveTab('submissions')}
                          className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 transition-colors"
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    {...getRootProps()} 
                    className={`border-2 border-dashed ${isDragActive ? 'border-teal-400 bg-teal-50' : 'border-gray-300 bg-gray-50'} 
                      rounded-xl p-8 hover:bg-gray-100 transition-colors cursor-pointer ${processingFile ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center justify-center text-center">
                      {processingFile ? (
                        <>
                          <div className="mb-4 bg-teal-100 p-3 rounded-full animate-pulse">
                            <svg className="w-8 h-8 text-teal-600 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                          <h4 className="text-lg font-medium text-gray-900 mb-1">Processing your file...</h4>
                          <p className="text-sm text-gray-600">This will just take a moment</p>
                        </>
                      ) : (
                        <>
                          <div className="mb-4 bg-teal-100 p-3 rounded-full">
                            <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-medium text-gray-900 mb-1">
                            {isDragActive ? 'Drop your file here' : 'Drag and drop your answer key file, or click to select'}
                          </h4>
                          <p className="text-sm text-gray-600 mb-4">PDF or Image files accepted</p>
                          <button 
                            onClick={(e) => e.stopPropagation()}
                            className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
                          >
                            Select File
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Display extracted questions if available */}
                {questions.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-900">
                        Questions ({questions.length})
                      </h4>
                      <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm">
                        Save Answer Key
                      </button>
                    </div>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto p-2">
                      {questions.map((question) => (
                        <div 
                          key={question.id}
                          className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex justify-between">
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-2">
                              {question.type || 'Question ' + question.id}
                            </span>
                            <button
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </button>
                          </div>
                          <p className="text-gray-900 mb-2">{question.question}</p>
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-700">Answer:</p>
                            <p className="text-sm text-gray-600">{question.answer}</p>
                          </div>
                          {question.explanation && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-700">Explanation:</p>
                              <p className="text-sm text-gray-600">{question.explanation}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'submissions' && (
              <div>
                {!file ? (
                  // If no answer key uploaded yet
                  <div className="text-center py-8">
                    <div className="inline-block bg-teal-100 p-3 rounded-full mb-3">
                      <ClipboardDocumentCheckIcon className="w-8 h-8 text-teal-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Upload an answer key first</h3>
                    <p className="text-gray-600 mb-6">Upload an answer key first to start accepting student submissions</p>
                    <button 
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
                      onClick={() => setActiveTab('answerKey')}
                    >
                      Go to Answer Key
                    </button>
                  </div>
                ) : showSubmissionForm ? (
                  // Student submission form
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">Add Student Submission</h3>
                      <button
                        onClick={() => setShowSubmissionForm(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="studentName" className="block text-sm font-medium text-gray-700">
                          Student Name
                        </label>
                        <input
                          id="studentName"
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          placeholder="Enter student name"
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all bg-white text-gray-900"
                        />
                      </div>
                      
                      {/* Student file upload */}
                      {studentFile ? (
                        <div className="border-2 border-green-300 rounded-xl p-4 bg-green-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="bg-green-100 p-2 rounded-full">
                                <DocumentIcon className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium text-green-800">{studentFile.name}</p>
                                <p className="text-sm text-green-600">{(studentFile.size / 1024).toFixed(1)} KB</p>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => setStudentFile(null)}
                              className="px-2 py-1 bg-white text-red-600 border border-red-300 rounded-lg text-xs hover:bg-red-50 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          {...getStudentRootProps()} 
                          className={`border-2 border-dashed ${isStudentDragActive ? 'border-teal-400 bg-teal-50' : 'border-gray-300 bg-gray-50'} 
                            rounded-xl p-6 hover:bg-gray-100 transition-colors cursor-pointer`}
                        >
                          <input {...getStudentInputProps()} />
                          <div className="flex flex-col items-center justify-center text-center">
                            <div className="mb-3 bg-teal-100 p-2 rounded-full">
                              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                            </div>
                            <h4 className="text-base font-medium text-gray-900 mb-1">
                              {isStudentDragActive ? 'Drop the file here' : 'Drag and drop student submission, or click to select'}
                            </h4>
                            <p className="text-xs text-gray-600 mb-3">PDF or Image files accepted</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        onClick={handleAddSubmission}
                        disabled={!studentName || !studentFile}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                          !studentName || !studentFile 
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                            : 'bg-teal-600 text-white hover:bg-teal-700'
                        } transition-colors`}
                      >
                        Add Submission
                      </button>
                    </div>
                  </div>
                ) : (
                  // List of student submissions
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">Student Submissions</h3>
                      <button
                        onClick={() => setShowSubmissionForm(true)}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors flex items-center"
                      >
                        <PlusIcon className="w-4 h-4 mr-1" />
                        Add Submission
                      </button>
                    </div>
                    
                    {studentSubmissions.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="inline-block bg-teal-100 p-3 rounded-full mb-3">
                          <UserIcon className="w-6 h-6 text-teal-600" />
                        </div>
                        <h3 className="text-base font-medium text-gray-900 mb-2">No submissions yet</h3>
                        <p className="text-sm text-gray-600 mb-4">Start adding student submissions to grade them</p>
                        <button 
                          onClick={() => setShowSubmissionForm(true)}
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
                        >
                          Add First Submission
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {studentSubmissions.map(submission => (
                          <div 
                            key={submission.id} 
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="bg-gray-100 rounded-full p-2">
                                <UserIcon className="w-5 h-5 text-gray-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{submission.studentName}</h4>
                                <p className="text-xs text-gray-500">
                                  {submission.file?.name} • {submission.file ? (submission.file.size / 1024).toFixed(1) + ' KB' : ''}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {submission.status === 'pending' && (
                                <>
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                    Pending
                                  </span>
                                  <button
                                    onClick={() => handleGradeSubmission(submission.id)}
                                    className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs hover:bg-teal-700 transition-colors"
                                  >
                                    Grade
                                  </button>
                                </>
                              )}
                              
                              {submission.status === 'processing' && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs flex items-center">
                                  <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Grading...
                                </span>
                              )}
                              
                              {submission.status === 'error' && (
                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                                  Error
                                </span>
                              )}
                              
                              {submission.status === 'graded' && (
                                <>
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs flex items-center">
                                    Score: {(submission.totalScore || 0).toFixed(1)}%
                                  </span>
                                  <button
                                    onClick={() => setActiveTab('grades')}
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors"
                                  >
                                    View
                                  </button>
                                </>
                              )}
                              
                              <button
                                onClick={() => handleDeleteSubmission(submission.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {studentSubmissions.length > 0 && studentSubmissions.some(s => s.status === 'graded') && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => setActiveTab('grades')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          View Grading Dashboard
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'grades' && (
              <div>
                {studentSubmissions.filter(s => s.status === 'graded').length === 0 ? (
                  <div className="text-center py-8">
                    <div className="inline-block bg-teal-100 p-3 rounded-full mb-3">
                      <ClipboardDocumentCheckIcon className="w-8 h-8 text-teal-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No grades available yet</h3>
                    <p className="text-gray-600 mb-6">Grade student submissions to see results here</p>
                    <button 
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
                      onClick={() => setActiveTab('submissions')}
                    >
                      Go to Submissions
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">Grades Dashboard</h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={saveExamToMaterials}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          Save to Materials
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                          Export Grades
                        </button>
                      </div>
                    </div>
                    
                    {/* Grade summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-teal-700 mb-1">Average Score</h4>
                        <p className="text-2xl font-bold text-teal-900">
                          {Math.round(studentSubmissions
                            .filter(s => s.status === 'graded' && typeof s.totalScore === 'number')
                            .reduce((acc, curr) => acc + (curr.totalScore || 0), 0) / 
                            Math.max(1, studentSubmissions.filter(s => s.status === 'graded').length)
                          )}%
                        </p>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-700 mb-1">Graded Submissions</h4>
                        <p className="text-2xl font-bold text-blue-900">
                          {studentSubmissions.filter(s => s.status === 'graded').length} / {studentSubmissions.length}
                        </p>
                      </div>
                      
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-green-700 mb-1">Passing Rate</h4>
                        <p className="text-2xl font-bold text-green-900">
                          {studentSubmissions.filter(s => s.status === 'graded').length > 0 ? 
                            Math.round(studentSubmissions
                              .filter(s => s.status === 'graded' && (s.totalScore || 0) >= 70).length / 
                              studentSubmissions.filter(s => s.status === 'graded').length * 100
                            ) : 0}%
                        </p>
                      </div>
                    </div>
                    
                    {/* Question performance analysis */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Question Performance</h4>
                      
                      <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                        {questions.map((question) => {
                          // Calculate percentage of correct answers for this question
                          const questionResults = studentSubmissions
                            .filter(s => s.status === 'graded')
                            .flatMap(s => s.grades || [])
                            .filter(g => g.questionId === question.id);
                          
                          const correctCount = questionResults.filter(g => g.score >= 80).length;
                          const totalCount = Math.max(1, questionResults.length);
                          const correctPercentage = (correctCount / totalCount) * 100;
                          
                          return (
                            <div key={question.id} className="bg-gray-50 p-3 border rounded-lg">
                              <p className="text-sm text-gray-900 mb-2 line-clamp-1">
                                <span className="font-medium">Q{question.id}:</span> {question.question}
                              </p>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className={`h-2.5 rounded-full ${
                                    correctPercentage >= 70 ? 'bg-green-600' : 
                                    correctPercentage >= 40 ? 'bg-yellow-500' : 'bg-red-600'
                                  }`}
                                  style={{ width: `${correctPercentage}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs mt-1">
                                <span className="text-gray-600">{correctCount} correct</span>
                                <span className="text-gray-600">{correctPercentage.toFixed(0)}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Student grades table */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-sm font-medium text-gray-500 uppercase tracking-wider">
                              Student
                            </th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-4 py-3 text-sm font-material text-gray-500 uppercase tracking-wider">
                              Score
                            </th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {studentSubmissions.map(submission => (
                            <tr key={submission.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {submission.studentName}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {submission.status === 'pending' && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                    Pending
                                  </span>
                                )}
                                
                                {submission.status === 'processing' && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                    Processing
                                  </span>
                                )}
                                
                                {submission.status === 'error' && (
                                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                                    Error
                                  </span>
                                )}
                                
                                {submission.status === 'graded' && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                    Graded
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {submission.status === 'graded' ? (
                                  <span className={`font-medium ${
                                    (submission.totalScore || 0) >= 90 ? 'text-green-600' :
                                    (submission.totalScore || 0) >= 70 ? 'text-blue-600' :
                                    'text-orange-600'
                                  }`}>
                                    {(submission.totalScore || 0).toFixed(1)}%
                                  </span>
                                ) : (
                                  <span className="text-gray-500">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {submission.status === 'graded' && (
                                  <button className="px-3 py-1 text-blue-600 hover:text-blue-800 font-medium">
                                    View Details
                                  </button>
                                )}
                                
                                {submission.status === 'pending' && (
                                  <button 
                                    onClick={() => handleGradeSubmission(submission.id)}
                                    className="px-3 py-1 text-teal-600 hover:text-teal-800 font-medium"
                                  >
                                    Grade Now
                                  </button>
                                )}
                                
                                {submission.status === 'error' && (
                                  <button 
                                    onClick={() => handleGradeSubmission(submission.id)}
                                    className="px-3 py-1 text-red-600 hover:text-red-800 font-medium"
                                  >
                                    Retry
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Material Selector Modal */}
      {showMaterialSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium text-gray-900">
                Select Exam from Materials
              </h2>
              <button 
                onClick={() => setShowMaterialSelector(false)}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {materials.length > 0 ? (
              <div className="space-y-4">
                {materials.map((material) => (
                  <div 
                    key={material.id}
                    onClick={() => handleSelectMaterial(material)}
                    className="p-4 border rounded-lg hover:bg-blue-50 cursor-pointer"
                  >
                    <h3 className="font-medium text-gray-900 mb-1">{material.title || 'Untitled Exam'}</h3>
                    <button 
                      className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full"
                    >
                      Load This Exam
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-block bg-gray-100 p-3 rounded-full mb-3">
                  <DocumentTextIcon className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-gray-700 mb-4">No exam materials found. Create and save some exams first.</p>
                <button
                  onClick={() => setShowMaterialSelector(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Ask Spark Helper */}
      <AskSparkHelper 
        activeTab={activeTab} 
        isVisible={showHelper} 
        setIsVisible={setShowHelper} 
      />
      
      {/* Updated animation styles for the Ask Spark button */}
      <style jsx global>{`
        @keyframes spark-glow {
          0% {
            box-shadow: 0 0 5px rgba(13, 148, 136, 0.5);
            border-color: rgba(13, 148, 136, 0.5);
          }
          50% {
            box-shadow: 0 0 15px rgba(13, 148, 136, 0.8);
            border-color: rgba(13, 148, 136, 0.8);
          }
          100% {
            box-shadow: 0 0 5px rgba(13, 148, 136, 0.5);
            border-color: rgba(13, 148, 136, 0.5);
          }
        }
        
        .animate-spark-glow {
          animation: spark-glow 1.5s ease-in-out infinite;
          border-width: 2px;
        }
      `}</style>
    </div>
  );
} 