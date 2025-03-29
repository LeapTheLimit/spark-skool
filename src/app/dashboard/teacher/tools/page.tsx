'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { extractTextFromImage } from '@/services/ocr';
import { extractTextFromPDF } from '@/services/pdfExtractor';
import { extractQuestionsFromText, gradeStudentSubmission, type Question } from '@/services/groq';
import { useRouter } from 'next/navigation';
import { saveAnswerKey, getAnswerKey } from '@/services/examService';
import { PDFDownloadButton } from '@/components/PDFDownloadButton';
import { CSVExport } from '@/components/CSVExport';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  DocumentTextIcon, 
  PuzzlePieceIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  PencilSquareIcon,
  ChevronLeftIcon,
  SparklesIcon,
  DocumentCheckIcon,
  DocumentPlusIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  TableCellsIcon,
  BeakerIcon,
  ClockIcon,
  ArrowLeftIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import type { Route } from 'next';
import { MATERIALS_STORAGE_KEY } from '@/lib/constants';
import TeacherMascot from '@/components/TeacherMascot';
import React from 'react';

interface GradingResult {
  questionId: number;
  score: number;
  feedback: string;
  isCorrect: boolean;
  confidence: number;
  partialCredit?: number;
  matchType?: string;
  teacherAdjusted?: boolean;
}

