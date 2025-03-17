import React from 'react';
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
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-medium">Grading Details</h2>
            <p className="text-sm text-gray-500">{submission.studentName}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>

        <div className="space-y-6">
          {submission.grades?.map((grade) => {
            const question = questions.find(q => q.id === grade.questionId);
            return (
              <div key={grade.questionId} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Question {grade.questionId}</h4>
                    <p className="text-sm text-gray-600">{question?.question}</p>
                    <div className="mt-2 space-y-2">
                      <p className="text-sm"><span className="font-medium">Correct Answer:</span> {question?.answer}</p>
                      <p className="text-sm"><span className="font-medium">Match Type:</span> {grade.matchType}</p>
                      <p className="text-sm"><span className="font-medium">Confidence:</span> {(grade.confidence * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="ml-4">
                    <input
                      type="number"
                      value={grade.score}
                      onChange={(e) => onGradeAdjust(grade.questionId, Number(e.target.value))}
                      className="w-20 p-2 border rounded text-right"
                      min="0"
                      max="100"
                    />
                    <p className="text-xs text-gray-500 mt-1 text-center">Score</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-white rounded border border-gray-200">
                  <p className="text-sm text-gray-600">{grade.feedback}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 