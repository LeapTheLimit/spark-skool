'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

type Language = 'en' | 'ar' | 'he';

// Define the structure for material categories
interface MaterialCategories {
  all: string;
  lesson: string;
  quiz: string;
  activity: string;
  other: string;
}

// Add a new interface for tool categories
interface ToolCategories {
  planning: string;
  assessment: string;
  feedback: string;
  activities: string;
  resources: string;
}

// Update the translations interface to support nested objects
interface TranslationStrings {
  [key: string]: string | MaterialCategories | { toolCategories: ToolCategories };
}

interface Translations {
  [key: string]: TranslationStrings;
}

// Update the translation function type
type TranslationParams = Record<string, string | number>;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: TranslationParams) => string;
}

export const translations: Translations = {
  en: {
    // Dashboard & Common
    welcomeMessage: 'Welcome, {name}! 👋',
    teacherAt: '{subject} Teacher at {school}',
    newReport: 'New Report',
    createLesson: 'Create Lesson',
    completed: 'Completed',
    quickActions: 'Quick Actions',
    recentActivity: 'Recent Activity',
    recentChats: 'Recent Chats',
    background: 'Background',
    selectBackground: 'Choose your preferred background style',
    createExam: 'Create Exam',
    addStudents: 'Add Students',
    scheduleClass: 'Schedule Class',
    subjects: 'Subjects',
    enterSubject: 'Enter Subject',
    add: 'Add',
    bio: 'Bio',
    enterBio: 'Share a short bio about yourself (max 200 characters)',
    characters: 'characters',
    noBioYet: 'No bio added yet',
    noRecentActivity: 'No recent activity',
    activityWillAppearHere: 'Student activities will appear here',
    noRecentChats: 'No recent chats',
    startChattingWithStudents: 'Start chatting with your students',
    teacher: 'Teacher',
    at: 'at',
    
    // Stats
    activeStudents: 'Active Students',
    activeStudentsDesc: 'Students active in the last 30 days',
    completionRate: 'Completion Rate',
    completionRateDesc: 'Average task completion rate',
    totalClasses: 'Total Classes',
    totalClassesDesc: 'Number of active classes',
    averageGrade: 'Average Grade',
    averageGradeDesc: 'Overall class performance',
    
    // Tools & Actions
    lessonPlanning: 'Lesson Planning',
    lessonPlanningDesc: 'Create customized lesson plans for your {subject} class',
    assessmentGenerator: 'Assessment Generator',
    assessmentDesc: 'Create {subject}-specific assessments and quizzes',
    studentFeedback: 'Student Feedback',
    feedbackDesc: 'Generate personalized feedback for {subject} students',
    activityCreator: 'Activity Creator',
    activityDesc: 'Design engaging {subject} classroom activities',
    
    // Materials
    uploadMaterial: 'Upload Material',
    materialCategories: {
      all: 'All Materials',
      lesson: 'Lesson Plans',
      quiz: 'Assessments',
      activity: 'Activities',
      other: 'Other'
    },
    
    // Common Actions
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    upload: 'Upload',
    download: 'Download',
    preview: 'Preview',
    share: 'Share',
    
    // Status & Progress
    inProgress: 'In Progress',
    pending: 'Pending',
    overdue: 'Overdue',
    dueDate: 'Due {date}',
    lastModified: 'Last modified {date}',
    
    // Quick Actions Section
    importLesson: 'Import Lesson',
    generateWithAI: 'Generate with AI',
    useTemplate: 'Use Template',
    
    // Student Related
    studentCount: '{count} Students',
    classAverage: 'Class Average: {score}%',
    submitWork: 'Submit Work',
    viewFeedback: 'View Feedback',
    
    // Settings
    settings: 'Settings',
    settingsDescription: 'Manage your account and application preferences',
    profile: 'Profile',
    appSettings: 'App Settings',
    profileInformation: 'Profile Information',
    editProfile: 'Edit Profile',
    fullName: 'Full Name',
    email: 'Email',
    school: 'School',
    saveChanges: 'Save Changes',
    theme: 'Theme',
    choosePreferredTheme: 'Choose your preferred theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    language: 'Language',
    selectPreferredLanguage: 'Select your preferred language',
    english: 'English',
    arabic: 'العربية',
    hebrew: 'עברית',
    notifications: 'Notifications',
    manageNotificationPreferences: 'Manage notification preferences',
    colorScheme: 'Color Scheme',
    chooseAccentColor: 'Choose your accent color',
    settingsUpdated: 'Settings updated successfully',
    failedToSave: 'Failed to save settings',
    
    // Navigation
    dashboard: 'Dashboard',
    chat: 'Chat',
    lessons: 'Lessons',
    materials: 'Materials',
    students: 'Students',
    tools: {
      toolCategories: {
        planning: 'Lesson Planning',
        assessment: 'Assessment',
        feedback: 'Student Feedback',
        activities: 'Activities',
        resources: 'Resources'
      }
    },
    search: 'Search',
    newChat: 'New Chat',
    savedMaterials: 'Saved Materials',
    viewAll: 'View All',
    gradeMore: 'Grade More',
    
    // Form Placeholders
    enterFullName: 'Enter your full name',
    enterEmail: 'Enter your email',
    enterSchoolName: 'Enter your school name',
    
    // Subjects
    physicsForces: 'Physics - Forces & Motion',
    chemistryLab: 'Chemistry Lab - Reactions',
    biology: 'Biology - Cell Structure',
    mathematics: 'Mathematics - Algebra',
    
    // Chat Interface
    typeMessage: 'Type a message...',
    sendMessage: 'Send',
    uploadFile: 'Upload File',
    recordVoice: 'Record Voice',
    attachFile: 'Attach File',
    messageHistory: 'Message History',
    noMessages: 'No messages yet',
    startNewChat: 'Start New Chat',
    aiAssistant: 'AI Assistant',
    you: 'You',
    
    // AI Tools
    aiTools: 'AI Tools',
    teachingToolsLessonPlanner: 'Lesson Planner',
    quizGenerator: 'Quiz Generator',
    feedbackAssistant: 'Feedback Assistant',
    activityDesigner: 'Activity Designer',
    
    // Tool Instructions
    teachingToolsLessonPlannerDesc: 'Design comprehensive lesson plans with curriculum alignment',
    quizGeneratorDesc: 'Generate quizzes and assessments for your class',
    feedbackAssistantDesc: 'Get help writing personalized student feedback',
    activityDesignerDesc: 'Design engaging classroom activities',
    
    // Stats Changes
    increase: '+{value}%',
    decrease: '-{value}%',

    // Tools Section
    toolsAndResources: 'Tools & Resources',
    toolsDescription: 'Access AI-powered tools to enhance your teaching',
    createNew: 'Create New',
    recentlyUsed: 'Recently Used',
    popularTools: 'Popular Tools',
    allTools: 'All Tools',
    
    // Chat Interface Extended
    startConversation: 'Start a conversation',
    suggestedPrompts: 'Suggested Prompts',
    createLessonPlan: 'Create a lesson plan',
    generateQuiz: 'Generate a quiz',
    writeFeedback: 'Write student feedback',
    designActivity: 'Design a class activity',
    chatHistory: 'Chat History',
    clearChat: 'Clear Chat',
    regenerateResponse: 'Regenerate Response',
    copyToClipboard: 'Copy to Clipboard',
    downloadResponse: 'Download Response',
    saveToMaterials: 'Save to Materials',
    uploadFiles: 'Upload Files',
    recordAudio: 'Record Audio',
    stopRecording: 'Stop Recording',
    aiTyping: 'AI is typing...',
    
    // Dashboard Extended
    quickStart: 'Quick Start',
    upcomingLessons: 'Upcoming Lessons',
    pendingTasks: 'Pending Tasks',
    studentProgress: 'Student Progress',
    classInsights: 'Class Insights',
    teachingStats: 'Teaching Stats',
    weeklyOverview: 'Weekly Overview',
    monthlyReport: 'Monthly Report',
    
    // Material Management
    createNewMaterial: 'Create Material',
    uploadNewMaterial: 'Upload Material',
    materialTypes: 'Material Types',
    sortBy: 'Sort By',
    filterBy: 'Filter By',
    searchMaterials: 'Search Materials',
    noMaterialsFound: 'No Materials Found',
    lastEdited: 'Last Edited',
    dateCreated: 'Date Created',
    fileSize: 'File Size',
    studentLevel: 'Student Level',
    gradeLevel: 'Grade Level',
    elementary: 'Elementary',
    middleSchool: 'Middle School',
    highSchool: 'High School',
    controlPanel: 'Control Panel',
    
    // Teaching Style
    teachingStyle: 'Teaching Style',
    formal: 'Formal',
    conversational: 'Conversational',
    socratic: 'Socratic',
    
    // Curriculum
    curriculumAlignment: 'Curriculum Alignment',
    commonCore: 'Common Core',
    ibProgram: 'IB Program',
    custom: 'Custom',
    
    // Recent Activity
    noRecentSessions: 'No recent sessions',
    
    // Time and Dates
    today: 'Today',
    yesterday: 'Yesterday',
    daysAgo: '{days} days ago',
    
    // File Types
    document: 'Document',
    presentation: 'Presentation',
    spreadsheet: 'Spreadsheet',
    pdf: 'PDF',
    
    // Control Panel Additional
    elementarySchool: 'elementary school students',
    middleSchoolLevel: 'middle school students',
    highSchoolLevel: 'high school students',
    formalStyle: 'formal and structured',
    conversationalStyle: 'conversational and engaging',
    socraticStyle: 'inquiry-based and Socratic',
    commonCoreDesc: 'aligned with Common Core standards',
    ibProgramDesc: 'following IB framework',
    customCurriculumDesc: 'using flexible curriculum standards',
    generalChat: 'General Chat',
    recentMaterials: 'Recent Materials',
    examGrading: 'Exam Grading',
    examGradingDesc: 'Grade exams quickly with AI assistance and detailed analytics',
    examCreator: 'Exam Creator',
    examCreatorDesc: 'Create professional exams with AI and share them with students',
    gamifyExam: 'Gamify Exam',
    gamifyExamDesc: 'Transform your exams into interactive games like Kahoot',
    homeworkMaker: 'Homework Maker',
    homeworkMakerDesc: 'Generate homework assignments from your lesson materials',
    feedbackGenerator: 'Feedback Generator',
    feedbackGeneratorDesc: 'Create personalized student feedback with AI assistance',
    analyticsInsights: 'Analytics & Insights',
    analyticsDesc: 'Visualize student performance data with actionable insights',
    lessonPlannerDesc: 'Design comprehensive lesson plans with curriculum alignment',
    rubricCreator: 'Rubric Creator',
    rubricCreatorDesc: 'Create detailed grading rubrics for assignments and projects',
    teachingTools: 'Teaching Tools',
    new: 'NEW',
    published: 'Published',
    graded: 'Graded',
    draft: 'Draft',
    backToTools: 'Back to Tools',
    examSaveToMaterials: 'Save to Materials',
    useExistingMaterials: 'Use Existing Materials',
    useExistingMaterialsDesc: 'Import content from your saved materials',
    uploadContent: 'Upload Content',
    uploadContentDesc: 'Upload files to extract content for your exam',
    aiGeneration: 'AI Generation',
    aiGenerationDesc: 'Generate exam questions with AI assistance',
    manualCreation: 'Manual Creation',
    manualCreationDesc: 'Create exam questions from scratch',
    examInformation: 'Exam Information',
    examSubject: 'Subject',
    examGrade: 'Grade',
    examDuration: 'Duration',
    minutes: 'minutes',
    totalPoints: 'Total Points',
    instructions: 'Instructions',
    teacherInformation: 'Teacher Information',
    addQuestions: 'Add Questions',
    addQuestionManually: 'Add Question Manually',
    importFromMaterials: 'Import from Materials',
    aiQuestionGenerator: 'AI Question Generator',
    quickAITemplates: 'Quick AI Templates',
    generateQuestionsWithAI: 'Generate Questions with AI',
    processing: 'Processing...',
    examQuestions: 'Exam Questions',
    noQuestionsYet: 'No questions added yet',
    useToolsToAddQuestions: 'Use the tools above to add questions',
    pleaseEnterTitle: 'Please enter a title for the exam',
    pleaseAddQuestions: 'Please add at least one question',
    examSavedSuccess: 'Exam saved to materials successfully',
    failedToSaveExam: 'Failed to save exam to materials',
    pdfDownloadStarted: 'PDF download has started',
    pdfGenerationFailed: 'Failed to generate PDF',
    true: 'True',
    false: 'False',
    goodLuck: 'Good luck!',
    points: 'points',
    questionType: 'Question Type',
    questionText: 'Question Text',
    answer: 'Answer',
    explanation: 'Explanation',
    options: 'Options',
    difficulty: 'Difficulty',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    materialLoadedAsContext: 'Material loaded as context for AI generation',
    textExtractedFromFile: 'Text extracted from file and added as context',
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',
    timezone: 'Timezone',
    currentTime: 'Current time',
    localizationSettings: 'Localization Settings',
    contactSupportToChangeEmail: 'Contact support to change your email address',
    classLevels: 'Class Levels',
    addClass: 'Add Class',
    enterClassLevel: 'Enter class level (e.g., 7th Grade, AP Physics)',
    quickAdd: 'Quick add',
    getStarted: 'Get Started',
    newTeacherWelcome: 'New Teacher Welcome',
    personalizeSparkMessage: 'Let\'s personalize Spark for you! Complete the steps below to get started.',
    completeStepsBelow: 'Complete these steps to set up your teaching environment and get the most out of Spark.',
    start: 'Start',
    enterSchool: 'Enter your school name',
  },
  ar: {
    // Dashboard & Common
    welcomeMessage: 'مرحباً، {name}! 👋',
    teacherAt: 'مدرس {subject} في {school}',
    newReport: 'تقرير جديد',
    createLesson: 'إنشاء درس',
    completed: 'مكتمل',
    quickActions: 'إجراءات سريعة',
    recentActivity: 'النشاط الأخير',
    recentChats: 'المحادثات الأخيرة',
    background: 'الخلفية',
    selectBackground: 'اختر نمط الخلفية المفضل لديك',
    createExam: 'إنشاء اختبار',
    addStudents: 'إضافة طلاب',
    scheduleClass: 'جدولة الفصل',
    subjects: 'المواد الدراسية',
    enterSubject: 'أدخل مادة',
    add: 'إضافة',
    bio: 'البيوغرافية',
    enterBio: 'أشرف على بيوغرافية صغيرة عن نفسك (أقصى 200 حرفًا)',
    characters: 'الأحرف',
    noBioYet: 'لم تتم إضافة سيرة ذاتية بعد',
    noRecentActivity: 'لا يوجد نشاط حديث',
    activityWillAppearHere: 'ستظهر أنشطة الطلاب هنا',
    noRecentChats: 'لا توجد محادثات حديثة',
    startChattingWithStudents: 'ابدأ الدردشة مع طلابك',
    teacher: 'مدرس',
    at: 'في',
    
    // Stats
    activeStudents: 'الطلاب النشطون',
    activeStudentsDesc: 'الطلاب النشطون في آخر 30 يومًا',
    completionRate: 'معدل الإنجاز',
    completionRateDesc: 'متوسط معدل إنجاز المهام',
    totalClasses: 'مجموع الفصول',
    totalClassesDesc: 'عدد الفصول النشطة',
    averageGrade: 'المعدل العام',
    averageGradeDesc: 'الأداء العام للفصل',
    
    // Tools & Actions
    lessonPlanning: 'تخطيط الدرس',
    lessonPlanningDesc: 'إنشاء خطط دروس مخصصة لفصل {subject}',
    assessmentGenerator: 'منشئ التقييمات',
    assessmentDesc: 'إنشاء تقييمات واختبارات خاصة بمادة {subject}',
    studentFeedback: 'تقييم الطلاب',
    feedbackDesc: 'إنشاء تقييم شخصي لطلاب {subject}',
    activityCreator: 'منشئ الأنشطة',
    activityDesc: 'تصميم أنشطة صفية تفاعلية لمادة {subject}',
    
    // Materials
    uploadMaterial: 'رفع مواد',
    materialCategories: {
      all: 'جميع المواد',
      lesson: 'خطط الدروس',
      quiz: 'التقييمات',
      activity: 'الأنشطة',
      other: 'أخرى'
    },
    
    // Common Actions
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ',
    cancel: 'إلغاء',
    upload: 'رفع',
    download: 'تحميل',
    preview: 'معاينة',
    share: 'مشاركة',
    
    // Status & Progress
    inProgress: 'قيد التنفيذ',
    pending: 'قيد الانتظار',
    overdue: 'متأخر',
    dueDate: 'تاريخ التسليم {date}',
    lastModified: 'آخر تعديل {date}',
    
    // Quick Actions Section
    importLesson: 'استيراد درس',
    generateWithAI: 'إنشاء بالذكاء الاصطناعي',
    useTemplate: 'استخدام قالب',
    
    // Student Related
    studentCount: '{count} طالب',
    classAverage: 'متوسط الفصل: {score}٪',
    submitWork: 'تسليم العمل',
    viewFeedback: 'عرض الملاحظات',
    
    // Settings
    settings: 'الإعدادات',
    settingsDescription: 'إدارة حسابك وتفضيلات التطبيق',
    profile: 'الملف الشخصي',
    appSettings: 'إعدادات التطبيق',
    profileInformation: 'معلومات الملف الشخصي',
    editProfile: 'تعديل الملف الشخصي',
    fullName: 'الاسم الكامل',
    email: 'البريد الإلكتروني',
    school: 'المدرسة',
    saveChanges: 'حفظ التغييرات',
    theme: 'المظهر',
    choosePreferredTheme: 'اختر المظهر المفضل',
    light: 'فاتح',
    dark: 'داكن',
    system: 'النظام',
    language: 'اللغة',
    selectPreferredLanguage: 'اختر لغتك المفضلة',
    english: 'English',
    arabic: 'العربية',
    hebrew: 'عبريت',
    notifications: 'الإشعارات',
    manageNotificationPreferences: 'إدارة تفضيلات الإشعارات',
    colorScheme: 'نظام الألوان',
    chooseAccentColor: 'اختر لون التمييز',
    settingsUpdated: 'تم تحديث الإعدادات بنجاح',
    failedToSave: 'فشل في حفظ الإعدادات',
    
    // Navigation
    dashboard: 'لوحة التحكم',
    chat: 'المحادثة',
    lessons: 'الدروس',
    materials: 'المواد',
    students: 'الطلاب',
    tools: {
      toolCategories: {
        planning: 'تخطيط الدروس',
        assessment: 'التقييم',
        feedback: 'تقييم الطلاب',
        activities: 'الأنشطة',
        resources: 'الموارد'
      }
    },
    search: 'بحث',
    newChat: 'محادثة جديدة',
    savedMaterials: 'المواد المحفوظة',
    recentGrading: 'التقييمات الأخيرة',
    viewAll: 'عرض الكل',
    gradeMore: 'تقييم المزيد',
    
    // Form Placeholders
    enterFullName: 'أدخل اسمك الكامل',
    enterEmail: 'أدخل بريدك الإلكتروني',
    enterSchool: 'أدخل اسم المدرسة',
    
    // Subjects
    physicsForces: 'الفيزياء - القوى والحركة',
    chemistryLab: 'مختبر الكيمياء - التفاعلات',
    biology: 'الأحياء - بنية الخلية',
    mathematics: 'الرياضيات - الجبر',
    
    // Chat Interface
    typeMessage: 'اكتب رسالة...',
    sendMessage: 'إرسال',
    uploadFile: 'رفع ملف',
    recordVoice: 'تسجيل صوتي',
    attachFile: 'إرفاق ملف',
    messageHistory: 'سجل المحادثات',
    noMessages: 'لا توجد رسائل بعد',
    startNewChat: 'بدء محادثة جديدة',
    aiAssistant: 'المساعد الذكي',
    you: 'أنت',
    
    // AI Tools
    aiTools: 'أدوات الذكاء الاصطناعي',
    teachingToolsLessonPlanner: 'مخطط الدروس',
    quizGenerator: 'منشئ الاختبارات',
    feedbackAssistant: 'مساعد التقييم',
    activityDesigner: 'مصمم الأنشطة',
    
    // Tool Instructions
    teachingToolsLessonPlannerDesc: 'إنشاء خطط دروس مفصلة مع الأهداف والأنشطة',
    quizGeneratorDesc: 'إنشاء اختبارات وتقييمات لفصلك',
    feedbackAssistantDesc: 'الحصول على مساعدة في كتابة تقييم شخصي للطلاب',
    activityDesignerDesc: 'تصميم أنشطة صفية تفاعلية',
    
    // Stats Changes
    increase: '+{value}٪',
    decrease: '-{value}٪',

    // Tools Section
    toolsAndResources: 'الأدوات والموارد',
    toolsDescription: 'الوصول إلى أدوات الذكاء الاصطناعي لتحسين التدريس',
    createNew: 'إنشاء جديد',
    recentlyUsed: 'المستخدمة مؤخراً',
    popularTools: 'الأدوات الشائعة',
    allTools: 'جميع الأدوات',
    
    // Chat Interface Extended
    startConversation: 'بدء محادثة',
    suggestedPrompts: 'اقتراحات المحادثة',
    createLessonPlan: 'إنشاء خطة درس',
    generateQuiz: 'إنشاء اختبار',
    writeFeedback: 'كتابة تقييم للطالب',
    designActivity: 'تصميم نشاط صفي',
    chatHistory: 'سجل المحادثات',
    clearChat: 'مسح المحادثة',
    regenerateResponse: 'إعادة إنشاء الرد',
    copyToClipboard: 'نسخ إلى الحافظة',
    downloadResponse: 'تحميل الرد',
    saveToMaterials: 'حفظ في المواد',
    uploadFiles: 'رفع ملفات',
    recordAudio: 'تسجيل صوتي',
    stopRecording: 'إيقاف التسجيل',
    aiTyping: 'الذكاء الاصطناعي يكتب...',
    
    // Dashboard Extended
    quickStart: 'البدء السريع',
    upcomingLessons: 'الدروس القادمة',
    pendingTasks: 'المهام المعلقة',
    studentProgress: 'تقدم الطلاب',
    classInsights: 'تحليلات الفصل',
    teachingStats: 'إحصائيات التدريس',
    weeklyOverview: 'نظرة عامة أسبوعية',
    monthlyReport: 'التقرير الشهري',
    
    // Material Management
    createNewMaterial: 'إنشاء مادة',
    uploadNewMaterial: 'رفع مادة',
    materialTypes: 'أنواع المواد',
    sortBy: 'ترتيب حسب',
    filterBy: 'تصفية حسب',
    searchMaterials: 'بحث في المواد',
    noMaterialsFound: 'لم يتم العثور على مواد',
    lastEdited: 'آخر تعديل',
    dateCreated: 'تاريخ الإنشاء',
    fileSize: 'حجم الملف',
    studentLevel: 'مستوى الطالب',
    gradeLevel: 'المرحلة الدراسية',
    elementary: 'ابتدائي',
    middleSchool: 'متوسط',
    highSchool: 'ثانوي',
    controlPanel: 'لوحة التحكم',
    
    // Teaching Style
    teachingStyle: 'أسلوب التدريس',
    formal: 'رسمي',
    conversational: 'محادثة',
    socratic: 'سقراطي',
    
    // Curriculum
    curriculumAlignment: 'توافق المنهج',
    commonCore: 'المنهج الأساسي المشترك',
    ibProgram: 'برنامج البكالوريا الدولية',
    custom: 'مخصص',
    
    // Recent Activity
    noRecentSessions: 'لا توجد جلسات حديثة',
    
    // Time and Dates
    today: 'اليوم',
    yesterday: 'أمس',
    daysAgo: 'قبل {days} أيام',
    
    // File Types
    document: 'مستند',
    presentation: 'عرض تقديمي',
    spreadsheet: 'جدول بيانات',
    pdf: 'PDF',
    
    // Control Panel Additional
    elementarySchool: 'طلاب المرحلة الابتدائية',
    middleSchoolLevel: 'طلاب المرحلة المتوسطة',
    highSchoolLevel: 'طلاب المرحلة الثانوية',
    formalStyle: 'رسمي ومنظم',
    conversationalStyle: 'تفاعلي وجذاب',
    socraticStyle: 'قائم على الاستقصاء والحوار',
    commonCoreDesc: 'متوافق مع المعايير الأساسية المشتركة',
    ibProgramDesc: 'يتبع إطار البكالوريا الدولية',
    customCurriculumDesc: 'باستخدام معايير مرنة للمناهج',
    generalChat: 'محادثة عامة',
    recentMaterials: 'المواد الأخيرة',
    examGrading: 'تصحيح الامتحانات',
    examGradingDesc: 'تصحيح الامتحانات بسرعة بمساعدة الذكاء الاصطناعي وتحليلات مفصلة',
    examCreator: 'منشئ الامتحانات',
    examCreatorDesc: 'إنشاء امتحانات احترافية باستخدام الذكاء الاصطناعي ومشاركتها مع الطلاب',
    gamifyExam: 'تحويل الامتحان إلى لعبة',
    gamifyExamDesc: 'تحويل امتحاناتك إلى ألعاب تفاعلية مثل كاهوت',
    homeworkMaker: 'منشئ الواجبات',
    homeworkMakerDesc: 'إنشاء واجبات منزلية من مواد دروسك',
    feedbackGenerator: 'منشئ التقييمات',
    feedbackGeneratorDesc: 'إنشاء تقييمات مخصصة للطلاب بمساعدة الذكاء الاصطناعي',
    analyticsInsights: 'التحليلات والإحصاءات',
    analyticsDesc: 'تصور بيانات أداء الطلاب مع رؤى قابلة للتنفيذ',
    lessonPlannerDesc: 'Design comprehensive lesson plans with curriculum alignment',
    rubricCreator: 'منشئ معايير التقييم',
    rubricCreatorDesc: 'إنشاء معايير تقييم مفصلة للواجبات والمشاريع',
    teachingTools: 'أدوات التدريس',
    new: 'جديد',
    published: 'منشور',
    graded: 'مصحح',
    draft: 'مسودة',
    backToTools: 'العودة إلى الأدوات',
    examSaveToMaterials: 'حفظ في المواد',
    useExistingMaterials: 'استخدام المواد الموجودة',
    useExistingMaterialsDesc: 'استيراد المحتوى من المواد المحفوظة',
    uploadContent: 'تحميل المحتوى',
    uploadContentDesc: 'تحميل الملفات لاستخراج المحتوى للامتحان',
    aiGeneration: 'إنشاء بالذكاء الاصطناعي',
    aiGenerationDesc: 'إنشاء أسئلة الامتحان بمساعدة الذكاء الاصطناعي',
    manualCreation: 'إنشاء يدوي',
    manualCreationDesc: 'إنشاء أسئلة الامتحان من البداية',
    examInformation: 'معلومات الامتحان',
    examSubject: 'المادة',
    examGrade: 'الصف',
    examDuration: 'المدة',
    minutes: 'دقائق',
    totalPoints: 'مجموع النقاط',
    instructions: 'التعليمات',
    teacherInformation: 'معلومات المعلم',
    addQuestions: 'إضافة أسئلة',
    addQuestionManually: 'إضافة سؤال يدويًا',
    importFromMaterials: 'استيراد من المواد',
    examUploadFile: 'تحميل ملف',
    aiQuestionGenerator: 'منشئ الأسئلة بالذكاء الاصطناعي',
    quickAITemplates: 'قوالب الذكاء الاصطناعي السريعة',
    generateQuestionsWithAI: 'إنشاء أسئلة باستخدام الذكاء الاصطناعي',
    processing: 'جاري المعالجة...',
    examQuestions: 'أسئلة الامتحان',
    noQuestionsYet: 'No questions added yet',
    useToolsToAddQuestions: 'Use the tools above to add questions',
    pleaseEnterTitle: 'Please enter a title for the exam',
    pleaseAddQuestions: 'Please add at least one question',
    examSavedSuccess: 'تم حفظ الامتحان في المواد بنجاح',
    failedToSaveExam: 'فشل في حفظ الامتحان في المواد',
    pdfDownloadStarted: 'بدأ تحميل ملف PDF',
    pdfGenerationFailed: 'فشل في إنشاء ملف PDF',
    true: 'صحيح',
    false: 'خطأ',
    goodLuck: 'حظًا موفقًا!',
    points: 'نقاط',
    questionType: 'نوع السؤال',
    questionText: 'نص السؤال',
    answer: 'الإجابة',
    explanation: 'الشرح',
    options: 'الخيارات',
    difficulty: 'الصعوبة',
    easy: 'سهل',
    medium: 'متوسط',
    hard: 'صعب',
    materialLoadedAsContext: 'تم تحميل المادة كسياق للإنشاء بالذكاء الاصطناعي',
    textExtractedFromFile: 'تم استخراج النص من الملف وإضافته كسياق',
    goodMorning: 'صباح الخير',
    goodAfternoon: 'صباح الخير',
    goodEvening: 'صباح الخير',
    timezone: 'منطقة زمنية',
    currentTime: 'الوقت الحالي',
    localizationSettings: 'إعدادات الموقع',
    contactSupportToChangeEmail: 'اتصل بالدعم لتغيير عنوان بريدك الإلكتروني',
    classLevels: 'مستويات الصف',
    addClass: 'إضافة صف',
    enterClassLevel: 'أدخل مستوى الصف (مثل، الصف السابع، الفيزياء المتقدمة)',
    quickAdd: 'إضافة سريعة',
    getStarted: 'ابدأ',
    newTeacherWelcome: 'مرحبًا بالمعلم الجديد',
    personalizeSparkMessage: 'دعنا نخصص سبارك لك! أكمل الخطوات أدناه للبدء.',
    completeStepsBelow: 'أكمل هذه الخطوات لإعداد بيئة التدريس الخاصة بك والاستفادة القصوى من سبارك.',
    start: 'ابدأ',
  },
  he: {
    // Dashboard & Common
    welcomeMessage: 'ברוך הבא, {name}! 👋',
    teacherAt: 'מורה ל{subject} ב{school}',
    newReport: 'דוח חדש',
    createLesson: 'צור שיעור',
    completed: 'הושלם',
    quickActions: 'פעולות מהירות',
    recentActivity: 'פעילות אחרונה',
    recentChats: 'צ\'אטים אחרונים',
    background: 'רקע',
    selectBackground: 'בחר את סגנון הרקע המועדף עליך',
    createExam: 'צור מבחן',
    addStudents: 'הוסף תלמידים',
    scheduleClass: 'תזמן כיתה',
    subjects: 'מקצועות',
    enterSubject: 'הזן מקצוע',
    add: 'הוסף',
    bio: 'הביוגרפיה',
    enterBio: 'שתף ביוגרפיה קצרה על עצמך (מקסימום 200 תווים)',
    characters: 'תווים',
    noBioYet: 'עדיין לא נוספה ביוגרפיה',
    noRecentActivity: 'אין פעילות אחרונה',
    activityWillAppearHere: 'פעילויות תלמידים יופיעו כאן',
    noRecentChats: 'אין צ\'אטים אחרונים',
    startChattingWithStudents: 'התחל לשוחח עם התלמידים שלך',
    teacher: 'מורה',
    at: 'ב',
    
    // Stats
    activeStudents: 'תלמידים פעילים',
    activeStudentsDesc: 'תלמידים פעילים ב-30 הימים האחרונים',
    completionRate: 'שיעור השלמה',
    completionRateDesc: 'שיעור השלמת משימות ממוצע',
    totalClasses: 'סך הכל כיתות',
    totalClassesDesc: 'מספר הכיתות הפעילות',
    averageGrade: 'ציון ממוצע',
    averageGradeDesc: 'ביצועי הכיתה הכוללים',
    
    // Tools & Actions
    lessonPlanning: 'תכנון שיעור',
    lessonPlanningDesc: 'צור מערכי שיעור מותאמים אישית לכיתת {subject}',
    assessmentGenerator: 'יוצר מבחנים',
    assessmentDesc: 'צור מבחנים והערכות ייעודיים ל{subject}',
    studentFeedback: 'משוב לתלמידים',
    feedbackDesc: 'צור משוב מותאם אישית לתלמידי {subject}',
    activityCreator: 'יוצר פעילויות',
    activityDesc: 'תכנן פעילויות כיתה מעניינות ב{subject}',
    
    // Materials
    uploadMaterial: 'העלה חומר',
    materialCategories: {
      all: 'כל החומרים',
      lesson: 'מערכי שיעור',
      quiz: 'מבחנים',
      activity: 'פעילויות',
      other: 'אחר'
    },
    
    // Common Actions
    edit: 'עריכה',
    delete: 'מחיקה',
    save: 'שמירה',
    cancel: 'ביטול',
    upload: 'העלאה',
    download: 'הורדה',
    preview: 'תצוגה מקדימה',
    share: 'שיתוף',
    
    // Status & Progress
    inProgress: 'בתהליך',
    pending: 'ממתין',
    overdue: 'באיחור',
    dueDate: 'תאריך יעד {date}',
    lastModified: 'עודכן לאחרונה {date}',
    
    // Quick Actions Section
    importLesson: 'ייבוא שיעור',
    generateWithAI: 'יצירה עם בינה מלאכותית',
    useTemplate: 'שימוש בתבנית',
    
    // Student Related
    studentCount: '{count} תלמידים',
    classAverage: 'ממוצע כיתה: {score}%',
    submitWork: 'הגשת עבודה',
    viewFeedback: 'צפייה במשוב',
    
    // Settings
    settings: 'הגדרות',
    settingsDescription: 'ניהול החשבון והעדפות היישום',
    profile: 'פרופיל',
    appSettings: 'הגדרות יישום',
    profileInformation: 'מידע אישי',
    editProfile: 'עריכת פרופיל',
    fullName: 'שם מלא',
    email: 'דואר אלקטרוני',
    school: 'בית ספר',
    saveChanges: 'שמירת שינויים',
    theme: 'ערכת נושא',
    choosePreferredTheme: 'בחר את ערכת הנושא המועדפת',
    light: 'בהיר',
    dark: 'כהה',
    system: 'מערכת',
    language: 'שפה',
    selectPreferredLanguage: 'בחר את השפה המועדפת',
    english: 'English',
    arabic: 'العربية',
    hebrew: 'עברית',
    notifications: 'התראות',
    manageNotificationPreferences: 'ניהול העדפות התראות',
    colorScheme: 'ערכת צבעים',
    chooseAccentColor: 'בחר צבע הדגשה',
    settingsUpdated: 'ההגדרות עודכנו בהצלחה',
    failedToSave: 'שמירת ההגדרות נכשלה',
    
    // Navigation
    dashboard: 'לוח בקרה',
    chat: 'צ\'אט',
    lessons: 'שיעורים',
    materials: 'חומרים',
    students: 'תלמידים',
    tools: {
      toolCategories: {
        planning: 'תכנון שיעורים',
        assessment: 'הערכה',
        feedback: 'משוב לתלמידים',
        activities: 'פעילויות',
        resources: 'משאבים'
      }
    },
    search: 'חיפוש',
    newChat: 'צ\'אט חדש',
    savedMaterials: 'חומרים שמורים',
    recentGrading: 'ציונים אחרונים',
    viewAll: 'הצג הכל',
    gradeMore: 'ציין עוד',
    
    // Form Placeholders
    enterFullName: 'הכנס שם מלא',
    enterEmail: 'הכנס דואר אלקטרוני',
    enterSchoolName: 'הזן את שם בית הספר שלך',
    
    // Subjects
    physicsForces: 'פיזיקה - כוחות ותנועה',
    chemistryLab: 'מעבדת כימיה - תגובות',
    biology: 'ביולוגיה - מבנה התא',
    mathematics: 'מתמטיקה - אלגברה',
    
    // Chat Interface
    typeMessage: 'הקלד הודעה...',
    sendMessage: 'שלח',
    uploadFile: 'העלה קובץ',
    recordVoice: 'הקלט קול',
    attachFile: 'צרף קובץ',
    messageHistory: 'היסטוריית הודעות',
    noMessages: 'אין הודעות עדיין',
    startNewChat: 'התחל צ\'אט חדש',
    aiAssistant: 'עוזר בינה מלאכותית',
    you: 'אתה',
    
    // AI Tools
    aiTools: 'כלי בינה מלאכותית',
    teachingToolsLessonPlanner: 'מתכנן שיעורים',
    quizGenerator: 'יוצר מבחנים',
    feedbackAssistant: 'עוזר משוב',
    activityDesigner: 'מעצב פעילויות',
    
    // Tool Instructions
    teachingToolsLessonPlannerDesc: 'צור מערכי שיעור מפורטים עם מטרות ופעילויות',
    quizGeneratorDesc: 'צור מבחנים והערכות לכיתה שלך',
    feedbackAssistantDesc: 'קבל עזרה בכתיבת משוב אישי לתלמידים',
    activityDesignerDesc: 'עצב פעילויות כיתה מעניינות',
    
    // Stats Changes
    increase: '+{value}%',
    decrease: '-{value}%',

    // Tools Section
    toolsAndResources: 'כלים ומשאבים',
    toolsDescription: 'גישה לכלים מבוססי AI לשיפור ההוראה',
    createNew: 'צור חדש',
    recentlyUsed: 'בשימוש לאחרונה',
    popularTools: 'כלים פופולריים',
    allTools: 'כל הכלים',
    
    // Chat Interface Extended
    startConversation: 'התחל שיחה',
    suggestedPrompts: 'הצעות לשיחה',
    createLessonPlan: 'צור מערך שיעור',
    generateQuiz: 'צור מבחן',
    writeFeedback: 'כתוב משוב לתלמיד',
    designActivity: 'עצב פעילות כיתה',
    chatHistory: 'היסטוריית שיחות',
    clearChat: 'נקה שיחה',
    regenerateResponse: 'צור תשובה מחדש',
    copyToClipboard: 'העתק ללוח',
    downloadResponse: 'הורד תשובה',
    saveToMaterials: 'שמור לחומרים',
    uploadFiles: 'העלה קבצים',
    recordAudio: 'הקלט שמע',
    stopRecording: 'עצור הקלטה',
    aiTyping: 'הבינה המלאכותית מקלידה...',
    
    // Dashboard Extended
    quickStart: 'התחלה מהירה',
    upcomingLessons: 'שיעורים קרובים',
    pendingTasks: 'משימות ממתינות',
    studentProgress: 'התקדמות תלמידים',
    classInsights: 'תובנות כיתה',
    teachingStats: 'סטטיסטיקות הוראה',
    weeklyOverview: 'סקירה שבועית',
    monthlyReport: 'דוח חודשי',
    
    // Material Management
    createNewMaterial: 'צור חומר',
    uploadNewMaterial: 'העלה חומר',
    materialTypes: 'סוגי חומרים',
    sortBy: 'מיין לפי',
    filterBy: 'סנן לפי',
    searchMaterials: 'חפש חומרים',
    noMaterialsFound: 'לא נמצאו חומרים',
    lastEdited: 'נערך לאחרונה',
    dateCreated: 'תאריך יצירה',
    fileSize: 'גודל קובץ',
    studentLevel: 'רמת תלמיד',
    gradeLevel: 'שכבת גיל',
    elementary: 'יסודי',
    middleSchool: 'חטיבת ביניים',
    highSchool: 'תיכון',
    controlPanel: 'לוח בקרה',
    
    // Teaching Style
    teachingStyle: 'סגנון הוראה',
    formal: 'פורמלי',
    conversational: 'שיחתי',
    socratic: 'סוקרטי',
    
    // Curriculum
    curriculumAlignment: 'התאמת תכנית לימודים',
    commonCore: 'ליבה משותפת',
    ibProgram: 'תכנית IB',
    custom: 'מותאם אישית',
    
    // Recent Activity
    noRecentSessions: 'אין שיעורים אחרונים',
    
    // Time and Dates
    today: 'היום',
    yesterday: 'אתמול',
    daysAgo: 'לפני {days} ימים',
    
    // File Types
    document: 'מסמך',
    presentation: 'מצגת',
    spreadsheet: 'גיליון אלקטרוני',
    pdf: 'PDF',
    
    // Control Panel Additional
    elementarySchool: 'תלמידי בית ספר יסודי',
    middleSchoolLevel: 'תלמידי חטיבת ביניים',
    highSchoolLevel: 'תלמידי תיכון',
    formalStyle: 'פורמלי ומובנה',
    conversationalStyle: 'שיחתי ומעורר עניין',
    socraticStyle: 'מבוסס חקר ודיאלוג',
    commonCoreDesc: 'מותאם לתקני הליבה המשותפים',
    ibProgramDesc: 'על פי מסגרת IB',
    customCurriculumDesc: 'שימוש בתקני תכנית לימודים גמישים',
    generalChat: 'צ\'אט כללי',
    recentMaterials: 'חומרים אחרונים',
    examGrading: 'בדיקת מבחנים',
    examGradingDesc: 'בדיקת מבחנים במהירות בעזרת בינה מלאכותית וניתוח מפורט',
    examCreator: 'מנשר המבחנים',
    examCreatorDesc: 'יצירת מבחנים מקצועיים עם בינה מלאכותית ושיתופם עם תלמידים',
    gamifyExam: 'הפוך מבחן למשחק',
    gamifyExamDesc: 'הפוך את המבחנים שלך למשחקים אינטראקטיביים כמו Kahoot',
    homeworkMaker: 'יוצר שיעורי בית',
    homeworkMakerDesc: 'יצירת שיעורי בית מחומרי הלימוד שלך',
    feedbackGenerator: 'יוצר משוב',
    feedbackGeneratorDesc: 'יצירת משוב אישי לתלמידים בעזרת בינה מלאכותית',
    analyticsInsights: 'ניתוח ותובנות',
    analyticsDesc: 'הצגה חזותית של נתוני ביצועי תלמידים עם תובנות מעשיות',
    lessonPlannerDesc: 'Design comprehensive lesson plans with curriculum alignment',
    rubricCreator: 'יוצר רובריקות',
    rubricCreatorDesc: 'יצירת רובריקות הערכה מפורטות למטלות ופרוייקטים',
    teachingTools: 'כלי הוראה',
    new: 'חדש',
    published: 'מנוסם',
    graded: 'נבדק',
    draft: 'מסודה',
    backToTools: 'חזרה לכלים',
    examSaveToMaterials: 'Save to Materials',
    useExistingMaterials: 'Use Existing Materials',
    useExistingMaterialsDesc: 'Import content from your saved materials',
    uploadContent: 'Upload Content',
    uploadContentDesc: 'Upload files to extract content for your exam',
    aiGeneration: 'AI Generation',
    aiGenerationDesc: 'Generate exam questions with AI assistance',
    manualCreation: 'Manual Creation',
    manualCreationDesc: 'Create exam questions from scratch',
    examInformation: 'Exam Information',
    examSubject: 'Subject',
    examGrade: 'Grade',
    examDuration: 'Duration',
    minutes: 'minutes',
    totalPoints: 'Total Points',
    instructions: 'Instructions',
    teacherInformation: 'Teacher Information',
    addQuestions: 'Add Questions',
    addQuestionManually: 'Add Question Manually',
    importFromMaterials: 'Import from Materials',
    examUploadFile: 'Upload File',
    aiQuestionGenerator: 'AI Question Generator',
    quickAITemplates: 'Quick AI Templates',
    generateQuestionsWithAI: 'Generate Questions with AI',
    processing: 'Processing...',
    examQuestions: 'Exam Questions',
    noQuestionsYet: 'No questions added yet',
    useToolsToAddQuestions: 'Use the tools above to add questions',
    pleaseEnterTitle: 'Please enter a title for the exam',
    pleaseAddQuestions: 'Please add at least one question',
    examSavedSuccess: 'Exam saved to materials successfully',
    failedToSaveExam: 'Failed to save exam to materials',
    pdfDownloadStarted: 'PDF download has started',
    pdfGenerationFailed: 'Failed to generate PDF',
    true: 'True',
    false: 'False',
    goodLuck: 'Good luck!',
    points: 'points',
    questionType: 'Question Type',
    questionText: 'Question Text',
    answer: 'Answer',
    explanation: 'Explanation',
    options: 'Options',
    difficulty: 'Difficulty',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    materialLoadedAsContext: 'Material loaded as context for AI generation',
    textExtractedFromFile: 'Text extracted from file and added as context',
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',
    timezone: 'Timezone',
    currentTime: 'Current time',
    localizationSettings: 'Localization Settings',
    contactSupportToChangeEmail: 'צור קשר עם התמיכה כדי לשנות את כתובת הדוא"ל שלך',
    classLevels: 'רמות כיתה',
    addClass: 'הוסף כיתה',
    enterClassLevel: 'הזן רמת כיתה (לדוגמה, כיתה ז, פיזיקה מתקדמת)',
    quickAdd: 'הוספה מהירה',
    getStarted: 'התחל',
    newTeacherWelcome: 'ברוך הבא למורה חדש',
    personalizeSparkMessage: 'בואו נתאים את ספארק עבורך! השלם את השלבים למטה כדי להתחיל.',
    completeStepsBelow: 'השלם שלבים אלה כדי להגדיר את סביבת ההוראה שלך ולהפיק את המרב מספארק.',
    start: 'התחל',
  }
};