export default function ToolsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState<'answerKey' | 'submissions' | 'grades'>('answerKey');
  const [grades, setGrades] = useState<Array<{
    questionId: number;
    score: number;
    feedback: string;
    isCorrect: boolean;
  }>>([]);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'info'
  });

  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showOriginalExamGrading, setShowOriginalExamGrading] = useState(false);
  const [showMaterialSelector, setShowMaterialSelector] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);

  const [processingStage, setProcessingStage] = useState<{
    stage: 'initializing' | 'analyzing' | 'extracting' | 'processing' | 'formatting' | 'complete' | null;
    message: string;
    progress: number;
  }>({
    stage: null,
    message: '',
    progress: 0
  });

  const [activeSection, setActiveSection] = useState<'answerKey' | 'studentUpload'>('answerKey');
  const [examContext, setExamContext] = useState<string | null>(null);

  const [studentSubmissions, setStudentSubmissions] = useState<Array<{
    id: string;
    studentName: string;
    file: File | null;
    status: 'pending' | 'processing' | 'graded' | 'error';
    grades?: GradingResult[];
    totalScore?: number;
  }>>([]);

  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [showGradingDashboard, setShowGradingDashboard] = useState(false);

  const { t, language } = useLanguage();
  const isRTL = language === 'ar' || language === 'he';
  
  // Updated tool cards with superpower-themed names and improved interaction
  const toolCards = [
    {
      id: 'exam-grading',
      title: t('GradeWizard'),
      powerDescription: t('AI-Powered Exam Grading'),
      description: t('Grade exams at superhuman speed with AI assistance and detailed analytics'),
      icon: <ClipboardDocumentCheckIcon className="w-6 h-6" />,
      color: 'bg-teal-600',
      link: '/dashboard/teacher/tools/exam-grading' as Route,
      new: false,
      comingSoon: false
    },
    {
      id: 'exam-creator',
      title: t('ExamCrafter'),
      powerDescription: t('Professional Exam Creation'),
      description: t('Craft perfect exams with AI assistance and customizable templates'),
      icon: <DocumentPlusIcon className="w-6 h-6" />,
      color: 'bg-blue-600',
      link: '/dashboard/teacher/tools/exam-creator' as Route,
      new: false,
      comingSoon: false
    },
    {
      id: 'ai-exam-generator',
      title: t('GameMaster'), // Power-themed name
      powerDescription: t('Interactive Learning Games'), // Subtitle
      description: t('Create engaging exam games with AI-powered question generation and interactive formats'),
      icon: <PuzzlePieceIcon className="w-6 h-6" />,
      color: 'bg-purple-600',
      link: '/dashboard/teacher/tools/exam-game' as Route,
      new: true,
      comingSoon: false
    },
    {
      id: 'slide-maker',
      title: t('SlideDesigner'),
      powerDescription: t('Dynamic Presentations'),
      description: t('Create captivating slides with AI assistance and beautiful templates'),
      icon: <TableCellsIcon className="w-6 h-6" />,
      color: 'bg-cyan-600',
      link: '/dashboard/teacher/tools/slide-creator' as Route,
      new: true,
      comingSoon: false
    },
    {
      id: 'homework-maker',
      title: t('AssignmentMaker'),
      powerDescription: t('Customized Learning Tasks'),
      description: t('Generate customized homework assignments aligned with your lesson objectives'),
      icon: <BookOpenIcon className="w-6 h-6" />,
      color: 'bg-amber-500',
      link: '/dashboard/teacher/tools/homework-maker' as Route,
      new: false,
      comingSoon: true
    },
    {
      id: 'feedback-generator',
      title: t('FeedbackGenius'), // Power-themed name
      powerDescription: t('Personalized Student Insights'), // Subtitle
      description: t('Create personalized feedback for students with AI assistance to save time'),
      icon: <ChatBubbleLeftRightIcon className="w-6 h-6" />,
      color: 'bg-rose-600',
      link: '/dashboard/teacher/tools/feedback' as Route,
      new: true,
      comingSoon: true
    },
    {
      id: 'analytics-dashboard',
      title: t('DataVision'), // Power-themed name
      powerDescription: t('Performance Analytics'), // Subtitle
      description: t('Visualize classroom performance data with actionable teaching insights'),
      icon: <ChartBarIcon className="w-6 h-6" />,
      color: 'bg-indigo-600',
      link: '/dashboard/teacher/tools/analytics' as Route,
      new: false,
      comingSoon: true
    },
    {
      id: 'lesson-planner',
      title: t('LessonArchitect'), // Power-themed name
      powerDescription: t('Curriculum Planning'), // Subtitle
      description: t('Design comprehensive lesson plans aligned with your curriculum standards'),
      icon: <PencilSquareIcon className="w-6 h-6" />,
      color: 'bg-emerald-600',
      link: '/dashboard/teacher/tools/lesson-planner' as Route,
      new: false,
      comingSoon: true
    },
    {
      id: 'rubric-creator',
      title: t('RubricSmith'), // Power-themed name
      powerDescription: t('Assessment Criteria Builder'), // Subtitle
      description: t('Create detailed grading rubrics for assignments and projects'),
      icon: <DocumentCheckIcon className="w-6 h-6" />,
      color: 'bg-yellow-600', // Changed from amber to yellow
      link: '/dashboard/teacher/tools/rubric-creator' as Route,
      new: false,
      comingSoon: true
    }
  ];

  // Format exam material for display
  const formatExamMaterial = (material: any) => {
    try {
      let data;
      
      if (typeof material.content === 'string') {
        data = JSON.parse(material.content);
      } else {
        data = material.content;
      }
      
      return {
        ...material,
        parsedData: data
      };
    } catch (error) {
      console.error('Error parsing material content:', error);
      return material;
    }
  };

  // Function to save exam to materials
  const saveExamToMaterials = () => {
    try {
      // Generate a meaningful title
      let title = 'Exam Results';
      if (examContext && examContext.trim()) {
        title = examContext.trim();
      } else if (questions.length > 0 && questions[0].question) {
        const firstQuestion = questions[0].question;
        title = `Exam: ${firstQuestion.substring(0, 30)}${firstQuestion.length > 30 ? '...' : ''}`;
      }
      
      // Add completion info to title if submissions exist
      if (studentSubmissions.length > 0) {
        const gradedCount = studentSubmissions.filter(s => s.status === 'graded').length;
        title = `${title} (${gradedCount}/${studentSubmissions.length} graded)`;
      }
      
      // Add timestamp to make unique
      const dateStr = new Date().toLocaleDateString();
      const fullTitle = `${title} - ${dateStr}`;
      
      // Format data in more structured way
      const formattedData = {
        title: fullTitle,
        examContext: examContext,
        questions: questions.map(q => ({
          id: q.id,
          type: q.type || 'short answer',
          question: q.question,
          answer: q.answer,
          explanation: q.explanation,
          points: q.points || 10,
        })),
        submissions: studentSubmissions.map(s => ({
          id: s.id,
          name: s.studentName,
          status: s.status,
          totalScore: s.totalScore,
          gradeDate: new Date().toISOString()
        })),
        summary: studentSubmissions.length > 0 ? {
          avgScore: (studentSubmissions.reduce((acc, sub) => acc + (sub.totalScore || 0), 0) / studentSubmissions.length).toFixed(1),
          highestScore: Math.max(...studentSubmissions.filter(s => s.totalScore !== undefined).map(s => s.totalScore || 0)).toFixed(1),
          submissionCount: studentSubmissions.length,
          gradedCount: studentSubmissions.filter(s => s.status === 'graded').length
        } : null,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };

      const examData = {
        id: `exam-${Date.now()}`,
        title: fullTitle,
        content: JSON.stringify(formattedData),
        category: 'quiz',
        createdAt: new Date().toISOString()
      };

      // Get existing materials
      const stored = localStorage.getItem(MATERIALS_STORAGE_KEY) || '[]';
      let materials;
      
      try {
        materials = JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing stored materials:', e);
        materials = [];
      }
      
      if (!Array.isArray(materials)) {
        materials = [];
      }
      
      // Add new material at the beginning
      materials.unshift(examData);
      
      // Save back to localStorage
      localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(materials));
      
      // Trigger storage event for other tabs
      window.dispatchEvent(new Event('storage'));

      setNotification({
        show: true,
        message: `Exam "${fullTitle}" saved to Materials!`,
        type: 'success'
      });
    } catch (error) {
      console.error('Failed to save exam:', error);
      setNotification({
        show: true,
        message: 'Failed to save exam to Materials: ' + (error instanceof Error ? error.message : 'Unknown error'),
        type: 'error'
      });
    }
  };

  // Function to load exam from materials
  const loadExamFromMaterials = () => {
    setShowMaterialSelector(true);
  };

  // Update handleSelectMaterial function
  const handleSelectMaterial = (material: any) => {
    try {
      // Format the material before using it
      const formattedMaterial = formatExamMaterial(material);
      const data = formattedMaterial.parsedData;
      
      if (data.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions);
        if (data.examContext) setExamContext(data.examContext);
        
        // If there are student submissions, load those too
        if (data.studentSubmissions && Array.isArray(data.studentSubmissions)) {
          setStudentSubmissions(data.studentSubmissions);
        }
        
        // Close the modal and show the exam grading interface
        setShowMaterialSelector(false);
        setShowOriginalExamGrading(true);
        
        // Set appropriate tab based on what was loaded
        if (data.studentSubmissions && data.studentSubmissions.length > 0) {
          setActiveTab('grades');
        } else {
          setActiveTab('answerKey');
        }
      
      setNotification({
        show: true,
          message: 'Exam loaded successfully! You can continue working on it.',
        type: 'success'
      });
      } else {
        throw new Error('No valid questions found in the selected material');
      }
    } catch (error) {
      console.error('Failed to parse material:', error);
      setNotification({
        show: true,
        message: `Failed to load exam: ${error instanceof Error ? error.message : 'Invalid format'}`,
        type: 'error'
      });
    }
  };

  // Load materials when modal opens
  useEffect(() => {
    if (showMaterialSelector) {
      const stored = localStorage.getItem(MATERIALS_STORAGE_KEY);
      if (stored) {
        const allMaterials = JSON.parse(stored);
        // Filter for quiz materials only
        const quizMaterials = allMaterials.filter((m: any) => m.category === 'quiz');
        setMaterials(quizMaterials);
      }
    }
  }, [showMaterialSelector]);

  // Process the file
  const processFile = async (file: File) => {
    setLoading(true);
    try {
      // Implementation details...
      setProcessingStage({
        stage: 'initializing',
        message: 'Preparing document...',
        progress: 15
      });
      
      // More implementation...

    } catch (error) {
      console.error('Error processing file:', error);
      setNotification({
        show: true,
        message: error instanceof Error ? error.message : 'Error processing file',
        type: 'error'
      });
    } finally {
      setTimeout(() => {
        setLoading(false);
        setProcessingStage({ stage: null, message: '', progress: 0 });
      }, 1000);
    }
  };

  const handleAdjustGrade = (submissionId: string, questionId: number, score: number) => {
    setStudentSubmissions(prev => 
      prev.map(submission => {
        if (submission.id === submissionId) {
          const updatedGrades = submission.grades?.map(grade => {
            if (grade.questionId === questionId) {
              return { ...grade, score, teacherAdjusted: true };
            }
            return grade;
          });
          
          // Recalculate total score
          const totalPoints = updatedGrades?.reduce((total, grade) => total + grade.score, 0) || 0;
          const maxPossible = updatedGrades?.length || 1;
          const totalScore = (totalPoints / maxPossible);

        return {
          ...submission,
            grades: updatedGrades,
          totalScore
        };
        }
        return submission;
      })
    );
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFile(file);
      try {
        setLoading(true);
        
        setProcessingStage({
          stage: 'initializing',
          message: 'Preparing document...',
          progress: 15
        });

        let extractedText = '';
        
        // Log file information to debug
        console.log('Processing file:', file.name, file.type, file.size);
        
        if (file.type.includes('pdf')) {
          extractedText = await extractTextFromPDF(file);
        } else if (file.type.includes('image')) {
          // Ensure image extraction works
          extractedText = await extractTextFromImage(file);
        } else {
          throw new Error('Unsupported file type. Please upload a PDF or image file.');
        }
        
        console.log('Extracted text:', extractedText.substring(0, 100) + '...');
        
        setProcessingStage({
          stage: 'extracting',
          message: 'Extracting questions and answers...',
          progress: 50
        });

        const extractedQuestions = await extractQuestionsFromText(extractedText);
        console.log('Extracted questions:', extractedQuestions.length);
        
        // Make sure we update the questions state
        setQuestions(extractedQuestions);
        
        setProcessingStage({
          stage: 'complete',
          message: 'Exam processed successfully!',
          progress: 100
        });

      setNotification({
        show: true,
          message: `Successfully extracted ${extractedQuestions.length} questions`,
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
        setTimeout(() => {
      setLoading(false);
          setProcessingStage({ stage: null, message: '', progress: 0 });
        }, 1000);
      }
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/tiff': ['.tiff', '.tif']
    },
    maxFiles: 1
  });

  const importAnswerKeyFromMaterials = () => {
    try {
      // Show material selector for answer keys
      setShowMaterialSelector(true);
    } catch (error) {
      console.error('Failed to open materials selector:', error);
      setNotification({
        show: true,
        message: 'Failed to open materials selector',
        type: 'error'
      });
    }
  };

  // Save current state whenever significant changes occur
  useEffect(() => {
    if (showOriginalExamGrading && (questions.length > 0 || studentSubmissions.length > 0)) {
      const currentState = {
        tool: 'exam-grading',
        timestamp: new Date().toISOString(),
        state: {
          examContext,
        questions,
          studentSubmissions,
          activeTab
        }
      };
      localStorage.setItem('currentToolState', JSON.stringify(currentState));
      
      // Update recently used tools list
      const recentlyUsed = JSON.parse(localStorage.getItem('recentlyUsedTools') || '[]');
      const updatedRecent = [
        {
          id: 'exam-grading',
          title: examContext || t('examGrading'),
          timestamp: new Date().toISOString(),
          status: studentSubmissions.length > 0 ? 'graded' : questions.length > 0 ? 'draft' : 'new'
        },
        ...recentlyUsed.filter((t: any) => t.id !== 'exam-grading').slice(0, 4)
      ];
      localStorage.setItem('recentlyUsedTools', JSON.stringify(updatedRecent));
    }
  }, [questions, studentSubmissions, examContext, activeTab, showOriginalExamGrading, t]);

  // Function to restore previous work
  const restorePreviousWork = () => {
    try {
      const savedState = localStorage.getItem('currentToolState');
      if (savedState) {
        const { tool, state } = JSON.parse(savedState);
        
        if (tool === 'exam-grading') {
          setExamContext(state.examContext || null);
          setQuestions(state.questions || []);
          setStudentSubmissions(state.studentSubmissions || []);
          setActiveTab(state.activeTab || 'answerKey');
          setShowOriginalExamGrading(true);
      
      setNotification({
        show: true,
            message: t('workRestored', { defaultValue: 'Previous work restored successfully' }),
        type: 'success'
      });
        }
      }
    } catch (error) {
      console.error('Error restoring previous work:', error);
    }
  };

  // Load recently used tools when component mounts
  const [recentlyUsedTools, setRecentlyUsedTools] = useState<any[]>([]);

  useEffect(() => {
    try {
      const recentTools = localStorage.getItem('recentlyUsedTools');
      if (recentTools) {
        setRecentlyUsedTools(JSON.parse(recentTools));
      }
    } catch (error) {
      console.error('Error loading recently used tools:', error);
    }
  }, []);

  const [studentName, setStudentName] = useState('');
  const [studentSubmissionFile, setStudentSubmissionFile] = useState<File | null>(null);

  const onStudentSubmissionDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setStudentSubmissionFile(acceptedFiles[0]);
    }
  }, []);

  const {
    getRootProps: getStudentSubmissionRootProps,
    getInputProps: getStudentSubmissionInputProps
  } = useDropzone({
    onDrop: onStudentSubmissionDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/tiff': ['.tiff', '.tif']
    },
    maxFiles: 1
  });

  const handleSubmitStudentWork = () => {
    if (!studentSubmissionFile || !studentName) return;
    
    const newSubmission = {
      id: `STU-${Math.random().toString(36).substring(2, 10)}`,
      studentName,
      file: studentSubmissionFile,
      status: 'pending' as const
    };
    
    setStudentSubmissions(prev => [...prev, newSubmission]);
    
    // Reset form
    setStudentName('');
    setStudentSubmissionFile(null);
    
    setNotification({
      show: true,
      message: 'Student submission added successfully',
      type: 'success'
    });
  };

  const handleGradeSubmission = async (submissionId: string) => {
    const submission = studentSubmissions.find(s => s.id === submissionId);
    if (!submission || !submission.file) return;
    
    // Update status to processing
    setStudentSubmissions(prev => prev.map(s => 
      s.id === submissionId ? { ...s, status: 'processing' as const } : s
    ));
    
    try {
      // Extract text from submission
      let extractedText = '';
      
      if (submission.file.type.includes('pdf')) {
        extractedText = await extractTextFromPDF(submission.file);
      } else if (submission.file.type.includes('image')) {
        extractedText = await extractTextFromImage(submission.file);
      } else {
        throw new Error('Unsupported file type');
      }
      
      // Grade the submission against our answer key
      const gradingResults = await gradeStudentSubmission(questions, extractedText);
      
      // Calculate total score
      const totalPoints = gradingResults.reduce((total, grade) => total + grade.score, 0);
      const maxPossible = gradingResults.length * 100;
      const totalScore = (totalPoints / maxPossible) * 100;
      
      // Update submission with grades
      setStudentSubmissions(prev => prev.map(s => 
        s.id === submissionId ? { 
          ...s, 
          status: 'graded' as const,
          grades: gradingResults,
          totalScore
        } : s
      ));
      
      setNotification({
        show: true,
        message: `Submission graded successfully! Score: ${totalScore.toFixed(1)}%`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error grading submission:', error);
      
      // Update status to error
      setStudentSubmissions(prev => prev.map(s => 
        s.id === submissionId ? { ...s, status: 'error' as const } : s
      ));
      
      setNotification({
        show: true,
        message: `Error grading submission: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    }
  };

  const handleDeleteSubmission = (submissionId: string) => {
    setStudentSubmissions(prev => prev.filter(s => s.id !== submissionId));
    
    setNotification({
      show: true,
      message: 'Student submission deleted',
      type: 'info'
    });
  };

  const [showNewBadge] = useState(true);

  // Add RTL support
  useEffect(() => {
    // Set document direction based on language
    const isRtl = language === 'ar' || language === 'he';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [language]);

  return (
    <div className={`min-h-screen bg-gray-50 p-6 overflow-auto max-h-screen ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Always show the header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-black">
            {language === 'ar' ? 'قوى خارقة' : 
             language === 'he' ? 'כוחות-על' : 
             'Superpowers'}
          </h1>
          <p className="text-black">
            {language === 'ar' ? 'أدوات سبارك لتعزيز التدريس وتوفير ساعات من العمل' :
             language === 'he' ? 'כלי הסופר-כוח של ספארק לשדרוג ההוראה וחיסכון בשעות עבודה' :
             'Spark superpowers tools to enhance your teaching and save hours of work'}
          </p>
        </div>

        {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {toolCards.map(tool => (
                <div 
                  key={tool.id} 
              className={`rounded-xl overflow-hidden border border-gray-200 shadow-sm relative ${tool.comingSoon ? 'opacity-80 cursor-default' : 'hover:shadow-lg transition-all group cursor-pointer'} h-[180px] ${tool.color} bg-opacity-5`}
              onClick={!tool.comingSoon ? (() => tool.link && router.push(tool.link as Route)) : undefined}
                >
              <div className="p-5 h-full flex flex-col">
                {/* Tags */}
                    {tool.new && !tool.comingSoon && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {t('new')}
                      </span>
                    )}
                    
                    {tool.comingSoon && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 text-xs font-medium bg-orange-500 text-white rounded-full z-10">
                        {language === 'ar' ? 'قريباً' : language === 'he' ? 'בקרוב' : 'COMING SOON'}
                      </span>
                    )}
                    
                {/* Mascot in top left corner */}
                <div className="absolute top-3 left-3">
                  <TeacherMascot width={32} height={32} variant={
                    tool.id === 'exam-grading' ? 'teal' : 
                    tool.id === 'exam-creator' ? 'blue' : 
                    tool.id === 'ai-exam-generator' ? 'purple' :
                    tool.id === 'homework-maker' ? 'orange' :
                    tool.id === 'feedback-generator' ? 'rose' :
                    tool.id === 'analytics-dashboard' ? 'indigo' :
                    tool.id === 'lesson-planner' ? 'emerald' :
                    tool.id === 'rubric-creator' ? 'amber' : 'blue'
                  } />
                      </div>
                
                {/* Centered title and icon - larger size */}
                <div className="flex flex-col items-center justify-center my-4 text-center flex-1">
                  <div className={`w-14 h-14 ${tool.color} bg-opacity-20 rounded-xl flex items-center justify-center mb-3`}>
                    <div className={`${tool.color.replace('bg-', 'text-')}`}>
                      {React.cloneElement(tool.icon as React.ReactElement, { className: "w-8 h-8" })}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-black mb-1">
                      {tool.title}
                    </h3>
                  <p className="text-sm text-gray-600">{tool.powerDescription}</p>
                </div>
                
                {/* Description and button that show on hover */}
                <div className="hidden group-hover:flex flex-col items-center justify-center absolute inset-0 bg-white bg-opacity-95 p-5 transition-all">
                  <p className="text-sm text-gray-700 mb-4 text-center">
                      {tool.description}
                    </p>
                  
                  {!tool.comingSoon && (
                    <button 
                      onClick={() => tool.link && router.push(tool.link as Route)}
                      className={`px-6 py-2 text-sm font-medium text-white rounded-lg ${tool.color} hover:opacity-90 transition-opacity`}
                    >
                      {t('start', { defaultValue: 'Start' })}
                    </button>
                  )}
                  </div>
              </div>
              
              {/* Bottom accent line with animation */}
              {!tool.comingSoon && (
                <div className={`absolute bottom-0 left-0 h-1 w-0 ${tool.color} group-hover:w-full transition-all duration-300 ease-in-out`}></div>
              )}
                </div>
              ))}
            </div>
            
            {/* Recently Used Section */}
            <div className="mt-10">
              <h2 className="text-xl font-semibold text-black mb-5">{t('recentlyUsed')}</h2>
              <div className="space-y-3">
                {recentlyUsedTools.length > 0 ? (
                  recentlyUsedTools.map((tool, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`bg-${
                          tool.id === 'exam-grading' ? 'blue' : 
                          tool.id === 'exam-creator' ? 'purple' : 
                          'gray'
                        }-100 p-3 rounded-lg`}>
                          {tool.id === 'exam-grading' ? (
                            <ClipboardDocumentCheckIcon className="w-6 h-6 text-blue-600" />
                          ) : tool.id === 'exam-creator' ? (
                            <AcademicCapIcon className="w-6 h-6 text-purple-600" />
                          ) : (
                            <DocumentTextIcon className="w-6 h-6 text-black-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-black">{tool.title}</h3>
                          <p className="text-sm text-black">
                            {new Date(tool.timestamp).toLocaleDateString(language === 'ar' ? 'ar-SA' : 
                            language === 'he' ? 'he-IL' : undefined)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`text-sm px-3 py-1 rounded-full ${
                          tool.status === 'graded' ? 'bg-green-100 text-green-800' :
                          tool.status === 'draft' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {t(tool.status)}
                        </span>
                        
                        <button 
                          onClick={() => {
                            if (tool.id === 'exam-grading') {
                              restorePreviousWork();
                            } else {
                              router.push(`/dashboard/teacher/tools/${tool.id}` as Route);
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          {t('continueWork')}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-black">{t('noRecentTools', { defaultValue: 'No recently used tools' })}</p>
                )}
              </div>
            </div>
                              </div>
    </div>
  );
} 