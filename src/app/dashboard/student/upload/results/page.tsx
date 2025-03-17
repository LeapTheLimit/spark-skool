'use client';

import { useEffect, useState } from 'react';

interface GradeResult {
  questionId: number;
  score: number;
  feedback: string;
  isCorrect: boolean;
}

export default function ResultsPage() {
  const [results, setResults] = useState<GradeResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading results
    setTimeout(() => {
      setResults([
        {
          questionId: 1,
          score: 85,
          feedback: "Good answer, but could be more detailed",
          isCorrect: true
        },
        // Add more mock results as needed
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Loading results...</span>
      </div>
    );
  }

  const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Grading Results</h1>
          
          <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
            <p className="text-lg font-medium text-indigo-900">
              Overall Score: {averageScore.toFixed(1)}%
            </p>
          </div>

          <div className="space-y-4">
            {results.map((result) => (
              <div
                key={result.questionId}
                className={`p-4 rounded-lg border ${
                  result.isCorrect 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Question {result.questionId}</span>
                  <span 
                    className={`px-2 py-1 rounded-full text-sm font-medium ${
                      result.score >= 70 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {result.score}%
                  </span>
                </div>
                <p className="text-gray-600">{result.feedback}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 