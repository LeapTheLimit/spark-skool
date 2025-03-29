import { Groq } from 'groq-sdk';

const groqClient = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || '',
});

interface Question {
  id: number | string;
  question: string;
  answer: string;
  type: string;
  explanation?: string;
  options?: string[];
}

export async function extractQuestionsFromText(text: string): Promise<Question[]> {
  try {
    // Create a timeout promise
    const timeoutPromise = new Promise<Question[]>((_, reject) => {
      setTimeout(() => reject(new Error("Question extraction timed out")), 30000);
    });
    
    // Create a fallback promise that uses the basic extraction
    const fallbackPromise = new Promise<Question[]>(resolve => {
      setTimeout(() => {
        console.log("Using fallback question extraction");
        resolve(createBasicQuestions(text));
      }, 25000); // Try fallback after 25 seconds
    });
    
    // First, use regex to identify potential question patterns
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const questions: Question[] = [];
    const potentialQuestions = [];
    
    // Identify potential question starts with regex patterns
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check for common question patterns
      if (
        line.match(/^(Q|Question)(\s*\d+)?[\s:.]+/i) || 
        line.match(/^\d+[\s).)]+/) ||
        line.match(/^[\[(]?\s*\d+\s*[\])]?[\s.]/) ||
        line.endsWith('?')
      ) {
        potentialQuestions.push({ 
          index: i, 
          line, 
          questionText: line.replace(/^(Q|Question)(\s*\d+)?[\s:.]+/i, '').trim() 
        });
      }
    }
    
    // If we couldn't identify any questions with regex, use AI to segment the document
    if (potentialQuestions.length === 0) {
      return await extractQuestionsWithAI(text);
    }
    
    // Process each potential question
    for (let i = 0; i < potentialQuestions.length; i++) {
      const question = potentialQuestions[i];
      const nextQuestionIndex = i < potentialQuestions.length - 1 
        ? potentialQuestions[i+1].index 
        : lines.length;
      
      // Analyze content between this question and the next
      const questionContent = lines.slice(question.index, nextQuestionIndex).join('\n');
      
      // Use Groq API to identify question type, answer, and options
      const { questionType, answer, explanation, options } = await analyzeQuestionContent(
        questionContent
      );
      
      questions.push({
        id: i + 1,
        question: question.questionText,
        answer,
        type: questionType,
        explanation,
        options: options.length > 0 ? options : undefined
      });
    }
    
    // Race between AI extraction, fallback, and timeout
    return await Promise.race([
      Promise.resolve(questions),
      fallbackPromise,
      timeoutPromise
    ]);
  } catch (error) {
    console.error('Error extracting questions:', error);
    // Return basic questions if AI extraction fails
    return createBasicQuestions(text);
  }
}

