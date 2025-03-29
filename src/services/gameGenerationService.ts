import Groq from 'groq-sdk';

interface GameQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  points: number;
  timeLimit: number;
  imageUrl?: string;
  explanation?: string;
}

interface GenerationOptions {
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  count: number;
  context?: string;
  language?: string;
  includeImages?: boolean;
}

// Initialize Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// External APIs for question generation
const QUIZ_APIS = {
  OPEN_TRIVIA_DB: 'https://opentdb.com/api.php',
  QUIZ_API: 'https://quizapi.io/api/v1/questions',
  NUMBERSAPI: 'http://numbersapi.com',
  WOLFRAM_ALPHA: 'https://api.wolframalpha.com/v1/result',
};

export async function generateQuestions(options: GenerationOptions): Promise<GameQuestion[]> {
  const questions: GameQuestion[] = [];
  const apis = [
    generateWithGroqLlama,
    generateWithQuizAPI,
    generateWithOpenTriviaDB
  ];

  // Try different APIs in parallel
  const results = await Promise.allSettled(
    apis.map(api => api(options))
  );

  // Collect successful results
  results.forEach(result => {
    if (result.status === 'fulfilled' && result.value) {
      questions.push(...result.value);
    }
  });

  // If we don't have enough questions, generate more using Llama
  if (questions.length < options.count) {
    const remaining = options.count - questions.length;
    const llamaQuestions = await generateWithGroqLlama({
      ...options,
      count: remaining
    });
    questions.push(...llamaQuestions);
  }

  // Ensure we have the right number of questions
  return questions.slice(0, options.count);
}

async function generateWithGroqLlama(options: GenerationOptions): Promise<GameQuestion[]> {
  try {
    const prompt = `Generate ${options.count} multiple-choice questions about ${options.subject} - ${options.topic}.
Difficulty level: ${options.difficulty}
Additional context: ${options.context || 'None'}

Format each question as a JSON object with:
- question (string)
- options (array of 4 strings)
- correctAnswer (string, must match one of the options)
- explanation (string)
- points (number)
- timeLimit (number in seconds)

Make the questions engaging, educational, and appropriate for the difficulty level.
Ensure all questions are factually accurate and well-formatted.
Return the questions as a JSON array.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama2-70b-4096',
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      stop: null,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) return [];

    // Extract JSON array from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const questions = JSON.parse(jsonMatch[0]);
    return questions.map((q: any, index: number) => ({
      id: index + 1,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      points: q.points || 100,
      timeLimit: q.timeLimit || (
        options.difficulty === 'easy' ? 30 :
        options.difficulty === 'medium' ? 20 : 15
      )
    }));
  } catch (error) {
    console.error('Error generating questions with Groq Llama:', error);
    return [];
  }
}

async function generateWithQuizAPI(options: GenerationOptions): Promise<GameQuestion[]> {
  try {
    const response = await fetch(`${QUIZ_APIS.QUIZ_API}?apiKey=${process.env.QUIZ_API_KEY}&limit=${options.count}&difficulty=${options.difficulty}`);
    const data = await response.json();

    return data.map((q: any, index: number) => ({
      id: index + 1,
      question: q.question,
      options: Object.values(q.answers).filter(Boolean),
      correctAnswer: Object.entries(q.correct_answers)
        .find(([key, value]) => value === 'true')?.[0]
        .replace('_correct', ''),
      explanation: q.explanation || '',
      points: 100,
      timeLimit: options.difficulty === 'easy' ? 30 : options.difficulty === 'medium' ? 20 : 15
    }));
  } catch (error) {
    console.error('Error generating questions with QuizAPI:', error);
    return [];
  }
}

async function generateWithOpenTriviaDB(options: GenerationOptions): Promise<GameQuestion[]> {
  try {
    const difficulty = options.difficulty === 'medium' ? 'medium' : options.difficulty === 'hard' ? 'hard' : 'easy';
    const response = await fetch(`${QUIZ_APIS.OPEN_TRIVIA_DB}?amount=${options.count}&difficulty=${difficulty}&type=multiple`);
    const data = await response.json();

    return data.results.map((q: any, index: number) => ({
      id: index + 1,
      question: q.question,
      options: [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5),
      correctAnswer: q.correct_answer,
      explanation: '',
      points: 100,
      timeLimit: options.difficulty === 'easy' ? 30 : options.difficulty === 'medium' ? 20 : 15
    }));
  } catch (error) {
    console.error('Error generating questions with Open Trivia DB:', error);
    return [];
  }
} 