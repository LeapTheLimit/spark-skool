'use client';

import { useParams } from 'next/navigation';
import { 
  ChevronLeftIcon, 
  BookOpenIcon,
  ChartBarIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  PencilIcon,
  UserGroupIcon,
  ClockIcon,
  BookmarkIcon,
  BeakerIcon,
  EllipsisHorizontalIcon,
  PlusIcon,
  SparklesIcon,
  PuzzlePieceIcon,
  DocumentIcon,
  PlayCircleIcon,
  CalculatorIcon,
  LanguageIcon,
  PaintBrushIcon,
  CloudArrowUpIcon,
  InboxIcon,
  ComputerDesktopIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useScroll, motion, useTransform } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

// Update the content for each subject with unique content
const subjectContent = {
  math: {
    title: "Mathematics",
    lastActivity: "Completed Algebra Quiz",
    icon: CalculatorIcon,
    syllabusContent: {
      title: "Complete curriculum including Algebra, Geometry, and Calculus",
      progress: 75
    },
    notes: [
      { 
        title: 'Chapter 3 Notes',
        subtitle: 'Key concepts and formulas',
        category: 'Chapter 3',
        pages: '2 pages',
        timeAgo: '2d ago'
      }
    ]
  },
  chemistry: {
    title: "Chemistry",
    lastActivity: "Completed Molecular Structure Lab",
    icon: BeakerIcon,
    syllabusContent: {
      title: "Chemical Reactions and Bonding",
      progress: 70
    },
    notes: [
      { 
        title: 'Periodic Table',
        subtitle: 'Element properties',
        category: 'Chapter 2',
        pages: '4 pages',
        timeAgo: '1d ago'
      }
    ]
  },
  biology: {
    title: "Biology",
    lastActivity: "Completed Cell Structure Lab",
    icon: BeakerIcon,
    syllabusContent: {
      title: "Human Biology and Ecosystems",
      progress: 65
    },
    notes: [
      { 
        title: 'Cell Structure',
        subtitle: 'Organelles and functions',
        category: 'Chapter 4',
        pages: '3 pages',
        timeAgo: '1d ago'
      }
    ]
  },
  physics: {
    title: "Physics",
    lastActivity: "Completed Forces Lab",
    icon: BeakerIcon,
    syllabusContent: {
      title: "Mechanics and Dynamics",
      progress: 68
    },
    notes: [
      { 
        title: 'Newton Laws',
        subtitle: 'Motion and forces',
        category: 'Chapter 1',
        pages: '3 pages',
        timeAgo: '2d ago'
      }
    ]
  },
  "computer-science": {
    title: "Computer Science",
    lastActivity: "Submitted Python Project",
    icon: ComputerDesktopIcon,
    syllabusContent: {
      title: "Programming Fundamentals and Algorithms",
      progress: 80
    },
    notes: [
      { 
        title: 'Python Basics',
        subtitle: 'Control structures',
        category: 'Programming',
        pages: '4 pages',
        timeAgo: '3d ago'
      }
    ]
  },
  arabic: {
    title: "Arabic",
    lastActivity: "Completed Writing Exercise",
    icon: LanguageIcon,
    syllabusContent: {
      title: "Modern Standard Arabic and Literature",
      progress: 70
    },
    notes: [
      { 
        title: 'Grammar Rules',
        subtitle: 'Verb conjugation',
        category: 'Grammar',
        pages: '3 pages',
        timeAgo: '2d ago'
      }
    ]
  },
  hebrew: {
    title: "Hebrew",
    lastActivity: "Vocabulary Quiz Completed",
    icon: LanguageIcon,
    syllabusContent: {
      title: "Modern Hebrew Language and Culture",
      progress: 72
    },
    notes: [
      { 
        title: 'Script Practice',
        subtitle: 'Writing exercises',
        category: 'Writing',
        pages: '2 pages',
        timeAgo: '1d ago'
      }
    ]
  },
  english: {
    title: "English",
    lastActivity: "Completed Essay Draft",
    icon: LanguageIcon,
    syllabusContent: {
      title: "Advanced Literature and Writing Skills",
      progress: 82
    },
    notes: [
      { 
        title: 'Essay Structure',
        subtitle: 'Introduction and thesis writing',
        category: 'Writing',
        pages: '3 pages',
        timeAgo: '1d ago'
      },
      { 
        title: 'Literary Analysis',
        subtitle: 'Character development study',
        category: 'Literature',
        pages: '4 pages',
        timeAgo: '3d ago'
      },
      { 
        title: 'Vocabulary List',
        subtitle: 'Advanced academic terms',
        category: 'Vocabulary',
        pages: '2 pages',
        timeAgo: '1w ago'
      }
    ],
    assignments: [
      { 
        title: 'Research Paper',
        subtitle: 'Due next week',
        status: 'In Progress',
        type: 'Essay'
      },
      { 
        title: 'Book Review',
        subtitle: 'To Kill a Mockingbird',
        status: 'Pending',
        type: 'Analysis'
      },
      { 
        title: 'Presentation',
        subtitle: 'Poetry Analysis',
        status: 'Upcoming',
        type: 'Speaking'
      }
    ],
    worksheets: [
      {
        title: 'Grammar Practice',
        subtitle: 'Advanced tenses review',
        timeAgo: '2d ago',
        status: 'New'
      },
      {
        title: 'Writing Workshop',
        subtitle: 'Argumentative essays',
        timeAgo: '1w ago',
        status: 'Complete'
      }
    ],
    examPrep: {
      practiceTests: {
        title: 'Mock Tests',
        description: 'Reading comprehension and writing',
        progress: 75
      },
      mockExam: {
        title: 'Speaking Assessment',
        description: 'Oral presentation practice',
        status: 'Scheduled'
      }
    }
  }
};

