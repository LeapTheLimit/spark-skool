'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone, FileRejection } from 'react-dropzone';
import { 
  ChevronLeftIcon, 
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
  DocumentIcon,
  PhotoIcon,
  XMarkIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import type { Route } from 'next';
import { useLanguage } from '@/contexts/LanguageContext';
import SparkMascot from '@/components/SparkMascot';
import { MATERIALS_STORAGE_KEY } from '@/lib/constants';
import { extractTextFromPDF } from '@/services/pdfExtractor';
import { extractTextFromImage, processImage } from '@/services/ocr';
import { gradeStudentSubmission, extractQuestionsWithGroq, analyzeExamContext, Question } from '@/services/groq';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Camera } from '@/components/Camera';
import { toast } from 'react-hot-toast';
import { saveAnswerKey, getAnswerKey } from '@/services/storage';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import SaveMaterialButton from '@/components/SaveMaterialButton';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: {
      head: string[][];
      body: string[][];
      startY: number;
      styles?: {
        fontSize?: number;
      };
      headStyles?: {
        fillColor?: number[];
      };
    }) => void;
  }
}

// Student submission type
interface StudentSubmission {
  id: string;
  studentName: string;
  file: File;
  timestamp: Date;
  status: 'pending' | 'processing' | 'graded' | 'error';
  totalScore?: number;
  grades?: Array<{
    questionId: string;
    score: number;
    answer: string;
    reasoning: string;
    feedback: string;
    isCorrect: boolean;
    confidence: number;
  }>;
}

