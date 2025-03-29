import React, { useState } from 'react';
import { Question } from '@/services/groq';

interface Props {
  submission: {
    id: string;
    studentName: string;
    grades?: Array<{
      questionId: number;
      score: number;
      feedback: string;
      isCorrect: boolean;
      confidence: number;
      partialCredit?: number;
      matchType?: string;
    }>;
  };
  questions: Question[];
  onClose: () => void;
  onGradeAdjust: (questionId: number, newScore: number) => void;
}

export const GradingDetailsModal: React.FC<Props> = ({
  submission,
  questions,
  onClose,
  onGradeAdjust
}) => {
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  
  const toggleQuestion = (questionId: number) => {
    if (expandedQuestion === questionId) {
      setExpandedQuestion(null);
    } else {
      setExpandedQuestion(questionId);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-medium">Grading Details</h2>
            <p className="text-sm text-gray-500">{submission.studentName}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {submission.grades?.map((grade) => {
            const question = questions.find(q => q.id === grade.questionId);
            const isExpanded = expandedQuestion === grade.questionId;
            const scoreClass = grade.score >= 80 ? 'text-green-600' : 
                               grade.score >= 60 ? 'text-blue-600' : 'text-red-600';
            
            return (
              <div key={grade.questionId} className="border rounded-lg overflow-hidden">
                <div 
                  className="p-4 bg-gray-50 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleQuestion(grade.questionId)}
                >
                  <div className="flex-1">
                    <h4 className="font-medium">Question {grade.questionId}</h4>
                    <p className="text-sm text-gray-600 line-clamp-1">{question?.question}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <span className={`text-lg font-bold ${scoreClass}`}>{grade.score}</span>
                      <p className="text-xs text-gray-500">Score</p>
                    </div>
                    <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`} 
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="p-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h5 className="text-sm font-medium mb-2">Question:</h5>
                        <p className="text-sm bg-gray-50 p-3 rounded">{question?.question}</p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium mb-2">Correct Answer:</h5>
                        <p className="text-sm bg-gray-50 p-3 rounded">{question?.answer}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center">
                        <h5 className="text-sm font-medium">Grading Metrics:</h5>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Adjust score:</span>
                          <input
                            type="number"
                            value={grade.score}
                            onChange={(e) => onGradeAdjust(grade.questionId, Number(e.target.value))}
                            className="w-20 p-2 border rounded text-right"
                            min="0"
                            max="100"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="bg-gray-50 p-2 rounded">
                          <span className="font-medium block">Match Type:</span>
                          <span>{grade.matchType || 'N/A'}</span>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <span className="font-medium block">Confidence:</span>
                          <span>{(grade.confidence * 100).toFixed(1)}%</span>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <span className="font-medium block">Status:</span>
                          <span className={grade.isCorrect ? 'text-green-600' : 'text-red-600'}>
                            {grade.isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium mb-2">AI Feedback:</h5>
                      <div className="bg-blue-50 border border-blue-100 p-3 rounded text-sm">
                        {grade.feedback}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}; 