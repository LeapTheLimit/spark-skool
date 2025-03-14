// Define all valid routes in your application
const routes = {
  dashboard: '/dashboard/teacher',
  schedule: '/dashboard/teacher/schedule',
  chat: '/dashboard/teacher/chat',
  students: '/dashboard/teacher/students',
  lessons: '/dashboard/teacher/lessons',
  materials: '/dashboard/teacher/materials',
  settings: '/dashboard/teacher/settings',
  tools: {
    examGame: {
      base: '/dashboard/teacher/tools/exam-game',
      quizShow: '/dashboard/teacher/tools/exam-game/quiz-show',
      wordScramble: '/dashboard/teacher/tools/exam-game/word-scramble',
      wordSearch: '/dashboard/teacher/tools/exam-game/word-search',
      timeline: '/dashboard/teacher/tools/exam-game/timeline',
      pptxExport: '/dashboard/teacher/tools/exam-game/pptx-export'
    }
  }
};

export default routes; 