// Update theme colors for all subjects
const subjectThemes = {
  math: {
    gradient: "from-blue-500/20 to-transparent",
    accent: "blue",
    mainColor: "text-blue-600",
    bgLight: "bg-blue-50",
    statsColors: {
      progress: { bg: "bg-blue-500/10", text: "text-blue-700", dot: "bg-blue-500" },
      resources: { bg: "bg-blue-400/10", text: "text-blue-600", dot: "bg-blue-400" },
      exams: { bg: "bg-blue-300/10", text: "text-blue-500", dot: "bg-blue-300" }
    }
  },
  physics: {
    gradient: "from-purple-500/20 to-transparent",
    accent: "purple",
    mainColor: "text-purple-600",
    bgLight: "bg-purple-50",
    statsColors: {
      progress: { bg: "bg-purple-500/10", text: "text-purple-700", dot: "bg-purple-500" },
      resources: { bg: "bg-purple-400/10", text: "text-purple-600", dot: "bg-purple-400" },
      exams: { bg: "bg-purple-300/10", text: "text-purple-500", dot: "bg-purple-300" }
    }
  },
  chemistry: {
    gradient: "from-green-500/20 to-transparent",
    accent: "green",
    mainColor: "text-green-600",
    bgLight: "bg-green-50",
    statsColors: {
      progress: { bg: "bg-green-500/10", text: "text-green-700", dot: "bg-green-500" },
      resources: { bg: "bg-green-400/10", text: "text-green-600", dot: "bg-green-400" },
      exams: { bg: "bg-green-300/10", text: "text-green-500", dot: "bg-green-300" }
    }
  },
  biology: {
    gradient: "from-rose-500/20 to-transparent",
    accent: "rose",
    mainColor: "text-rose-600",
    bgLight: "bg-rose-50",
    statsColors: {
      progress: { bg: "bg-rose-500/10", text: "text-rose-700", dot: "bg-rose-500" },
      resources: { bg: "bg-rose-400/10", text: "text-rose-600", dot: "bg-rose-400" },
      exams: { bg: "bg-rose-300/10", text: "text-rose-500", dot: "bg-rose-300" }
    }
  },
  english: {
    gradient: "from-pink-500/20 to-transparent",
    accent: "pink",
    mainColor: "text-pink-600",
    bgLight: "bg-pink-50",
    statsColors: {
      progress: { bg: "bg-pink-500/10", text: "text-pink-700", dot: "bg-pink-500" },
      resources: { bg: "bg-pink-400/10", text: "text-pink-600", dot: "bg-pink-400" },
      exams: { bg: "bg-pink-300/10", text: "text-pink-500", dot: "bg-pink-300" }
    }
  },
  arabic: {
    gradient: "from-amber-500/20 to-transparent",
    accent: "amber",
    mainColor: "text-amber-600",
    bgLight: "bg-amber-50",
    statsColors: {
      progress: { bg: "bg-amber-500/10", text: "text-amber-700", dot: "bg-amber-500" },
      resources: { bg: "bg-amber-400/10", text: "text-amber-600", dot: "bg-amber-400" },
      exams: { bg: "bg-amber-300/10", text: "text-amber-500", dot: "bg-amber-300" }
    }
  },
  hebrew: {
    gradient: "from-cyan-500/20 to-transparent",
    accent: "cyan",
    mainColor: "text-cyan-600",
    bgLight: "bg-cyan-50",
    statsColors: {
      progress: { bg: "bg-cyan-500/10", text: "text-cyan-700", dot: "bg-cyan-500" },
      resources: { bg: "bg-cyan-400/10", text: "text-cyan-600", dot: "bg-cyan-400" },
      exams: { bg: "bg-cyan-300/10", text: "text-cyan-500", dot: "bg-cyan-300" }
    }
  },
  "computer-science": {
    gradient: "from-indigo-500/20 to-transparent",
    accent: "indigo",
    mainColor: "text-indigo-600",
    bgLight: "bg-indigo-50",
    statsColors: {
      progress: { bg: "bg-indigo-500/10", text: "text-indigo-700", dot: "bg-indigo-500" },
      resources: { bg: "bg-indigo-400/10", text: "text-indigo-600", dot: "bg-indigo-400" },
      exams: { bg: "bg-indigo-300/10", text: "text-indigo-500", dot: "bg-indigo-300" }
    }
  }
};

