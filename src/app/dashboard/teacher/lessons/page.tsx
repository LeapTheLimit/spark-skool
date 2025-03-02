'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function LessonsPage() {
  const { language, t } = useLanguage();
  const isRTL = language === 'ar' || language === 'he';

  const lessonCards = [
    {
      title: t('physicsForces'),
      status: t('inProgress'),
      progress: 68,
      dueDate: t('dueDate', { date: 'Sep 15, 2024' }),
      students: 24,
      color: 'bg-blue-600'
    },
    {
      title: t('chemistryLab'),
      status: t('completed'),
      progress: 100,
      dueDate: t('dueDate', { date: 'Sep 12, 2024' }),
      students: 22,
      color: 'bg-green-600'
    },
    // Add more lesson cards
  ];

  return (
    <div className={`flex h-full gap-6 p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{t('lessons')}</h1>
            <p className="text-gray-500">{t('createAndManageLessons')}</p>
          </div>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            {t('newLesson')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessonCards.map((lesson, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200/50 hover:shadow-md transition-all">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-2 h-2 ${lesson.color} rounded-full`} />
                  <span className="text-sm text-gray-500">{lesson.dueDate}</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{lesson.title}</h3>
                <div className="flex items-center justify-between text-sm text-gray-700">
                  <span>{lesson.students} Students</span>
                  <span className={`${
                    lesson.status === 'Completed' ? 'text-green-600' : 'text-blue-600'
                  }`}>{lesson.status}</span>
                </div>
              </div>
              <div className="h-1 w-full bg-gray-100">
                <div 
                  className={`h-full ${lesson.status === 'Completed' ? 'bg-green-600' : 'bg-blue-600'}`}
                  style={{ width: `${lesson.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-80 flex flex-col">
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-4">{t('quickActions')}</h2>
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
              {t('importLessonPlan')}
            </button>
            <button className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
              {t('generateWithAI')}
            </button>
            <button className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
              {t('lessonTemplates')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 