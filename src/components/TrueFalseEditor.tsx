'use client';

import { useState } from 'react';
import { 
  QuestionData, 
  TrueFalseFormat, 
  detectTrueFalseFormat 
} from '@/services/imageProcessingService';

interface TrueFalseEditorProps {
  question: QuestionData;
  onSave: (updatedQuestion: QuestionData) => void;
}

export default function TrueFalseEditor({ question, onSave }: TrueFalseEditorProps) {
  const [editedQuestion, setEditedQuestion] = useState(question);
  const [format, setFormat] = useState<TrueFalseFormat>(
    question.format || {
      type: 'checkbox',
      trueValue: question.language === 'ara' ? 'صح' : 'True',
      falseValue: question.language === 'ara' ? 'خطأ' : 'False'
    }
  );

  const formatTypes = [
    { id: 'checkbox', label: '[ ]', example: '[ ] True/False' },
    { id: 'circle', label: '○', example: '○ True/False' },
    { id: 'parentheses', label: '()', example: '(T)/(F)' },
    { id: 'symbol', label: '✓/×', example: '✓ or ×' },
    { id: 'arabic', label: 'صح/خطأ', example: 'Arabic Format' },
    { id: 'hebrew', label: 'נכון/לא נכון', example: 'Hebrew Format' }
  ];

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg shadow">
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium text-gray-700">Question Text</label>
        <textarea
          value={editedQuestion.text}
          onChange={(e) => setEditedQuestion({ ...editedQuestion, text: e.target.value })}
          className="p-2 border rounded-lg"
          dir={question.language === 'ara' || question.language === 'heb' ? 'rtl' : 'ltr'}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Format Type</label>
          <select
            value={format.type}
            onChange={(e) => {
              const newFormat = detectTrueFalseFormat(
                formatTypes.find(f => f.id === e.target.value)?.example || '',
                question.language
              );
              if (newFormat) {
                setFormat(newFormat);
                setEditedQuestion({ ...editedQuestion, format: newFormat });
              }
            }}
            className="w-full p-2 border rounded-lg"
          >
            {formatTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Points</label>
          <input
            type="number"
            value={editedQuestion.points || 0}
            onChange={(e) => setEditedQuestion({ 
              ...editedQuestion, 
              points: parseInt(e.target.value) 
            })}
            className="w-full p-2 border rounded-lg"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700">Correct Answer:</label>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              checked={editedQuestion.correctAnswer === 'true'}
              onChange={() => setEditedQuestion({ 
                ...editedQuestion, 
                correctAnswer: 'true' 
              })}
            />
            <span>{format.trueValue}</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              checked={editedQuestion.correctAnswer === 'false'}
              onChange={() => setEditedQuestion({ 
                ...editedQuestion, 
                correctAnswer: 'false' 
              })}
            />
            <span>{format.falseValue}</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <button
          onClick={() => onSave(editedQuestion)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
} 