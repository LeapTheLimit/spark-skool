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

// Add game-specific translations interface
interface GameTranslations {
  selectGameMode: string;
  playing: string;
  results: string;
  score: string;
  time: string;
  playAgain: string;
  backToDashboard: string;
  gameResults: string;
  timeTaken: string;
  correctAnswers: string;
  wrongAnswers: string;
  questionsGenerated: string;
  errorGeneratingQuestions: string;
  raisedHand: string;
  isAnswering: string;
  typeStudentAnswer: string;
  correct: string;
  incorrect: string;
  previous: string;
  next: string;
  tutorialStep1: string;
  tutorialStep2: string;
  tutorialStep3: string;
  gotIt: string;
  enterStudentName: string;
  addStudent: string;
  raiseHand: string;
  question: string;
  generating: string;
}

// Add game type translations interface
interface GameTypeTranslations {
  quizBattle: string;
  quizBattleDesc: string;
  quizBattleTag1: string;
  quizBattleTag2: string;
  flashcardMemory: string;
  flashcardMemoryDesc: string;
  flashcardMemoryTag1: string;
  flashcardMemoryTag2: string;
  fillBlanks: string;
  fillBlanksDesc: string;
  fillBlanksTag1: string;
  fillBlanksTag2: string;
  matching: string;
  matchingDesc: string;
  matchingTag1: string;
  matchingTag2: string;
  simulation: string;
  simulationDesc: string;
  simulationTag1: string;
  simulationTag2: string;
  timeline: string;
  timelineDesc: string;
  timelineArrangeInOrder: string;
  timelineCheckOrder: string;
  timelineResetGame: string;
  timelineMoves: string;
  timelineScore: string;
  timelineTimeLeft: string;
  timelineGameOver: string;
  timelineFinalScore: string;
  timelinePlayAgain: string;
  timelineCorrect: string;
  timelineIncorrect: string;
  chemicalMixing: string;
  chemicalMixingDesc: string;
  circuitConnection: string;
  circuitConnectionDesc: string;
  ballDrop: string;
  ballDropDesc: string;
  sequence: string;
  sequenceDesc: string;
}

// Add error and action translations interfaces
interface ErrorTranslations {
  invalidGameType: string;
  gameLoadError: string;
  unexpectedError: string;
}

interface ActionTranslations {
  backToSelection: string;
  tryAgain: string;
  continue: string;
  restart: string;
}

// Update TranslationStrings interface to properly handle nested objects
interface TranslationStrings {
  [key: string]: string | MaterialCategories | ToolCategories | GameSetup | GameTranslations | GameTypeTranslations | ErrorTranslations | ActionTranslations | Record<string, any>;
  game: GameTranslations;
  gameTypes: GameTypeTranslations;
  errors: ErrorTranslations;
  actions: ActionTranslations;
  tools: {
    toolCategories: ToolCategories;
  };
}

interface GameSetup {
  title: string;
  subject: string;
  selectSubject: string;
  topic: string;
  selectTopic: string;
  difficulty: string;
  questionCount: string;
  aiGeneration: string;
  enterContext: string;
  generateQuestions: string;
  howToPlay: string;
  leaderboard: string;
  difficultyLevels: {
    easy: string;
    medium: string;
    hard: string;
  };
}

// Update Translations type to ensure unique language sections
interface Translations {
  en: TranslationStrings;
  ar: TranslationStrings;
  he: TranslationStrings;
}

// Update the translation function type
type TranslationParams = Record<string, string | number>;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: TranslationParams) => string;
}

