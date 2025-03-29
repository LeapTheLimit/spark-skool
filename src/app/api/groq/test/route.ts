import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Groq API key not configured'
      });
    }
    
    try {
      const groq = new Groq({
        apiKey,
        dangerouslyAllowBrowser: true
      });
      
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a test assistant."
          },
          {
            role: "user",
            content: "Respond with the word 'SUCCESS' if you can read this message."
          }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0
      });
      
      const response = completion.choices[0]?.message?.content || '';
      
      return NextResponse.json({
        success: response.includes('SUCCESS'),
        message: response
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Groq API test failed'
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 