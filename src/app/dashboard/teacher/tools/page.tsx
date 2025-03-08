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
  TableCellsIcon
} from '@heroicons/react/24/outline';
import type { Route } from 'next';
import { MATERIALS_STORAGE_KEY } from '@/lib/constants';

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
  
  // Tool card data with translations
  const toolCards = [
    {
      id: 'exam-grading',
      title: t('examGrading'),
      description: t('examGradingDesc', { defaultValue: 'Grade exams quickly with AI assistance and detailed analytics' }),
      icon: <ClipboardDocumentCheckIcon className="w-6 h-6" />,
      color: 'bg-blue-600',
      action: () => setShowOriginalExamGrading(true),
      link: '#' as Route, // using action instead of link
      new: false,
      comingSoon: false
    },
    {
      id: 'exam-creator',
      title: t('examCreator'),
      description: t('examCreatorDesc', { defaultValue: 'Create professional exams with AI and share them with students' }),
      icon: <AcademicCapIcon className="w-6 h-6" />,
      color: 'bg-purple-600',
      link: '/dashboard/teacher/tools/exam-creator' as Route,
      new: true,
      comingSoon: false
    },
    {
      id: 'exam-game',
      title: t('exam Game'),
      description: t('examGameDesc', { defaultValue: 'Transform your exams into interactive games like Kahoot' }),
      icon: <SparklesIcon className="w-6 h-6" />,
      color: 'bg-green-600',
      link: '/dashboard/teacher/tools/exam-game' as Route,
      new: false,
      comingSoon: false
    },
    {
      id: 'homework-maker',
      title: t('homeworkMaker'),
      description: t('home work Maker Desc', { defaultValue: 'Generate homework assignments from your lesson materials' }),
      icon: <BookOpenIcon className="w-6 h-6" />,
      color: 'bg-orange-600',
      link: '/dashboard/teacher/tools/homework-maker' as Route,
      new: false,
      comingSoon: true
    },
    {
      id: 'feedback-generator',
      title: t('feedbackGenerator'),
      description: t('feedbackGeneratorDesc', { defaultValue: 'Create personalized student feedback with AI assistance' }),
      icon: <ChatBubbleLeftRightIcon className="w-6 h-6" />,
      color: 'bg-rose-600',
      link: '/dashboard/teacher/tools/feedback' as Route,
      new: true,
      comingSoon: true
    },
    {
      id: 'analytics-dashboard',
      title: t('analyticsInsights'),
      description: t('analyticsDesc', { defaultValue: 'Visualize student performance data with actionable insights' }),
      icon: <ChartBarIcon className="w-6 h-6" />,
      color: 'bg-indigo-600',
      link: '/dashboard/teacher/tools/analytics' as Route,
      new: false,
      comingSoon: true
    },
    {
      id: 'lesson-planner',
      title: t('teachingToolsLessonPlanner'),
      description: t('teachingToolsLessonPlannerDesc', { defaultValue: 'Design comprehensive lesson plans with curriculum alignment' }),
      icon: <PencilSquareIcon className="w-6 h-6" />,
      color: 'bg-cyan-600',
      link: '/dashboard/teacher/tools/lesson-planner' as Route,
      new: false,
      comingSoon: true
    },
    {
      id: 'rubric-creator',
      title: t('rubricCreator'),
      description: t('rubricCreatorDesc', { defaultValue: 'Create detailed grading rubrics for assignments and projects' }),
      icon: <DocumentTextIcon className="w-6 h-6" />,
      color: 'bg-amber-600',
      link: '/dashboard/teacher/tools/rubric-creator' as Route,
      new: true,
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

  return (
    <div className={`min-h-screen bg-gray-50 p-6 overflow-auto max-h-screen ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-black">{t('teachingTools')}</h1>
          <p className="text-black">{t('toolsDescription', { defaultValue: 'AI-powered tools to enhance your teaching experience' })}</p>
        </div>

        {!showOriginalExamGrading ? (
          <>
            {/* Tools Grid - Responsive 1-4 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {toolCards.map(tool => (
                <div 
                  key={tool.id} 
                  onClick={tool.comingSoon ? undefined : (tool.action || (() => tool.link && router.push(tool.link as Route)))}
                  className={`bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm ${tool.comingSoon ? 'opacity-80 cursor-default' : 'hover:shadow-md transition-shadow group cursor-pointer'}`}
                >
                  <div className="relative p-6">
                    {tool.new && !tool.comingSoon && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {t('new')}
                      </span>
                    )}
                    
                    {tool.comingSoon && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium bg-orange-500 text-white rounded-full z-10">
                        {language === 'ar' ? 'قريباً' : language === 'he' ? 'בקרוב' : 'COMING SOON'}
                      </span>
                    )}
                    
                    <div className={`w-12 h-12 ${tool.color} bg-opacity-10 rounded-xl flex items-center justify-center mb-4`}>
                      <div className={`text-${tool.color.replace('bg-', '')}`}>
                        {tool.icon}
                      </div>
                    </div>
                    <h3 className={`text-lg font-semibold text-black mb-2 ${!tool.comingSoon ? 'group-hover:text-blue-600 transition-colors' : ''}`}>
                      {tool.title}
                    </h3>
                    <p className="text-black text-sm max-h-20 overflow-y-auto">
                      {tool.description}
                    </p>
                  </div>
                  <div className={`h-1 w-full ${tool.color} transition-all transform origin-left ${!tool.comingSoon ? 'group-hover:scale-x-100 scale-x-0' : 'scale-x-0'}`}></div>
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
          </>
        ) : (
          // Original Exam Grading Interface
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-black">{t('examGrading')}</h2>
              <button
                onClick={() => setShowOriginalExamGrading(false)}
                className="px-4 py-2 mb-4 bg-gray-100 text-black rounded-lg hover:bg-gray-200 flex items-center gap-2"
              >
                <ChevronLeftIcon className="w-5 h-5" />
                {t('backToTools')}
              </button>
            </div>
            
            <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('answerKey')}
                className={`px-4 py-2 rounded-lg ${
                activeTab === 'answerKey'
                    ? 'bg-blue-600 text-black' 
                    : 'bg-gray-100 text-black'
              }`}
            >
              Answer Key
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
                className={`px-4 py-2 rounded-lg ${
                activeTab === 'submissions'
                    ? 'bg-blue-600 text-black' 
                    : 'bg-gray-100 text-black'
              }`}
            >
              Student Submissions
            </button>
            <button
              onClick={() => setActiveTab('grades')}
                className={`px-4 py-2 rounded-lg ${
                activeTab === 'grades'
                    ? 'bg-blue-600 text-black' 
                    : 'bg-gray-100 text-black'
              }`}
            >
                Grades
            </button>
        </div>

            {/* Tab content */}
            <div className="mt-6">
          {activeTab === 'answerKey' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-black">
                      Create Answer Key
                    </h3>
                    <button
                      onClick={importAnswerKeyFromMaterials}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Import from Materials
                    </button>
              </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-black mb-2">
                      Exam Context (optional)
                    </label>
                    <input
                      type="text"
                      value={examContext || ''}
                      onChange={(e) => setExamContext(e.target.value)}
                      placeholder="e.g., 10th Grade Biology Midterm, Chapter 4-5"
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                  </div>
                  
                  <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6 text-center cursor-pointer">
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-4">
                        <svg
                          className="mx-auto h-12 w-12 text-black"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 14v20c0 4.418 7.163 8 16 8 1.381 0 2.721-.087 4-.252M8 14c0 4.418 7.163 8 16 8s16-3.582 16-8M8 14c0-4.418 7.163-8 16-8s16 3.582 16 8m0 0v14m0-4c0 4.418-7.163 8-16 8S8 28.418 8 24m32 10v6m0 0v6m0-6h6m-6 0h-6"
                          />
                        </svg>
                  </div>
                      <p className="text-black">
                        Drag and drop your answer key file, or click to select
                      </p>
                      <p className="text-sm text-black mt-1">
                        PDF or Image files accepted
                      </p>
                </div>
                  </div>

              {questions.length > 0 && (
                    <div>
                  <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium text-black">
                      Extracted Questions ({questions.length})
                        </h4>
                    <button
                          onClick={async () => {
                            try {
                              // Save answer key with context
                              await saveAnswerKey({ 
                                questions: questions, 
                                examContext: examContext 
                              });
                              
                              setNotification({
                                show: true,
                                message: t('answerKeySavedSuccess', { defaultValue: 'Answer key saved successfully' }),
                                type: 'success'
                              });
                              
                              // Switch to submissions tab after saving the answer key
                              setActiveTab('submissions');
                              
                              // Refresh materials list if modal is open
                              if (showMaterialSelector) {
                                const stored = localStorage.getItem(MATERIALS_STORAGE_KEY);
                                if (stored) {
                                  const allMaterials = JSON.parse(stored);
                                  const quizMaterials = allMaterials.filter((m: any) => m.category === 'quiz');
                                  setMaterials(quizMaterials);
                                }
                              }
                            } catch (error) {
                              console.error('Error saving answer key:', error);
                              setNotification({
                                show: true,
                                message: `Failed to save answer key: ${error instanceof Error ? error.message : 'Unknown error'}`,
                                type: 'error'
                              });
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                        >
                          Save Answer Key
                    </button>
                  </div>
                      
                      <div className="space-y-4 max-h-96 overflow-y-auto p-2">
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
                                onClick={() => setEditingQuestion(question)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                Edit
                              </button>
                        </div>
                            <p className="text-black mb-2">{question.question}</p>
                            <div className="mt-2">
                              <p className="text-sm font-medium text-black">Answer:</p>
                              <p className="text-sm text-black">{question.answer}</p>
                            </div>
                            {question.explanation && (
                              <div className="mt-2">
                                <p className="text-sm font-medium text-black">Explanation:</p>
                                <p className="text-sm text-black">{question.explanation}</p>
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
                  <h3 className="text-lg font-medium text-black mb-4">
                    Student Submissions
                  </h3>
                  
                  {questions.length === 0 ? (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6">
                      <p className="text-black">
                        Please create or load an answer key before adding student submissions.
                      </p>
                      <button
                        onClick={() => setActiveTab('answerKey')}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
                      >
                        Go to Answer Key
                      </button>
              </div>
                  ) : (
                    <>
                      {/* Add new student submission */}
                      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
                        <h4 className="font-medium text-black mb-4">Add New Submission</h4>
                        
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-black mb-2">
                            Student Name
                          </label>
                          <input
                            type="text"
                            value={studentName || ''}
                            onChange={(e) => setStudentName(e.target.value)}
                            placeholder="Enter student name"
                            className="w-full p-3 border border-gray-300 rounded-lg"
                          />
              </div>

                        <div {...getStudentSubmissionRootProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4 text-center cursor-pointer">
                          <input {...getStudentSubmissionInputProps()} />
                          <div className="flex flex-col items-center justify-center">
                <div className="mb-4">
                              <svg
                                className="mx-auto h-12 w-12 text-black"
                                stroke="currentColor"
                                fill="none"
                                viewBox="0 0 48 48"
                                aria-hidden="true"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 14v20c0 4.418 7.163 8 16 8 1.381 0 2.721-.087 4-.252M8 14c0 4.418 7.163 8 16 8s16-3.582 16-8M8 14c0-4.418 7.163-8 16-8s16 3.582 16 8m0 0v14m0-4c0 4.418-7.163 8-16 8S8 28.418 8 24m32 10v6m0 0v6m0-6h6m-6 0h-6"
                                />
                              </svg>
                  </div>
                            <p className="text-black">
                              Drag and drop student submission, or click to select
                            </p>
                            <p className="text-sm text-black mt-1">
                              PDF or Image files accepted
                            </p>
                </div>
                        </div>

                    <button
                          onClick={handleSubmitStudentWork}
                          disabled={!studentSubmissionFile || !studentName}
                          className={`w-full px-4 py-3 rounded-lg ${
                            !studentSubmissionFile || !studentName 
                              ? 'bg-gray-300 cursor-not-allowed' 
                              : 'bg-green-600 hover:bg-green-700'
                          } text-white`}
                        >
                          Submit Student Work
                    </button>
                  </div>
                      
                      {/* List of student submissions */}
                      <div className="bg-white rounded-lg border border-gray-200">
                        <div className="p-4 border-b border-gray-200">
                          <h4 className="font-medium text-black">
                            {studentSubmissions.length} Student Submissions
                          </h4>
                        </div>
                        
                        {studentSubmissions.length > 0 ? (
                          <div className="divide-y divide-gray-200">
                    {studentSubmissions.map((submission) => (
                              <div key={submission.id} className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                                    <h5 className="font-medium text-black">{submission.studentName}</h5>
                                    <p className="text-sm text-black">
                                      {submission.file?.name || 'No file'}
                            </p>
                          </div>
                                  
                                  <div className="flex items-center gap-3">
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      submission.status === 'graded' 
                                        ? 'bg-green-100 text-green-800' 
                                        : submission.status === 'error' 
                                        ? 'bg-red-100 text-red-800'
                                        : submission.status === 'processing' 
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-gray-100 text-black'
                                    }`}>
                                      {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                                    </span>
                                    
                                    {submission.status === 'pending' && (
                                      <button
                                        onClick={() => handleGradeSubmission(submission.id)}
                                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg"
                                      >
                                        Grade
                                      </button>
                                    )}
                                    
                                    {submission.status === 'graded' && submission.totalScore !== undefined && (
                                      <span className="font-medium text-black">
                              {submission.totalScore.toFixed(1)}%
                                      </span>
                                    )}
                                    
                                    <button
                                      onClick={() => handleDeleteSubmission(submission.id)}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                      </svg>
                                    </button>
                                  </div>
                        </div>
                      </div>
                    ))}
                  </div>
                        ) : (
                          <div className="p-6 text-center">
                            <p className="text-black">No student submissions yet.</p>
                            <p className="text-sm text-black mt-1">Add a student submission above to begin grading.</p>
                </div>
                        )}
                        
                        {studentSubmissions.length > 0 && (
                          <div className="p-4 border-t border-gray-200">
                            <button
                              onClick={() => setActiveTab('grades')}
                              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              View Grading Results
                            </button>
                          </div>
                        )}
                      </div>
                    </>
              )}
            </div>
          )}

          {activeTab === 'grades' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-black mb-4">
                      Grading Summary
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={saveExamToMaterials}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Save to Materials
                      </button>
                      <button
                        onClick={loadExamFromMaterials}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Load from Materials
                      </button>
                    </div>
              </div>

                  {/* Analytics Dashboard */}
                  {studentSubmissions.length > 0 && (
                    <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <h4 className="text-lg font-medium text-black mb-4">Class Analytics</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-black mb-1">Average Score</p>
                          <p className="text-2xl font-bold text-black">
                            {(studentSubmissions.reduce((acc, sub) => 
                              acc + (sub.totalScore || 0), 0) / studentSubmissions.length).toFixed(1)}%
                    </p>
                  </div>
                        
                        <div className="bg-green-50 p-4 rounded-lg">
                          <p className="text-sm text-black mb-1">Highest Score</p>
                          <p className="text-2xl font-bold text-black">
                            {Math.max(...studentSubmissions
                              .filter(s => s.totalScore !== undefined)
                              .map(s => s.totalScore || 0)).toFixed(1)}%
                          </p>
                </div>

                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <p className="text-sm text-black mb-1">Submissions</p>
                          <p className="text-2xl font-bold text-black">
                            {studentSubmissions.filter(s => s.status === 'graded').length} / {studentSubmissions.length}
                          </p>
                        </div>
                </div>

                      {/* Question Performance */}
                      <h5 className="font-medium text-black mb-3">Question Performance</h5>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {questions.map((question) => {
                          // Calculate percentage of correct answers for this question
                          const questionResults = studentSubmissions
                            .filter(s => s.status === 'graded')
                            .flatMap(s => s.grades || [])
                            .filter(g => g.questionId === question.id);
                          
                          const correctCount = questionResults.filter(g => g.score >= 80).length;
                          const totalCount = questionResults.length || 1; // Avoid division by zero
                          const correctPercentage = (correctCount / totalCount) * 100;
                          
                          return (
                            <div key={question.id} className="bg-white p-3 border rounded-lg">
                              <p className="text-sm text-black mb-2 line-clamp-1">
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
                                <span className="text-black">{correctCount} correct</span>
                                <span className="text-black">{correctPercentage.toFixed(0)}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Grading Table */}
                  {studentSubmissions.length > 0 ? (
                        <div>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                              Student
                            </th>
                            {/* Other headers... */}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {studentSubmissions.map((submission) => (
                            <tr key={submission.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-black">{submission.studentName}</div>
                              </td>
                              {/* Other cells... */}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                          </div>
                  ) : (
                    <p className="text-black">No student submissions yet.</p>
                  )}
                        </div>
              )}
                      </div>
                    </div>
        )}
      </div>

      {/* Material Selector Modal - Updated to show better previews */}
      {showMaterialSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium text-black">
                Select Exam from Materials
              </h2>
              <button 
                onClick={() => setShowMaterialSelector(false)}
                className="text-black hover:text-black"
              >
                ×
              </button>
            </div>
            
            {materials.length > 0 ? (
              <div className="space-y-4">
                {materials.map((material) => {
                  // Try to parse the content to show a preview
                  let previewData;
                  try {
                    if (typeof material.content === 'string') {
                      previewData = JSON.parse(material.content);
                    } else {
                      previewData = material.content;
                    }
                  } catch (e) {
                    previewData = null;
                  }
                  
                  // Extract questions from different possible formats
                  const questions = previewData?.questions || 
                                   (previewData?.content?.questions) || 
                                   [];
                  
                  // Format date nicely
                  const createdDate = new Date(material.createdAt).toLocaleDateString(
                    language === 'ar' ? 'ar-SA' : 
                    language === 'he' ? 'he-IL' : undefined,
                    { year: 'numeric', month: 'short', day: 'numeric' }
                  );
                  
                  return (
                    <div 
                      key={material.id}
                      onClick={() => handleSelectMaterial(material)}
                      className="p-4 border rounded-lg hover:bg-blue-50 cursor-pointer"
                    >
                      <h3 className="font-medium text-black mb-1">{material.title}</h3>
                      <div className="text-sm text-black">
                        <p className="mb-1">Created: {createdDate}</p>
                        
                        {questions && questions.length > 0 && (
                          <div className="mt-2">
                            <p className="text-black"><strong>Questions:</strong> {questions.length}</p>
                            
                            <div className="mt-2 border-t pt-2">
                              <p className="text-black font-medium">Sample Questions:</p>
                              <ul className="list-disc list-inside">
                                {questions.slice(0, 2).map((q: any, idx: number) => (
                                  <li key={idx} className="text-black truncate">
                                    {q.question}
                                  </li>
                                ))}
                                {questions.length > 2 && (
                                  <li className="text-black">+ {questions.length - 2} more questions</li>
                                )}
                              </ul>
                </div>
                          </div>
                        )}
                        
                        <button 
                          className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 w-full"
                        >
                          Load This Exam
                        </button>
                </div>
              </div>
                  );
                })}
            </div>
            ) : (
              <p className="text-black">No exam materials found. Create and save some exams first.</p>
          )}
        </div>
        </div>
      )}

      {/* Processing Stage Indicator */}
      {processingStage.stage && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-black font-medium">{processingStage.message}</p>
            <span className="text-black">{processingStage.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${processingStage.progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Edit Question Modal - properly implement the content */}
        {editingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium text-black">
                Edit Question {editingQuestion.id}
              </h2>
              <button 
                onClick={() => setEditingQuestion(null)}
                className="text-black hover:text-black"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
                <div>
                <label className="block text-sm font-medium text-black mb-1">
                    Question
                  </label>
                  <textarea
                    value={editingQuestion.question}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      question: e.target.value
                    })}
                    className="w-full p-2 border rounded-lg"
                    rows={3}
                  />
                </div>
                <div>
                <label className="block text-sm font-medium text-black mb-1">
                    Answer
                  </label>
                  <textarea
                    value={editingQuestion.answer}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      answer: e.target.value
                    })}
                    className="w-full p-2 border rounded-lg"
                    rows={2}
                  />
                </div>
                <div>
                <label className="block text-sm font-medium text-black mb-1">
                    Explanation
                  </label>
                  <textarea
                    value={editingQuestion.explanation}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      explanation: e.target.value
                    })}
                    className="w-full p-2 border rounded-lg"
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 text-black hover:bg-gray-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setQuestions(questions.map(q =>
                      q.id === editingQuestion.id ? editingQuestion : q
                    ));
                    setEditingQuestion(null);
                  }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
} 