// Update the translation function to handle nested objects
const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Use a more specific type for language state
  const [language, setLanguageState] = useState<Language>(() => {
    // Initialize from localStorage if available, otherwise default to 'en'
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('language');
      return (savedLang === 'en' || savedLang === 'ar' || savedLang === 'he') ? savedLang as Language : 'en';
    }
    return 'en';
  });

  // Update setLanguage to trigger re-render
  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', newLang);
      // Force a page refresh to ensure all components update
      window.location.reload();
    }
  }, []);

  // Memoize the translation function to prevent unnecessary re-renders
  const t = useCallback((key: string, params?: TranslationParams) => {
    // Split the key by dots to handle nested objects
    const keys = key.split('.');
    let translation: any = translations[language];
    
    // Navigate through nested objects
    for (const k of keys) {
      translation = translation?.[k];
      if (!translation) break;
    }

    // If no translation found, return the key
    if (!translation || typeof translation === 'object') return key;

    // Replace parameters if they exist
    if (params) {
      return Object.entries(params).reduce((str, [param, value]) => {
        return str.replace(`{${param}}`, String(value));
      }, translation);
    }
    
    return translation;
  }, [language]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t
  }), [language, setLanguage, t]);

  return (
    <LanguageContext.Provider value={contextValue}>
      <div dir={language === 'ar' || language === 'he' ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext); 