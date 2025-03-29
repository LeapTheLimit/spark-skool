import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

// Add rate limiting utilities
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(fn: () => Promise<T>, retries = 3, backoff = 3000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries === 0 || !error?.error?.code?.includes('rate_limit')) {
      throw error;
    }
    
    // Get wait time from error or use backoff
    const waitTime = error?.error?.message?.match(/try again in (\d+\.?\d*)s/)?.[1] * 1000 || backoff;
    console.log(`Rate limited, waiting ${waitTime}ms before retry...`);
    await delay(waitTime);
    return withRetry(fn, retries - 1, backoff * 1.5);
  }
}

export interface Question {
  id: number;
  type: 'multiple_choice' | 'short_answer' | 'true_false' | 'essay' | 'matching' | 'advanced';
  question: string;
  answer: string;
  reasoning?: string;
  explanation?: string;
  options?: string[];
  points: number;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  matchingItems?: { left: string; right: string }[];
  imageUrl?: string;
  formula?: string;
  hasLargeText?: boolean;
}

interface GenerateExamOptions {
  language: string;
  subject: string;
  grade: string;
  questionTypes: string[];
  difficulty: string[];
}

export async function generateExamFromText(
  content: string, 
  options: GenerateExamOptions
): Promise<Question[]> {
  try {
    const prompt = `
      As an expert ${options.subject} teacher, create exam questions from the following content:
      "${content}"
      
      Requirements:
      - Language: ${options.language}
      - Subject: ${options.subject}
      - Grade Level: ${options.grade}
      - Question Types: ${options.questionTypes.join(', ')}
      - Difficulty Levels: ${options.difficulty.join(', ')}
      
      Generate a well-structured exam with appropriate questions. For each question:
      - Include clear question text
      - Provide the correct answer
      - Add an explanation where helpful
      - For multiple choice, include 4 options
      - Assign appropriate difficulty level
      - Set reasonable point values
      
      Format the response as a JSON array of questions with this structure:
      {
        id: number,
        type: "multiple_choice" | "short_answer" | "true_false" | "essay",
        question: string,
        answer: string,
        explanation?: string,
        options?: string[],
        points: number,
        difficulty: "easy" | "medium" | "hard"
      }
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert teacher and exam creator. Create high-quality exam questions based on provided content and requirements.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 4096,
      top_p: 1,
      stream: false,
      stop: null
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI');
    }

    // Extract the JSON array from the response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not find JSON array in response');
    }

    const questions: Question[] = JSON.parse(jsonMatch[0]);

    // Validate and clean up the questions
    return questions.map((q, index) => ({
      ...q,
      id: index + 1,
      points: q.points || 10,
      type: validateQuestionType(q.type),
      difficulty: validateDifficulty(q.difficulty),
      options: q.type === 'multiple_choice' ? (q.options || []) : undefined
    }));

  } catch (error) {
    console.error('Error generating exam:', error);
    throw new Error('Failed to generate exam questions');
  }
}

// Helper functions
function validateQuestionType(type?: string): "multiple_choice" | "short_answer" | "true_false" | "essay" {
  if (!type) return "short_answer";
  
  // Normalize the input by converting to lowercase and replacing hyphens/spaces with underscores
  const normalizedType = type.toLowerCase().replace(/[-\s]/g, '_');
  
  if (normalizedType === "multiple_choice" || normalizedType === "multiplechoice") {
    return "multiple_choice";
  } else if (normalizedType === "true_false" || normalizedType === "truefalse") {
    return "true_false";
  } else if (normalizedType === "essay") {
    return "essay";
  } else {
    return "short_answer";
  }
}

function validateDifficulty(difficulty?: string): Question['difficulty'] {
  if (!difficulty) return 'medium'; // Default difficulty if none provided
  const validDifficulties = ['easy', 'medium', 'hard'];
  return validDifficulties.includes(difficulty) ? difficulty as Question['difficulty'] : 'medium';
}

export interface GradingResult {
  questionId: number;
  score: number;
  answer: string;
  reasoning: string;
  feedback: string;
  isCorrect: boolean;
  confidence: number;
}

export const extractQuestionsFromText = async (text: string, context?: string | null): Promise<Question[]> => {
  try {
    if (!process.env.NEXT_PUBLIC_GROQ_API_KEY) {
      throw new Error('Groq API key is not configured');
    }

    const fullText = text?.trim() || '';
    if (!fullText) {
      return [];
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are an expert at analyzing exam questions and providing precise answers.
For each question:
1. Identify the specific part of the text that contains the answer
2. Extract ONLY the relevant information needed to answer the question
3. Provide a clear, concise answer
4. Include paragraph reference (e.g., "paragraph I") if mentioned in the question

Return a JSON array of questions with this structure:
{
  "id": number,
  "type": "multiple choice/short answer/etc",
  "question": "the question text",
  "answer": "precise answer from the text",
  "explanation": "brief explanation with reference to specific text",
  "points": 10,
  "isAnswered": true,
  "context": "only the specific sentence/part relevant to this question"
}`
        },
        {
          role: "user",
          content: `Text to analyze:\n\n${fullText}`
        }
      ],
      temperature: 0.1,
    });

    const content = completion.choices[0]?.message?.content?.trim() || '[]';
    
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const questions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

      return questions.map((q: any, index: number) => ({
        id: q.id || index + 1,
        type: q.type || 'short answer',
        question: q.question,
        answer: q.answer || '',
        explanation: q.explanation || '',
        points: q.points || 10,
        isAnswered: true,
        context: q.context || null
      })).filter((q: Question) => q.question && q.question.trim() !== '');

    } catch (parseError: unknown) {
      console.error('Parse error:', parseError);
      throw new Error(`Failed to parse Groq response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Groq API error:', error);
    throw error;
  }
};

export async function gradeStudentSubmission(questions: Question[], submissionText: string): Promise<GradingResult[]> {
  try {
    const results: GradingResult[] = [];
    
    for (const question of questions) {
      if (!question.question || !question.answer) {
        console.error('Invalid question or answer:', question);
        continue;
      }

      const prompt = `
You are an expert teacher grading an exam answer. Grade the following student answer against the correct answer.

Question: ${question.question}
Correct Answer: ${question.answer}
Student Submission: ${submissionText}
Question Type: ${question.type || 'short_answer'}
Points: ${question.points || 10}

For multiple-choice questions:
1. Look for circled, marked, or written letters (A, B, C, D)
2. Look for marked symbols (X, ✓, •) next to options
3. Look for written full answers matching the options
4. Consider partial matches if the intent is clear

For short answer questions:
1. Compare key concepts and main points
2. Consider alternative correct phrasings
3. Award partial credit for partially correct answers
4. Check for mathematical accuracy in calculations

Format your response EXACTLY as follows:
SCORE: [number between 0-100]
ANSWER: [extracted student answer, 'None' if no answer found]
REASONING: [detailed explanation of grading]
FEEDBACK: [constructive feedback for improvement]
CONFIDENCE: [number between 0-100 indicating grading confidence]
`;

      const completion = await withRetry(() => groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an expert teacher grading exam answers. Be thorough and fair in your assessment. Look for answers throughout the entire submission text, not just exact matches. Consider context and alternative phrasings.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 1000,
        stream: false
      }));

      const response = completion.choices[0]?.message?.content || '';
      
      // Extract sections using regex with improved patterns
      const scoreMatch = response.match(/SCORE:\s*(\d+)/);
      const answerMatch = response.match(/ANSWER:\s*([^\n]+)/);
      const reasoningMatch = response.match(/REASONING:\s*([^\n]+(?:\n(?!FEEDBACK:|CONFIDENCE:)[^\n]+)*)/);
      const feedbackMatch = response.match(/FEEDBACK:\s*([^\n]+(?:\n(?!CONFIDENCE:)[^\n]+)*)/);
      const confidenceMatch = response.match(/CONFIDENCE:\s*(\d+)/);

      const score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1]))) : 0;
      const answer = answerMatch ? answerMatch[1].trim() : 'No answer found';
      const reasoning = reasoningMatch ? reasoningMatch[1].trim() : '';
      const feedback = feedbackMatch ? feedbackMatch[1].trim() : '';
      const confidence = confidenceMatch ? Math.min(100, Math.max(0, parseInt(confidenceMatch[1]))) : 0;

      // For multiple-choice questions, try to extract the selected option
      let extractedAnswer = answer;
      if (question.type === 'multiple_choice' && answer !== 'No answer found') {
        const optionMatch = answer.match(/[A-Da-d]/);
        if (optionMatch) {
          extractedAnswer = optionMatch[0].toUpperCase();
        }
      }

      results.push({
        questionId: question.id,
        score,
        answer: extractedAnswer,
        reasoning,
        feedback,
        isCorrect: score >= 80,
        confidence: confidence / 100
      });
    }

    return results;
  } catch (error) {
    console.error('Error grading submission:', error);
    throw error;
  }
}

function extractRelevantAnswer(submissionText: string, question: Question): string {
  // Simple extraction for now - could be enhanced with more sophisticated matching
  const questionIndex = submissionText.indexOf(question.question);
  if (questionIndex === -1) return submissionText;
  
  const nextQuestionIndex = submissionText.indexOf('Question', questionIndex + question.question.length);
  
  if (nextQuestionIndex === -1) {
    return submissionText.slice(questionIndex + question.question.length).trim();
  }
  
  return submissionText.slice(questionIndex + question.question.length, nextQuestionIndex).trim();
}

export const analyzeExamContext = async (text: string): Promise<string> => {
  return withRetry(() => 
    groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "Analyze the exam text and provide a brief context summary. Focus on subject area, difficulty level, and key topics covered."
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.1
    }).then(completion => completion.choices[0]?.message?.content || '')
  );
};

export const generateFeedback = async (question: Question, studentAnswer: string): Promise<string> => {
  return withRetry(() => 
    groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "Generate constructive feedback for the student's answer. Explain what was correct and what could be improved."
        },
        {
          role: "user",
          content: `Question: ${question.question}\nCorrect Answer: ${question.answer}\nStudent Answer: ${studentAnswer}`
        }
      ],
      temperature: 0.7
    }).then(completion => completion.choices[0]?.message?.content || '')
  );
};

export const suggestImprovement = async (question: Question, studentAnswer: string): Promise<string> => {
  return withRetry(() => 
    groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "Suggest specific ways the student can improve their answer. Provide study tips and resources if relevant."
        },
        {
          role: "user",
          content: `Question: ${question.question}\nStudent Answer: ${studentAnswer}\nExpected Answer: ${question.answer}`
        }
      ],
      temperature: 0.7
    }).then(completion => completion.choices[0]?.message?.content || '')
  );
}; 

export default function notImplemented() {
  throw new Error('Function not implemented.');
}

export const extractQuestionsWithGroq = async (text: string): Promise<Question[]> => {
  try {
    const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    if (!groqApiKey) {
      throw new Error("Groq API key not found");
    }
    
    const groq = new Groq({
      apiKey: groqApiKey,
      dangerouslyAllowBrowser: true
    });

    const prompt = `
You are an AI specialized in extracting and analyzing exam questions.
CRITICAL: Provide clear, structured answers with reasoning.

Given this text, extract ALL questions with these requirements:
1. Include the COMPLETE question text - never truncate
2. Preserve ALL parts of multi-line questions
3. Keep ALL context and formatting
4. For multi-part questions, include ALL parts
5. Extract any provided answers
6. Identify question type accurately
7. Provide clear reasoning for each answer

Text to analyze:
${text}

Return ONLY a JSON array:
{
  "questions": [
    {
      "id": number,
      "question": "COMPLETE question text with ALL parts",
      "type": "multiple_choice|short_answer|true_false|essay",
      "answer": "Clear, concise answer statement",
      "reasoning": "Detailed step-by-step explanation",
      "points": number,
      "options": ["A", "B", "C", "D"] // for multiple choice only
    }
  ]
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert at extracting and analyzing exam questions. Provide clear answers with detailed reasoning.' 
        },
        { role: 'user', content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 4000,
      top_p: 1,
      stop: null
    });

    const response = completion.choices[0]?.message?.content || '';
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    let questions = parsedResponse.questions || [];

    // Generate answers for questions without them
    const questionsWithoutAnswers = questions.filter((q: { answer: string; }) => !q.answer || q.answer.trim() === '');
    
    if (questionsWithoutAnswers.length > 0) {
      const answers = await generateAnswersForQuestions(questionsWithoutAnswers);
      
      // Merge answers back into questions
      questions = questions.map((q: { answer: string; id: any; }) => {
        if (!q.answer || q.answer.trim() === '') {
          const answer = answers.find(a => a.id === q.id);
          return { 
            ...q, 
            answer: answer?.answer || 'Answer pending...',
            reasoning: answer?.reasoning || 'Reasoning pending...'
          };
        }
        return q;
      });
    }

    return questions;

  } catch (error) {
    console.error('Error in question extraction:', error);
    throw error;
  }
};