const teacherInfo = {
  name: 'Dr. Smith',
  role: 'Mathematics Teacher',
  email: 'smith@school.edu'
};

const noteColors = [
  'bg-yellow-50/90 hover:bg-yellow-50',
  'bg-blue-50/90 hover:bg-blue-50',
  'bg-pink-50/90 hover:bg-pink-50',
  'bg-green-50/90 hover:bg-green-50',
  'bg-purple-50/90 hover:bg-purple-50',
];

const subjectIcons = {
  math: CalculatorIcon,
  science: BeakerIcon,
  english: LanguageIcon,
  art: PaintBrushIcon
};

const performanceStats = {
  currentGrade: 'A',
  classAverage: '92%',
  latestScore: '88%'
};

const examPrep = {
  practiceTests: {
    title: 'Practice Tests',
    description: '10 practice tests with solutions',
    progress: 60
  },
  mockExam: {
    title: 'Mock Exam',
    description: 'Timed exam simulation',
    status: 'Coming Soon'
  }
};

const worksheets = [
  { title: 'Algebra Basics', progress: 100, status: 'Completed' },
  { title: 'Linear Equations', progress: 75, status: 'In Progress' },
  { title: 'Quadratic Functions', progress: 0, status: 'Not Started' },
];

const notes = [
  { 
    title: 'Chapter 3 Notes',
    subtitle: 'Key concepts and formulas',
    category: 'Chapter 3',
    pages: '2 pages',
    timeAgo: '2d ago'
  },
  { 
    title: 'Homework Solutions',
    subtitle: 'Practice problem solutions',
    category: 'Homework',
    pages: '3 pages',
    timeAgo: '1w ago'
  },
  { 
    title: 'Study Guide',
    subtitle: 'Exam preparation notes',
    category: 'Exam Prep',
    pages: '5 pages',
    timeAgo: '2w ago'
  }
];

// Add mock assignments data
const assignments = [
  { 
    title: 'Week 5 Homework',
    subtitle: 'Due in 3 days',
    status: 'Pending',
    type: 'homework',
    timeAgo: '2d ago'
  },
  { 
    title: 'Mid-Term Project',
    subtitle: 'Grading in progress',
    status: 'Submitted',
    type: 'project',
    timeAgo: '1w ago'
  },
  { 
    title: 'Practice Problems',
    subtitle: 'Grade: 95%',
    status: 'Graded',
    type: 'practice',
    timeAgo: '2w ago'
  }
];

