export interface GradingResult {
  questionId: string | number;
  score: number;
  feedback: string;
  isCorrect: boolean;
  confidence: number;
  partialCredit?: number;
  matchType: 'exact' | 'semantic' | 'partial' | 'none';
}

export interface StudentSubmission {
  id: string;
  studentName: string;
  file: File;
  timestamp: Date;
  status: 'pending' | 'processing' | 'graded' | 'error';
  score?: number;
  totalScore?: number;
  grades?: GradingResult[];
  extractedText?: string;
} 