import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      console.error('GROQ_API_KEY is not defined');
      return NextResponse.json({ 
        status: 'error', 
        message: 'API key is not configured' 
      }, { status: 500 });
    }

    // Initialize Groq client
    const groq = new Groq({ apiKey });
    
    // Parse request body
    const body = await req.json();
    const { prompt, settings = {} } = body;

    if (!prompt) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Prompt is required' 
      }, { status: 400 });
    }

    // Create a structured prompt with all settings
    const formattedPrompt = `
Create a detailed presentation outline on the following topic:

${prompt}

Settings:
- Number of slides: ${settings?.pages || '15'}
- Detail level: ${settings?.wordAmount || 'Regular'}
- Target audience: ${settings?.audience || 'General'}
- Presentation style: ${settings?.slidesForm || 'Creative'}
- Include internet research: ${settings?.isOnline ? 'Yes' : 'No'}

Format your response as a structured JSON with:
1. A creative, engaging title for the presentation
2. Exactly ${settings?.pages || '15'} slides, each with:
   - A unique title for each slide
   - 3-5 bullet points of content for each slide
   - A flag indicating if the slide should use bullet points

Return ONLY a JSON object with this structure:
{
  "title": "Creative Presentation Title",
  "sections": [
    {
      "id": 1,
      "title": "Introduction to Topic",
      "subtopics": ["Point 1", "Point 2", "Point 3"],
      "isBulletPoint": true
    },
    // more slides...
  ]
}`;

    // Make API call to Groq
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert at creating educational presentations. Generate a well-structured, comprehensive presentation outline based on the topic and settings provided."
        },
        {
          role: "user",
          content: formattedPrompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_tokens: 4000,
    });

    const text = completion.choices[0]?.message?.content || '';
    
    // Try to parse the JSON response
    try {
      // Extract JSON from the response if it contains other text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const content = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      
      if (!content || !content.title || !content.sections) {
        throw new Error('Invalid response format');
      }
      
      return NextResponse.json({
        status: 'success',
        content
      });
    } catch (parseError) {
      console.error('Failed to parse API response:', parseError);
      return NextResponse.json({
        status: 'success',
        content: {
          title: 'Generated Presentation',
          sections: generateBasicOutline(prompt, settings?.pages || 15)
        }
      });
    }
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Failed to generate content' 
    }, { status: 500 });
  }
}

// Simple fallback generator in case API call fails
function generateBasicOutline(prompt: string, numSlides: number) {
  const sections = [];
  
  // Add introduction
  sections.push({
    id: 1,
    title: 'Introduction',
    subtopics: ['Overview of the topic', 'Key objectives', 'Why this matters'],
    isBulletPoint: true
  });
  
  // Add content slides
  for (let i = 2; i < numSlides; i++) {
    sections.push({
      id: i,
      title: `Main Point ${i-1}`,
      subtopics: ['Key concept', 'Supporting details', 'Examples or applications'],
      isBulletPoint: i % 2 === 0
    });
  }
  
  // Add conclusion
  sections.push({
    id: numSlides,
    title: 'Conclusion',
    subtopics: ['Summary of key points', 'Final thoughts', 'Next steps'],
    isBulletPoint: true
  });
  
  return sections;
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
} 