export default function SubjectPage() {
  // Keep all hooks at the top
  const scrollRef = useRef(null);
  const { scrollY } = useScroll();
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const params = useParams();

  // Move useEffect before any conditionals
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsNavVisible(currentScrollY < lastScrollY || currentScrollY < 100);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  if (!params?.subject) {
    return <div>Subject not found</div>;
  }

  const subject = params.subject as string;
  
  // Get the current subject content or fallback to math
  const currentContent = subjectContent[subject as keyof typeof subjectContent] || subjectContent.math;
  const theme = subjectThemes[subject as keyof typeof subjectThemes] || subjectThemes.math;

  return (
    <div className="flex flex-col bg-gray-50/80 backdrop-blur-sm min-h-screen" ref={scrollRef}>
      {/* Subject Progress Bar - Shows when main nav is hidden */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 z-50"
        style={{
          background: `linear-gradient(to right, 
            ${subject === 'math' ? '#3B82F6' : 
              subject === 'science' ? '#10B981' : 
              subject === 'english' ? '#EC4899' : '#6366F1'} 75%, 
            transparent 75%)`,
          opacity: isNavVisible ? 0 : 1,
          transform: isNavVisible ? 'translateY(-100%)' : 'translateY(0)'
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Enhanced Header Section with Dynamic Theme */}
      <div className={`relative bg-gradient-to-b ${theme.gradient} p-4 pb-16`}>
        <div className="absolute inset-0 bg-grid-black/[0.02] -z-10" />
        
        {/* Navigation and Title */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/student/directory" 
              className="hover:bg-black/5 p-2 rounded-xl transition-colors">
              <ChevronLeftIcon className="w-6 h-6 text-gray-700" />
            </Link>
            <div className="flex items-center gap-3">
              <currentContent.icon className={`w-6 h-6 ${theme.mainColor}`} />
              <h1 className={`text-2xl font-bold ${theme.mainColor}`}>
                {currentContent.title}
              </h1>
            </div>
          </div>
          
          {/* History with more spacing */}
          <div className="flex items-center gap-2 text-gray-500 text-sm ml-12">
            <ClockIcon className="w-4 h-4" />
            <span>Last activity: {currentContent.lastActivity}</span>
          </div>
        </div>

        {/* Enhanced Stats Overview with Theme Colors */}
        <div className="grid grid-cols-3 gap-3 mt-2">
          <div className={`${theme.statsColors.progress.bg} rounded-2xl p-4 flex flex-col items-center`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${theme.statsColors.progress.dot}`} />
              <p className="text-sm font-medium text-gray-600">Progress</p>
            </div>
            <p className={`text-3xl font-bold ${theme.statsColors.progress.text}`}>75%</p>
          </div>
          
          <div className={`${theme.statsColors.resources.bg} rounded-2xl p-4 flex flex-col items-center`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${theme.statsColors.resources.dot}`} />
              <p className="text-sm font-medium text-gray-600">Resources</p>
            </div>
            <p className={`text-3xl font-bold ${theme.statsColors.resources.text}`}>24</p>
          </div>
          
          <div className={`${theme.statsColors.exams.bg} rounded-2xl p-4 flex flex-col items-center`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${theme.statsColors.exams.dot}`} />
              <p className="text-sm font-medium text-gray-600">Exams</p>
            </div>
            <p className={`text-3xl font-bold ${theme.statsColors.exams.text}`}>3</p>
          </div>
        </div>
      </div>

      {/* Rest of the content with improved spacing */}
      <div className="p-4 -mt-12 space-y-4">
        {/* Teacher Info - At top with less margin */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white p-4 rounded-2xl border border-gray-100 mt-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-xl">
                <UserGroupIcon className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{teacherInfo.name}</h2>
                <p className="text-gray-500">{teacherInfo.role}</p>
                <p className="text-gray-400 text-sm">{teacherInfo.email}</p>
              </div>
            </div>
            <button 
              className="px-6 py-2 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-100 transition-colors"
            >
              Message
            </button>
          </div>
        </motion.div>

        {/* Assignments Section - Moved up right after teacher */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <InboxIcon className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-medium text-gray-900">Assignments</h2>
            </div>
            <button className="flex items-center gap-1 text-blue-500 text-sm bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors">
              <CloudArrowUpIcon className="w-4 h-4" />
              Upload Assignment
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {assignments.map((assignment, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                className="bg-white p-4 rounded-xl border border-gray-100"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-gray-900 font-medium">{assignment.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    assignment.status === 'Pending' ? 'bg-yellow-50 text-yellow-600' :
                    assignment.status === 'Submitted' ? 'bg-blue-50 text-blue-600' :
                    'bg-green-50 text-green-600'
                  }`}>
                    {assignment.status}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3">{assignment.subtitle}</p>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-xs">{assignment.timeAgo}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    assignment.type === 'homework' ? 'bg-violet-50 text-violet-600' :
                    assignment.type === 'project' ? 'bg-pink-50 text-pink-600' :
                    'bg-indigo-50 text-indigo-600'
                  }`}>
                    {assignment.type}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Progress Cards */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`bg-gradient-to-br ${theme.accent === 'blue' ? 'from-blue-400 to-blue-500' : 
              theme.accent === 'purple' ? 'from-purple-400 to-purple-500' :
              theme.accent === 'green' ? 'from-green-400 to-green-500' :
              'from-pink-400 to-pink-500'} p-4 rounded-2xl text-white`}
          >
            <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
              <BookOpenIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold mb-1">Syllabus</h3>
            <p className="text-white/80 text-sm">{currentContent.syllabusContent.title}</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-purple-400 to-purple-500 p-4 rounded-2xl text-white"
          >
            <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold mb-1">Performance</h3>
            <div className="space-y-2">
              {Object.entries(performanceStats).map(([key, value], index) => (
                <div key={index} className="flex justify-between items-center">
                  <p className="text-white/80">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="font-bold">{value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Exam Prep */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { 
              title: 'Practice Tests',
              desc: '10 practice tests with solutions',
              icon: DocumentTextIcon,
            },
            { 
              title: 'Mock Exam',
              desc: 'Timed exam simulation',
              icon: AcademicCapIcon,
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              className="bg-white p-4 rounded-2xl shadow-[0_4px_12px_rgba(59,130,246,0.1)] hover:shadow-[0_4px_16px_rgba(59,130,246,0.15)] transition-shadow"
            >
              <div className="bg-blue-50 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                <item.icon className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-gray-500 text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Notes Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <PencilIcon className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-medium text-gray-900">My Notes</h2>
            </div>
            <button className="flex items-center gap-1 text-blue-500 text-sm">
              <PlusIcon className="w-4 h-4" />
              Add Note
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {notes.map((note, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02, rotate: 1 }}
                className={`bg-gradient-to-br ${
                  index % 4 === 0 ? 'from-yellow-50 to-yellow-100/80' :
                  index % 4 === 1 ? 'from-blue-50 to-blue-100/80' :
                  index % 4 === 2 ? 'from-pink-50 to-pink-100/80' :
                  'from-green-50 to-green-100/80'
                } p-4 rounded-lg shadow-sm hover:shadow-md transition-all`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-gray-900 font-medium">{note.title}</h3>
                  <span className="text-gray-500 text-xs">{note.timeAgo}</span>
                </div>
                <p className="text-gray-600 text-sm mb-3">{note.subtitle}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`${
                    index % 4 === 0 ? 'text-yellow-600' :
                    index % 4 === 1 ? 'text-blue-600' :
                    index % 4 === 2 ? 'text-pink-600' :
                    'text-green-600'
                  }`}>{note.category}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-500">{note.pages}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Worksheets Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-medium text-gray-900">Worksheets</h2>
            </div>
            <button className="flex items-center gap-1 text-blue-500 text-sm">
              <PlusIcon className="w-4 h-4" />
              Upload Work
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { 
                title: 'Weekly Practice',
                subtitle: 'Practice problems and solutions',
                timeAgo: '2d ago',
                status: 'Updated'
              },
              { 
                title: 'Chapter Review',
                subtitle: 'End of chapter exercises',
                timeAgo: '1w ago',
                status: 'Due Tomorrow'
              },
              { 
                title: 'Extra Credit',
                subtitle: 'Optional challenge problems',
                timeAgo: '3d ago',
                status: 'Optional'
              }
            ].map((worksheet, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                className="bg-white p-4 rounded-xl border border-gray-100"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-gray-900 font-medium">{worksheet.title}</h3>
                  <span className="text-gray-400 text-xs">{worksheet.timeAgo}</span>
                </div>
                <p className="text-gray-600 text-sm mb-3">{worksheet.subtitle}</p>
                <div className="flex items-center gap-2">
                  <span className="text-blue-500 text-xs px-2 py-1 bg-blue-50 rounded-full">
                    {worksheet.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Hope AI Learning Assistant Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-medium text-gray-900">Ask SPARK</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Practice Problems Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`bg-gradient-to-br from-${theme.accent}-400 to-${theme.accent}-500 p-6 rounded-2xl text-white`}
            >
              <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <PuzzlePieceIcon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-xl mb-2">Practice with SPARK</h3>
              <p className="text-white/80 text-sm mb-4">
                {subject === 'math' ? 'Master equations and formulas with SPARK SKOOL guidance' :
                 subject === 'english' ? 'Improve writing and grammar with SPARK SKOOLfeedback' :
                 subject === 'physics' ? 'Practice physics problems with SPARK SKOOL assistance' :
                 'Get personalized practice and instant feedback from SPARK SKOOL'}
              </p>
              <button className="bg-white/20 px-4 py-2 rounded-xl text-sm hover:bg-white/30 transition-colors">
                Start Practice
              </button>
            </motion.div>

            {/* Ask Hope AI Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white p-6 rounded-2xl border border-gray-100"
            >
              <div className={`${theme.bgLight} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                <ChatBubbleLeftIcon className={`w-7 h-7 ${theme.mainColor}`} />
              </div>
              <h3 className={`font-bold text-xl mb-2 ${theme.mainColor}`}>Chat with SPARK</h3>
              <p className="text-gray-500 text-sm mb-4">
                {subject === 'math' ? 'Get step-by-step math explanations from SPARK AI' :
                 subject === 'english' ? 'Get writing and language guidance from SPARK AI' :
                 subject === 'physics' ? 'Understand physics concepts with SPARK AI' :
                 'Get personalized help and explanations from SPARK AI'}
              </p>
              <button className={`${theme.bgLight} ${theme.mainColor} px-4 py-2 rounded-xl text-sm hover:bg-opacity-80 transition-colors`}>
                Start Chat
              </button>
            </motion.div>
          </div>

          {/* Interactive Learning Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white p-6 rounded-2xl border border-gray-100"
          >
            <div className={`${theme.bgLight} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
              <PlayCircleIcon className={`w-7 h-7 ${theme.mainColor}`} />
            </div>
            <h3 className={`font-bold text-xl mb-2 ${theme.mainColor}`}>Learn with SPARK</h3>
            <p className="text-gray-500 text-sm mb-4">
              {subject === 'math' ? 'Interactive math learning powered by SPARK AI' :
               subject === 'english' ? 'AI-powered language practice with SPARK' :
               subject === 'physics' ? 'Explore physics concepts with SPARK AI' :
               'Interactive learning sessions guided by SPARK AI'}
            </p>
            <button className={`${theme.bgLight} ${theme.mainColor} px-4 py-2 rounded-xl text-sm hover:bg-opacity-80 transition-colors`}>
              Start Learning
            </button>
          </motion.div>

          {/* Quick Actions - Now Hope AI specific */}
          <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:overflow-x-visible">
            {[
              { 
                title: 'Quick Quiz',
                icon: AcademicCapIcon,
                desc: `SPARK AI ${subject}-focused assessment`
              },
              { 
                title: 'Ask SPARK',
                icon: BookOpenIcon,
                desc: `Get instant ${subject} explanations`
              },
              { 
                title: 'Problem Help',
                icon: PuzzlePieceIcon,
                desc: `SPARK AI ${subject} solutions`
              },
              { 
                title: 'Study Guide',
                icon: ClockIcon,
                desc: `AI-powered ${subject} planning`
              }
            ].map((action, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                className={`flex-shrink-0 w-[250px] md:w-auto bg-white p-4 rounded-xl border border-${theme.accent}-100 hover:border-${theme.accent}-200 cursor-pointer transition-colors`}
              >
                <div className={`${theme.bgLight} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
                  <action.icon className={`w-5 h-5 ${theme.mainColor}`} />
                </div>
                <h3 className={`font-medium text-gray-900 mb-1 ${theme.mainColor}`}>{action.title}</h3>
                <p className="text-gray-500 text-sm">{action.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 