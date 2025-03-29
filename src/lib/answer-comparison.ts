import { Groq } from 'groq-sdk';
import stringSimilarity from 'string-similarity';

const groqClient = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || '',
});

// Models available through Groq
const MODEL = "llama3-2-70b-versatile"; // Alternatives: "deepseek-r1-instruct", "mixtral-8x7b-32768"

export async function compareAnswers(
  studentAnswer: string, 
  correctAnswer: string, 
  questionType: string
): Promise<{
  score: number;
  feedback: string;
  isCorrect: boolean;
  confidence: number;
  matchType: string;
}> {
  // If student didn't provide an answer
  if (!studentAnswer) {
    return {
      score: 0,
      feedback: "No answer was provided.",
      isCorrect: false,
      confidence: 1.0,
      matchType: "no-answer"
    };
  }
  
  // For multiple choice and true/false questions, use direct comparison
  if (questionType === 'multiple-choice' || questionType === 'true-false') {
    // Normalize both answers for comparison (remove punctuation, case-insensitive)
    const normalizedStudent = normalizeAnswer(studentAnswer);
    const normalizedCorrect = normalizeAnswer(correctAnswer);
    
    // Check if the answers are identical or very similar
    const similarity = stringSimilarity.compareTwoStrings(
      normalizedStudent, 
      normalizedCorrect
    );
    
    if (similarity > 0.8) {
      return {
        score: 100,
        feedback: "Correct! Your answer matches the expected response.",
        isCorrect: true,
        confidence: similarity,
        matchType: "exact"
      };
    } else if (similarity > 0.5) {
      // Partial match
      return {
        score: Math.round(similarity * 70),
        feedback: "Partially correct. Your answer contains some elements of the correct response.",
        isCorrect: false,
        confidence: similarity,
        matchType: "partial"
      };
    } else {
      return {
        score: 0,
        feedback: `Incorrect. The correct answer is: ${correctAnswer}`,
        isCorrect: false,
        confidence: 1 - similarity,
        matchType: "incorrect"
      };
    }
  }
  
  // For short answer questions, use AI to evaluate
  if (questionType === 'short-answer') {
    return await evaluateShortAnswer(
      studentAnswer, 
      correctAnswer
    );
  }
  
  // For essay questions, use AI to do a more comprehensive evaluation
  if (questionType === 'essay') {
    return await evaluateEssayAnswer(
      studentAnswer, 
      correctAnswer
    );
  }
  
  // Default handling for any other question type
  return await evaluateWithAI(
    studentAnswer, 
    correctAnswer,
    questionType
  );
}

function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function evaluateShortAnswer(
  studentAnswer: string,
  correctAnswer: string
): Promise<{
  score: number;
  feedback: string;
  isCorrect: boolean;
  confidence: number;
  matchType: string;
}> {
  try {
    const prompt = `
      Grade the following student's answer to a short answer question:
      
      Question answer key: "${correctAnswer}"
      Student's answer: "${studentAnswer}"
      
      Score the answer from 0-100 based on accuracy and completeness.
      Provide constructive feedback.
      Indicate if the answer is correct (80+ points), partially correct (40-79 points), or incorrect (0-39 points).
      Rate your confidence in this assessment from 0.0 to 1.0.
      Specify the match type as one of: "exact", "semantic", "partial", or "incorrect".
      
      Respond in JSON format with the following fields:
      {
        "score": <number>,
        "feedback": "<feedback>",
        "isCorrect": <boolean>,
        "confidence": <number>,
        "matchType": "<match_type>"
      }
    `;
    
    const completion = await groqClient.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are an AI grading assistant with expertise in evaluating student answers." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    
    return {
      score: result.score || 0,
      feedback: result.feedback || "Unable to evaluate answer.",
      isCorrect: result.isCorrect || false,
      confidence: result.confidence || 0.5,
      matchType: result.matchType || "incorrect"
    };
  } catch (error) {
    console.error('Error evaluating short answer:', error);
    
    // Fallback to simpler evaluation if AI fails
    const similarity = stringSimilarity.compareTwoStrings(
      normalizeAnswer(studentAnswer), 
      normalizeAnswer(correctAnswer)
    );
    
    const score = Math.round(similarity * 100);
    
    return {
      score,
      feedback: "Your answer was evaluated using text similarity.",
      isCorrect: score >= 80,
      confidence: 0.5,
      matchType: score >= 80 ? "semantic" : score >= 40 ? "partial" : "incorrect"
    };
  }
}

async function evaluateEssayAnswer(
  studentAnswer: string,
  correctAnswer: string
): Promise<{
  score: number;
  feedback: string;
  isCorrect: boolean;
  confidence: number;
  matchType: string;
}> {
  try {
    const prompt = `
      Grade the following student's essay answer:
      
      Expected key points: "${correctAnswer}"
      Student's answer: "${studentAnswer}"
      
      Evaluate the essay on the following criteria:
      1. Content (50%): Inclusion of key points and accuracy
      2. Organization (20%): Logical flow and structure
      3. Evidence (20%): Support for arguments
      4. Language (10%): Grammar and clarity
      
      Score the answer from 0-100.
      Provide detailed, constructive feedback.
      Rate your confidence in this assessment from 0.0 to 1.0.
      
      Respond in JSON format with the following fields:
      {
        "score": <number>,
        "feedback": "<feedback>",
        "isCorrect": <boolean>,
        "confidence": <number>,
        "matchType": "essay"
      }
    `;
    
    const completion = await groqClient.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are an AI grading assistant with expertise in evaluating essay answers." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    
    return {
      score: result.score || 0,
      feedback: result.feedback || "Unable to evaluate essay.",
      isCorrect: result.score >= 80,
      confidence: result.confidence || 0.5,
      matchType: "essay"
    };
  } catch (error) {
    console.error('Error evaluating essay answer:', error);
    
    // Basic fallback for essay evaluation
    return {
      score: 50, // Default middle score
      feedback: "Your essay was received but could not be fully evaluated.",
      isCorrect: false,
      confidence: 0.3,
      matchType: "essay"
    };
  }
}

async function evaluateWithAI(
  studentAnswer: string,
  correctAnswer: string,
  questionType: string
): Promise<{
  score: number;
  feedback: string;
  isCorrect: boolean;
  confidence: number;
  matchType: string;
}> {
  try {
    const prompt = `
      Grade the following student's answer:
      
      Question type: ${questionType}
      Expected answer: "${correctAnswer}"
      Student's answer: "${studentAnswer}"
      
      Score the answer from 0-100.
      Provide constructive feedback.
      Indicate if the answer is correct (score >= 80).
      Rate your confidence in this assessment from 0.0 to 1.0.
      Specify the match type as one of: "exact", "semantic", "partial", or "incorrect".
      
      Respond in JSON format with the following fields:
      {
        "score": <number>,
        "feedback": "<feedback>",
        "isCorrect": <boolean>,
        "confidence": <number>,
        "matchType": "<match_type>"
      }
    `;
    
    const completion = await groqClient.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are an AI grading assistant that objectively evaluates student answers." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    
    return {
      score: result.score || 0,
      feedback: result.feedback || "Unable to evaluate answer.",
      isCorrect: result.isCorrect || false,
      confidence: result.confidence || 0.5,
      matchType: result.matchType || "incorrect"
    };
  } catch (error) {
    console.error('Error evaluating with AI:', error);
    
    // Simple fallback
    return {
      score: 0,
      feedback: "Your answer could not be evaluated at this time.",
      isCorrect: false,
      confidence: 0.1,
      matchType: "incorrect"
    };
  }
} 