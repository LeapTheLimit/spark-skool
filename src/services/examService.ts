import { Question } from './groq';

interface SavedAnswerKey {
  questions: Question[];
  context?: string | null;
  metadata?: {
    createdAt: string;
    updatedAt: string;
    teacherId: string;
  };
}

export const saveAnswerKey = async (data: SavedAnswerKey): Promise<void> => {
  try {
    // In a real app, this would save to a database
    localStorage.setItem('answerKey', JSON.stringify(data));
  } catch (error) {
    console.error('Error saving answer key:', error);
    throw error;
  }
};

export const getAnswerKey = async (): Promise<SavedAnswerKey | null> => {
  try {
    const saved = localStorage.getItem('answerKey');
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Error getting answer key:', error);
    throw error;
  }
}; 