// Define translations for each language
const translations = {
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
    recentGrading: 'Recent Grading',
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
    
    // Tasks related translations
    createTasksDescription: 'Create tasks to keep track of your to-dos',
    whatDoYouNeedToDo: 'What do you need to do?',
    category: 'Category',
    categoryDescription: 'Choose a category for your task',
    task: 'Task',
    grading: 'Grading',
    call: 'Call',
    callMeeting: 'Call/Meeting',
    priority: 'Priority',
    priorityDescription: 'Set the priority level for this task',
    dueDateDescription: 'When does this task need to be completed?',
    addTask: 'Add Task',
    addNewTask: 'Add New Task',
    tasks: 'Tasks',
    completedTasks: 'Completed Tasks',
    activeTasks: 'Active Tasks',
    allTasks: 'All Tasks',
    clearCompleted: 'Clear Completed',
    clearCompletedTasksConfirm: 'Are you sure you want to clear all completed tasks?',
    noCompletedTasksYet: 'No completed tasks yet',
    created: 'Created',
    markAsIncomplete: 'Mark as Incomplete',
    markAsComplete: 'Mark as Complete',
    deleteTask: 'Delete Task',
    noTasksFound: 'No tasks found',
    callsMeetings: 'Calls/Meetings',
    general: 'General',
    whenCompletedTasks: 'When you complete tasks, they will appear here',
    addFirstTask: 'Add your first task to get started',
    signInToYourAccount: 'Sign in to your account',
    emailAddress: 'Email address',
    password: 'Password',
    rememberMe: 'Remember me',
    forgotYourPassword: 'Forgot your password?',
    signIn: 'Sign in',
    or: 'Or',
    createNewAccount: 'Create a new account',
    alreadyHaveAccount: 'Already have an account?',
    confirmPassword: 'Confirm password',
    createAccount: 'Create account',
    pleaseCompleteAllFields: 'Please complete all fields',
    passwordsDontMatch: 'Passwords don\'t match',
    registrationSuccessful: 'Registration successful!',
    registrationFailed: 'Registration failed',
    pleaseEnterEmailAndPassword: 'Please enter your email and password',
    loginSuccessful: 'Login successful!',
    loginFailed: 'Login failed. Please check your credentials.',
    enterYourEmailToResetPassword: 'Enter your email address and we\'ll send you a link to reset your password',
    pleaseEnterYourEmail: 'Please enter your email',
    resetLinkSent: 'Reset link sent',
    resetLinkSentText: 'We\'ve sent a password reset link to your email. Please check your inbox.',
    failedToSendResetLink: 'Failed to send reset link',
    backToLogin: 'Back to login',
    invalidResetToken: 'Invalid or expired reset token',
    resetYourPassword: 'Reset your password',
    enterNewPassword: 'Enter your new password',
    newPassword: 'New password',
    passwordTooShort: 'Password must be at least 8 characters',
    passwordResetSuccessfully: 'Password reset successfully',
    passwordResetSuccessText: 'Your password has been reset successfully. You will be redirected to the login page.',
    failedToResetPassword: 'Failed to reset password',
    resetPassword: 'Reset password',
    termsOfUse: 'Terms of Use',
    privacyPolicy: 'Privacy Policy',
    welcomeBack: 'Welcome',
    back: 'Back',
    signInToYourAICopilot: 'Sign in to your AI copilot',
    noCreditCardRequired: 'No credit card required',
    dontHaveAccount: "Don't have an account?",
    bySigningInYouAgree: 'By signing in, you agree to the',
    and: 'and',
    invalidToken: 'Invalid Token',
    invalidTokenDescription: 'The password reset token is invalid or has expired.',
    requestNewResetLink: 'Request a new reset link',

    orSignIn: 'Or already have an account?',

    signUp: 'Sign up',

    byRegistering: 'By registering, you agree to our',

    iAmA: 'I am a',
    schoolVerification: 'School Verification',
    studentVerificationDescription: 'Enter your school code to verify your enrollment',
    enterSchoolCode: 'Enter school code',
    verify: 'Verify',
    verified: 'Verified',
    schoolName: 'School name',
    subjectTaught: 'Subject taught',
    creatingAccount: 'Creating account...',
    alreadyMember: 'Already a member?',
    classLevel: 'Class level',
    yourUltimateClassroomAICopilot: 'Your ultimate classroom AI copilot',
    yourClassroomAICopilot: 'Your classroom AI copilot',
    student: 'Student',
    createEngagingPresentations: 'Create engaging presentations and visual aids in seconds',
  
    
    // Class levels
    college: 'College',
    
    verifying: 'Verifying...',

    signingIn: 'Signing in...',

    // Add these translations to the English section
    comingUp: 'Coming Up',

    completeYourSetup: 'Complete your setup',
    continueSetup: 'Continue Setup',

    noUpcomingEvents: 'No upcoming events today',
    viewSchedule: 'View Schedule',

    chatWithSpark: 'Chat with Spark',
    getTeachingAssistance: 'Get teaching assistance from your AI assistant',

    manageYourClassRoster: 'Manage your class roster',
 
    generateQuizzesAndAssessments: 'Generate quizzes and assessments',
  
    createLessonPlansWithAI: 'Create lesson plans with AI assistance',
 
    schedule: 'Schedule',
    notes: 'Notes',

    helpAndSupport: 'Help & Support',
    superpowers: 'Superpowers',

    backToDashboard: 'Back to Dashboard',
    profileUpdatedSuccessfully: 'Profile updated successfully',
    failedToSaveProfile: 'Failed to save profile',
    failedToSaveSettings: 'Failed to save settings',
    selectColorScheme: 'Choose your accent color',
    emailNotifications: 'Email Notifications',
    pushNotifications: 'Push Notifications',
    smsNotifications: 'SMS Notifications',
    languageChanged: 'Language changed successfully',

    // Time-based greetings
    morningGreeting: 'Good morning',
    afternoonGreeting: 'Good afternoon',
    eveningGreeting: 'Good evening',
    
    // Dashboard sections

    
  
    createLessonDesc: 'Create lesson plans with AI assistance',
    createQuiz: 'Create quiz',
    createQuizDesc: 'Generate quizzes and assessments',

    addStudentsDesc: 'Manage your class roster',
    
    // Subject options
    subjectsHeader: 'Subjects',
    addSubject: 'Add Subject',
   
    
    // School info
    schoolLabel: 'School',
    
    // Class levels
    classLevelsHeader: 'Class Levels',

    // Onboarding
    completeProfile: 'Complete Profile',
    addProfileDetails: 'Add your name, school, and contact info',
    addSubjects: 'Add Teaching Subjects',
    selectTeachingSubjects: 'Select the subjects you teach',
    setupSchedule: 'Setup Schedule',
    addYourClassSchedule: 'Add your teaching schedule',
   
    setup: 'Setup',
    
    // Subjects selection (from the second image)
    
    // Add to English translations
    noProfileToSave: 'No profile to save',
    pleaseCompleteRequiredFields: 'Please complete all required fields',
    
    // Add in the English translations section
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',

    // Add these translations to the English section
    // Schedule page translations

    day: 'Day',
    week: 'Week',
    month: 'Month',
    year: 'Year',
    addEvent: 'Add Event',
    scheduleSettings: 'Settings',

    addYourFirstClass: 'Add Your First Class',
    time: 'Time',
    startTime: 'Start Time',
    endTime: 'End Time',
    eventType: 'Event Type',
    room: 'Room',
    color: 'Color',

    recurring: 'Recurring',
    recurrencePattern: 'Recurrence Pattern',
    numberOfOccurrences: 'Number of occurrences',
    until: 'Until',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    workingDays: 'Working Days',
    workingHours: 'Working Hours',
    class: 'Class',
    meeting: 'Meeting',
    break: 'Break',
    officeHours: 'Office Hours',
    other: 'Other',
  
    update: 'Update',
 
    deleteConfirmation: 'Are you sure you want to delete this class?',
    yourSchedule: 'Your Schedule',
    allEvents: 'All',
    googleCalendarIntegrationTitle: 'Google Calendar Integration Coming Soon',
    googleCalendarIntegrationText: 'Soon you\'ll be able to sync your class schedule with Google Calendar and receive reminders!',
    noClassesScheduled: 'No classes scheduled',
    actions: 'Actions',

    colorOptions: 'Color Options',
    blue: 'Blue', 
    purple: 'Purple',
    green: 'Green',
    amber: 'Amber',
    rose: 'Rose',
    title: 'Title',
    description: 'Description',
    date: 'Date',
    eventDetails: 'Event Details',
    repeat: 'Repeat',
    numberOfStudents: 'Number of Students',

    edited: 'Edited',
    weekOf: 'Week of',

    loading: 'Loading...',

    continueWork: 'Continue',
    noRecentTools: 'No recently used tools',

    superpowersDescription: 'Spark superpowers tools to enhance your teaching and save hours of work',

    comingSoon: 'COMING SOON',

    all: 'All',
    pinned: 'Pinned',
    archived: 'Archived',
    addNote: 'Add Note',

    // Add tool name and description translations to the English section
    // Tool Names and Descriptions
    GradeWizard: 'GradeWizard',
    gradeWizardDescription: 'AI-Powered Exam Grading',
    examGradingDescription: 'Grade exams at superhuman speed with AI assistance and detailed analytics',

    ExamCrafter: 'ExamCrafter',
    examCrafterDescription: 'Professional Exam Creation',
    examCreationDescription: 'Craft perfect exams with AI assistance and customizable templates',

    GameMaster: 'GameMaster',
    gameMasterDescription: 'Interactive Learning Games',
    gameDescription: 'Create engaging exam games with AI-powered question generation and interactive formats',

    SlideDesigner: 'SlideDesigner',
    slideDesignerDescription: 'Dynamic Presentations',
    slideDescription: 'Create captivating slides with AI assistance and beautiful templates',

    AssignmentMaker: 'AssignmentMaker',
    assignmentMakerDescription: 'Customized Learning Tasks',
    assignmentDescription: 'Generate customized homework assignments aligned with your lesson objectives',

    FeedbackGenius: 'FeedbackGenius',
    feedbackGeniusDescription: 'Personalized Student Insights',
    feedbackDescription: 'Create personalized feedback for students with AI assistance to save time',

    DataVision: 'DataVision',
    dataVisionDescription: 'Performance Analytics',
    analyticsDescription: 'Visualize student performance data with actionable insights',

    LessonArchitect: 'LessonArchitect',
    lessonArchitectDescription: 'Curriculum Planning',
    lessonDescription: 'Design comprehensive lesson plans aligned with your curriculum standards',

    RubricSmith: 'RubricSmith',
    rubricSmithDescription: 'Assessment Criteria Builder',
    rubricDescription: 'Create detailed grading rubrics for assignments and projects',

    // Additional schedule translations
  
    tryAdjustingYourSearch: 'Try adjusting your search or filter criteria',
    noToolsFound: 'No tools found',
    planning: 'Planning',
    assessment: 'Assessment',
    feedback: 'Feedback',
    activities: 'Activities',
    resources: 'Resources',
    searchTools: 'Search tools...',
  
    failedToLoadEvents: 'Failed to load events',
  
    // Tools page translations
  
    // Tool statuses

    

    // Tool actions
 
    workRestored: 'Previous work restored successfully',

    // Add presentation-related translations
   
    presentations: 'Presentations',
    presentationViewer: 'Presentation Viewer',
    presentationEditor: 'Presentation Editor',
    createEditPresentation: 'Create and edit your presentation',
    presentationSaved: 'Presentation saved successfully',
    presentationPublished: 'Presentation published successfully',
    slides: 'Slides',
    slide: 'Slide',
    template: 'Template',
    themeSettings: 'Theme Settings',
    themeUpdated: 'Theme updated successfully',
    colorChanged: 'Changed primary color to',
    applyTheme: 'Apply Theme',
    doubleClickToEdit: 'Double-click any text to edit',
    currentContent: 'Current Content',
    currentImage: 'Current Image',
    pages: 'Pages',
    aiImage: 'AI Image',
    aiWriting: 'AI Writing',
    layout: 'Layout',
    bold: 'Bold',
    italic: 'Italic',
    underline: 'Underline',
    textColor: 'Text Color',
    alignLeft: 'Align Left',
    alignCenter: 'Align Center',
    font: 'Font',
    pagesManager: 'Pages Manager',
    pagesManagerDesc: 'Manage your presentation pages here',
    layoutOptions: 'Layout Options',
    layoutOptionsDesc: 'Customize the layout of your current slide',
    slideType: 'Slide Type',
    standard: 'Standard (Bullet Points)',
    textHeavy: 'Text Heavy (Paragraphs)',
    quote: 'Quote',
    statistics: 'Statistics',
    comparison: 'Comparison',
    timeline: 'Timeline',
    imageFocus: 'Image Focus',
    example: 'Example',
    addNewSlide: 'Add New Slide',
    duplicateSlide: 'Duplicate Slide',
    deleteCurrentSlide: 'Delete Current Slide',
    newSlideAdded: 'New slide added!',
    slideDuplicated: 'Slide duplicated!',
    slideDeleted: 'Slide deleted!',
    publish: 'Publish',
    aiImageGenerator: 'AI Image Generator',
    aiImageGeneratorDesc: 'Describe the image you want to generate for this slide',
    describeImage: 'Describe the image you want (e.g., \'A professional looking pie chart showing market data\')',
    generating: 'Generating...',
    generateImage: 'Generate Image',
    removeImage: 'Remove Image',
    aiWritingAssistant: 'AI Writing Assistant',
    aiWritingAssistantDesc: 'Describe how you want to enhance this slide\'s content',
    describeEnhancement: 'What would you like to add or improve? (e.g., \'Add more detailed statistics about market growth\')',
    enhancing: 'Enhancing...',
    // Game Setup
    gameSetup: {
      title: 'Game Setup',
      subject: 'Subject',
      selectSubject: 'Select Subject',
      topic: 'Topic',
      selectTopic: 'Select Topic',
      difficulty: 'Difficulty',
      questionCount: 'Question Count',
      aiGeneration: 'AI Generation',
      enterContext: 'Enter Context',
      generateQuestions: 'Generate Questions',
      howToPlay: 'How To Play',
      leaderboard: 'Leaderboard',
      difficultyLevels: {
        easy: 'Easy',
        medium: 'Medium',
        hard: 'Hard'
      }
    },
    game: {
      selectGameMode: 'Select Game Mode',
      playing: 'Playing',
      results: 'Results',
      score: 'Score',
      time: 'Time',
      playAgain: 'Play Again',
      backToDashboard: 'Back to Dashboard',
      gameResults: 'Game Results',
      timeTaken: 'Time Taken',
      correctAnswers: 'Correct Answers',
      wrongAnswers: 'Wrong Answers',
      questionsGenerated: 'Questions generated successfully!',
      errorGeneratingQuestions: 'Error generating questions',
      raisedHand: 'raised their hand',
      isAnswering: 'is answering',
      typeStudentAnswer: 'Type student\'s answer',
      correct: 'Correct',
      incorrect: 'Incorrect',
      previous: 'Previous',
      next: 'Next',
      tutorialStep1: 'Select a game mode to begin',
      tutorialStep2: 'Answer questions to earn points',
      tutorialStep3: 'Complete all questions to see your results',
      gotIt: 'Got it!',
      enterStudentName: 'Enter student name',
      addStudent: 'Add Student',
      raiseHand: 'Raise Hand',
      question: 'Question',
      generating: 'Generating...'
    },
    
    gameTypes: {
      quizBattle: 'Quiz Battle',
      quizBattleDesc: 'Compete in real-time quiz competitions with interactive multiplayer support',
      quizBattleTag1: '⚡ Fast-paced',
      quizBattleTag2: '👥 Multiplayer',
      
      flashcardMemory: 'Flashcard Memory',
      flashcardMemoryDesc: 'Test memory and recall with interactive flashcard exercises',
      flashcardMemoryTag1: '🧠 Memory',
      flashcardMemoryTag2: '🎯 Focus',
      
      fillBlanks: 'Fill in the Blanks',
      fillBlanksDesc: 'Complete sentences and passages with missing words',
      fillBlanksTag1: '📝 Writing',
      fillBlanksTag2: '✍️ Creative',
      
      matching: 'Matching Game',
      matchingDesc: 'Match related pairs of concepts, terms, or images',
      matchingTag1: '🔄 Matching',
      matchingTag2: '🤝 Pairing',
      
      simulation: 'Interactive Simulation',
      simulationDesc: 'Learn through interactive simulations and virtual experiments',
      simulationTag1: '🎮 Interactive',
      simulationTag2: '🎲 Dynamic',

      timeline: 'Timeline Game',
      timelineDesc: 'Arrange historical events in chronological order.',
      timelineArrangeInOrder: 'Arrange Events in Chronological Order',
      timelineCheckOrder: 'Check Order',
      timelineResetGame: 'Reset Game',
      timelineMoves: 'Moves',
      timelineScore: 'Score',
      timelineTimeLeft: 'Time Left',
      timelineGameOver: 'Game Over',
      timelineFinalScore: 'Final Score',
      timelinePlayAgain: 'Play Again',
      timelineCorrect: 'Correct Order!',
      timelineIncorrect: 'Try Again',

      chemicalMixing: 'Chemical Mixing',
      chemicalMixingDesc: 'Mix chemicals and observe reactions in a virtual lab environment.',
      circuitConnection: 'Circuit Connection',
      circuitConnectionDesc: 'Build and test electrical circuits to understand electronics.',
      ballDrop: 'Ball Drop',
      ballDropDesc: 'Learn physics concepts through interactive ball dropping experiments.',
      sequence: 'Sequence Game',
      sequenceDesc: 'Put steps or events in the correct order.'
    },

    errors: {
      invalidGameType: 'Invalid game type selected',
      gameLoadError: 'Error loading game component',
      unexpectedError: 'An unexpected error occurred'
    },

    actionss: {
      backToSelection: 'Back to Game Selection',
      tryAgain: 'Try Again',
      continue: 'Continue',
      restart: 'Restart'
    },
    timelinee: {
      arrangeInOrder: 'Arrange Events in Chronological Order',
      checkOrder: 'Check Order',
      resetGame: 'Reset Game',
      moves: 'Moves',
      score: 'Score',
      timeLeft: 'Time Left',
      gameOver: 'Game Over',
      finalScore: 'Final Score',
      playAgain: 'Play Again',
      correct: 'Correct Order!',
      incorrect: 'Try Again',
    }
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
    difficulty: 'مستوى الصعوبة',
    subject: 'المادة',
    easy: 'سهل',
    medium: 'متوسط',
    hard: 'صعب',
    materialLoadedAsContext: 'تم تحميل المادة كسياق للإنشاء بالذكاء الاصطناعي',
    textExtractedFromFile: 'تم استخراج النص من الملف وإضافته كسياق',
    goodMorning: 'صباح الخير',
    goodAfternoon: 'مساء الخير',
    goodEvening: 'مساء الخير',
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
    
    // Tasks related translations
    createTasksDescription: 'إنشاء مهام لتتبع مهامك',
    whatDoYouNeedToDo: 'ما الذي تحتاج إلى القيام به؟',
    category: 'الفئة',
    categoryDescription: 'اختر فئة للمهمة الخاصة بك',
    task: 'مهمة',
    grading: 'تصحيح',
    call: 'مكالمة',
    callMeeting: 'مكالمة/اجتماع',
    priority: 'الأولوية',
    priorityDescription: 'حدد مستوى الأولوية لهذه المهمة',
    dueDateDescription: 'متى يجب إكمال هذه المهمة؟',
    addTask: 'إضافة مهمة',
    addNewTask: 'إضافة مهمة جديدة',
    tasks: 'المهام',
    completedTasks: 'المهام المكتملة',
    activeTasks: 'المهام النشطة',
    allTasks: 'All Tasks',
    clearCompleted: 'مسح المكتملة',
    clearCompletedTasksConfirm: 'هل أنت متأكد أنك تريد مسح جميع المهام المكتملة؟',
    noCompletedTasksYet: 'لا توجد مهام مكتملة بعد',
    created: 'تم إنشاؤها',
    markAsIncomplete: 'وضع علامة كغير مكتمل',
    markAsComplete: 'وضع علامة كمكتمل',
    deleteTask: 'حذف المهمة',
    noTasksFound: 'No tasks found',
    callsMeetings: 'المكالمات/الاجتماعات',
    general: 'عام',
    whenCompletedTasks: 'عندما تكمل المهام، ستظهر هنا',
    addFirstTask: 'أضف مهمتك الأولى للبدء',

    signInToYourAccount: 'تسجيل الدخول إلى حسابك',
    emailAddress: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    rememberMe: 'تذكرني',
    forgotYourPassword: 'نسيت كلمة المرور؟',
    signIn: 'تسجيل الدخول',
    or: 'أو',
    createNewAccount: 'إنشاء حساب جديد',
    alreadyHaveAccount: 'لديك حساب بالفعل؟',
    confirmPassword: 'تأكيد كلمة المرور',
    createAccount: 'إنشاء حساب',
    pleaseCompleteAllFields: 'يرجى إكمال جميع الحقول',
    passwordsDontMatch: 'كلمات المرور غير متطابقة',
    registrationSuccessful: 'تم التسجيل بنجاح!',
    registrationFailed: 'فشل التسجيل',
    pleaseEnterEmailAndPassword: 'يرجى إدخال البريد الإلكتروني وكلمة المرور',
    loginSuccessful: 'تم تسجيل الدخول بنجاح!',
    loginFailed: 'فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد الخاصة بك.',
    enterYourEmailToResetPassword: 'أدخل عنوان بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور',
    pleaseEnterYourEmail: 'يرجى إدخال بريدك الإلكتروني',
    resetLinkSent: 'تم إرسال رابط إعادة التعيين',
    resetLinkSentText: 'لقد أرسلنا رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد الخاص بك.',
    failedToSendResetLink: 'فشل في إرسال رابط إعادة التعيين',
    backToLogin: 'العودة إلى تسجيل الدخول',
    invalidResetToken: 'رمز إعادة التعيين غير صالح أو منتهي الصلاحية',
    resetYourPassword: 'إعادة تعيين كلمة المرور الخاصة بك',
    enterNewPassword: 'أدخل كلمة المرور الجديدة',
    newPassword: 'كلمة المرور الجديدة',
    passwordTooShort: 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل',
    passwordResetSuccessfully: 'تم إعادة تعيين كلمة المرور بنجاحيين كلمة المرور بنجاح',
    termsOfUse: 'شروط الاستخدام',
    privacyPolicy: 'سياسة الخصوصية',
    welcomeBack: 'مرحبًا بعودتك',
    back: 'مجددًا',
    signInToYourAICopilot: 'تسجيل الدخول إلى مساعدك الذكي',
    noCreditCardRequired: 'لا حاجة لبطاقة ائتمان',
    dontHaveAccount: "Don't have an account?",
    bySigningInYouAgree: 'By signing in, you agree to the',
    and: 'and',
    invalidToken: 'Invalid Token',
    invalidTokenDescription: 'The password reset token is invalid or has expired.',
    requestNewResetLink: 'Request a new reset link',

    orSignIn: 'Or already have an account?',

    signUp: 'Sign up',

    byRegistering: 'By registering, you agree to our',

    iAmA: 'I am a',
    schoolVerification: 'School Verification',
    studentVerificationDescription: 'Enter your school code to verify your enrollment',
    enterSchoolCode: 'Enter school code',
    verify: 'Verify',
    verified: 'Verified',
    schoolName: 'School name',
    subjectTaught: 'Subject taught',
    creatingAccount: 'Creating account...',
    alreadyMember: 'Already a member?',
    classLevel: 'Class level',
    yourUltimateClassroomAICopilot: 'Your ultimate classroom AI copilot',
    yourClassroomAICopilot: 'Your classroom AI copilot',
    student: 'Student',
    createEngagingPresentations: 'Create engaging presentations and visual aids in seconds',
  
    
    // Class levels
    college: 'College',
    
    verifying: 'Verifying...',

    signingIn: 'Signing in...',

    // Add these translations to the English section
    comingUp: 'Coming Up',

    completeYourSetup: 'Complete your setup',
    continueSetup: 'Continue Setup',

    noUpcomingEvents: 'No upcoming events today',
    viewSchedule: 'View Schedule',

    chatWithSpark: 'Chat with Spark',
    getTeachingAssistance: 'Get teaching assistance from your AI assistant',

    manageYourClassRoster: 'Manage your class roster',
 
    generateQuizzesAndAssessments: 'Generate quizzes and assessments',
  
    createLessonPlansWithAI: 'Create lesson plans with AI assistance',
 
    schedule: 'Schedule',
    notes: 'Notes',

    helpAndSupport: 'Help & Support',
    superpowers: 'Superpowers',

    backToDashboard: 'Back to Dashboard',
    profileUpdatedSuccessfully: 'Profile updated successfully',
    failedToSaveProfile: 'Failed to save profile',
    failedToSaveSettings: 'Failed to save settings',
    selectColorScheme: 'Choose your accent color',
    emailNotifications: 'Email Notifications',
    pushNotifications: 'Push Notifications',
    smsNotifications: 'SMS Notifications',
    languageChanged: 'Language changed successfully',

    // Time-based greetings
    morningGreeting: 'Good morning',
    afternoonGreeting: 'Good afternoon',
    eveningGreeting: 'Good evening',
    
    // Dashboard sections

    
  
    createLessonDesc: 'Create lesson plans with AI assistance',
    createQuiz: 'Create quiz',
    createQuizDesc: 'Generate quizzes and assessments',

    addStudentsDesc: 'Manage your class roster',
    
    // Subject options
    subjectsHeader: 'Subjects',
    addSubject: 'Add Subject',
   
    
    // School info
    schoolLabel: 'School',
    
    // Class levels
    classLevelsHeader: 'Class Levels',

    // Onboarding
    completeProfile: 'Complete Profile',
    addProfileDetails: 'Add your name, school, and contact info',
    addSubjects: 'Add Teaching Subjects',
    selectTeachingSubjects: 'Select the subjects you teach',
    setupSchedule: 'Setup Schedule',
    addYourClassSchedule: 'Add your teaching schedule',
   
    setup: 'Setup',
    
    // Subjects selection (from the second image)
    
    // Add to English translations
    noProfileToSave: 'No profile to save',
    pleaseCompleteRequiredFields: 'Please complete all required fields',
    
    // Add in the English translations section
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',

    // Add these translations to the English section
    // Schedule page translations

    day: 'Day',
    week: 'Week',
    month: 'Month',
    year: 'Year',
    addEvent: 'Add Event',
    scheduleSettings: 'Settings',

    addYourFirstClass: 'Add Your First Class',
    time: 'Time',
    startTime: 'Start Time',
    endTime: 'End Time',
    eventType: 'Event Type',
    room: 'Room',
    color: 'Color',

    recurring: 'Recurring',
    recurrencePattern: 'Recurrence Pattern',
    numberOfOccurrences: 'Number of occurrences',
    until: 'Until',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    workingDays: 'Working Days',
    workingHours: 'Working Hours',
    class: 'Class',
    meeting: 'Meeting',
    break: 'Break',
    officeHours: 'Office Hours',
    other: 'Other',
  
    update: 'Update',
 
    deleteConfirmation: 'Are you sure you want to delete this class?',
    yourSchedule: 'Your Schedule',
    allEvents: 'All',
    googleCalendarIntegrationTitle: 'Google Calendar Integration Coming Soon',
    googleCalendarIntegrationText: 'Soon you\'ll be able to sync your class schedule with Google Calendar and receive reminders!',
    noClassesScheduled: 'No classes scheduled',
    actions: 'Actions',

    colorOptions: 'Color Options',
    blue: 'Blue', 
    purple: 'Purple',
    green: 'Green',
    amber: 'Amber',
    rose: 'Rose',
    title: 'Title',
    description: 'Description',
    date: 'Date',
    eventDetails: 'Event Details',
    repeat: 'Repeat',
    numberOfStudents: 'Number of Students',

    edited: 'Edited',
    weekOf: 'Week of',

    loading: 'Loading...',

    continueWork: 'Continue',
    noRecentTools: 'No recently used tools',

    superpowersDescription: 'Spark superpowers tools to enhance your teaching and save hours of work',

    comingSoon: 'COMING SOON',

    all: 'All',
    pinned: 'Pinned',
    archived: 'Archived',
    addNote: 'Add Note',

    // Add tool name and description translations to the English section
    // Tool Names and Descriptions
    GradeWizard: 'GradeWizard',
    gradeWizardDescription: 'AI-Powered Exam Grading',
    examGradingDescription: 'Grade exams at superhuman speed with AI assistance and detailed analytics',

    ExamCrafter: 'ExamCrafter',
    examCrafterDescription: 'Professional Exam Creation',
    examCreationDescription: 'Craft perfect exams with AI assistance and customizable templates',

    GameMaster: 'GameMaster',
    gameMasterDescription: 'Interactive Learning Games',
    gameDescription: 'Create engaging exam games with AI-powered question generation and interactive formats',

    SlideDesigner: 'SlideDesigner',
    slideDesignerDescription: 'Dynamic Presentations',
    slideDescription: 'Create captivating slides with AI assistance and beautiful templates',

    AssignmentMaker: 'AssignmentMaker',
    assignmentMakerDescription: 'Customized Learning Tasks',
    assignmentDescription: 'Generate customized homework assignments aligned with your lesson objectives',

    FeedbackGenius: 'FeedbackGenius',
    feedbackGeniusDescription: 'Personalized Student Insights',
    feedbackDescription: 'Create personalized feedback for students with AI assistance to save time',

    DataVision: 'DataVision',
    dataVisionDescription: 'Performance Analytics',
    analyticsDescription: 'Visualize student performance data with actionable insights',

    LessonArchitect: 'LessonArchitect',
    lessonArchitectDescription: 'Curriculum Planning',
    lessonDescription: 'Design comprehensive lesson plans aligned with your curriculum standards',

    RubricSmith: 'RubricSmith',
    rubricSmithDescription: 'Assessment Criteria Builder',
    rubricDescription: 'Create detailed grading rubrics for assignments and projects',

    // Additional schedule translations
  
    tryAdjustingYourSearch: 'Try adjusting your search or filter criteria',
    noToolsFound: 'No tools found',
    planning: 'Planning',
    assessment: 'Assessment',
    feedback: 'Feedback',
    activities: 'Activities',
    resources: 'Resources',
    searchTools: 'Search tools...',
  
    failedToLoadEvents: 'Failed to load events',
  
    // Tools page translations
  
    // Tool statuses

    

    // Tool actions
 
    workRestored: 'Previous work restored successfully',

    // Add presentation-related translations
   
    presentations: 'Presentations',
    presentationViewer: 'Presentation Viewer',
    presentationEditor: 'Presentation Editor',
    createEditPresentation: 'Create and edit your presentation',
    presentationSaved: 'Presentation saved successfully',
    presentationPublished: 'Presentation published successfully',
    slides: 'Slides',
    slide: 'Slide',
    template: 'Template',
    themeSettings: 'Theme Settings',
    themeUpdated: 'Theme updated successfully',
    colorChanged: 'Changed primary color to',
    applyTheme: 'Apply Theme',
    doubleClickToEdit: 'Double-click any text to edit',
    currentContent: 'Current Content',
    currentImage: 'Current Image',
    pages: 'Pages',
    aiImage: 'AI Image',
    aiWriting: 'AI Writing',
    layout: 'Layout',
    bold: 'Bold',
    italic: 'Italic',
    underline: 'Underline',
    textColor: 'Text Color',
    alignLeft: 'Align Left',
    alignCenter: 'Align Center',
    font: 'Font',
    pagesManager: 'Pages Manager',
    pagesManagerDesc: 'Manage your presentation pages here',
    layoutOptions: 'Layout Options',
    layoutOptionsDesc: 'Customize the layout of your current slide',
    slideType: 'Slide Type',
    standard: 'Standard (Bullet Points)',
    textHeavy: 'Text Heavy (Paragraphs)',
    quote: 'Quote',
    statistics: 'Statistics',
    comparison: 'Comparison',
    timeline: 'Timeline',
    imageFocus: 'Image Focus',
    example: 'Example',
    addNewSlide: 'Add New Slide',
    duplicateSlide: 'Duplicate Slide',
    deleteCurrentSlide: 'Delete Current Slide',
    newSlideAdded: 'New slide added!',
    slideDuplicated: 'Slide duplicated!',
    slideDeleted: 'Slide deleted!',
    publish: 'Publish',
    aiImageGenerator: 'AI Image Generator',
    aiImageGeneratorDesc: 'Describe the image you want to generate for this slide',
    describeImage: 'Describe the image you want (e.g., \'A professional looking pie chart showing market data\')',
    generating: 'Generating...',
    generateImage: 'Generate Image',
    removeImage: 'Remove Image',
    aiWritingAssistant: 'AI Writing Assistant',
    aiWritingAssistantDesc: 'Describe how you want to enhance this slide\'s content',
    describeEnhancement: 'What would you like to add or improve? (e.g., \'Add more detailed statistics about market growth\')',
    enhancing: 'Enhancing...',
    // Game Setup
    gameSetup: {
      title: 'إعداد اللعبة',
      subject: 'المادة',
      selectSubject: 'اختر المادة',
      topic: 'الموضوع',
      selectTopic: 'اختر الموضوع',
      difficulty: 'مستوى الصعوبة',
      questionCount: 'عدد الأسئلة',
      aiGeneration: 'توليد الذكاء الاصطناعي',
      enterContext: 'أدخل السياق',
      generateQuestions: 'توليد الأسئلة',
      howToPlay: 'كيفية اللعب',
      leaderboard: 'لوحة المتصدرين',
      difficultyLevels: {
        easy: 'سهل',
        medium: 'متوسط',
        hard: 'صعب'
      }
    },
    game: {
      selectGameMode: 'اختر وضع اللعبة',
      playing: 'جاري اللعب',
      results: 'النتائج',
      score: 'النتيجة',
      time: 'الوقت',
      playAgain: 'العب مرة أخرى',
      backToDashboard: 'العودة إلى لوحة التحكم',
      gameResults: 'نتائج اللعبة',
      timeTaken: 'الوقت المستغرق',
      correctAnswers: 'الإجابات الصحيحة',
      wrongAnswers: 'الإجابات الخاطئة',
      questionsGenerated: 'تم إنشاء الأسئلة بنجاح!',
      errorGeneratingQuestions: 'خطأ في إنشاء الأسئلة',
      raisedHand: 'رفع يده',
      isAnswering: 'يجيب',
      typeStudentAnswer: 'اكتب إجابة الطالب',
      correct: 'صحيح',
      incorrect: 'خاطئ',
      previous: 'السابق',
      next: 'التالي',
      tutorialStep1: 'اختر وضع اللعبة للبدء',
      tutorialStep2: 'أجب على الأسئلة لكسب النقاط',
      tutorialStep3: 'أكمل جميع الأسئلة لرؤية نتائجك',
      gotIt: 'فهمت!',
      enterStudentName: 'أدخل اسم الطالب',
      addStudent: 'إضافة طالب',
      raiseHand: 'ارفع يدك',
      question: 'سؤال',
      generating: 'جاري الإنشاء...'
    },
    
    gameTypes: {
      quizBattle: 'معركة الاختبار',
      quizBattleDesc: 'تنافس في مسابقات الاختبارات في الوقت الفعلي مع دعم اللعب الجماعي التفاعلي',
      quizBattleTag1: '⚡ سريع الوتيرة',
      quizBattleTag2: '👥 متعدد اللاعبين',
      
      flashcardMemory: 'ذاكرة البطاقات',
      flashcardMemoryDesc: 'اختبر الذاكرة والتذكر مع تمارين البطاقات التفاعلية',
      flashcardMemoryTag1: '🧠 الذاكرة',
      flashcardMemoryTag2: '🎯 التركيز',
      
      fillBlanks: 'ملء الفراغات',
      fillBlanksDesc: 'أكمل الجمل والفقرات بالكلمات المفقودة',
      fillBlanksTag1: '📝 الكتابة',
      fillBlanksTag2: '✍️ إبداعي',
      
      matching: 'لعبة المطابقة',
      matchingDesc: 'طابق بين أزواج المفاهيم والمصطلحات أو الصور المرتبطة',
      matchingTag1: '🔄 المطابقة',
      matchingTag2: '🤝 الإقران',
      
      simulation: 'محاكاة تفاعلية',
      simulationDesc: 'تعلم من خلال المحاكاة التفاعلية والتجارب الافتراضية',
      simulationTag1: '🎮 تفاعلي',
      simulationTag2: '🎲 ديناميكي',

      timeline: 'لعبة الخط الزمني',
      timelineDesc: 'رتب الأحداث التاريخية بالترتيب الزمني لاختبار فهمك للتسلسل التاريخي.',
      timelineArrangeInOrder: 'رتب الأحداث بالترتيب الزمني',
      timelineCheckOrder: 'تحقق من الترتيب',
      timelineResetGame: 'إعادة اللعبة',
      timelineMoves: 'الحركات',
      timelineScore: 'النتيجة',
      timelineTimeLeft: 'الوقت المتبقي',
      timelineGameOver: 'انتهت اللعبة',
      timelineFinalScore: 'النتيجة النهائية',
      timelinePlayAgain: 'العب مرة أخرى',
      timelineCorrect: 'ترتيب صحيح!',
      timelineIncorrect: 'حاول مرة أخرى',

      chemicalMixing: 'خلط المواد الكيميائية',
      chemicalMixingDesc: 'اخلط المواد الكيميائية وراقب التفاعلات في بيئة مختبر افتراضية.',
      circuitConnection: 'توصيل الدوائر',
      circuitConnectionDesc: 'قم ببناء واختبار الدوائر الكهربائية لفهم الإلكترونيات.',
      ballDrop: 'إسقاط الكرة',
      ballDropDesc: 'تعلم مفاهيم الفيزياء من خلال تجارب إسقاط الكرة التفاعلية.',
      sequence: 'لعبة التسلسل',
      sequenceDesc: 'ضع الخطوات أو الأحداث في الترتيب الصحيح.'
    },

    errors: {
      invalidGameType: 'نوع اللعبة المحدد غير صالح',
      gameLoadError: 'خطأ في تحميل مكون اللعبة',
      unexpectedError: 'حدث خطأ غير متوقع'
    },

    actionss: {
      backToSelection: 'العودة إلى اختيار اللعبة',
      tryAgain: 'حاول مرة أخرى',
      continue: 'استمر',
      restart: 'إعادة التشغيل'
    },
    timelinee: {
      arrangeInOrder: 'رتب الأحداث بالترتيب الزمني',
      checkOrder: 'تحقق من الترتيب',
      resetGame: 'إعادة اللعبة',
      moves: 'الحركات',
      score: 'النتيجة',
      timeLeft: 'الوقت المتبقي',
      gameOver: 'انتهت اللعبة',
      finalScore: 'النتيجة النهائية',
      playAgain: 'العب مرة أخرى',
      correct: 'ترتيب صحيح!',
      incorrect: 'حاول مرة أخرى',
    }
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
    newChat: 'מחדש',
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
    difficulty: 'مستوى الصعوبة',
    subject: 'المادة',
    easy: 'سهل',
    medium: 'متوسط',
    hard: 'صعب',
    materialLoadedAsContext: 'تم تحميل المادة كسياق للإنشاء بالذكاء الاصطناعي',
    textExtractedFromFile: 'تم استخراج النص من الملف وإضافته كسياق',
    goodMorning: 'صباح الخير',
    goodAfternoon: 'مساء الخير',
    goodEvening: 'مساء الخير',
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
    
    // Tasks related translations
    createTasksDescription: 'إنشاء مهام لتتبع مهامك',
    whatDoYouNeedToDo: 'ما الذي تحتاج إلى القيام به؟',
    category: 'الفئة',
    categoryDescription: 'اختر فئة للمهمة الخاصة بك',
    task: 'مهمة',
    grading: 'تصحيح',
    call: 'مكالمة',
    callMeeting: 'مكالمة/اجتماع',
    priority: 'الأولوية',
    priorityDescription: 'حدد مستوى الأولوية لهذه المهمة',
    dueDateDescription: 'متى يجب إكمال هذه المهمة؟',
    addTask: 'إضافة مهمة',
    addNewTask: 'إضافة مهمة جديدة',
    tasks: 'المهام',
    completedTasks: 'المهام المكتملة',
    activeTasks: 'المهام النشطة',
    allTasks: 'All Tasks',
    clearCompleted: 'مسح المكتملة',
    clearCompletedTasksConfirm: 'هل أنت متأكد أنك تريد مسح جميع المهام المكتملة؟',
    noCompletedTasksYet: 'لا توجد مهام مكتملة بعد',
    created: 'تم إنشاؤها',
    markAsIncomplete: 'وضع علامة كغير مكتمل',
    markAsComplete: 'وضع علامة كمكتمل',
    deleteTask: 'حذف المهمة',
    noTasksFound: 'No tasks found',
    callsMeetings: 'المكالمات/الاجتماعات',
    general: 'عام',
    whenCompletedTasks: 'عندما تكمل المهام، ستظهر هنا',
    addFirstTask: 'أضف مهمتك الأولى للبدء',

    signInToYourAccount: 'تسجيل الدخول إلى حسابك',
    emailAddress: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    rememberMe: 'تذكرني',
    forgotYourPassword: 'نسيت كلمة المرور؟',
    signIn: 'تسجيل الدخول',
    or: 'أو',
    createNewAccount: 'إنشاء حساب جديد',
    alreadyHaveAccount: 'لديك حساب بالفعل؟',
    confirmPassword: 'تأكيد كلمة المرور',
    createAccount: 'إنشاء حساب',
    pleaseCompleteAllFields: 'يرجى إكمال جميع الحقول',
    passwordsDontMatch: 'كلمات المرور غير متطابقة',
    registrationSuccessful: 'تم التسجيل بنجاح!',
    registrationFailed: 'فشل التسجيل',
    pleaseEnterEmailAndPassword: 'يرجى إدخال البريد الإلكتروني وكلمة المرور',
    loginSuccessful: 'تم تسجيل الدخول بنجاح!',
    loginFailed: 'فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد الخاصة بك.',
    enterYourEmailToResetPassword: 'أدخل عنوان بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور',
    pleaseEnterYourEmail: 'يرجى إدخال بريدك الإلكتروني',
    resetLinkSent: 'تم إرسال رابط إعادة التعيين',
    resetLinkSentText: 'لقد أرسلنا رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد الخاص بك.',
    failedToSendResetLink: 'فشل في إرسال رابط إعادة التعيين',
    backToLogin: 'العودة إلى تسجيل الدخول',
    invalidResetToken: 'رمز إعادة التعيين غير صالح أو منتهي الصلاحية',
    resetYourPassword: 'إعادة تعيين كلمة المرور الخاصة بك',
    enterNewPassword: 'أدخل كلمة المرور الجديدة',
    newPassword: 'كلمة المرور الجديدة',
    passwordTooShort: 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل',
    passwordResetSuccessfully: 'تم إعادة تعيين كلمة المرور بنجاحيين كلمة المرور بنجاح',
    termsOfUse: 'شروط الاستخدام',
    privacyPolicy: 'سياسة الخصوصية',
    welcomeBack: 'مرحبًا بعودتك',
    back: 'مجددًا',
    signInToYourAICopilot: 'تسجيل الدخول إلى مساعدك الذكي',
    noCreditCardRequired: 'لا حاجة لبطاقة ائتمان',
    dontHaveAccount: "Don't have an account?",
    bySigningInYouAgree: 'By signing in, you agree to the',
    and: 'and',
    invalidToken: 'Invalid Token',
    invalidTokenDescription: 'The password reset token is invalid or has expired.',
    requestNewResetLink: 'Request a new reset link',

    orSignIn: 'Or already have an account?',

    signUp: 'Sign up',

    byRegistering: 'By registering, you agree to our',

    iAmA: 'I am a',
    schoolVerification: 'School Verification',
    studentVerificationDescription: 'Enter your school code to verify your enrollment',
    enterSchoolCode: 'Enter school code',
    verify: 'Verify',
    verified: 'Verified',
    schoolName: 'School name',
    subjectTaught: 'Subject taught',
    creatingAccount: 'Creating account...',
    alreadyMember: 'Already a member?',
    classLevel: 'Class level',
    yourUltimateClassroomAICopilot: 'Your ultimate classroom AI copilot',
    yourClassroomAICopilot: 'Your classroom AI copilot',
    student: 'Student',
    createEngagingPresentations: 'Create engaging presentations and visual aids in seconds',
  
    
    // Class levels
    college: 'College',
    
    verifying: 'Verifying...',

    signingIn: 'Signing in...',

    // Add these translations to the English section
    comingUp: 'Coming Up',

    completeYourSetup: 'Complete your setup',
    continueSetup: 'Continue Setup',

    noUpcomingEvents: 'No upcoming events today',
    viewSchedule: 'View Schedule',

    chatWithSpark: 'Chat with Spark',
    getTeachingAssistance: 'Get teaching assistance from your AI assistant',

    manageYourClassRoster: 'Manage your class roster',
 
    generateQuizzesAndAssessments: 'Generate quizzes and assessments',
  
    createLessonPlansWithAI: 'Create lesson plans with AI assistance',
 
    schedule: 'Schedule',
    notes: 'Notes',

    helpAndSupport: 'Help & Support',
    superpowers: 'Superpowers',

    backToDashboard: 'Back to Dashboard',
    profileUpdatedSuccessfully: 'Profile updated successfully',
    failedToSaveProfile: 'Failed to save profile',
    failedToSaveSettings: 'Failed to save settings',
    selectColorScheme: 'Choose your accent color',
    emailNotifications: 'Email Notifications',
    pushNotifications: 'Push Notifications',
    smsNotifications: 'SMS Notifications',
    languageChanged: 'Language changed successfully',

    // Time-based greetings
    morningGreeting: 'Good morning',
    afternoonGreeting: 'Good afternoon',
    eveningGreeting: 'Good evening',
    
    // Dashboard sections

    
  
    createLessonDesc: 'Create lesson plans with AI assistance',
    createQuiz: 'Create quiz',
    createQuizDesc: 'Generate quizzes and assessments',

    addStudentsDesc: 'Manage your class roster',
    
    // Subject options
    subjectsHeader: 'Subjects',
    addSubject: 'Add Subject',

    
    // School info
    schoolLabel: 'School',
    
    // Class levels
    classLevelsHeader: 'Class Levels',

    // Onboarding
    completeProfile: 'Complete Profile',
    addProfileDetails: 'Add your name, school, and contact info',
    addSubjects: 'Add Teaching Subjects',
    selectTeachingSubjects: 'Select the subjects you teach',
    setupSchedule: 'Setup Schedule',
    addYourClassSchedule: 'Add your teaching schedule',
   
    setup: 'Setup',
    
    // Subjects selection (from the second image)
    
    // Add to English translations
    noProfileToSave: 'No profile to save',
    pleaseCompleteRequiredFields: 'Please complete all required fields',
    
    // Add in the English translations section
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',

    // Add these translations to the English section
    // Schedule page translations

    day: 'Day',
    week: 'Week',
    month: 'Month',
    year: 'Year',
    addEvent: 'Add Event',
    scheduleSettings: 'Settings',

    addYourFirstClass: 'Add Your First Class',
    time: 'Time',
    startTime: 'Start Time',
    endTime: 'End Time',
    eventType: 'Event Type',
    room: 'Room',
    color: 'Color',

    recurring: 'Recurring',
    recurrencePattern: 'Recurrence Pattern',
    numberOfOccurrences: 'Number of occurrences',
    until: 'Until',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    workingDays: 'Working Days',
    workingHours: 'Working Hours',
    class: 'Class',
    meeting: 'Meeting',
    break: 'Break',
    officeHours: 'Office Hours',
    other: 'Other',
  
    update: 'Update',
 
    deleteConfirmation: 'Are you sure you want to delete this class?',
    yourSchedule: 'Your Schedule',
    allEvents: 'All',
    googleCalendarIntegrationTitle: 'Google Calendar Integration Coming Soon',
    googleCalendarIntegrationText: 'Soon you\'ll be able to sync your class schedule with Google Calendar and receive reminders!',
    noClassesScheduled: 'No classes scheduled',
    actions: 'Actions',

    colorOptions: 'Color Options',
    blue: 'Blue', 
    purple: 'Purple',
    green: 'Green',
    amber: 'Amber',
    rose: 'Rose',
    title: 'Title',
    description: 'Description',
    date: 'Date',
    eventDetails: 'Event Details',
    repeat: 'Repeat',
    numberOfStudents: 'Number of Students',

    edited: 'Edited',
    weekOf: 'Week of',

    loading: 'Loading...',

    continueWork: 'Continue',
    noRecentTools: 'No recently used tools',

    superpowersDescription: 'Spark superpowers tools to enhance your teaching and save hours of work',

    comingSoon: 'COMING SOON',

    all: 'All',
    pinned: 'Pinned',
    archived: 'Archived',
    addNote: 'Add Note',

    // Add tool name and description translations to the English section
    // Tool Names and Descriptions
    GradeWizard: 'GradeWizard',
    gradeWizardDescription: 'AI-Powered Exam Grading',
    examGradingDescription: 'Grade exams at superhuman speed with AI assistance and detailed analytics',

    ExamCrafter: 'ExamCrafter',
    examCrafterDescription: 'Professional Exam Creation',
    examCreationDescription: 'Craft perfect exams with AI assistance and customizable templates',

    GameMaster: 'GameMaster',
    gameMasterDescription: 'Interactive Learning Games',
    gameDescription: 'Create engaging exam games with AI-powered question generation and interactive formats',

    SlideDesigner: 'SlideDesigner',
    slideDesignerDescription: 'Dynamic Presentations',
    slideDescription: 'Create captivating slides with AI assistance and beautiful templates',

    AssignmentMaker: 'AssignmentMaker',
    assignmentMakerDescription: 'Customized Learning Tasks',
    assignmentDescription: 'Generate customized homework assignments aligned with your lesson objectives',

    FeedbackGenius: 'FeedbackGenius',
    feedbackGeniusDescription: 'Personalized Student Insights',
    feedbackDescription: 'Create personalized feedback for students with AI assistance to save time',

    DataVision: 'DataVision',
    dataVisionDescription: 'Performance Analytics',
    analyticsDescription: 'Visualize student performance data with actionable insights',

    LessonArchitect: 'LessonArchitect',
    lessonArchitectDescription: 'Curriculum Planning',
    lessonDescription: 'Design comprehensive lesson plans aligned with your curriculum standards',

    RubricSmith: 'RubricSmith',
    rubricSmithDescription: 'Assessment Criteria Builder',
    rubricDescription: 'Create detailed grading rubrics for assignments and projects',

    // Additional schedule translations
  
    tryAdjustingYourSearch: 'Try adjusting your search or filter criteria',
    noToolsFound: 'No tools found',
    planning: 'Planning',
    assessment: 'Assessment',
    feedback: 'Feedback',
    activities: 'Activities',
    resources: 'Resources',
    searchTools: 'Search tools...',
  
    failedToLoadEvents: 'Failed to load events',
  
    // Tools page translations
  
    // Tool statuses

    

    // Tool actions
 
    workRestored: 'Previous work restored successfully',

    // Add presentation-related translations
   
    presentations: 'Presentations',
    presentationViewer: 'Presentation Viewer',
    presentationEditor: 'Presentation Editor',
    createEditPresentation: 'Create and edit your presentation',
    presentationSaved: 'Presentation saved successfully',
    presentationPublished: 'Presentation published successfully',
    slides: 'Slides',
    slide: 'Slide',
    template: 'Template',
    themeSettings: 'Theme Settings',
    themeUpdated: 'Theme updated successfully',
    colorChanged: 'Changed primary color to',
    applyTheme: 'Apply Theme',
    doubleClickToEdit: 'Double-click any text to edit',
    currentContent: 'Current Content',
    currentImage: 'Current Image',
    pages: 'Pages',
    aiImage: 'AI Image',
    aiWriting: 'AI Writing',
    layout: 'Layout',
    bold: 'Bold',
    italic: 'Italic',
    underline: 'Underline',
    textColor: 'Text Color',
    alignLeft: 'Align Left',
    alignCenter: 'Align Center',
    font: 'Font',
    pagesManager: 'Pages Manager',
    pagesManagerDesc: 'Manage your presentation pages here',
    layoutOptions: 'Layout Options',
    layoutOptionsDesc: 'Customize the layout of your current slide',
    slideType: 'Slide Type',
    standard: 'Standard (Bullet Points)',
    textHeavy: 'Text Heavy (Paragraphs)',
    quote: 'Quote',
    statistics: 'Statistics',
    comparison: 'Comparison',
    timeline: 'Timeline',
    imageFocus: 'Image Focus',
    example: 'Example',
    addNewSlide: 'Add New Slide',
    duplicateSlide: 'Duplicate Slide',
    deleteCurrentSlide: 'Delete Current Slide',
    newSlideAdded: 'New slide added!',
    slideDuplicated: 'Slide duplicated!',
    slideDeleted: 'Slide deleted!',
    publish: 'Publish',
    aiImageGenerator: 'AI Image Generator',
    aiImageGeneratorDesc: 'Describe the image you want to generate for this slide',
    describeImage: 'Describe the image you want (e.g., \'A professional looking pie chart showing market data\')',
    generating: 'Generating...',
    generateImage: 'Generate Image',
    removeImage: 'Remove Image',
    aiWritingAssistant: 'AI Writing Assistant',
    aiWritingAssistantDesc: 'Describe how you want to enhance this slide\'s content',
    describeEnhancement: 'What would you like to add or improve? (e.g., \'Add more detailed statistics about market growth\')',
    enhancing: 'Enhancing...',
    // Game Setup
    gameSetup: {
      title: 'הגדרת משחק',
      subject: 'נושא',
      selectSubject: 'בחר נושא',
      topic: 'נושא משנה',
      selectTopic: 'בחר נושא משנה',
      difficulty: 'רמת קושי',
      questionCount: 'מספר שאלות',
      aiGeneration: 'יצירה באמצעות בינה מלאכותית',
      enterContext: 'הזן הקשר',
      generateQuestions: 'צור שאלות',
      howToPlay: 'איך משחקים',
      leaderboard: 'לו׭ة المتصدرين',
      difficultyLevels: {
        easy: 'سهل',
        medium: 'متوسط',
        hard: 'صعب'
      }
    },
    game: {
      selectGameMode: 'בחר מצב משחק',
      playing: 'משחק',
      results: 'תוצאות',
      score: 'ניקוד',
      time: 'זמן',
      playAgain: 'שחק שוב',
      backToDashboard: 'חזרה ללוח הבקרה',
      gameResults: 'נتائج המשחק',
      timeTaken: 'זמן שנלקח',
      correctAnswers: 'תשובות נכונות',
      wrongAnswers: 'תשובות שגויות',
      questionsGenerated: 'השאלות נוצרו בהצלחה!',
      errorGeneratingQuestions: 'שגיאה ביצירת שאלות',
      raisedHand: 'הרים את היד',
      isAnswering: 'עונה',
      typeStudentAnswer: 'הקלד את תשובת התלמיד',
      correct: 'נכון',
      incorrect: 'לא נכון',
      previous: 'הקודם',
      next: 'הבא',
      tutorialStep1: 'בחר מצב משחק להתחלה',
      tutorialStep2: 'ענה על שאלות לצבירת נקודות',
      tutorialStep3: 'أكمل جميع الأسئلة لرؤية نتائجك',
      gotIt: 'فهمت!',
      enterStudentName: 'أدخل اسم الطالب',
      addStudent: 'إضافة طالب',
      raiseHand: 'ارفع يدك',
      question: 'سؤال',
      generating: 'جاري الإنشاء...'
    },
    
    gameTypes: {
      quizBattle: 'معركة الاختبار',
      quizBattleDesc: 'تنافس في مسابقات الاختبارات في الوقت الفعلي مع دعم اللعب الجماعي التفاعلي',
      quizBattleTag1: '⚡ سريع الوتيرة',
      quizBattleTag2: '👥 متعدد اللاعبين',
      
      flashcardMemory: 'ذاكرة البطاقات',
      flashcardMemoryDesc: 'اختبر الذاكرة والتذكر مع تمارين البطاقات التفاعلية',
      flashcardMemoryTag1: '🧠 الذاكرة',
      flashcardMemoryTag2: '🎯 التركيز',
      
      fillBlanks: 'ملء الفراغات',
      fillBlanksDesc: 'أكمل الجمل والفقرات بالكلمات المفقودة',
      fillBlanksTag1: '📝 الكتابة',
      fillBlanksTag2: '✍️ إبداعي',
      
      matching: 'لعبة المطابقة',
      matchingDesc: 'طابق بين أزواج المفاهيم والمصطلحات أو الصور المرتبطة',
      matchingTag1: '🔄 المطابقة',
      matchingTag2: '🤝 الإقران',
      
      simulation: 'محاكاة تفاعلية',
      simulationDesc: 'تعلم من خلال المحاكاة التفاعلية والتجارب الافتراضية',
      simulationTag1: '🎮 تفاعلي',
      simulationTag2: '🎲 ديناميكي',

      timeline: 'لعبة الخط الزمني',
      timelineDesc: 'رتب الأحداث التاريخية بالترتيب الزمني لاختبار فهمك للتسلسل التاريخي.',
      timelineArrangeInOrder: 'رتب الأحداث بالترتيب الزمني',
      timelineCheckOrder: 'تحقق من الترتيب',
      timelineResetGame: 'إعادة اللعبة',
      timelineMoves: 'الحركات',
      timelineScore: 'النتيجة',
      timelineTimeLeft: 'الوقت المتبقي',
      timelineGameOver: 'انتهت اللعبة',
      timelineFinalScore: 'النتيجة النهائية',
      timelinePlayAgain: 'العب مرة أخرى',
      timelineCorrect: 'ترتيب صحيح!',
      timelineIncorrect: 'حاول مرة أخرى',

      chemicalMixing: 'خلط المواد الكيميائية',
      chemicalMixingDesc: 'اخلط المواد الكيميائية وراقب التفاعلات في بيئة مختبر افتراضية.',
      circuitConnection: 'توصيل الدوائر',
      circuitConnectionDesc: 'قم ببناء واختبار الدوائر الكهربائية لفهم الإلكترونيات.',
      ballDrop: 'إسقاط الكرة',
      ballDropDesc: 'تعلم مفاهيم الفيزياء من خلال تجارب إسقاط الكرة التفاعلية.',
      sequence: 'لعبة التسلسل',
      sequenceDesc: 'ضع الخطوات أو الأحداث في الترتيب الصحيح.'
    },

    errors: {
      invalidGameType: 'نوع اللعبة المحدد غير صالح',
      gameLoadError: 'خطأ في تحميل مكون اللعبة',
      unexpectedError: 'حدث خطأ غير متوقع'
    },

    actionss: {
      backToSelection: 'العودة إلى اختيار اللعبة',
      tryAgain: 'حاول مرة أخرى',
      continue: 'استمر',
      restart: 'إعادة التشغيل'
    },
    timelinee: {
      arrangeInOrder: 'رتب الأحداث بالترتيب الزمني',
      checkOrder: 'تحقق من الترتيب',
      resetGame: 'إعادة اللعبة',
      moves: 'الحركات',
      score: 'النتيجة',
      timeLeft: 'الوقت المتبقي',
      gameOver: 'انتهت اللعبة',
      finalScore: 'النتيجة النهائية',
      playAgain: 'العب مرة أخرى',
      correct: 'ترتيب صحيح!',
      incorrect: 'حاول مرة أخرى',
    }
  }
};

