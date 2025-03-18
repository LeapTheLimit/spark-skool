import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' }, 
        { status: 400 }
      );
    }
    
    // Use Unsplash as a fallback for now, but this could be replaced with:
    // 1. OpenAI DALL-E API
    // 2. Stability AI API
    // 3. Any other image generation service
    
    // For a realistic implementation, uncomment and modify one of these examples:
    
    /*
    // Example using OpenAI DALL-E API
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not defined');
    }
    
    const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'url'
      })
    });
    
    const openaiData = await openaiResponse.json();
    
    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiData.error?.message || 'Unknown error'}`);
    }
    
    return NextResponse.json({
      success: true,
      imageUrl: openaiData.data[0].url
    });
    */
    
    // Wait for 2 seconds to simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For now, use Unsplash as a fallback
    return NextResponse.json({
      success: true,
      imageUrl: `https://source.unsplash.com/random/1024x768/?${encodeURIComponent(prompt)}`
    });
    
  } catch (error) {
    console.error('Error generating AI image:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' }, 
      { status: 500 }
    );
  }
} 