// Add this type for saved exam data
interface SavedExamData {
  questions: Question[];
  submissions: StudentSubmission[];
  metadata: {
    savedAt: string;
    totalSubmissions: number;
    averageScore: number;
  };
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

// Update the GradingResultCard component
const GradingResultCard = ({ result, question, onScoreUpdate }: { 
  result: { 
    questionId: number;
    score: number;
    answer: string;
    reasoning: string;
    feedback: string;
    confidence: number;
  };
  question: Question;
  onScoreUpdate?: (questionId: number, newScore: number) => void;
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedScore, setEditedScore] = useState(result.score);
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-blue-100 text-blue-800';
    return 'bg-red-100 text-red-800';
  };
  
  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.5) return 'Medium';
    return 'Low';
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <h4 className="font-medium text-gray-900">Question {result.questionId}</h4>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(result.score)}`}>
            Score: {result.score}%
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700`}>
            Confidence: {getConfidenceLabel(result.confidence)}
          </span>
        </div>
        {onScoreUpdate && (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editedScore}
                  onChange={(e) => setEditedScore(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-16 px-2 py-1 border rounded text-sm"
                />
                <button
                  onClick={() => {
                    onScoreUpdate(result.questionId, editedScore);
                    setIsEditing(false);
                  }}
                  className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedScore(result.score);
                  }}
                  className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Edit Score
              </button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm font-medium text-gray-700 mb-1">Question:</p>
          <p className="text-gray-900">{question.question}</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-sm font-medium text-blue-700 mb-1">Student's Answer:</p>
          <p className="text-blue-900">{result.answer || 'No answer provided'}</p>
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
        >
          {showDetails ? 'Hide' : 'Show'} Grading Details
          <ChevronLeftIcon className={`w-4 h-4 transform transition-transform ${
            showDetails ? 'rotate-90' : '-rotate-90'
          }`} />
        </button>

        {showDetails && (
          <div className="space-y-3">
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-sm font-medium text-purple-700 mb-1">Grading Reasoning:</p>
              <p className="text-sm text-purple-900">{result.reasoning}</p>
            </div>

            {result.feedback && (
              <div className="bg-yellow-50 rounded-lg p-3">
                <p className="text-sm font-medium text-yellow-700 mb-1">Feedback:</p>
                <p className="text-sm text-yellow-900">{result.feedback}</p>
              </div>
            )}

            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm font-medium text-green-700 mb-1">Correct Answer:</p>
              <p className="text-sm text-green-900">{question.answer}</p>
              {question.reasoning && (
                <>
                  <p className="text-sm font-medium text-green-700 mt-2 mb-1">Answer Explanation:</p>
                  <p className="text-sm text-green-900">{question.reasoning}</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Update the StudentDetailsModal component
const StudentDetailsModal = ({ 
  submission,
  questions,
  onClose,
  onUpdateGrades,
  setSelectedSubmission,
  studentSubmissions,
  setStudentSubmissions
}: { 
  submission: StudentSubmission;
  questions: Question[];
  onClose: () => void;
  onUpdateGrades?: (submissionId: string, updatedGrades: StudentSubmission['grades']) => void;
  setSelectedSubmission: (submission: StudentSubmission | null) => void;
  studentSubmissions: StudentSubmission[];
  setStudentSubmissions: React.Dispatch<React.SetStateAction<StudentSubmission[]>>;
}) => {
  if (!submission.grades) return null;

  const handleScoreUpdate = (questionId: number, newScore: number) => {
    if (!onUpdateGrades || !submission.grades) return;

    // Update the specific grade
    const updatedGrades = submission.grades.map(grade => 
      grade.questionId === questionId.toString() ? { ...grade, score: newScore } : grade
    );

    // Calculate new total score based on points per question
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 10), 0);
    const earnedPoints = updatedGrades.reduce((sum, grade) => {
      const question = questions.find(q => q.id.toString() === grade.questionId);
      const questionPoints = question?.points || 10;
      return sum + ((grade.score / 100) * questionPoints);
    }, 0);

    const newTotalScore = Math.round((earnedPoints / totalPoints) * 100);

    // Update both grades and total score
    onUpdateGrades(submission.id, updatedGrades);
    
    // Update the submission's total score and grades in the parent component
    const updatedSubmission = {
      ...submission,
      grades: updatedGrades,
      totalScore: newTotalScore
    };
    setSelectedSubmission(updatedSubmission);

    // Update the submission in the main submissions list
    const updatedSubmissions = studentSubmissions.map(s =>
      s.id === submission.id ? updatedSubmission : s
    );
    setStudentSubmissions(updatedSubmissions);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-medium text-gray-900">{submission.studentName}</h2>
            <p className="text-sm text-gray-500">
              Submitted on {submission.timestamp.toLocaleDateString()}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {submission.grades.map((grade) => {
            const question = questions.find(q => q.id.toString() === grade.questionId);
            if (!question) return null;
            
            return (
              <GradingResultCard 
                key={grade.questionId} 
                result={{
                  ...grade,
                  questionId: parseInt(grade.questionId)
                }}
                question={question}
                onScoreUpdate={handleScoreUpdate}
              />
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Update the ExportButton component
const ExportButton = ({ 
  submissions,
  questions,
  format 
}: { 
  submissions: StudentSubmission[];
  questions: Question[];
  format: 'csv' | 'pdf';
}) => {
  const generateCSV = () => {
    try {
      // Prepare headers
      const headers = [
        'Student Name',
        'Submission Date',
        'Total Score',
        'Percentage',
        ...questions.map(q => `Q${q.id} Score`),
        ...questions.map(q => `Q${q.id} Feedback`)
      ];

      // Prepare data rows
      const rows = submissions.map(submission => {
        const grades = submission.grades || [];
        const totalScore = submission.totalScore || 0;
        const percentage = totalScore;

        const row = [
          submission.studentName || 'Unknown',
          submission.timestamp.toLocaleDateString(),
          totalScore.toString(),
          percentage.toFixed(1) + '%'
        ];

        // Add individual question scores and feedback
        questions.forEach(q => {
          const grade = grades.find(g => g.questionId === q.id.toString());
          row.push(grade?.score.toString() || '0');
          row.push(grade?.feedback || '');
        });

        return row;
      });

      // Convert to CSV format
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => {
          // Escape commas and quotes in cell content
          const cellStr = String(cell);
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(','))
      ].join('\n');

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `exam-results-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('CSV file exported successfully');
    } catch (error) {
      console.error('Error generating CSV:', error);
      toast.error('Failed to generate CSV file');
    }
  };

  const generatePDF = async (submission: StudentSubmission) => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text('Exam Grading Report', 20, 20);
      doc.setFontSize(12);
      
      // Add date and basic info
      const date = new Date().toLocaleDateString();
      doc.text(`Date: ${date}`, 20, 30);
      doc.text(`Student: ${submission.studentName || 'Unknown'}`, 20, 40);
      doc.text(`Total Score: ${submission.totalScore || 0}%`, 20, 50);
      
      // Calculate statistics
      const grades = submission.grades || [];
      
      // Add summary
      doc.setFontSize(14);
      doc.text('Summary', 20, 70);
      doc.setFontSize(12);
      doc.text(`Total Score: ${submission.totalScore || 0}%`, 20, 80);
      doc.text(`Questions: ${grades.length}`, 20, 90);
      
      // Add questions and answers
      doc.setFontSize(14);
      doc.text('Detailed Results', 20, 110);
      doc.setFontSize(12);
      
      let yPos = 120;
      grades.forEach((grade, index) => {
        // Check if we need a new page
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        const question = questions.find(q => q.id.toString() === grade.questionId);
        if (!question) return;
        
        // Question
        doc.setFont('helvetica', 'bold');
        doc.text(`Question ${index + 1}:`, 20, yPos);
        doc.setFont('helvetica', 'normal');
        const questionLines = doc.splitTextToSize(question.question || 'No question provided', 170);
        doc.text(questionLines, 30, yPos + 5);
        yPos += (questionLines.length * 7) + 10;
        
        // Answer
        doc.setFont('helvetica', 'bold');
        doc.text('Answer:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        const answerLines = doc.splitTextToSize(grade.answer || 'No answer provided', 170);
        doc.text(answerLines, 30, yPos + 5);
        yPos += (answerLines.length * 7) + 10;
        
        // Score
        doc.text(`Score: ${grade.score}%`, 20, yPos);
        yPos += 10;
        
        // Feedback
        if (grade.feedback) {
          doc.setFont('helvetica', 'bold');
          doc.text('Feedback:', 20, yPos);
          doc.setFont('helvetica', 'normal');
          const feedbackLines = doc.splitTextToSize(grade.feedback, 170);
          doc.text(feedbackLines, 30, yPos + 5);
          yPos += (feedbackLines.length * 7) + 15;
        }
        
        yPos += 10;
      });
      
      // Save the PDF
      doc.save(`exam-report-${submission.studentName || 'unknown'}-${date.replace(/\//g, '-')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF report');
    }
  };

  return (
    <button
      onClick={() => {
        if (format === 'csv') {
          generateCSV();
        } else {
          generatePDF(submissions[0]);
        }
      }}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
    >
      <DocumentArrowDownIcon className="w-5 h-5" />
      Export as {format.toUpperCase()}
    </button>
  );
};

export default function ExamGradingPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const isRTL = language === 'ar' || language === 'he';
  
  // Add userId state
  const [userId, setUserId] = useState<string>('default_user');
  
  const [activeTab, setActiveTab] = useState<'answerKey' | 'submissions' | 'grades'>('answerKey');
  const [examContext, setExamContext] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [processingFile, setProcessingFile] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  
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
  
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [showCamera, setShowCamera] = useState(false);
  
  const [answerKeySaved, setAnswerKeySaved] = useState(false);
  const [answerKeyId, setAnswerKeyId] = useState<string | null>(null);
  
  // Add state for the details modal
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  
  // Add state for edit modal
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
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
  
  // Handle file processing for answer key
  const handleFileUpload = async (file: File) => {
    setProcessingFile(true);
    setProcessingStage('Processing file...');

    try {
      let extractedText = '';
      
      // Extract text from file
      if (file.type.includes('pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        extractedText = await extractTextFromPDF(buffer);
      } else if (file.type.includes('image')) {
        extractedText = await extractTextFromImage(file);
      } else {
        throw new Error('Unsupported file type. Please upload a PDF or image file.');
      }

      if (!extractedText || extractedText.trim().length < 10) {
        throw new Error('No text could be extracted from the file. Please ensure the file contains readable text.');
      }

      setProcessingStage('Analyzing content...');
      
      // Extract questions using Groq
      const extractedQuestions = await extractQuestionsWithGroq(extractedText);
      
      if (!extractedQuestions || extractedQuestions.length === 0) {
        throw new Error('No questions could be identified in the text. Please check the file content.');
      }

      // Process and format questions
      const formattedQuestions = extractedQuestions.map((q, index) => ({
        id: index + 1,
        type: q.type || 'short_answer',
        question: q.question,
        answer: q.answer,
        explanation: q.explanation || '',
        points: q.points || 10,
        difficulty: q.difficulty || 'medium',
        options: q.type === 'multiple_choice' ? q.options : undefined,
        matchingItems: q.type === 'matching' ? q.matchingItems : undefined,
        imageUrl: q.imageUrl,
        formula: q.formula,
        hasLargeText: q.hasLargeText
      }));

      setQuestions(formattedQuestions);
      setFile(file);
      toast.success(`Successfully processed ${formattedQuestions.length} questions`);

      // Try to extract exam context
      try {
        const context = await analyzeExamContext(extractedText);
        if (context) {
          setExamContext(context);
        }
      } catch (error) {
        console.error('Error analyzing exam context:', error);
        // Don't throw here - context is optional
      }

      return extractedText;
    } catch (error) {
      console.error('Error processing file:', error);
      throw error;
    } finally {
      setProcessingFile(false);
      setProcessingStage('');
    }
  };
  
  // File upload handling for answer key
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
      setProcessingFile(true);
    setProcessingStage('Processing file...');

    try {
      // Extract text from file
      let extractedText = '';
      if (file.type.includes('pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        extractedText = await extractTextFromPDF(buffer);
      } else if (file.type.includes('image')) {
        extractedText = await extractTextFromImage(file);
      } else {
        throw new Error('Unsupported file type. Please upload a PDF or image file.');
      }

      if (!extractedText || extractedText.trim().length < 10) {
        throw new Error('No text could be extracted from the file. Please ensure the file contains readable text.');
      }

      setProcessingStage('Analyzing content...');
      
      // Extract questions using Groq
      const extractedQuestions = await extractQuestionsWithGroq(extractedText);
      
      if (!extractedQuestions || extractedQuestions.length === 0) {
        throw new Error('No questions could be identified in the text. Please check the file content.');
      }

      // Process and format questions
      const formattedQuestions = extractedQuestions.map((q, index) => ({
        id: index + 1,
        type: q.type || 'short_answer',
        question: q.question,
        answer: q.answer,
        explanation: q.explanation || '',
        points: q.points || 10,
        difficulty: q.difficulty || 'medium',
        options: q.type === 'multiple_choice' ? q.options : undefined,
        matchingItems: q.type === 'matching' ? q.matchingItems : undefined,
        imageUrl: q.imageUrl,
        formula: q.formula,
        hasLargeText: q.hasLargeText
      }));

      setQuestions(formattedQuestions);
      toast.success(`Successfully processed ${formattedQuestions.length} questions`);

    } catch (error) {
      console.error('Error processing file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process file');
    } finally {
      setProcessingFile(false);
      setProcessingStage('');
    }
  }, []);
  
  // Update the useDropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
    },
    maxFiles: 1,
    maxSize: 10485760, // 10MB
    onDropRejected: (rejectedFiles: FileRejection[]) => {
      const errors = rejectedFiles.map(rejection => {
        if (rejection.file.size > 10485760) return 'File is too large. Maximum size is 10MB.';
        return 'Invalid file type. Please upload a PDF or image file.';
      });
      toast.error(errors[0]);
    }
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
  
  // Handle student submission grading
  const handleGradeSubmission = async (id: string) => {
    if (!questions.length) {
      toast.error('No answer key available. Please upload an answer key first.');
      return;
    }
    
    setGradingStudent(id);
    const submissionIndex = studentSubmissions.findIndex(s => s.id === id);
    if (submissionIndex === -1) return;
    
    try {
      // Update status to processing
      const updatedSubmissions = [...studentSubmissions];
      updatedSubmissions[submissionIndex].status = 'processing';
      setStudentSubmissions(updatedSubmissions);
      
      const submission = studentSubmissions[submissionIndex];
      let extractedText = '';

      // Extract text from submission
          if (submission.file.type.includes('pdf')) {
        const arrayBuffer = await submission.file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        extractedText = await extractTextFromPDF(buffer);
          } else if (submission.file.type.includes('image')) {
        extractedText = await extractTextFromImage(submission.file);
      } else {
        throw new Error('Unsupported file type');
      }

      if (!extractedText || extractedText.trim().length < 10) {
        throw new Error('No text could be extracted from the submission');
      }

      // Grade the submission
      const gradingResults = await gradeStudentSubmission(questions, extractedText);
      
      // Calculate total score
      const totalPossiblePoints = questions.reduce((sum, q) => sum + q.points, 0);
      const earnedPoints = gradingResults.reduce((sum, result) => {
        // Convert percentage score to points
        const questionPoints = questions.find(q => q.id === result.questionId)?.points || 0;
        return sum + (result.score / 100 * questionPoints);
      }, 0);
      
      const totalScore = Math.round((earnedPoints / totalPossiblePoints) * 100);
      
      // Update submission with grades
      updatedSubmissions[submissionIndex] = {
        ...updatedSubmissions[submissionIndex],
        status: 'graded',
        grades: gradingResults.map(result => ({
          questionId: result.questionId.toString(),
          score: result.score,
          answer: result.answer,
          reasoning: result.reasoning,
          feedback: result.feedback,
          isCorrect: result.isCorrect,
          confidence: result.confidence
        })),
        totalScore
      };

      setStudentSubmissions([...updatedSubmissions]);
      toast.success('Grading completed successfully');
      
    } catch (error) {
      console.error('Error grading submission:', error);
      const errorSubmissions = [...studentSubmissions];
      errorSubmissions[submissionIndex].status = 'error';
      setStudentSubmissions(errorSubmissions);
      toast.error(error instanceof Error ? error.message : 'Failed to grade submission');
    } finally {
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

  // Mobile camera capture component
  const CameraCapture = () => {
    if (!isMobile) return null;

    return (
      <div className="mt-4">
        <button
          onClick={() => setShowCamera(true)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2"
        >
          <PhotoIcon className="w-5 h-5" />
          Take Photo of Exam
        </button>

        {showCamera && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-lg">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-medium text-black">Take Photo</h3>
                <button onClick={() => setShowCamera(false)} className="text-gray-500">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <Camera
                onCapture={async (blob) => {
                  const file = new File([blob], 'exam-capture.jpg', { type: 'image/jpeg' });
                  setShowCamera(false);
                  await handleFileUpload(file);
                }}
                onClose={() => setShowCamera(false)}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  // Update the file upload area to include camera option on mobile
  const renderFileUpload = () => (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed ${
          isDragActive ? 'border-teal-400 bg-teal-50' : 'border-gray-300 bg-gray-50'
        } rounded-xl p-8 hover:bg-gray-100 transition-colors cursor-pointer`}
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
              <p className="text-sm text-gray-600">{processingStage || 'This will just take a moment'}</p>
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
              <label 
                className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file);
                    }
                  }}
                />
                Select File
              </label>
            </>
          )}
        </div>
      </div>
      {isMobile && <CameraCapture />}
    </div>
  );

  // Update the save answer key function
  const handleSaveAnswerKey = async () => {
    if (!questions.length) {
      toast.error('No questions to save');
      return;
    }

    try {
      // Add metadata and validation
      const answerKeyData = {
        id: Date.now().toString(),
        questions: questions.map(q => ({
          ...q,
          points: Number(q.points) || 10,
          type: q.type || 'short_answer'
        })),
        examContext,
        timestamp: new Date().toISOString(),
        metadata: {
          questionCount: questions.length,
          totalPoints: questions.reduce((sum, q) => sum + (Number(q.points) || 10), 0),
          types: [...new Set(questions.map(q => q.type))],
          languages: ['eng', 'ara', 'heb']
        }
      };

      await saveAnswerKey(answerKeyData);
      setAnswerKeySaved(true);
      setAnswerKeyId(answerKeyData.id);
      
      toast.success('Answer key saved successfully');
      
      // Show success message with guidance
      toast((t) => (
        <div className="flex flex-col gap-2">
          <p className="font-medium">Answer key saved!</p>
          <button 
            onClick={() => {
              setActiveTab('submissions');
              toast.dismiss(t.id);
            }}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 transition-colors"
          >
            Start Adding Student Submissions
          </button>
        </div>
      ), { duration: 5000 });

      // Automatically navigate to submissions tab after a short delay
      setTimeout(() => {
        setActiveTab('submissions');
      }, 1500);

    } catch (error) {
      console.error('Error saving answer key:', error);
      toast.error('Failed to save answer key. Please try again.');
    }
  };

  // Update the submissions tab check
  const showSubmissionsContent = activeTab === 'submissions' && (answerKeySaved || file);

  // Add answer key retrieval function
  const loadAnswerKey = async (id: string) => {
    try {
      const answerKey = await getAnswerKey(id);
      if (answerKey && answerKey.questions) {
        setQuestions(answerKey.questions);
        setExamContext(answerKey.examContext || '');
        toast.success('Answer key loaded successfully');
      }
    } catch (error) {
      console.error('Error loading answer key:', error);
      toast.error('Failed to load answer key');
    }
  };

  // Add edit question functionality
  const handleEditQuestion = async (questionId: number) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    try {
      const updatedQuestions = [...questions];
      const index = updatedQuestions.findIndex(q => q.id === questionId);
      
      if (index === -1) return;

      // Show edit modal with current question data
      setEditingQuestion(question);
      setShowEditModal(true);
    } catch (error) {
      console.error('Error editing question:', error);
      toast.error('Failed to edit question');
    }
  };

  // Add question edit modal
  const QuestionEditModal = ({ question, onSave, onClose }: any) => {
    const [editedQuestion, setEditedQuestion] = useState(question);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-medium text-black">Edit Question</h2>
            <button onClick={onClose} className="text-gray-900 hover:text-gray-700">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">Question Text</label>
              <textarea
                value={editedQuestion.question}
                onChange={(e) => setEditedQuestion({ ...editedQuestion, question: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 text-black"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">Answer</label>
              <textarea
                value={editedQuestion.answer}
                onChange={(e) => setEditedQuestion({ ...editedQuestion, answer: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 text-black"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">Points</label>
              <input
                type="number"
                value={editedQuestion.points}
                onChange={(e) => setEditedQuestion({ ...editedQuestion, points: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 text-black"
                min={1}
              />
            </div>

            {editedQuestion.type === 'multiple_choice' && (
              <div>
                <label className="block text-sm font-medium text-black mb-1">Options</label>
                {editedQuestion.options?.map((option: string, index: number) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(editedQuestion.options || [])];
                        newOptions[index] = e.target.value;
                        setEditedQuestion({ ...editedQuestion, options: newOptions });
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 text-black"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-black hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSave(editedQuestion);
                onClose();
              }}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add handler for saving edited question
  const handleSaveEditedQuestion = (editedQuestion: Question) => {
    const updatedQuestions = questions.map(q =>
      q.id === editedQuestion.id ? editedQuestion : q
    );
    setQuestions(updatedQuestions);
    toast.success('Question updated successfully');
  };

  const calculateAverageScore = () => {
    if (!studentSubmissions.length) return 0;
    const totalScore = studentSubmissions.reduce((sum, sub) => sum + (sub.totalScore || 0), 0);
    return Math.round((totalScore / studentSubmissions.length) * 100) / 100;
  };

  const handleSaveSuccess = () => {
    toast.success('Exam results saved to materials successfully!');
  };

  // Update the handleBatchGrading function
  const handleBatchGrading = async () => {
    const pendingSubmissions = studentSubmissions.filter((submission: StudentSubmission) => 
      submission.status === 'pending' || submission.status === 'error'
    );
    
    if (pendingSubmissions.length === 0) {
      toast.success('No pending submissions to grade');
      return;
    }

    if (!questions.length) {
      toast.error('No answer key available. Please upload an answer key first.');
      return;
    }

    let completedCount = 0;
    const totalCount = pendingSubmissions.length;

    try {
      // Update UI to show progress
      toast((t) => (
        <div>
          <div className="font-medium">Grading submissions...</div>
          <div className="text-sm mt-1">{completedCount} of {totalCount} complete</div>
        </div>
      ), { duration: 5000 });

      // Process submissions in parallel with a limit
      const batchSize = 3;
      for (let i = 0; i < pendingSubmissions.length; i += batchSize) {
        const batch = pendingSubmissions.slice(i, i + batchSize);
        await Promise.all(batch.map(async (submission: StudentSubmission) => {
          try {
            // Update status to processing
            setStudentSubmissions((prev: StudentSubmission[]) => prev.map((s: StudentSubmission): StudentSubmission => 
              s.id === submission.id ? { ...s, status: 'processing' as const } : s
            ));

            // Extract text from submission
            let extractedText = '';
            if (submission.file.type.includes('pdf')) {
              const arrayBuffer = await submission.file.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              extractedText = await extractTextFromPDF(buffer);
            } else if (submission.file.type.includes('image')) {
              extractedText = await extractTextFromImage(submission.file);
            }

            if (!extractedText || extractedText.trim().length < 10) {
              throw new Error('No text could be extracted from the submission');
            }

            // Grade the submission
            const gradingResults = await gradeStudentSubmission(questions, extractedText);

            // Calculate total score
            const totalPossiblePoints = questions.reduce((sum, q) => sum + (q.points || 10), 0);
            const earnedPoints = gradingResults.reduce((sum, result) => {
              const questionPoints = questions.find(q => q.id === result.questionId)?.points || 10;
              return sum + (result.score / 100 * questionPoints);
            }, 0);
            
            const totalScore = Math.round((earnedPoints / totalPossiblePoints) * 100);

            // Update submission with grades
            setStudentSubmissions((prev: StudentSubmission[]) => prev.map((s: StudentSubmission): StudentSubmission => 
              s.id === submission.id ? {
                ...s,
                status: 'graded' as const,
                grades: gradingResults.map(result => ({
                  questionId: result.questionId.toString(),
                  score: result.score,
                  answer: result.answer,
                  reasoning: result.reasoning,
                  feedback: result.feedback,
                  isCorrect: result.isCorrect,
                  confidence: result.confidence
                })),
                totalScore
              } : s
            ));

            completedCount++;
            
            // Update progress toast
            toast((t) => (
              <div>
                <div className="font-medium">Grading submissions...</div>
                <div className="text-sm mt-1">{completedCount} of {totalCount} complete</div>
              </div>
            ), { duration: 5000 });

          } catch (error) {
            console.error('Error grading submission:', error);
            setStudentSubmissions((prev: StudentSubmission[]) => prev.map((s: StudentSubmission): StudentSubmission => 
              s.id === submission.id ? { ...s, status: 'error' as const } : s
            ));
          }
        }));
      }

      toast.success(`Completed grading ${completedCount} submissions`);
    } catch (error) {
      console.error('Error in batch grading:', error);
      toast.error('Error during batch grading');
    }
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
                {renderFileUpload()}
                
                {/* Display extracted questions if available */}
                {questions.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-900">
                        Questions ({questions.length})
                      </h4>
                      <button 
                        onClick={handleSaveAnswerKey}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 transition-colors"
                      >
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
                              onClick={() => handleEditQuestion(question.id)}
                              className="text-blue-600 hover:text-blue-800 font-medium px-3 py-1 rounded hover:bg-blue-50 transition-colors"
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
                {!answerKeySaved && !file ? (
                  // If no answer key uploaded yet
                  <div className="text-center py-8">
                    <div className="inline-block bg-teal-100 p-3 rounded-full mb-3">
                      <ClipboardDocumentCheckIcon className="w-8 h-8 text-teal-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Upload an answer key first</h3>
                    <p className="text-gray-600 mb-6">Save your answer key to start accepting student submissions</p>
                    <button 
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
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
                                    onClick={() => setSelectedSubmission(submission)}
                                    className="px-3 py-1 text-blue-600 hover:text-blue-800 font-medium"
                                  >
                                    View Details
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
                        <SaveMaterialButton
                          content={{
                            questions,
                            submissions: studentSubmissions,
                            metadata: {
                              savedAt: new Date().toISOString(),
                              totalSubmissions: studentSubmissions.length,
                              averageScore: calculateAverageScore()
                            }
                          }}
                          type="exam_results"
                          userId={userId}
                          onSaveSuccess={handleSaveSuccess}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        />
                        <ExportButton 
                          submissions={studentSubmissions} 
                          questions={questions}
                          format="csv" 
                        />
                        <ExportButton 
                          submissions={studentSubmissions} 
                          questions={questions}
                          format="pdf" 
                        />
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
                            .filter(g => g.questionId === question.id.toString());
                          
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
                                  <button 
                                    onClick={() => setSelectedSubmission(submission)}
                                    className="px-3 py-1 text-blue-600 hover:text-blue-800 font-medium"
                                  >
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
      
      {/* Add edit modal */}
      {showEditModal && editingQuestion && (
        <QuestionEditModal
          question={editingQuestion}
          onSave={handleSaveEditedQuestion}
          onClose={() => {
            setShowEditModal(false);
            setEditingQuestion(null);
          }}
        />
      )}
      
      {/* Student details modal */}
      {selectedSubmission && (
        <StudentDetailsModal
          submission={selectedSubmission}
          questions={questions}
          onClose={() => setSelectedSubmission(null)}
          onUpdateGrades={(submissionId, updatedGrades) => {
            const updatedSubmissions = studentSubmissions.map(s =>
              s.id === submissionId ? { ...s, grades: updatedGrades } : s
            );
            setStudentSubmissions(updatedSubmissions);
          }}
          setSelectedSubmission={setSelectedSubmission}
          studentSubmissions={studentSubmissions}
          setStudentSubmissions={setStudentSubmissions}
        />
      )}
    </div>
  );
} 