async function extractQuestionsWithAI(text: string): Promise<Question[]> {
  try {
    const prompt = `
      Extract exam questions from the following text:
      
      ${text}
      
      For each question, identify the following:
      1. Question text
      2. Question type (multiple-choice, short-answer, true-false, essay)
      3. Correct answer
      4. Explanation (if available)
      5. Options (for multiple-choice questions)
      
      Respond in JSON format with an array of questions:
      {
        "questions": [
          {
            "id": 1,
            "question": "Question text",
            "type": "question_type",
            "answer": "correct_answer",
            "explanation": "explanation_text",
            "options": ["option1", "option2"] // only for multiple-choice
          },
          // more questions...
        ]
      }
    `;
    
    const completion = await groqClient.chat.completions.create({
      model: "llama3-2-70b-versatile",
      messages: [
        { role: "system", content: "You are an expert at identifying and extracting exam questions from documents." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return result.questions || [];
  } catch (error) {
    console.error('Error extracting questions with AI:', error);
    return [];
  }
}

async function analyzeQuestionContent(content: string): Promise<{
  questionType: string;
  answer: string;
  explanation: string;
  options: string[];
}> {
  try {
    // First, try to extract with regex patterns
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    let answer = '';
    let explanation = '';
    const options: string[] = [];
    
    // Look for answer markers using regex
    for (const line of lines) {
      if (line.match(/^(A|Answer)[\s:.]+/i) || 
          line.match(/^(Answer key|Correct answer)[\s:.]+/i)) {
        answer = line.replace(/^(A|Answer|Answer key|Correct answer)[\s:.]+/i, '').trim();
      }
      else if (line.match(/^([A-D][.)]\s+)/)) {
        // This looks like a multiple choice option
        options.push(line.replace(/^[A-D][.)]\s+/, '').trim());
      }
      else if (line.match(/^(Explanation|Note|Reason)[\s:.]+/i)) {
        explanation = line.replace(/^(Explanation|Note|Reason)[\s:.]+/i, '').trim();
      }
    }
    
    // Determine question type
    let questionType = 'short-answer'; // Default
    
    if (options.length >= 2) {
      questionType = 'multiple-choice';
    } else if (answer.match(/^(true|false|yes|no)$/i)) {
      questionType = 'true-false';
    } else if (content.length > 300 && !answer) {
      questionType = 'essay';
    }
    
    // If regex extraction wasn't successful, use AI
    if (!answer && questionType !== 'essay') {
      return await analyzeQuestionWithAI(content);
    }
    
    return {
      questionType,
      answer,
      explanation,
      options
    };
  } catch (error) {
    console.error('Error analyzing question content:', error);
    return {
      questionType: 'short-answer',
      answer: '',
      explanation: '',
      options: []
    };
  }
}

async function analyzeQuestionWithAI(content: string): Promise<{
  questionType: string;
  answer: string;
  explanation: string;
  options: string[];
}> {
  try {
    const prompt = `
      Analyze the following exam question content:
      
      ${content}
      
      Identify the following components:
      1. Question type (multiple-choice, short-answer, true-false, essay)
      2. The correct answer
      3. Any explanation provided
      4. Options for multiple-choice questions (if applicable)
      
      Return the results in JSON format:
      {
        "questionType": "type_here",
        "answer": "answer_text_here",
        "explanation": "explanation_text_here",
        "options": ["option1", "option2"] // If multiple-choice
      }
    `;
    
    const completion = await groqClient.chat.completions.create({
      model: "llama3-2-70b-versatile",
      messages: [
        { role: "system", content: "You are an expert at analyzing and extracting components from exam questions." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    
    return {
      questionType: result.questionType || 'short-answer',
      answer: result.answer || '',
      explanation: result.explanation || '',
      options: result.options || []
    };
  } catch (error) {
    console.error('Error analyzing question with AI:', error);
    return {
      questionType: 'short-answer',
      answer: '',
      explanation: '',
      options: []
    };
  }
}

// Add this function to create basic questions if AI extraction is stuck
export function createBasicQuestions(text: string): Question[] {
  const questions: Question[] = [];
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  let currentId = 1;
  
  // Look for question patterns
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Simple regex to find potential questions
    if (
      line.endsWith('?') || 
      line.match(/^(\d+|[A-Z]|Q|Question)[\s.):]\s+\w+/) ||
      (line.length > 10 && i < lines.length - 1) // Potential question with answer on next line
    ) {
      // This looks like a question
      const questionText = line;
      let answerText = '';
      
      // Try to find answer in next lines
      if (i < lines.length - 1) {
        answerText = lines[i + 1].trim();
      }
      
      // Determine question type
      let questionType = 'short-answer';
      const options: string[] = [];
      
      // Check for multiple choice options in subsequent lines
      let j = i + 1;
      while (j < lines.length && j < i + 5) {
        const optLine = lines[j].trim();
        if (optLine.match(/^[A-D][.)]\s+\w+/)) {
          options.push(optLine.replace(/^[A-D][.)]\s+/, ''));
          questionType = 'multiple-choice';
        }
        j++;
      }
      
      questions.push({
        id: currentId++,
        question: questionText,
        answer: answerText,
        type: questionType,
        ...(options.length > 0 ? { options } : {})
      });
    }
  }
  
  return questions;
} 