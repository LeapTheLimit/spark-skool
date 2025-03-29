import { Question } from './groq';
import { MATERIALS_STORAGE_KEY } from '@/lib/constants';

export interface SavedAnswerKey {
  questions: Question[];
  examContext?: string | null;
}

export async function saveAnswerKey(answerKey: SavedAnswerKey): Promise<void> {
  try {
    console.log('Saving answer key:', answerKey);
    
    if (!answerKey.questions || answerKey.questions.length === 0) {
      throw new Error('No questions to save');
    }
    
    // Generate a better title from the exam context or questions
    let title = 'Answer Key';
    if (answerKey.examContext && answerKey.examContext.trim()) {
      title = answerKey.examContext.trim();
    } else if (answerKey.questions[0]?.question) {
      // Use the first question as part of the title if no context
      const firstQuestion = answerKey.questions[0].question;
      title = `Exam: ${firstQuestion.substring(0, 30)}${firstQuestion.length > 30 ? '...' : ''}`;
    }
    
    // Add timestamp to make the title unique
    const dateStr = new Date().toLocaleDateString();
    title = `${title} (${dateStr})`;
    
    // Format the content in a more readable way
    const formattedContent = {
      title,
      questions: answerKey.questions.map(q => ({
        id: q.id,
        type: q.type || 'short answer',
        question: q.question,
        answer: q.answer,
        explanation: q.explanation,
        points: q.points || 10,
      })),
      examContext: answerKey.examContext,
      createdAt: new Date().toISOString(),
      metadata: {
        questionCount: answerKey.questions.length,
        types: [...new Set(answerKey.questions.map(q => q.type || 'short answer'))],
      }
    };
    
    // Add timestamp and ID
    const keyToSave = {
      id: `answer-key-${Date.now()}`,
      title,
      content: JSON.stringify(formattedContent),
      category: 'quiz',
      createdAt: new Date().toISOString()
    };

    // Get existing materials
    const stored = localStorage.getItem(MATERIALS_STORAGE_KEY) || '[]';
    let materials;
    
    try {
      materials = JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing stored materials:', e);
      materials = [];
    }
    
    if (!Array.isArray(materials)) {
      materials = [];
    }
    
    // Add new material at the beginning
    materials.unshift(keyToSave);
    
    // Save back to localStorage
    localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(materials));
    
    // Trigger update event
    try {
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.warn('Could not dispatch storage event:', e);
    }
    
    console.log('Answer key saved successfully, material ID:', keyToSave.id);
    return Promise.resolve();
  } catch (error) {
    console.error('Error saving answer key:', error);
    return Promise.reject(error);
  }
}

export async function getAnswerKey(): Promise<SavedAnswerKey | null> {
  try {
    const stored = localStorage.getItem(MATERIALS_STORAGE_KEY);
    if (!stored) return null;
    
    const materials = JSON.parse(stored);
    const answerKeys = materials.filter((m: any) => m.category === 'quiz');
    
    if (answerKeys.length === 0) return null;
    
    // Get the most recent answer key
    const latest = answerKeys[0];
    const content = JSON.parse(latest.content);
    
    return {
      questions: content.questions,
      examContext: content.examContext
    };
  } catch (error) {
    console.error('Error getting answer key:', error);
    return null;
  }
}

export function extractQuestions(text: string) {
  // Implement question extraction logic
  return {
    questions: [],
    metadata: {
      examType: 'unknown',
      subject: 'unknown',
      questionCount: 0
    }
  };
} 