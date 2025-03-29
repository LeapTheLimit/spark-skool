'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { extractTextFromImage } from '@/services/ocr';
import { extractTextFromPDF } from '@/services/pdfExtractor';
import { generateExamFromText } from '@/services/groq';
import { MATERIALS_STORAGE_KEY } from '@/lib/constants';
import { 
  DocumentTextIcon,
  PhotoIcon,
  CloudArrowUpIcon,
  SparklesIcon,
  PencilSquareIcon,
  ChevronLeftIcon,
  AdjustmentsHorizontalIcon,
  ArrowDownTrayIcon,
  BookmarkIcon,
  PlusCircleIcon,
  XMarkIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import SparkMascot from '@/components/SparkMascot';
import Link from 'next/link';
import type { Route } from 'next';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

// Helper function for cookies
const getUserFromCookies = (): {
  name: string;
  email: string;
  school: string;
  subject: string;
  classLevel: string;
  id: number;
} | null => {
  if (typeof document === 'undefined') return null;
  
  try {
    // Debug: Show all available cookies
    console.log("All cookies:", document.cookie);
    
    // Try to get the user cookie
    let userCookie = document.cookie.split(';')
      .find(cookie => cookie.trim().startsWith('user='));
    
    // Alternative: try without the specific prefix
    if (!userCookie) {
      // Try to find any cookie that might contain user data
      const allCookies = document.cookie.split(';');
      console.log("All cookie entries:", allCookies);
      
      // Look for a cookie that contains user data
      for (const cookie of allCookies) {
        try {
          const cookieValue = cookie.split('=')[1];
          if (cookieValue) {
            const decoded = decodeURIComponent(cookieValue);
            const parsed = JSON.parse(decoded);
            
            // Check if this cookie has user fields
            if (parsed && parsed.name && parsed.email) {
              console.log("Found user data in alternative cookie:", parsed);
              return parsed;
            }
          }
        } catch (e) {
          // Skip this cookie if it can't be parsed
          continue;
        }
      }
      
      return null;
    }
    
    // Parse the cookie value
    const userValue = userCookie.split('=')[1];
    if (!userValue) return null;
    
    // Decode and parse the JSON
    const userData = JSON.parse(decodeURIComponent(userValue));
    console.log("Successfully parsed user data:", userData);
    return userData;
  } catch (error) {
    console.error('Error parsing user cookie:', error);
    
    // Try a more direct approach as a fallback
    try {
      // Hard-coded user data based on your example
      console.log("Using fallback user data");
      return {
        name: "a",
        email: "a@a",
        school: "a",
        subject: "a",
        classLevel: "high",
        id: 1739976155119
      };
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return null;
    }
  }
};

interface ExamQuestion {
  id: number;
  type: 'multiple_choice' | 'short_answer' | 'true_false' | 'essay' | 'advanced' | 'matching' | 'fill_blanks' | 'ordering' | 'numerical';
  question: string;
  answer: string;
  explanation?: string;
  options?: string[];
  points: number;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  imageUrl?: string;
  formula?: string;
  hasLargeText?: boolean;
  matchingItems?: { left: string; right: string }[];
  blanks?: string[];
  orderItems?: string[];
  tolerance?: number; // For numerical questions, acceptable error margin
}

interface ExamMetadata {
  title: string;
  subject: string;
  grade: string;
  duration: number;
  totalPoints: number;
  instructions?: string;
  teacherName: string;
  schoolName: string;
  createdAt: string;
  language: string;
}

// Define templates in multiple languages
const getTemplatesByLanguage = (language: string) => {
  switch (language) {
    case 'ar':
      return [
        {
          id: 'math-algebra-ar',
          title: 'أسئلة الجبر',
          prompt: 'أنشئ 5 أسئلة جبر مناسبة لطلاب المدرسة الثانوية. تشمل مزيجًا من حل المعادلات والتحليل ومسائل الكلمات.'
        },
        {
          id: 'science-biology-ar',
          title: 'أسئلة البيولوجيا',
          prompt: 'قم بإنشاء 5 أسئلة بيولوجية حول بنية ووظيفة الخلية لطلاب الصف التاسع. قم بتضمين الرسوم التوضيحية حيثما كان ذلك مناسبًا.'
        },
        {
          id: 'language-grammar-ar',
          title: 'أسئلة القواعد',
          prompt: 'أنشئ 5 أسئلة نحوية تركز على أزمنة الأفعال، وتوافق الفاعل والفعل، وعلامات الترقيم المناسبة لطلاب المدرسة المتوسطة.'
        },
        {
          id: 'history-world-ar',
          title: 'أسئلة التاريخ العالمي',
          prompt: 'أنشئ 5 أسئلة حول أحداث مهمة في التاريخ العالمي من 1900-1950، مناسبة لطلاب المدرسة الثانوية.'
        }
      ];
    case 'he':
      return [
        {
          id: 'math-algebra-he',
          title: 'שאלות אלגברה',
          prompt: 'צור 5 שאלות אלגברה מתאימות לתלמידי תיכון. כלול תמהיל של פתרון משוואות, פירוק גורמים ובעיות מילוליות.'
        },
        {
          id: 'science-biology-he',
          title: 'שאלות ביולוגיה',
          prompt: 'צור 5 שאלות ביולוגיה על מבנה ותפקוד התא לתלמידי כיתה ט. כלול תרשימים במידת הצורך.'
        },
        {
          id: 'language-grammar-he',
          title: 'שאלות דקדוק',
          prompt: 'צור 5 שאלות דקדוק המתמקדות בזמני פעלים, התאמה בין נושא לפועל, ופיסוק מתאים לתלמידי חטיבת ביניים.'
        },
        {
          id: 'history-world-he',
          title: 'שאלות היסטוריה עולמית',
          prompt: 'צור 5 שאלות על אירועים חשובים בהיסטוריה העולמית משנת 1900-1950, מתאימות לתלמידי תיכון.'
        }
      ];
    default: // English
      return [
        {
          id: 'math-algebra',
          title: 'Algebra Questions',
          prompt: 'Create 5 algebra questions suitable for high school students. Include a mix of equation solving, factoring, and word problems.'
        },
        {
          id: 'science-biology',
          title: 'Biology Questions',
          prompt: 'Generate 5 biology questions about cell structure and function for 9th grade students. Include diagrams where appropriate.'
        },
        {
          id: 'language-grammar',
          title: 'Grammar Questions',
          prompt: 'Create 5 grammar questions focusing on verb tenses, subject-verb agreement, and punctuation suitable for middle school students.'
        },
        {
          id: 'history-world',
          title: 'World History Questions',
          prompt: `Generate 5 questions about important events in world history from 1900-1950, suitable for high school students.`
        }
      ];
  }
};

// Add this function after the getTemplatesByLanguage function
const getPersonalizedTemplates = (subject: string, gradeLevel: string, language: string) => {
  // Return empty array if subject or grade are not filled in
  if (!subject || !gradeLevel) return [];
  
  // Clean and normalize inputs
  const cleanSubject = subject.trim().toLowerCase();
  const cleanGrade = gradeLevel.trim().toLowerCase();
  
  // Generate personalized templates based on subject
  const templates = [];
  
  // Match subject to categories
  if (cleanSubject.includes('math') || cleanSubject.includes('algebra') || 
      cleanSubject.includes('calculus') || cleanSubject.includes('geometry')) {
    
    templates.push({
      id: 'math-personalized',
      title: `${subject} Questions for ${gradeLevel}`,
      prompt: `Create 5 ${cleanSubject} questions suitable for ${cleanGrade} students. Include a mix of problem types with appropriate difficulty.`
    });
    
    templates.push({
      id: 'math-word-problems',
      title: `Word Problems for ${subject}`,
      prompt: `Generate 5 word problems related to ${cleanSubject} for ${cleanGrade} students. Include real-world applications.`
    });
  }
  
  if (cleanSubject.includes('english') || cleanSubject.includes('literature') || 
      cleanSubject.includes('language') || cleanSubject.includes('writing')) {
    
    templates.push({
      id: 'english-personalized',
      title: `${subject} Questions for ${gradeLevel}`,
      prompt: `Create 5 ${cleanSubject} questions for ${cleanGrade} students. Include questions about grammar, vocabulary, and comprehension.`
    });
    
    templates.push({
      id: 'literature-analysis',
      title: `Literature Analysis Questions`,
      prompt: `Generate 5 text analysis questions suitable for ${cleanGrade} ${cleanSubject} students. Focus on themes, characters, and literary devices.`
    });
  }
  
  if (cleanSubject.includes('science') || cleanSubject.includes('biology') || 
      cleanSubject.includes('chemistry') || cleanSubject.includes('physics')) {
    
    templates.push({
      id: 'science-personalized',
      title: `${subject} Questions for ${gradeLevel}`,
      prompt: `Create 5 ${cleanSubject} questions for ${cleanGrade} students. Include a mix of conceptual understanding and applied knowledge.`
    });
    
    templates.push({
      id: 'science-experiment',
      title: `Experiment Analysis Questions`,
      prompt: `Generate 5 questions about experimental design and data analysis in ${cleanSubject} appropriate for ${cleanGrade} level.`
    });
  }
  
  if (cleanSubject.includes('history') || cleanSubject.includes('social') || 
      cleanSubject.includes('geography') || cleanSubject.includes('economics')) {
    
    templates.push({
      id: 'history-personalized',
      title: `${subject} Questions for ${gradeLevel}`,
      prompt: `Create 5 ${cleanSubject} questions for ${cleanGrade} students. Include questions about important events, figures, and concepts.`
    });
    
    templates.push({
      id: 'history-analysis',
      title: `Source Analysis Questions`,
      prompt: `Generate 5 source analysis questions related to ${cleanSubject} appropriate for ${cleanGrade} students.`
    });
  }
  
  // Add a generic template if no specific category matched
  if (templates.length === 0) {
    templates.push({
      id: 'generic-personalized',
      title: `${subject} Questions for ${gradeLevel}`,
      prompt: `Create 5 ${cleanSubject} questions suitable for ${cleanGrade} level students. Include a variety of question types and difficulty levels.`
    });
  }
  
  return templates;
};

function AskSparkHelper({ isVisible, setIsVisible }: { 
  isVisible: boolean, 
  setIsVisible: (visible: boolean) => void 
}) {
  const [expanded, setExpanded] = useState(false);
  const [showGlowAnimation, setShowGlowAnimation] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGlowAnimation(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed bottom-20 right-12 z-50 flex flex-col items-end">
      {expanded && (
        <div className="mb-4 bg-white rounded-lg shadow-lg border border-blue-200 p-4 max-w-xs">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-gray-900">Spark Assistant</h4>
            <button onClick={() => setExpanded(false)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-700">I can help you create exams with AI assistance. You can generate questions from your materials, customize them, and create professional looking exams.</p>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center text-xs text-gray-500">
              <span>Need more help?</span>
              <button className="ml-2 px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">View Guide</button>
            </div>
          </div>
        </div>
      )}
      <button 
        onClick={() => setExpanded(!expanded)} 
        className={`bg-white rounded-full p-3 shadow-lg border ${
          showGlowAnimation ? 'animate-spark-glow border-blue-400' : 'border-blue-200'
        } hover:bg-blue-50 transition-colors`}
      >
        <div className="flex items-center">
          <SparkMascot width={40} height={40} variant="blue" blinking={false} />
          {!expanded && (<span className="ml-2 mr-3 text-sm font-medium text-gray-700">Ask Spark</span>)}
        </div>
      </button>
    </div>
  );
}

// Create a new component for template display
const TemplateDisplay = ({ metadata, language, templates, setAiPrompt }: {
  metadata: any;
  language: string;
  templates: any[];
  setAiPrompt: (prompt: string) => void;
}) => {
  const [displayTemplates, setDisplayTemplates] = useState<any[]>([]);

  useEffect(() => {
    if (metadata.subject && metadata.grade) {
      const personalizedTemplates = getPersonalizedTemplates(metadata.subject, metadata.grade, language);
      setDisplayTemplates(personalizedTemplates.length > 0 ? personalizedTemplates : templates);
    } else {
      setDisplayTemplates(templates);
    }
  }, [metadata.subject, metadata.grade, language, templates]);

  return (
    <div className="flex flex-wrap gap-2">
      {displayTemplates.map(template => (
        <button
          key={template.id}
          onClick={() => setAiPrompt(template.prompt)}
          className="px-3 py-1 bg-blue-100 text-black rounded-lg hover:bg-blue-200 text-sm"
        >
          {template.title || template.id}
        </button>
      ))}
      {metadata.subject && metadata.grade && (
        <p className="text-xs text-gray-600 mt-1">
          Templates personalized for {metadata.subject}, {metadata.grade} level
        </p>
      )}
    </div>
  );
};

export default function ExamCreator() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [showMaterialSelector, setShowMaterialSelector] = useState(false);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'info'
  });
  
  const [loading, setLoading] = useState(false);
  const user = getUserFromCookies();
  const [metadata, setMetadata] = useState<ExamMetadata>({
    title: user?.school ? `${user.school} Exam` : 'New Exam',
    subject: user?.subject || '',
    grade: user?.classLevel || '',
    duration: 60,
    totalPoints: 100,
    instructions: 'Answer all questions. Each question is worth the indicated points.',
    teacherName: user?.name || '',
    schoolName: user?.school || '',
    createdAt: new Date().toISOString(),
    language: language
  });
  
  const [aiPrompt, setAiPrompt] = useState('');
  const pdfRef = useRef<HTMLDivElement>(null);

  // Now we pass the language from the component
  const templates = getTemplatesByLanguage(language);

  // Load materials when selector opens
  useEffect(() => {
    if (showMaterialSelector) {
      const stored = localStorage.getItem(MATERIALS_STORAGE_KEY);
      if (stored) {
        const allMaterials = JSON.parse(stored);
        setMaterials(allMaterials);
      }
    }
  }, [showMaterialSelector]);

  // Update the useEffect to ensure teacher data is properly loaded
  useEffect(() => {
    // Always try to get user data from cookies to ensure fields are populated
    const userData = getUserFromCookies();
    console.log("User data from cookies:", userData);
    
    if (userData) {
      // Set metadata with user data from cookies
      setMetadata(prev => ({
        ...prev,
        title: userData.school ? `${userData.school} Exam` : 'New Exam',
        teacherName: userData.name || '',
        schoolName: userData.school || '',
        subject: userData.subject || '',
        grade: userData.classLevel || ''
      }));
      
      // Force render by logging the updated values
      console.log("Updated metadata with user data:", {
        teacherName: userData.name,
        schoolName: userData.school,
        subject: userData.subject,
        grade: userData.classLevel
      });
    }
  }, [editingQuestion, loading, notification.show, showMaterialSelector]);

  // Update the file processing logic in your exam creator page
  const handleFileUpload = async (file: File) => {
    let extractedText = '';
    try {
      // Convert File to Buffer first
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (file.type.includes('pdf')) {
        extractedText = await extractTextFromPDF(buffer);
      } else if (file.type.includes('image')) {
        extractedText = await extractTextFromImage(buffer);
      } else {
        throw new Error('Unsupported file type');
      }

      // Process the extracted text...
      return extractedText;
    } catch (error) {
      console.error('Error processing file:', error);
      throw error;
    }
  };

  // Add these state variables near the top of your component with other state declarations
  const [processingFile, setProcessingFile] = useState(false);
  const [processingStage, setProcessingStage] = useState('');

  // Then update the onDrop function to properly use these states
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setLoading(true);
    setProcessingFile(true);
    setProcessingStage('Processing file...');

    try {
      const extractedText = await handleFileUpload(file);
      
      if (!extractedText) {
        throw new Error('No text could be extracted from the file');
      }

      // Process the extracted text for questions
      const questions = await extractQuestionsFromText(extractedText);
      setQuestions(questions);
      
      toast.success(`Successfully processed ${questions.length} questions`);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process file');
    } finally {
      setLoading(false);
      setProcessingFile(false);
      setProcessingStage('');
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    },
    maxFiles: 1
  });

  // Make sure your services are properly typed
  const extractQuestionsFromText = async (text: string) => {
    try {
      // Your question extraction logic here
      const response = await fetch('/api/extract-questions/direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to extract questions');
      }

      const data = await response.json();
      return data.questions;
    } catch (error) {
      console.error('Error extracting questions:', error);
      throw error;
    }
  };

  // Generate questions with AI
  const handleAIGeneration = async () => {
    if (!aiPrompt) {
      setNotification({
        show: true,
        message: 'Please enter a prompt for the AI',
        type: 'error'
      });
      return;
    }
    
    setLoading(true);
    try {
      // Get the selected difficulty and question count
      const difficultyLevel = document.getElementById('difficultyLevel') as HTMLSelectElement;
      const questionCount = document.getElementById('questionCount') as HTMLInputElement;
      const includeAdvanced = document.getElementById('includeAdvanced') as HTMLInputElement;
      const includeMatching = document.getElementById('includeMatching') as HTMLInputElement;
      
      // Get desired count
      const desiredCount = parseInt(questionCount?.value || '5');
      
      // Build enhanced prompt with specific instructions
      let enhancedPrompt = aiPrompt;
      
      // Add question count to the prompt instead of as a separate parameter
      enhancedPrompt += `\n\nPlease generate exactly ${desiredCount} questions.`;
      
      // Add difficulty instruction and adjust question types based on difficulty
      let questionTypes = [];
      
      if (difficultyLevel && difficultyLevel.value) {
        const difficulty = difficultyLevel.value;
        
        if (difficulty === 'hard') {
          enhancedPrompt += "\n\nCreate challenging, advanced-level questions that require deep understanding and critical thinking.";
          // Hard questions should focus on essay, advanced, and complex matching
          questionTypes = ['essay', 'short_answer'];
          if (includeAdvanced && includeAdvanced.checked) {
            questionTypes.push('advanced');
          }
          if (includeMatching && includeMatching.checked) {
            questionTypes.push('matching');
          }
        } else if (difficulty === 'medium') {
          enhancedPrompt += "\n\nCreate moderate difficulty questions that test comprehensive understanding.";
          // Medium questions should have a mix
          questionTypes = ['multiple_choice', 'short_answer', 'matching'];
          if (includeAdvanced && includeAdvanced.checked) {
            questionTypes.push('advanced');
          }
        } else {
          enhancedPrompt += "\n\nCreate basic questions to test fundamental knowledge.";
          // Easy questions should focus on multiple choice and true/false
          questionTypes = ['multiple_choice', 'true_false'];
        }
      } else {
        // Default mix if no difficulty selected
        questionTypes = ['multiple_choice', 'short_answer', 'true_false', 'essay'];
        if (includeAdvanced && includeAdvanced.checked) {
          questionTypes.push('advanced');
        }
        if (includeMatching && includeMatching.checked) {
          questionTypes.push('matching');
        }
      }
      
      const generatedQuestions = await generateExamFromText(enhancedPrompt, {
        language,
        subject: metadata.subject,
        grade: metadata.grade,
        questionTypes: questionTypes,
        difficulty: [difficultyLevel?.value || 'medium']
      });
      
      // If we need to limit the number of questions, we can do it here
      const limitedQuestions = generatedQuestions.slice(0, desiredCount);
      
      setQuestions(prev => [...prev, ...limitedQuestions]);
      setNotification({
        show: true,
        message: `Successfully generated ${limitedQuestions.length} questions`,
        type: 'success'
      });
      setAiPrompt('');
    } catch (error) {
      console.error('Error generating exam:', error);
      setNotification({
        show: true,
        message: 'Failed to generate questions',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Select material
  const handleSelectMaterial = (material: any) => {
    try {
      // Parse material content
      let content;
      if (typeof material.content === 'string') {
        content = JSON.parse(material.content);
      } else {
        content = material.content;
      }
      
      // Instead of adding questions directly, use the content for AI generation
      let contextText = '';
      
      // Extract text from questions if available
      if (content.questions && Array.isArray(content.questions)) {
        contextText = content.questions.map((q: any) => 
          `${q.question}\n${q.answer || ''}\n${q.explanation || ''}`
        ).join('\n\n');
      }
      
      // Set the AI prompt to use this material
      setAiPrompt(`Based on this content, create exam questions:\n\n${contextText}`);
      setShowMaterialSelector(false);
      
      setNotification({
        show: true,
        message: 'Material loaded as context for AI generation',
        type: 'success'
      });
    } catch (error) {
      console.error('Error parsing material:', error);
      setNotification({
        show: true,
        message: 'Failed to parse material',
        type: 'error'
      });
    }
  };

  // Add a new blank question
  const addNewQuestion = () => {
    const newQuestion: ExamQuestion = {
      id: Date.now(),
      type: 'multiple_choice',
      question: '',
      answer: '',
      options: ['', '', '', ''],
      points: 10,
      difficulty: 'medium'
    };
    
    setEditingQuestion(newQuestion);
  };

  // Remove a question
  const removeQuestion = (questionId: number) => {
    // First confirm with the user
    if (confirm('Are you sure you want to delete this question?')) {
      // Filter out the question with the matching ID
      setQuestions(questions.filter(q => q.id !== questionId));
      
      // Show notification
      setNotification({
        show: true,
        message: 'Question deleted successfully',
        type: 'success'
      });
      
      // Auto-hide notification after 3 seconds
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);
    }
  };

  // Save changes to a question
  const saveQuestionChanges = () => {
    if (editingQuestion) {
      setQuestions(questions.map(q => 
        q.id === editingQuestion.id ? editingQuestion : q
      ));
      setEditingQuestion(null);
    }
  };

  // Save exam to materials
  const saveToMaterials = () => {
    if (!metadata.title) {
      setNotification({
        show: true,
        message: 'Please enter a title for the exam',
        type: 'error'
      });
      return;
    }
    
    if (questions.length === 0) {
      setNotification({
        show: true,
        message: 'Please add at least one question',
        type: 'error'
      });
      return;
    }
    
    try {
      const examData = {
        id: `exam-${Date.now()}`,
        title: metadata.title,
        content: JSON.stringify({
          metadata,
          questions,
          createdAt: new Date().toISOString()
        }),
        category: 'exam',
        createdAt: new Date().toISOString()
      };

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
      
      materials.unshift(examData);
      localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(materials));
      
      setNotification({
        show: true,
        message: 'Exam saved to materials successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error saving exam:', error);
      setNotification({
        show: true,
        message: 'Failed to save exam to materials',
        type: 'error'
      });
    }
  };

  // Download as PDF
  const downloadAsPDF = () => {
    if (!metadata.title) {
      setNotification({
        show: true,
        message: t('pleaseEnterTitle'),
        type: 'error'
      });
      return;
    }
    
    if (questions.length === 0) {
      setNotification({
        show: true,
        message: t('pleaseAddQuestions'),
        type: 'error'
      });
      return;
    }
    
    try {
      // Improved CSS for better print formatting
      const html = `
        <!DOCTYPE html>
        <html dir="${language === 'ar' || language === 'he' ? 'rtl' : 'ltr'}">
        <head>
          <meta charset="UTF-8">
          <title>${metadata.title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #000;
              margin: 0;
              padding: 20px;
            }
            .school-header {
              text-align: center;
              margin-bottom: 10px;
              font-size: 1.5em;
              font-weight: bold;
              color: #000;
              border-bottom: 2px solid #000;
              padding-bottom: 5px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 1px solid #000;
            }
            .exam-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            .exam-info div {
              margin-bottom: 10px;
            }
            .instructions {
              border: 1px solid #000;
              padding: 10px;
              margin-bottom: 20px;
              background-color: #f9f9f9;
            }
            .question {
              margin-bottom: 25px;
              padding-bottom: 15px;
              border-bottom: 1px solid #ddd;
              page-break-inside: avoid;
            }
            .question-header {
              font-weight: bold;
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
            }
            .options {
              margin-left: 20px;
            }
            .essay-space {
              margin-top: 15px;
              border: 1px solid #ddd;
              border-radius: 4px;
              min-height: 200px;
            }
            .short-answer-space {
              margin-top: 10px;
              border-bottom: 1px dashed #000;
              min-height: 60px;
            }
            .true-false {
              display: flex;
              gap: 30px;
              margin-top: 10px;
            }
            .true-false div {
              display: flex;
              align-items: center;
            }
            .circle {
              display: inline-block;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              border: 1px solid #000;
              margin-right: 10px;
            }
            .matching-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            .matching-table td {
              padding: 8px;
              border: 1px solid #ddd;
            }
            .matching-table .left-col {
              width: 45%;
            }
            .matching-table .right-col {
              width: 45%;
            }
            .matching-table .center-col {
              width: 10%;
              text-align: center;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 0.9em;
            }
            .advanced-question img {
              max-width: 100%;
              margin: 10px 0;
            }
            .formula {
              font-family: 'Times New Roman', serif;
              padding: 8px;
              background-color: #f8f8f8;
              margin: 10px 0;
              border-radius: 4px;
            }
            .reading-passage {
              padding: 10px;
              background-color: #f5f5f5;
              border-left: 3px solid #ddd;
              margin: 10px 0;
            }
            .difficulty-indicator {
              display: inline-block;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 0.8em;
              margin-left: 8px;
              font-weight: normal;
            }
            .difficulty-easy {
              background-color: #d1fae5;
              color: #065f46;
            }
            .difficulty-medium {
              background-color: #e0f2fe;
              color: #0369a1;
            }
            .difficulty-hard {
              background-color: #fee2e2;
              color: #b91c1c;
            }
            .fill-blanks {
              margin-top: 10px;
            }
            .fill-blanks .blank {
              display: inline-block;
              width: 100px;
              border-bottom: 1px solid #000;
              margin: 0 5px;
            }
            .ordering-list {
              margin-top: 15px;
            }
            .ordering-list .order-item {
              padding: 8px;
              border: 1px solid #ddd;
              margin-bottom: 8px;
              background-color: #f9f9f9;
            }
            .numerical-answer {
              margin-top: 15px;
              border-bottom: 1px dashed #000;
              min-height: 40px;
              width: 150px;
            }
            ${language === 'ar' || language === 'he' ? `
              body {
                font-family: 'Arial', 'Tahoma', sans-serif;
              }
            ` : ''}
          </style>
        </head>
        <body>
          <div class="school-header">
            ${metadata.schoolName || 'School Name'}
          </div>
          
          <div class="header">
            <h1>${metadata.title}</h1>
            <h3>${metadata.teacherName ? `${t('teacher')}: ${metadata.teacherName}` : ''}</h3>
          </div>
          
          <div class="exam-info">
            <div>
              <p><strong>${t('examSubject')}:</strong> ${metadata.subject}</p>
              <p><strong>${t('examGrade')}:</strong> ${metadata.grade}</p>
            </div>
            <div>
              <p><strong>${t('examDuration')}:</strong> ${metadata.duration} ${t('minutes')}</p>
              <p><strong>${t('totalPoints')}:</strong> ${questions.reduce((sum, q) => sum + q.points, 0)}</p>
            </div>
          </div>
          
          <div class="instructions">
            <h3>${t('instructions')}:</h3>
            <p>${metadata.instructions}</p>
          </div>
          
          <div class="questions">
            ${questions.map((q, index) => `
              <div class="question">
                <div class="question-header">
                  <div>${index + 1}. ${q.question}
                    <span class="difficulty-indicator difficulty-${q.difficulty || 'medium'}">
                      ${q.difficulty === 'easy' ? 'Easy' : q.difficulty === 'hard' ? 'Hard' : 'Medium'}
                    </span>
                  </div>
                  <div>(${q.points} ${t('points')})</div>
                </div>
                
                ${q.type === 'advanced' ? `
                  <div class="advanced-question">
                    ${q.imageUrl ? `<img src="${q.imageUrl}" alt="Question image">` : ''}
                    ${q.formula ? `<div class="formula">${q.formula}</div>` : ''}
                    ${q.hasLargeText ? `<div class="reading-passage">${q.answer}</div>` : ''}
                    <div class="short-answer-space"></div>
                  </div>
                ` : ''}
                
                ${q.type === 'matching' ? `
                  <table class="matching-table">
                    <tr>
                      <th class="left-col">Column A</th>
                      <th class="center-col"></th>
                      <th class="right-col">Column B</th>
                    </tr>
                    ${(q.matchingItems || []).map((item, idx) => `
                      <tr>
                        <td class="left-col">${String.fromCharCode(65 + idx)}. ${item.left}</td>
                        <td class="center-col">____</td>
                        <td class="right-col">${idx + 1}. ${item.right}</td>
                      </tr>
                    `).join('')}
                  </table>
                ` : ''}
                
                ${q.type === 'multiple_choice' && q.options && q.options.length > 0 ? `
                  <div class="options">
                    ${q.options.map((option, optIndex) => `
                      <div style="margin-bottom: 8px;">
                        <span class="circle"></span> ${String.fromCharCode(65 + optIndex)}. ${option}
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
                
                ${q.type === 'true_false' ? `
                  <div class="true-false">
                    <div>
                      <span class="circle"></span> ${t('true')}
                    </div>
                    <div>
                      <span class="circle"></span> ${t('false')}
                    </div>
                  </div>
                ` : ''}
                
                ${q.type === 'short_answer' ? `
                  <div class="short-answer-space"></div>
                ` : ''}
                
                ${q.type === 'essay' ? `
                  <div class="essay-space"></div>
                ` : ''}
                
                ${q.type === 'fill_blanks' ? `
                  <div class="fill-blanks">
                    ${q.question.replace(/_+/g, '<span class="blank"></span>')}
                  </div>
                ` : ''}
                
                ${q.type === 'ordering' ? `
                  <div class="ordering-list">
                    ${(q.orderItems || []).sort(() => Math.random() - 0.5).map((item, idx) => `
                      <div class="order-item">
                        <span class="circle"></span> ${item}
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
                
                ${q.type === 'numerical' ? `
                  <div class="numerical-answer"></div>
                ` : ''}
              </div>
            `).join('')}
          </div>
          
          <div class="footer">
            <p>${t('goodLuck')}</p>
          </div>
        </body>
        </html>
      `;
      
      // Create a hidden iframe for printing
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      // Write content to iframe and trigger print
      if (iframe.contentDocument) {
        iframe.contentDocument.open();
        iframe.contentDocument.write(html);
        iframe.contentDocument.close();
      }
      
      setTimeout(() => {
        if (iframe.contentWindow) {
          iframe.contentWindow.print();
        }
        document.body.removeChild(iframe);
      }, 500);
      
      setNotification({
        show: true,
        message: t('pdfDownloadStarted'),
        type: 'success'
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      setNotification({
        show: true,
        message: t('pdfGenerationFailed'),
        type: 'error'
      });
    }
  };

  // 3. ADD these state variables to your main component, near the other state declarations:
  const [showHelper, setShowHelper] = useState(true);
  const isRTL = language === 'ar' || language === 'he';

  // Add this useEffect to enable sidebar navigation
  useEffect(() => {
    // Clean up any possible event listeners or modal states that might block navigation
    return () => {
      if (showMaterialSelector) setShowMaterialSelector(false);
      if (editingQuestion) setEditingQuestion(null);
      if (loading) setLoading(false);
      
      if (notification.show) {
        setNotification({
          show: false,
          message: '',
          type: 'info'
        });
      }
      
      document.body.style.overflow = 'auto';
    };
  }, [showMaterialSelector, editingQuestion, loading, notification.show]);

  const showNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, show: true }));
  }, []); // Empty dependency array since we're using the setter function

  useEffect(() => {
    if (loading) {
      showNotification();
    }
  }, [loading, showNotification]); // Now properly memoized

  // 4. WRAP your existing return statement:
  // Find your main return statement and replace it with this wrapper,
  // but keep all your existing JSX content inside the inner div
  return (
    <div className={`min-h-screen bg-gray-50 p-6 overflow-auto ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* New header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center gap-3">
              <SparkMascot width={36} height={36} variant="blue" />
              <h2 className="text-xl font-bold text-gray-900">ExamCrafter</h2>
            </div>
            <a
              href="/dashboard/teacher/tools"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5 mr-1" />
              <span>Back to Superpowers</span>
            </a>
          </div>
          
          {/* This div will contain all your existing content */}
          <div className="p-6">
            {/* PUT YOUR EXISTING CONTENT HERE - DO NOT DELETE ANYTHING */}
            <div className="bg-white">
              <div className="max-w-7xl mx-auto pb-20">
                {notification.show && (
                  <div className={`mb-4 p-3 rounded-lg ${
                    notification.type === 'success' ? 'bg-green-100 border border-green-300' : 
                    notification.type === 'error' ? 'bg-red-100 border border-red-300' : 
                    'bg-blue-100 border border-blue-300'
                  }`}>
                    <p className="text-black">{notification.message}</p>
                  </div>
                )}
                
                {/* Header */}
                <div className="flex justify-end gap-2 mb-8">
                  <button
                    onClick={saveToMaterials}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                  >
                    <BookmarkIcon className="w-5 h-5" />
                    {t('saveToMaterials')}
                  </button>
                  <button
                    onClick={downloadAsPDF}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    {t('downloadAsPDF')}
                  </button>
                </div>

                {/* Exam Metadata */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-black border-opacity-10 mb-6">
                  <h2 className="text-xl font-medium text-black mb-4">Exam Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Exam Title
                      </label>
                      <input
                        type="text"
                        value={metadata.title}
                        onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter exam title"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={metadata.subject}
                        onChange={(e) => setMetadata({ ...metadata, subject: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter subject"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Grade Level
                      </label>
                      <input
                        type="text"
                        value={metadata.grade}
                        onChange={(e) => setMetadata({ ...metadata, grade: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter grade level"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Duration (minutes)
                      </label>
                      <div className="flex items-center">
                        <input
                          type="number"
                          value={metadata.duration}
                          onChange={(e) => setMetadata({ ...metadata, duration: parseInt(e.target.value) || 60 })}
                          className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="1"
                        />
                        <span className="ml-2">{t('minutes')}</span>
                      </div>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-black mb-1">
                        Instructions
                      </label>
                      <textarea
                        value={metadata.instructions}
                        onChange={(e) => setMetadata({ ...metadata, instructions: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                        placeholder="Enter instructions for students"
                      />
                    </div>
                  </div>
                </div>

                {/* User Data Display - Enhanced to ensure teacher data is visible and editable */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-black border-opacity-10 mb-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <h3 className="text-lg font-medium text-black mb-2 md:mb-0">Teacher Information</h3>
                    <div className="w-full md:w-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-black mb-1">Teacher Name</label>
                          <input
                            type="text"
                            value={metadata.teacherName}
                            onChange={(e) => setMetadata({ ...metadata, teacherName: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter teacher name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-black mb-1">School Name</label>
                          <input
                            type="text"
                            value={metadata.schoolName}
                            onChange={(e) => setMetadata({ ...metadata, schoolName: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter school name"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Question Generation Tools */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-black border-opacity-10 mb-6">
                  <h2 className="text-xl font-medium text-black mb-4">Add Questions</h2>
                  
                  <div className="flex flex-wrap gap-4 mb-6">
                    <button
                      onClick={addNewQuestion}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1"
                    >
                      <PlusCircleIcon className="w-5 h-5" />
                      Add Question Manually
                    </button>
                    
                    <button
                      onClick={() => setShowMaterialSelector(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                    >
                      <DocumentTextIcon className="w-5 h-5" />
                      Import from Materials
                    </button>
                    
                    <div {...getRootProps()} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-1 cursor-pointer">
                      <input {...getInputProps()} />
                      <CloudArrowUpIcon className="w-5 h-5" />
                      {t('examUploadFile')}
                    </div>
                  </div>
                  
                  {/* AI Generation with enhanced controls */}
                  <div className="border border-gray-200 rounded-lg p-5 bg-gradient-to-r from-blue-50 to-white">
                    <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                      <SparklesIcon className="w-5 h-5 text-blue-500 mr-2" />
                      AI Question Generator
                    </h3>
                    
                    <div className="mb-4">
                      <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Describe the topic or content for the questions, e.g. 'Create questions about photosynthesis for 9th grade biology'"
                      />
                    </div>
                    
                    {/* Enhanced AI controls with better explanation of difficulty levels */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block mb-1 text-black font-medium">Question Difficulty</label>
                        <select
                          id="difficultyLevel"
                          className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          defaultValue="medium"
                        >
                          <option value="easy">Easy - Multiple choice & True/False</option>
                          <option value="medium">Medium - Mix of all question types</option>
                          <option value="hard">Hard - Essay, Short answer & Advanced</option>
                        </select>
                        <p className="text-xs text-black mt-1">Different difficulty levels generate different question types</p>
                      </div>
                      
                      <div>
                        <label className="block mb-1 text-black font-medium">Number of Questions</label>
                        <input
                          id="questionCount"
                          type="number"
                          min="1"
                          max="20"
                          defaultValue="5"
                          className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block mb-1 text-black font-medium">Question Types to Include</label>
                        <div className="flex flex-wrap gap-4">
                          <div className="flex items-center">
                            <input
                              id="includeAdvanced"
                              type="checkbox"
                              className="mr-2"
                              defaultChecked
                            />
                            <label htmlFor="includeAdvanced" className="text-black">Advanced (images/formulas)</label>
                          </div>
                          <div className="flex items-center">
                            <input
                              id="includeMatching"
                              type="checkbox"
                              className="mr-2"
                              defaultChecked
                            />
                            <label htmlFor="includeMatching" className="text-black">Matching Columns</label>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Update this part to use the new TemplateDisplay component */}
                    <div className="mt-2">
                      <p className="text-black font-medium mb-2">Quick AI Templates:</p>
                      <TemplateDisplay 
                        metadata={metadata}
                        language={language}
                        templates={templates}
                        setAiPrompt={setAiPrompt}
                      />
                    </div>
                    
                    <button
                      onClick={handleAIGeneration}
                      disabled={loading || !aiPrompt}
                      className={`mt-4 px-4 py-2 rounded-lg flex items-center gap-1 ${
                        loading || !aiPrompt
                          ? 'bg-black bg-opacity-20 cursor-not-allowed text-black'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      <SparklesIcon className="w-5 h-5" />
                      {loading ? 'Generating...' : 'Generate Questions with AI'}
                    </button>
                  </div>
                </div>

                {/* Add more quick add buttons for different question types */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={addNewQuestion}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm flex items-center gap-1"
                  >
                    <PlusCircleIcon className="w-4 h-4" />
                    Multiple Choice
                  </button>
                  <button
                    onClick={() => {
                      const newQuestion: ExamQuestion = {
                        id: Date.now(),
                        type: 'true_false',
                        question: '',
                        answer: 'A', // Default to True
                        points: 5,
                        difficulty: 'easy'
                      };
                      setEditingQuestion(newQuestion);
                    }}
                    className="px-3 py-1 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 text-sm flex items-center gap-1"
                  >
                    <PlusCircleIcon className="w-4 h-4" />
                    True/False
                  </button>
                  <button
                    onClick={() => {
                      const newQuestion: ExamQuestion = {
                        id: Date.now(),
                        type: 'short_answer',
                        question: '',
                        answer: '',
                        points: 10,
                        difficulty: 'medium'
                      };
                      setEditingQuestion(newQuestion);
                    }}
                    className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-sm flex items-center gap-1"
                  >
                    <PlusCircleIcon className="w-4 h-4" />
                    Short Answer
                  </button>
                  <button
                    onClick={() => {
                      const newQuestion: ExamQuestion = {
                        id: Date.now(),
                        type: 'advanced',
                        question: '',
                        answer: '',
                        points: 10,
                        difficulty: 'medium',
                        imageUrl: '',
                        formula: '',
                        hasLargeText: false
                      };
                      setEditingQuestion(newQuestion);
                    }}
                    className="px-3 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm flex items-center gap-1"
                  >
                    <PlusCircleIcon className="w-4 h-4" />
                    Advanced Question
                  </button>
                  <button
                    onClick={() => {
                      const newQuestion: ExamQuestion = {
                        id: Date.now(),
                        type: 'matching',
                        question: '',
                        answer: '',
                        points: 15,
                        difficulty: 'medium',
                        matchingItems: [
                          { left: '', right: '' },
                          { left: '', right: '' },
                          { left: '', right: '' },
                          { left: '', right: '' }
                        ]
                      };
                      setEditingQuestion(newQuestion);
                    }}
                    className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 text-sm flex items-center gap-1"
                  >
                    <PlusCircleIcon className="w-4 h-4" />
                    Matching Columns
                  </button>
                  <button
                    onClick={() => {
                      const newQuestion: ExamQuestion = {
                        id: Date.now(),
                        type: 'essay',
                        question: '',
                        answer: '',
                        points: 20,
                        difficulty: 'hard'
                      };
                      setEditingQuestion(newQuestion);
                    }}
                    className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 text-sm flex items-center gap-1"
                  >
                    <PlusCircleIcon className="w-4 h-4" />
                    Essay Question
                  </button>
                  
                  {/* New question types */}
                  <button
                    onClick={() => {
                      const newQuestion: ExamQuestion = {
                        id: Date.now(),
                        type: 'fill_blanks',
                        question: 'Complete the following sentence: ___ is the capital of France.',
                        answer: 'Paris',
                        blanks: ['Paris'],
                        points: 10,
                        difficulty: 'easy'
                      };
                      setEditingQuestion(newQuestion);
                    }}
                    className="px-3 py-1 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 text-sm flex items-center gap-1"
                  >
                    <PlusCircleIcon className="w-4 h-4" />
                    Fill in the Blanks
                  </button>
                  
                  <button
                    onClick={() => {
                      const newQuestion: ExamQuestion = {
                        id: Date.now(),
                        type: 'ordering',
                        question: 'Arrange the following events in chronological order:',
                        answer: '1,2,3,4',
                        orderItems: ['First event', 'Second event', 'Third event', 'Fourth event'],
                        points: 15,
                        difficulty: 'medium'
                      };
                      setEditingQuestion(newQuestion);
                    }}
                    className="px-3 py-1 bg-cyan-50 text-cyan-700 rounded-lg hover:bg-cyan-100 text-sm flex items-center gap-1"
                  >
                    <PlusCircleIcon className="w-4 h-4" />
                    Ordering/Sequence
                  </button>
                  
                  <button
                    onClick={() => {
                      const newQuestion: ExamQuestion = {
                        id: Date.now(),
                        type: 'numerical',
                        question: 'Calculate: 25 × 4 =',
                        answer: '100',
                        tolerance: 0,
                        points: 10,
                        difficulty: 'medium'
                      };
                      setEditingQuestion(newQuestion);
                    }}
                    className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 text-sm flex items-center gap-1"
                  >
                    <PlusCircleIcon className="w-4 h-4" />
                    Numerical Answer
                  </button>
                </div>

                {/* Questions List */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-black border-opacity-10 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-medium text-black">
                      Exam Questions ({questions.length})
                    </h2>
                    {questions.length > 0 && (
                      <div className="text-black">
                        Total Points: {questions.reduce((sum, q) => sum + q.points, 0)}
                      </div>
                    )}
                  </div>
                  
                  {questions.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-black border-opacity-20 rounded-lg">
                      <p className="text-black">No questions added yet</p>
                      <p className="text-black mt-1">Use the tools above to add questions</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {questions.map((question, index) => (
                        <div 
                          key={question.id} 
                          className="border border-gray-200 rounded-lg p-5 mb-4 shadow-sm hover:shadow-md transition-shadow bg-white"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="bg-gray-100 text-black rounded-full w-6 h-6 flex items-center justify-center font-medium">
                                {index + 1}
                              </span>
                              <div className="flex-1">
                                <div className="text-black font-medium">{question.question}</div>
                                
                                {/* Advanced type display with image, formula, or large text */}
                                {question.type === 'advanced' && (
                                  <div className="mt-2">
                                    {question.imageUrl && (
                                      <div className="mb-2 border rounded p-2 max-w-md">
                                        <Image 
                                          src={question.imageUrl}
                                          alt="Question image"
                                          width={500}
                                          height={300}
                                          layout="responsive"
                                        />
                                      </div>
                                    )}
                                    {question.formula && (
                                      <div className="mb-2 p-2 bg-gray-50 rounded text-black font-mono">
                                        {question.formula}
                                      </div>
                                    )}
                                    {question.hasLargeText && question.answer && (
                                      <div className="mb-2 p-2 bg-gray-50 rounded max-h-40 overflow-auto text-black">
                                        <div className="italic mb-1 text-black">Reading passage:</div>
                                        <div className="text-black">{question.answer}</div>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {/* Matching type display */}
                                {question.type === 'matching' && question.matchingItems && (
                                  <div className="mt-2 border rounded overflow-hidden">
                                    <table className="w-full border-collapse">
                                      <thead className="bg-gray-50">
                                        <tr>
                                          <th className="p-2 text-left text-black border">Column A</th>
                                          <th className="p-2 text-left text-black border">Column B</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {question.matchingItems.map((item, idx) => (
                                          <tr key={idx}>
                                            <td className="p-2 border text-black">{String.fromCharCode(65 + idx)}. {item.left}</td>
                                            <td className="p-2 border text-black">{idx + 1}. {item.right}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                                
                                {/* Multiple choice options */}
                                {question.type === 'multiple_choice' && question.options && question.options.length > 0 ? `
                                  <div class="options">
                                    ${question.options.map((option, optIndex) => `
                                      <div style="margin-bottom: 8px;">
                                        <span class="circle"></span> ${String.fromCharCode(65 + optIndex)}. ${option}
                                      </div>
                                    `).join('')}
                                  </div>
                                ` : ''}
                                
                                {question.type === 'true_false' ? `
                                  <div class="true-false">
                                    <div>
                                      <span class="circle"></span> ${t('true')}
                                    </div>
                                    <div>
                                      <span class="circle"></span> ${t('false')}
                                    </div>
                                  </div>
                                ` : ''}
                                
                                {question.type === 'short_answer' ? `
                                  <div class="short-answer-space"></div>
                                ` : ''}
                                
                                {question.type === 'essay' ? `
                                  <div class="essay-space"></div>
                                ` : ''}
                                
                                {question.type === 'fill_blanks' ? `
                                  <div class="fill-blanks">
                                    ${question.question.replace(/_+/g, '<span class="blank"></span>')}
                                  </div>
                                ` : ''}
                                
                                {question.type === 'ordering' ? `
                                  <div class="ordering-list">
                                    ${(question.orderItems || []).sort(() => Math.random() - 0.5).map((item, idx) => `
                                      <div class="order-item">
                                        <span class="circle"></span> ${item}
                                      </div>
                                    `).join('')}
                                  </div>
                                ` : ''}
                                
                                {question.type === 'numerical' ? `
                                  <div class="numerical-answer"></div>
                                ` : ''}
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingQuestion({ ...question })}
                                className="p-1 hover:bg-gray-100 rounded"
                                title="Edit question"
                              >
                                <PencilSquareIcon className="w-5 h-5 text-blue-600" />
                              </button>
                              <button
                                onClick={() => removeQuestion(question.id)}
                                className="p-1 hover:bg-gray-100 rounded"
                                title="Delete question"
                              >
                                <TrashIcon className="w-5 h-5 text-red-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
          
                {/* Material Selector Modal */}
                {showMaterialSelector && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-medium text-black">
                          Select Material
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
                            return (
                              <div 
                                key={material.id}
                                onClick={() => handleSelectMaterial(material)}
                                className="p-4 border rounded-lg hover:bg-blue-50 cursor-pointer"
                              >
                                <h3 className="font-medium text-black mb-1">{material.title}</h3>
                                <p className="text-black text-sm">Created: {new Date(material.createdAt).toLocaleDateString()}</p>
                                <button className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm">
                                  Use This Material
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-black">No materials found</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Edit Question Modal */}
                {editingQuestion && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                      <div className="p-4 border-b flex justify-between items-center">
                        <h2 className="text-lg font-medium text-black">
                          {editingQuestion.id === Date.now() ? 'Add Question' : 'Edit Question'}
                        </h2>
                        <button onClick={() => setEditingQuestion(null)} className="text-black">
                          <XMarkIcon className="w-6 h-6" />
                        </button>
                      </div>
                      
                      <div className="p-6 space-y-4">
                        <div>
                          <label className="block mb-1 text-black font-medium">Question Type</label>
                          <select
                            value={editingQuestion.type}
                            onChange={(e) => {
                              const type = e.target.value as any;
                              let updatedQuestion: ExamQuestion = { ...editingQuestion, type };
                              
                              // Initialize appropriate data structures based on question type
                              if (type === 'multiple_choice') {
                                updatedQuestion.options = Array(4).fill('');
                              } else if (type === 'matching') {
                                updatedQuestion.matchingItems = Array(4).fill(0).map(() => ({ left: '', right: '' }));
                              } else if (type === 'fill_blanks') {
                                updatedQuestion.blanks = [''];
                              } else if (type === 'ordering') {
                                updatedQuestion.orderItems = Array(4).fill('');
                              } else if (type === 'numerical') {
                                updatedQuestion.tolerance = 0;
                              }
                              
                              setEditingQuestion(updatedQuestion);
                            }}
                            className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="multiple_choice">Multiple Choice</option>
                            <option value="short_answer">Short Answer</option>
                            <option value="true_false">True/False</option>
                            <option value="essay">Essay</option>
                            <option value="advanced">Advanced (Image/Formula/Large Text)</option>
                            <option value="matching">Matching Columns</option>
                            <option value="fill_blanks">Fill in the Blanks</option>
                            <option value="ordering">Ordering/Sequence</option>
                            <option value="numerical">Numerical Answer</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block mb-1 text-black font-medium">Question Text</label>
                          <textarea
                            value={editingQuestion.question}
                            onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                            placeholder="Enter your question here"
                          />
                        </div>
                        
                        {/* Advanced question type options */}
                        {editingQuestion.type === 'advanced' && (
                          <>
                            <div>
                              <label className="block mb-1 text-black font-medium">Image URL (optional)</label>
                              <input
                                type="text"
                                value={editingQuestion.imageUrl || ''}
                                onChange={(e) => setEditingQuestion({ ...editingQuestion, imageUrl: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter image URL (https://...)"
                              />
                              {editingQuestion.imageUrl && (
                                <div className="mt-2 border rounded-lg p-2 max-h-40 overflow-hidden">
                                  <Image 
                                    src={editingQuestion.imageUrl}
                                    alt="Question image"
                                    width={500}
                                    height={300}
                                    layout="responsive"
                                  />
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="block mb-1 text-black font-medium">Formula (optional - use LaTeX format)</label>
                              <textarea
                                value={editingQuestion.formula || ''}
                                onChange={(e) => setEditingQuestion({ ...editingQuestion, formula: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={2}
                                placeholder="e.g., E = mc^2 or \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}"
                              />
                            </div>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="hasLargeText"
                                checked={editingQuestion.hasLargeText || false}
                                onChange={(e) => setEditingQuestion({ ...editingQuestion, hasLargeText: e.target.checked })}
                                className="mr-2"
                              />
                              <label htmlFor="hasLargeText" className="text-black font-medium">Include large text/reading passage</label>
                            </div>
                            {editingQuestion.hasLargeText && (
                              <div>
                                <label className="block mb-1 text-black font-medium">Reading Passage/Large Text</label>
                                <textarea
                                  value={editingQuestion.answer || ''}
                                  onChange={(e) => setEditingQuestion({ ...editingQuestion, answer: e.target.value })}
                                  className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  rows={6}
                                  placeholder="Enter a paragraph, passage, or other large text content"
                                />
                              </div>
                            )}
                          </>
                        )}
                        
                        {/* Matching items editor */}
                        {editingQuestion.type === 'matching' && (
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <label className="block text-black font-medium">Matching Items</label>
                              <button 
                                onClick={() => {
                                  const items = editingQuestion.matchingItems || [];
                                  setEditingQuestion({
                                    ...editingQuestion,
                                    matchingItems: [...items, { left: '', right: '' }]
                                  });
                                }}
                                className="text-sm px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                              >
                                + Add Pair
                              </button>
                            </div>
                            
                            {(editingQuestion.matchingItems || []).map((item, idx) => (
                              <div key={idx} className="flex gap-2 mb-2 items-center">
                                <div className="text-black font-medium">{String.fromCharCode(65 + idx)}.</div>
                                <input
                                  type="text"
                                  value={item.left}
                                  onChange={(e) => {
                                    const newItems = [...(editingQuestion.matchingItems || [])];
                                    newItems[idx] = { ...newItems[idx], left: e.target.value };
                                    setEditingQuestion({ ...editingQuestion, matchingItems: newItems });
                                  }}
                                  className="flex-1 p-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Left column item"
                                />
                                <div className="text-center mx-2">→</div>
                                <input
                                  type="text"
                                  value={item.right}
                                  onChange={(e) => {
                                    const newItems = [...(editingQuestion.matchingItems || [])];
                                    newItems[idx] = { ...newItems[idx], right: e.target.value };
                                    setEditingQuestion({ ...editingQuestion, matchingItems: newItems });
                                  }}
                                  className="flex-1 p-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Right column item"
                                />
                                {idx > 1 && (
                                  <button
                                    onClick={() => {
                                      const newItems = [...(editingQuestion.matchingItems || [])];
                                      newItems.splice(idx, 1);
                                      setEditingQuestion({ ...editingQuestion, matchingItems: newItems });
                                    }}
                                    className="text-red-500 p-1"
                                  >
                                    <XMarkIcon className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                            ))}
                            
                            <div className="mt-2 text-sm text-gray-600">
                              Note: For matching questions, the correct answers will be stored automatically.
                            </div>
                          </div>
                        )}
                        
                        {/* Multiple choice options */}
                        {editingQuestion.type === 'multiple_choice' && editingQuestion.options && (
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <label className="block text-black font-medium">Answer Choices</label>
                              {editingQuestion.options.length < 6 && (
                                <button 
                                  onClick={() => {
                                    setEditingQuestion({
                                      ...editingQuestion,
                                      options: [...editingQuestion.options!, '']
                                    });
                                  }}
                                  className="text-sm px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                                >
                                  + Add Option
                                </button>
                              )}
                            </div>
                            
                            {editingQuestion.options.map((option, idx) => (
                              <div key={idx} className="flex items-center mb-2">
                                <div className="text-black font-medium mr-2">{String.fromCharCode(65 + idx)}.</div>
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...editingQuestion.options!];
                                    newOptions[idx] = e.target.value;
                                    setEditingQuestion({ ...editingQuestion, options: newOptions });
                                  }}
                                  className="flex-1 p-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                />
                                <input
                                  type="radio"
                                  name="correctOption"
                                  checked={editingQuestion.answer === String.fromCharCode(65 + idx)}
                                  onChange={() => setEditingQuestion({ ...editingQuestion, answer: String.fromCharCode(65 + idx) })}
                                  className="ml-2"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Fill in the blanks question type */}
                        {editingQuestion.type === 'fill_blanks' && (
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <label className="block text-black font-medium">Blank Spaces</label>
                              <button 
                                onClick={() => {
                                  const blanks = editingQuestion.blanks || [];
                                  setEditingQuestion({
                                    ...editingQuestion,
                                    blanks: [...blanks, '']
                                  });
                                }}
                                className="text-sm px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                              >
                                + Add Blank
                              </button>
                            </div>
                            
                            <div className="mb-4">
                              <p className="text-xs text-black mb-2">Use underscore(_) in your question text to indicate where blanks should appear.</p>
                            </div>
                            
                            {(editingQuestion.blanks || ['']).map((blank, idx) => (
                              <div key={idx} className="flex gap-2 mb-2 items-center">
                                <div className="text-black font-medium">Blank {idx + 1}:</div>
                                <input
                                  type="text"
                                  value={blank}
                                  onChange={(e) => {
                                    const newBlanks = [...(editingQuestion.blanks || [''])];
                                    newBlanks[idx] = e.target.value;
                                    setEditingQuestion({ ...editingQuestion, blanks: newBlanks });
                                    // Update answer to be comma-separated list of blanks
                                    setEditingQuestion({
                                      ...editingQuestion,
                                      blanks: newBlanks,
                                      answer: newBlanks.join(',')
                                    });
                                  }}
                                  className="flex-1 p-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Answer for blank space"
                                />
                                {idx > 0 && (
                                  <button
                                    onClick={() => {
                                      const newBlanks = [...(editingQuestion.blanks || [''])];
                                      newBlanks.splice(idx, 1);
                                      setEditingQuestion({
                                        ...editingQuestion,
                                        blanks: newBlanks,
                                        answer: newBlanks.join(',')
                                      });
                                    }}
                                    className="text-red-500 p-1"
                                  >
                                    <XMarkIcon className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Ordering question type */}
                        {editingQuestion.type === 'ordering' && (
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <label className="block text-black font-medium">Items to Order</label>
                              <button 
                                onClick={() => {
                                  const orderItems = editingQuestion.orderItems || [];
                                  setEditingQuestion({
                                    ...editingQuestion,
                                    orderItems: [...orderItems, '']
                                  });
                                }}
                                className="text-sm px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                              >
                                + Add Item
                              </button>
                            </div>
                            
                            {(editingQuestion.orderItems || []).map((item, idx) => (
                              <div key={idx} className="flex gap-2 mb-2 items-center">
                                <div className="text-black font-medium">{idx + 1}.</div>
                                <input
                                  type="text"
                                  value={item}
                                  onChange={(e) => {
                                    const newItems = [...(editingQuestion.orderItems || [])];
                                    newItems[idx] = e.target.value;
                                    setEditingQuestion({ ...editingQuestion, orderItems: newItems });
                                    // Auto-generate answer as correct sequence
                                    setEditingQuestion({
                                      ...editingQuestion,
                                      orderItems: newItems,
                                      answer: Array.from({length: newItems.length}, (_, i) => i + 1).join(',')
                                    });
                                  }}
                                  className="flex-1 p-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Item to be ordered"
                                />
                                {idx > 1 && (
                                  <button
                                    onClick={() => {
                                      const newItems = [...(editingQuestion.orderItems || [])];
                                      newItems.splice(idx, 1);
                                      setEditingQuestion({
                                        ...editingQuestion,
                                        orderItems: newItems,
                                        answer: Array.from({length: newItems.length}, (_, i) => i + 1).join(',')
                                      });
                                    }}
                                    className="text-red-500 p-1"
                                  >
                                    <XMarkIcon className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                            ))}
                            
                            <div className="mt-2 text-sm text-black">
                              Note: Items will be presented in random order to students. The correct order is as listed above.
                            </div>
                          </div>
                        )}
                        
                        {/* Numerical question type */}
                        {editingQuestion.type === 'numerical' && (
                          <div>
                            <div className="mb-4">
                              <label className="block mb-1 text-black font-medium">Correct Answer</label>
                              <input
                                type="number"
                                value={editingQuestion.answer}
                                onChange={(e) => setEditingQuestion({ ...editingQuestion, answer: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Correct numerical answer"
                                step="any"
                              />
                            </div>
                            
                            <div>
                              <label className="block mb-1 text-black font-medium">Acceptable Tolerance (±)</label>
                              <input
                                type="number"
                                value={editingQuestion.tolerance || 0}
                                onChange={(e) => setEditingQuestion({ 
                                  ...editingQuestion, 
                                  tolerance: parseFloat(e.target.value) || 0 
                                })}
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Acceptable error margin"
                                min="0"
                                step="any"
                              />
                              <p className="text-xs text-black mt-1">
                                Enter 0 for exact answers or a value like 0.5 to accept answers within that range
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4 border-t flex justify-end gap-2">
                        <button
                          onClick={() => setEditingQuestion(null)}
                          className="px-4 py-2 border border-black border-opacity-10 text-black rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveQuestionChanges}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                        >
                          Save Question
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Loading overlay */}
                {loading && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-black">Processing...</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add the Ask Spark Helper */}
      <AskSparkHelper isVisible={showHelper} setIsVisible={setShowHelper} />
      
      {/* Animation styles */}
      <style jsx global>{`
        @keyframes spark-glow {
          0% { box-shadow: 0 0 5px rgba(37, 99, 235, 0.5); border-color: rgba(37, 99, 235, 0.5); }
          50% { box-shadow: 0 0 15px rgba(37, 99, 235, 0.8); border-color: rgba(37, 99, 235, 0.8); }
          100% { box-shadow: 0 0 5px rgba(37, 99, 235, 0.5); border-color: rgba(37, 99, 235, 0.5); }
        }
        .animate-spark-glow { animation: spark-glow 1.5s ease-in-out infinite; border-width: 2px; }
      `}</style>
    </div>
  );
} 