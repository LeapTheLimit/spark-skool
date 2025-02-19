'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { extractTextFromImage } from '@/services/ocr';
import { extractTextFromPDF } from '@/services/pdfExtractor';
import { extractQuestionsFromText, gradeStudentSubmission, type Question } from '@/services/groq';
import { useRouter } from 'next/navigation';
import { saveAnswerKey, getAnswerKey } from '@/services/examService';
import { PDFDownloadButton } from '@/components/PDFDownloadButton';
import { CSVExport } from '@/components/CSVExport';

interface GradingResult {
  questionId: number;
  score: number;
  feedback: string;
  isCorrect: boolean;
  confidence: number;
  partialCredit?: number;
  matchType?: string;
  teacherAdjusted?: boolean;
}

export default function ToolsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState<'answerKey' | 'submissions' | 'grades'>('answerKey');
  const [grades, setGrades] = useState<Array<{
    questionId: number;
    score: number;
    feedback: string;
    isCorrect: boolean;
  }>>([]);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'info'
  });

  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const [processingStage, setProcessingStage] = useState<{
    stage: 'initializing' | 'analyzing' | 'extracting' | 'processing' | 'formatting' | 'complete' | null;
    message: string;
    progress: number;
  }>({
    stage: null,
    message: '',
    progress: 0
  });

  const [activeSection, setActiveSection] = useState<'answerKey' | 'studentUpload'>('answerKey');
  const [examContext, setExamContext] = useState<string | null>(null);

  const [studentSubmissions, setStudentSubmissions] = useState<Array<{
    id: string;
    studentName: string;
    file: File | null;
    status: 'pending' | 'processing' | 'graded' | 'error';
    grades?: GradingResult[];
    totalScore?: number;
  }>>([]);

  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [showGradingDashboard, setShowGradingDashboard] = useState(false);

  const processFile = async (file: File) => {
    setLoading(true);
    try {
      // Initializing stage
      setProcessingStage({
        stage: 'initializing',
        message: 'Preparing document...',
        progress: 15
      });
      await new Promise(resolve => setTimeout(resolve, 800));

      let text: string | undefined;
      
      // Extracting stage
      setProcessingStage({
        stage: 'extracting',
        message: 'Extracting text from document...',
        progress: 30
      });
      
      if (file.type.includes('image')) {
        text = await extractTextFromImage(file);
      } else if (file.type === 'application/pdf') {
        text = await extractTextFromPDF(file);
      } else {
        throw new Error('Unsupported file type');
      }

      if (!text) {
        throw new Error('No text could be extracted from the file');
      }

      console.log('Extracted text:', text); // Debug log

      // Processing stage
      setProcessingStage({
        stage: 'processing',
        message: 'Analyzing content...',
        progress: 60
      });

      const processedQuestions = await extractQuestionsFromText(text);
      
      console.log('Processed questions:', processedQuestions); // Debug log

      if (!processedQuestions || processedQuestions.length === 0) {
        throw new Error('No questions could be extracted from the text');
      }

      // Complete stage
      setProcessingStage({
        stage: 'complete',
        message: 'Processing complete!',
        progress: 100
      });

      setQuestions(processedQuestions);
      
      setNotification({
        show: true,
        message: `Successfully extracted ${processedQuestions.length} questions`,
        type: 'success'
      });

    } catch (error) {
      console.error('Error processing file:', error);
      setNotification({
        show: true,
        message: error instanceof Error ? error.message : 'Error processing file',
        type: 'error'
      });
    } finally {
      setTimeout(() => {
        setLoading(false);
        setProcessingStage({ stage: null, message: '', progress: 0 });
      }, 1000);
    }
  };

  const handleStudentSubmission = async (files: File[]) => {
    setLoading(true);
    try {
      setProcessingStage(prev => ({
        ...prev,
        stage: 'processing',
        message: 'Processing student submissions...',
        progress: 0
      }));

      const newSubmissions = await Promise.all(files.map(async (file, index) => {
        // Update progress for each file
        setProcessingStage(prev => ({
          ...prev,
          progress: (index / files.length) * 100
        }));

        const text = file.type.includes('image') 
          ? await extractTextFromImage(file)
          : await extractTextFromPDF(file);

        if (!text) {
          throw new Error(`No text could be extracted from ${file.name}`);
        }

        console.log('Extracted text from student submission:', text);

        const studentId = `STU-${Math.random().toString(36).substr(2, 9)}`;
        const submission = {
          id: studentId,
          studentName: file.name.replace(/\.[^/.]+$/, ""),
          file,
          status: 'processing' as const,
        };

        // Grade the submission
        const grades = await gradeStudentSubmission(questions, text);
        console.log('Grades for submission:', grades);

        const totalScore = grades.reduce((sum, grade) => sum + grade.score, 0) / grades.length;

        return {
          ...submission,
          status: 'graded' as const,
          grades,
          totalScore
        };
      }));

      setStudentSubmissions(prev => [...prev, ...newSubmissions]);
      
      // After successful processing, switch to grades tab
      if (newSubmissions.length > 0) {
        setActiveTab('grades');
      }

      setNotification({
        show: true,
        message: `Successfully processed ${newSubmissions.length} submissions`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error processing submissions:', error);
      setNotification({
        show: true,
        message: error instanceof Error ? error.message : 'Error processing submissions',
        type: 'error'
      });
    } finally {
      setLoading(false);
      setProcessingStage({
        stage: null,
        message: '',
        progress: 0
      });
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      await processFile(selectedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    multiple: false
  });

  const handleSaveQuestions = async () => {
    try {
      setLoading(true);
      await saveAnswerKey({
        questions,
        context: examContext,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          teacherId: 'teacher-1' // Replace with actual teacher ID
        }
      });
      
      setNotification({
        show: true,
        message: 'Answer key saved! You can now grade student submissions.',
        type: 'success'
      });
      
      setActiveTab('submissions');
    } catch (error) {
      setNotification({
        show: true,
        message: 'Error saving answer key',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
  };

  // Then the dropzone setup
  const { getRootProps: getStudentDropzoneProps, getInputProps: getStudentInputProps } = useDropzone({
    onDrop: handleStudentSubmission,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    multiple: true
  });

  const handleAdjustGrade = (submissionId: string, questionId: number, newScore: number) => {
    setStudentSubmissions(prev => prev.map(sub => {
      if (sub.id !== submissionId) return sub;
      
      const newGrades = sub.grades?.map(grade => {
        if (grade.questionId !== questionId) return grade;
        return {
          ...grade,
          score: newScore,
          teacherAdjusted: true
        };
      });

      const newTotalScore = newGrades?.reduce((sum, grade) => sum + grade.score, 0) || 0;
      return {
        ...sub,
        grades: newGrades,
        totalScore: newTotalScore / (newGrades?.length || 1)
      };
    }));
  };

  return (
    <div className="h-screen bg-gray-50 p-6 overflow-hidden">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* Tab Navigation */}
        <div className="flex-shrink-0 mb-8 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('answerKey')}
              className={`pb-4 px-1 ${
                activeTab === 'answerKey'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Answer Key
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`pb-4 px-1 ${
                activeTab === 'submissions'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              disabled={!questions.length}
            >
              Student Submissions
            </button>
            <button
              onClick={() => setActiveTab('grades')}
              className={`pb-4 px-1 ${
                activeTab === 'grades'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              disabled={!studentSubmissions.length}
            >
              Grades & Analysis
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Answer Key Tab */}
          {activeTab === 'answerKey' && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div
                {...getRootProps()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-500 transition-colors cursor-pointer"
              >
                <input {...getInputProps()} />
                {loading ? (
                  <div className="text-gray-500">Processing...</div>
                ) : (
                  <p className="text-gray-500">
                    Drag & drop a file here, or click to select one
                  </p>
                )}
              </div>

              {/* Processing Status */}
              {loading && processingStage.stage && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {processingStage.message}
                    </span>
                    <span className="text-sm text-gray-500">
                      {processingStage.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${processingStage.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {questions.length > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Extracted Questions ({questions.length})
                    </h3>
                    <button
                      onClick={handleSaveQuestions}
                      className="px-4 py-2 bg-indigo-600 text-black rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Questions'}
                    </button>
                  </div>
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <div
                        key={question.id}
                        className="p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-900">Question {index + 1}</span>
                        </div>
                        <p className="text-gray-900">{question.question}</p>
                        <div className="mt-2 text-sm text-gray-700">
                          <span>Expected Answer: </span>
                          <span className="font-medium">{question.answer}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Student Submissions Tab */}
          {activeTab === 'submissions' && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium">Student Submissions</h2>
                <p className="text-sm text-gray-500">Upload student exams for AI grading</p>
              </div>

              <div {...getStudentDropzoneProps()} className="border-2 border-dashed border-gray-300 rounded-xl p-8 mb-6">
                <input {...getStudentInputProps()} />
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mt-2">Drag & drop student submissions, or click to select files</p>
                  <p className="text-sm text-gray-500">Supports PDF and images</p>
                </div>
              </div>

              {/* Processing indicator */}
              {loading && (
                <div className="mb-4">
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${processingStage.progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{processingStage.message}</p>
                </div>
              )}

              {studentSubmissions.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Processed Submissions ({studentSubmissions.length})</h3>
                    <button
                      onClick={() => setActiveTab('grades')}
                      className="px-4 py-2 bg-indigo-600 text-black rounded-lg"
                    >
                      View Grades & Analysis
                    </button>
                  </div>
                  <div className="grid gap-4">
                    {studentSubmissions.map((submission) => (
                      <div 
                        key={submission.id}
                        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                        onClick={() => setSelectedSubmission(submission.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium text-gray-900">{submission.studentName}</h4>
                            <p className="text-sm text-gray-700">Status: {submission.status}</p>
                          </div>
                          {submission.totalScore !== undefined && (
                            <div className="text-lg font-medium text-gray-900">
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
          )}

          {/* Grades Tab */}
          {activeTab === 'grades' && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900">Grades & Analysis</h2>
                <p className="text-sm text-gray-700">Review and adjust grades</p>
              </div>

              <div className="space-y-8">
                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700">Average Score</h4>
                    <p className="text-2xl font-semibold text-gray-900">
                      {(studentSubmissions.reduce((sum, sub) => sum + (sub.totalScore || 0), 0) / studentSubmissions.length).toFixed(1)}%
                    </p>
                  </div>
                  {/* Add more stats */}
                </div>

                {/* Grade Distribution */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-4">Grade Distribution</h4>
                  {/* Add grade distribution visualization */}
                </div>

                {/* Student List with Grades */}
                <div className="space-y-4">
                  {studentSubmissions.map(submission => (
                    <div
                      key={submission.id}
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                      onClick={() => setSelectedSubmission(submission.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-gray-900">{submission.studentName}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              submission.totalScore && submission.totalScore >= 70 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {submission.totalScore?.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <button className="text-indigo-800 hover:text-indigo-900">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Export Options */}
                <div className="flex justify-end space-x-4">
                  <button className="text-indigo-800 hover:text-indigo-900">
                    <PDFDownloadButton data={studentSubmissions} />
                  </button>
                  <button className="text-indigo-800 hover:text-indigo-900">
                    <CSVExport data={studentSubmissions} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Dialog */}
        {editingQuestion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
              <h2 className="text-lg font-medium mb-4">Edit Question</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question
                  </label>
                  <textarea
                    value={editingQuestion.question}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      question: e.target.value
                    })}
                    className="w-full p-2 border rounded-lg"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Answer
                  </label>
                  <textarea
                    value={editingQuestion.answer}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      answer: e.target.value
                    })}
                    className="w-full p-2 border rounded-lg"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Explanation
                  </label>
                  <textarea
                    value={editingQuestion.explanation}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      explanation: e.target.value
                    })}
                    className="w-full p-2 border rounded-lg"
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setQuestions(questions.map(q =>
                      q.id === editingQuestion.id ? editingQuestion : q
                    ));
                    setEditingQuestion(null);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-black rounded-lg hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification.show && (
          <div 
            className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
              notification.type === 'success' 
                ? 'bg-green-100 text-green-800' 
                : notification.type === 'error'
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            <div className="flex items-center">
              <span>{notification.message}</span>
              <button 
                onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                className="ml-4 text-current hover:opacity-75"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Grading Dashboard Modal */}
        {selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900">
                  Grading Details
                </h2>
                <button 
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              {/* Grading Details */}
              {studentSubmissions.find(s => s.id === selectedSubmission)?.grades?.map((grade) => (
                <div key={grade.questionId} className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Question {grade.questionId}
                      </h4>
                      <p className="text-sm text-gray-800">
                        {questions.find(q => q.id === grade.questionId)?.question}
                      </p>
                    </div>
                    <input
                      type="number"
                      value={grade.score}
                      onChange={(e) => handleAdjustGrade(
                        selectedSubmission,
                        grade.questionId,
                        Number(e.target.value)
                      )}
                      className="w-20 p-2 border rounded text-gray-900"
                      min="0"
                      max="100"
                    />
                  </div>
                  <p className="text-sm text-gray-800">{grade.feedback}</p>
                  {grade.teacherAdjusted && (
                    <p className="text-xs text-indigo-600 mt-1">
                      Manually adjusted by teacher
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 