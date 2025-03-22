import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

interface SubjectSelectorProps {
  subjects: string[];
  onChange: (subjects: string[]) => void;
  defaultSubjects?: string[];
}

export default function SubjectSelector({ subjects, onChange, defaultSubjects = [] }: SubjectSelectorProps) {
  const { t } = useLanguage();
  const [newSubject, setNewSubject] = useState('');
  
  const handleAddSubject = () => {
    if (!newSubject.trim()) return;
    if (!subjects.includes(newSubject.trim())) {
      const updated = [...subjects, newSubject.trim()];
      onChange(updated);
    }
    setNewSubject('');
  };
  
  const handleRemoveSubject = (subject: string) => {
    const updated = subjects.filter(s => s !== subject);
    onChange(updated);
  };
  
  const handleSelectDefault = (subject: string) => {
    if (!subjects.includes(subject)) {
      const updated = [...subjects, subject];
      onChange(updated);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label htmlFor="newSubject" className="block text-sm font-medium text-gray-700 mb-1">
            {t('enterSubject')}
          </label>
          <input
            id="newSubject"
            type="text"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t('enterSubject')}
          />
        </div>
        <button
          onClick={handleAddSubject}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
        >
          <PlusIcon className="w-4 h-4" />
          {t('addSubject')}
        </button>
      </div>
      
      {/* Default subject buttons */}
      <div className="flex flex-wrap gap-2">
        {defaultSubjects.map(subject => (
          <button
            key={subject}
            onClick={() => handleSelectDefault(subject)}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              subjects.includes(subject)
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {subject}
          </button>
        ))}
      </div>
      
      {/* Selected subjects */}
      {subjects.length > 0 && (
        <div className="mt-3">
          <div className="text-sm font-medium text-gray-700 mb-2">{t('selectedSubjects')}</div>
          <div className="flex flex-wrap gap-2">
            {subjects.map(subject => (
              <div 
                key={subject}
                className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm flex items-center gap-1"
              >
                {subject}
                <button 
                  onClick={() => handleRemoveSubject(subject)}
                  className="p-0.5 hover:bg-blue-200 rounded-full"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 