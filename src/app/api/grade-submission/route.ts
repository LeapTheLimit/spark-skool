import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { extractedText, questions, examContext } = body;
    
    // Verify required data
    if (!extractedText || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'Missing required data: text content or questions' }, 
        { status: 400 }
      );
    }
    
    console.log(`Grading student submission with ${questions.length} questions`);
    
    // Check if Groq API is configured
    const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'AI grading service is not configured properly. Contact administrator.' }, 
        { status: 500 }
      );
    }
    
    // Initialize Groq client
    const groq = new Groq({
      apiKey: groqApiKey,
      dangerouslyAllowBrowser: false
    });
    
    // Process each question
    const gradePromises = questions.map(async (question, index) => {
      try {
        // Create a prompt for the AI to grade this question
        const prompt = `
You are grading a student's answer to an exam question. Be fair and objective.

EXAM CONTEXT: ${examContext || 'Not provided'}

QUESTION (${question.type}): ${question.question}

CORRECT ANSWER: ${question.answer}

STUDENT'S SUBMISSION:
${extractedText}

Please analyze this submission carefully to find the student's answer to this specific question.
Rate the answer on a scale of 0-100 based on accuracy and completeness.
Provide specific feedback on what was correct and what could be improved.

Return ONLY a JSON object in this format (nothing else):
{
  "score": 0-100,
  "feedback": "detailed feedback on the answer",
  "isCorrect": boolean,
  "confidence": 0-1,
  "matchType": "none | partial | exact"
}
`;

        // Call Groq API for grading
        const completion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: "You are an expert tutor who grades exam answers fairly and accurately." },
            { role: "user", content: prompt }
          ],
          model: "llama-3.1-8b-instant", // Use a faster model for grading
          temperature: 0.1, // Low temperature for consistent results
          max_tokens: 1000
        });
        
        const response = completion.choices[0]?.message?.content?.trim() || '{}';
        
        // Extract JSON result
        let gradeResult;
        try {
          // Find the JSON object in the response
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            gradeResult = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No valid JSON found in response');
          }
        } catch (parseError) {
          console.error('Error parsing AI response:', parseError, response);
          gradeResult = {
            score: 0,
            feedback: "Error processing this answer. Please check manually.",
            isCorrect: false,
            confidence: 0.5,
            matchType: "error"
          };
        }
        
        return {
          questionId: question.id,
          ...gradeResult
        };
      } catch (error) {
        console.error(`Error grading question ${index + 1}:`, error);
        return {
          questionId: question.id,
          score: 0,
          feedback: "Error grading this question. Technical issue encountered.",
          isCorrect: false,
          confidence: 0,
          matchType: "error"
        };
      }
    });
    
    // Collect all grading results
    const results = await Promise.all(gradePromises);
    
    return NextResponse.json({ results });
  } catch (error: unknown) {
    console.error('Error in grading submission:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to grade submission: ${errorMessage}` }, 
      { status: 500 }
    );
  }
} 