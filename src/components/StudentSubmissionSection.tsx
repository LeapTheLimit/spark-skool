import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Question } from '@/services/groq';
import { PDFDownloadButton } from './PDFDownloadButton';
import { CSVExport } from './CSVExport';

interface Props {
  questions: Question[];
  onSubmissionProcess: (files: File[]) => Promise<void>;
  submissions: Array<{
    id: string;
    studentName: string;
    file: File | null;
    status: 'pending' | 'processing' | 'graded' | 'error';
    grades?: Array<{
      questionId: number;
      score: number;
      feedback: string;
      isCorrect: boolean;
      confidence: number;
      partialCredit?: number;
      matchType?: string;
    }>;
    totalScore?: number;
  }>;
  onSubmissionSelect: (id: string) => void;
}

export const StudentSubmissionSection: React.FC<Props> = ({
  questions,
  onSubmissionProcess,
  submissions,
  onSubmissionSelect
}) => {
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: onSubmissionProcess,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    multiple: true
  });

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900">Student Submissions</h2>
        <p className="text-sm text-gray-500">Upload student exams for AI grading</p>
      </div>

      <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-xl p-8 mb-6">
        <input {...getInputProps()} />
        <div className="text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-gray-500">Drag & drop student submissions, or click to select files</p>
          <p className="text-sm text-gray-400 mt-1">Supports PDF and images</p>
        </div>
      </div>

      {submissions.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Processed Submissions ({submissions.length})</h3>
            <div className="space-x-2">
              <PDFDownloadButton data={submissions} />
              <CSVExport data={submissions} />
            </div>
          </div>

          <div className="grid gap-4">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                onClick={() => onSubmissionSelect(submission.id)}
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{submission.studentName}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        submission.status === 'graded' ? 'bg-green-100 text-green-800' :
                        submission.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        submission.status === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {submission.status}
                      </span>
                      {submission.grades && (
                        <span className="text-sm text-gray-500">
                          {submission.grades.filter(g => g.isCorrect).length}/{submission.grades.length} correct
                        </span>
                      )}
                    </div>
                  </div>
                  {submission.totalScore !== undefined && (
                    <div className="text-lg font-medium">
                      {submission.totalScore.toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 