// Improve answer generation with reasoning
async function generateAnswersForQuestions(questions: Question[]): Promise<any[]> {
  const prompt = `
Generate comprehensive answers with clear reasoning for these questions:

${questions.map(q => `
Question ${q.id}: ${q.question}
Type: ${q.type}
${q.options ? `Options:\n${q.options.join('\n')}` : ''}`).join('\n\n')}

Requirements:
1. Start with a clear, concise answer statement
2. Follow with detailed step-by-step reasoning
3. Address all parts of each question
4. Use academic language
5. For multiple choice, explain why the chosen option is correct
6. For essay questions, provide structured responses

Return a JSON array:
{
  "answers": [
    {
      "id": question_number,
      "answer": "Clear, concise answer statement",
      "reasoning": "Detailed step-by-step explanation"
    }
  ]
}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert educator providing clear answers with detailed reasoning.' 
        },
        { role: 'user', content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 4000,
      top_p: 1,
      stop: null
    });

    const response = completion.choices[0]?.message?.content || '';
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.answers || [];
    }
    
    return [];
  } catch (error) {
    console.error('Error generating answers:', error);
    return questions.map(q => ({
      id: q.id,
      answer: 'Error generating answer. Please try again.',
      reasoning: 'Error generating reasoning. Please try again.'
    }));
  }
}

