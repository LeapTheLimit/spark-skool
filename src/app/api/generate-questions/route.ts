import { NextResponse } from 'next/server';
import { generateExamFromText } from '@/services/groq';

export async function POST(request: Request) {
  try {
    const { subject, difficulty, count, topic, context } = await request.json();

    // Generate questions using Groq
    const questions = await generateExamFromText(
      context || `Generate ${count} ${difficulty} difficulty questions about ${topic} in ${subject}`,
      {
        language: 'en',
        subject,
        grade: 'any',
        questionTypes: ['multiple_choice', 'true_false', 'short_answer'],
        difficulty: [difficulty]
      }
    );

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error generating questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
} 