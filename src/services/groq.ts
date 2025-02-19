import Groq from 'groq-sdk';

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
  type: string;
  question: string;
  answer: string;
  explanation?: string;
  points?: number;
  isAnswered: boolean;
  context?: string | null;
  referenceText?: string | null;
}

export interface GradingResult {
  questionId: number;
  score: number;
  feedback: string;
  isCorrect: boolean;
  confidence: number;
  partialCredit?: number;
  matchType?: string;
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
      model: "llama-3.3-70b-versatile",
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

export const gradeStudentSubmission = async (answerKey: Question[], studentText: string): Promise<GradingResult[]> => {
  try {
    // Strict check for empty or meaningless submissions
    if (!studentText?.trim() || studentText.trim().length < 10) {
      return answerKey.map(question => ({
        questionId: question.id,
        score: 0,
        feedback: "No answer provided - received blank or invalid submission",
        isCorrect: false,
        confidence: 1,
        partialCredit: 0,
        matchType: 'none'
      }));
    }

    // Extract student answers with retry logic
    const extractionResponse = await withRetry(() => 
      groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are a very strict exam grader. Your task is to extract ONLY clearly stated answers from the student submission.

STRICT RULES:
1. If you cannot find an explicit answer to a question, mark it as "NO_ANSWER"
2. Do not infer or guess answers from context
3. Do not give partial credit for vague responses
4. Only extract text that directly answers the question
5. Mark any unclear or ambiguous responses as "NO_ANSWER"

Return a JSON array in this exact format:
[{
  "questionNumber": 1,
  "studentAnswer": "EXACT answer text found, or 'NO_ANSWER' if no clear answer exists",
  "workingShown": "EXACT calculations/work shown, or 'NONE' if no work found",
  "confidence": 0-1 (how confident you are this is the actual answer)
}]`
          },
          {
            role: "user",
            content: `Questions to grade:
${answerKey.map(q => `${q.id}. ${q.question}`).join('\n')}

Student's submission:
${studentText}`
          }
        ],
        temperature: 0.1
      })
    );

    let studentAnswers;
    try {
      const content = extractionResponse.choices[0]?.message?.content?.trim() || '[]';
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      studentAnswers = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      console.log('Parsed student answers:', studentAnswers);
    } catch (parseError) {
      console.error('Failed to parse student answers:', parseError);
      studentAnswers = [];
    }

    // Grade each answer with retry logic
    const gradingResults = await Promise.all(answerKey.map(async (question) => {
      const studentAnswer = studentAnswers.find((a: any) => a.questionNumber === question.id);
      
      if (!studentAnswer || 
          studentAnswer.studentAnswer === 'NO_ANSWER' || 
          studentAnswer.confidence < 0.8) {
        return {
          questionId: question.id,
          score: 0,
          feedback: "No valid answer provided for this question",
          isCorrect: false,
          confidence: 1,
          partialCredit: 0,
          matchType: 'none'
        };
      }

      const gradingResponse = await withRetry(() =>
        groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are a strict exam grader. Grade according to these STRICT rules:

1. ZERO SCORE if:
   - Answer is blank or irrelevant
   - Answer is completely wrong
   - Answer lacks required explanation/working
   - Answer is too vague or general

2. PARTIAL CREDIT (1-49%):
   - Shows some understanding but major errors
   - Missing crucial elements
   - Incorrect methodology but right direction

3. PASSING GRADE (50-79%):
   - Mostly correct but with minor errors
   - All main points covered but lacking detail
   - Correct methodology with small mistakes

4. FULL CREDIT (80-100%):
   - Completely correct answer
   - Clear explanation/working shown
   - Demonstrates full understanding

Return ONLY a JSON object:
{
  "score": 0-100,
  "feedback": "detailed explanation of grade",
  "isCorrect": boolean,
  "confidence": 0-1,
  "partialCredit": 0-100,
  "matchType": "none|partial|exact"
}`
            },
            {
              role: "user",
              content: `Question: ${question.question}
Correct Answer: ${question.answer}
Student Answer: ${studentAnswer.studentAnswer}
Working Shown: ${studentAnswer.workingShown}
Question Type: ${question.type}`
            }
          ],
          temperature: 0.1
        })
      );

      try {
        const content = gradingResponse.choices[0]?.message?.content?.trim() || '{}';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const grading = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        
        // Additional validation of grades
        const score = Math.min(100, Math.max(0, grading.score || 0));
        const partialCredit = Math.min(100, Math.max(0, grading.partialCredit || 0));
        
        return {
          questionId: question.id,
          score: score,
          feedback: grading.feedback || "Unable to grade answer",
          isCorrect: score >= 80, // Only mark as correct if score is 80% or higher
          confidence: grading.confidence || 1,
          partialCredit: partialCredit,
          matchType: grading.matchType || 'none'
        };
      } catch (parseError) {
        console.error('Failed to parse grading result:', parseError);
        return {
          questionId: question.id,
          score: 0,
          feedback: "Error grading answer",
          isCorrect: false,
          confidence: 1,
          partialCredit: 0,
          matchType: 'error'
        };
      }
    }));

    return gradingResults;
  } catch (error) {
    console.error('Error grading submission:', error);
    throw error;
  }
};

export const analyzeExamContext = async (text: string): Promise<string> => {
  return withRetry(() => 
    groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
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
      model: "llama-3.3-70b-versatile",
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
      model: "llama-3.3-70b-versatile",
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