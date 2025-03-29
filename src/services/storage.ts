import { Question } from './groq';

const ANSWER_KEYS_STORAGE_KEY = 'spark_skool_answer_keys';

interface AnswerKeyData {
  questions: Question[];
  examContext: string;
  timestamp: string;
  metadata: {
    questionCount: number;
    types: string[];
  };
}

export async function saveAnswerKey(data: AnswerKeyData): Promise<void> {
  try {
    // Get existing answer keys
    const existingKeys = await getStoredAnswerKeys();
    
    // Add new answer key
    existingKeys.push({
      id: Date.now().toString(),
      ...data
    });
    
    // Save back to storage
    localStorage.setItem(ANSWER_KEYS_STORAGE_KEY, JSON.stringify(existingKeys));
  } catch (error) {
    console.error('Error saving answer key:', error);
    throw new Error('Failed to save answer key');
  }
}

export async function getAnswerKey(id: string): Promise<AnswerKeyData | null> {
  try {
    const keys = await getStoredAnswerKeys();
    const key = keys.find(k => k.id === id);
    return key || null;
  } catch (error) {
    console.error('Error getting answer key:', error);
    return null;
  }
}

export async function getAllAnswerKeys(): Promise<(AnswerKeyData & { id: string })[]> {
  return getStoredAnswerKeys();
}

export async function deleteAnswerKey(id: string): Promise<void> {
  try {
    let keys = await getStoredAnswerKeys();
    keys = keys.filter(k => k.id !== id);
    localStorage.setItem(ANSWER_KEYS_STORAGE_KEY, JSON.stringify(keys));
  } catch (error) {
    console.error('Error deleting answer key:', error);
    throw new Error('Failed to delete answer key');
  }
}

async function getStoredAnswerKeys(): Promise<(AnswerKeyData & { id: string })[]> {
  try {
    const stored = localStorage.getItem(ANSWER_KEYS_STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    
    return parsed;
  } catch (error) {
    console.error('Error reading stored answer keys:', error);
    return [];
  }
} 