export { translations };

// Update the translation function to handle nested objects
const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // At the top of the LanguageProvider function, add:
  const languages: Language[] = ['en', 'ar', 'he'];

  // And update the useState initialization:
  const [language, setLanguageState] = useState<Language>(() => {
    // Initialize from localStorage if available, otherwise default to 'en'
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('language');
      return (savedLang === 'en' || savedLang === 'ar' || savedLang === 'he') ? savedLang as Language : 'en';
    }
    return 'en';
  });

  // Update setLanguage to trigger re-render
  const setLanguage = useCallback((lang: Language) => {
    if (languages.includes(lang)) {
      setLanguageState(lang);
      localStorage.setItem('language', lang);
      
      // Set RTL direction for Arabic and Hebrew
      const isRtl = lang === 'ar' || lang === 'he';
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
      
      // Apply RTL class for styling
      if (isRtl) {
        document.documentElement.classList.add('rtl');
      } else {
        document.documentElement.classList.remove('rtl');
      }
    }
  }, [languages]);

  // Update useEffect to apply RTL changes when language changes
  useEffect(() => {
    // Set document direction based on language
    const isRtl = language === 'ar' || language === 'he';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    
    // Also set html lang attribute for accessibility
    document.documentElement.lang = language;
  }, [language]);

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
