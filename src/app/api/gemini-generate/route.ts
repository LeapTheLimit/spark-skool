import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Set the runtime to edge for better performance
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    // Get API key from environment variable
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not defined in environment variables');
      return NextResponse.json(
        { error: 'API key is not configured' },
        { status: 500 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { prompt, model = 'gemini-2.0-flash', settings } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Initialize the Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = model === 'thinking' ? 
      'gemini-2.0-flash-thinking-exp-01-21' : 'gemini-2.0-flash';
    
    const genModel = genAI.getGenerativeModel({ model: modelName });

    // Create a structured prompt that incorporates all settings
    const formattedPrompt = `
Create a detailed presentation outline on the following topic:

${prompt}

Please follow these specific requirements:
- Number of slides: ${settings?.pages || '15'}
- Detail level: ${settings?.wordAmount || 'Regular'}
- Target audience: ${settings?.audience || 'General'}
- Presentation style: ${settings?.slidesForm || 'Creative'}
- Image requirements: ${settings?.imageSource || 'Custom'}
- Include internet research: ${settings?.isOnline ? 'Yes' : 'No'}

Format the response as a structured JSON with:
1. A clear title for the presentation
2. An array of sections, where each section has:
   - A descriptive title for each slide
   - 3-5 bullet points of content for each slide
   - Whether the slide should use bullet points or paragraph format

Please make the content highly relevant to the prompt and uploaded files mentioned.
`;

    // Generate content using Gemini
    try {
      const result = await genModel.generateContent(formattedPrompt);
      const response = await result.response;
      const text = response.text();
      
      // Try to parse as JSON first
      try {
        const jsonResponse = JSON.parse(text);
        return NextResponse.json({
          status: 'success',
          content: jsonResponse
        });
      } catch (jsonError) {
        // If not JSON, try to extract structured data
        const outline = extractOutlineFromText(text, prompt);
        return NextResponse.json({
          status: 'success',
          content: outline
        });
      }
    } catch (genError) {
      console.error('Gemini API error:', genError);
      return NextResponse.json(
        { error: 'Failed to generate content with AI' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Function to extract outline structure from text response
function extractOutlineFromText(text: string, originalPrompt: string) {
  // Title extraction
  let title = "";
  const titleMatch = text.match(/Title:?\s*(.*?)(?:\n|$)/i) || 
                    text.match(/Topic:?\s*(.*?)(?:\n|$)/i) ||
                    text.match(/^#\s*(.*?)(?:\n|$)/m);
  
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].trim();
  } else {
    // Use beginning of prompt as fallback title
    const words = originalPrompt.split(' ');
    title = words.slice(0, 5).join(' ') + (words.length > 5 ? '...' : '');
  }
  
  // Section extraction
  const sections = [];
  
  // Look for Markdown-style headers for slides
  const slideMatches = text.match(/##\s*(.*?)(?=##|$)/gs);
  
  if (slideMatches && slideMatches.length > 0) {
    slideMatches.forEach((slideText, index) => {
      const slideLines = slideText.split('\n').filter(line => line.trim());
      const slideTitle = slideLines[0].replace(/##\s*/, '').trim();
      const subtopics = [];
      
      // Find bullet points (lines starting with -, *, or •)
      for (let i = 1; i < slideLines.length; i++) {
        const line = slideLines[i].trim();
        if (line.match(/^[-*•]\s*/)) {
          subtopics.push(line.replace(/^[-*•]\s*/, ''));
        }
      }
      
      // If no bullet points found, use lines as paragraphs
      if (subtopics.length === 0) {
        for (let i = 1; i < slideLines.length; i++) {
          const line = slideLines[i].trim();
          if (line && !line.startsWith('#')) {
            subtopics.push(line);
          }
        }
      }
      
      sections.push({
        id: index + 1,
        title: slideTitle,
        subtopics: subtopics.length > 0 ? subtopics : ['Add content here'],
        isBulletPoint: true
      });
    });
  } else {
    // Alternative extraction if markdown headers not found
    // Split by numbered list items or other patterns
    const lines = text.split('\n').filter(line => line.trim());
    let currentTitle = '';
    let currentSubtopics = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if line looks like a slide title (numbered, UPPERCASE, or ending with colon)
      if (line.match(/^\d+[\.\)]\s+/) || line.match(/^[A-Z\s]{5,}$/) || line.match(/:\s*$/)) {
        // If we already have a title, save the previous slide
        if (currentTitle) {
          sections.push({
            id: sections.length + 1,
            title: currentTitle,
            subtopics: currentSubtopics.length > 0 ? currentSubtopics : ['Add content here'],
            isBulletPoint: true
          });
        }
        
        // Start a new slide
        currentTitle = line.replace(/^\d+[\.\)]\s+/, '').replace(/:\s*$/, '');
        currentSubtopics = [];
      } 
      // Check if line is a bullet point
      else if (line.match(/^[-*•]\s+/) || line.match(/^\s+[-*•]\s+/)) {
        currentSubtopics.push(line.replace(/^[-*•]\s+/, '').replace(/^\s+[-*•]\s+/, ''));
      }
      // If we have a title but this isn't a bullet, it might be content
      else if (currentTitle && line) {
        currentSubtopics.push(line);
      }
    }
    
    // Add the last slide if there is one
    if (currentTitle) {
      sections.push({
        id: sections.length + 1,
        title: currentTitle,
        subtopics: currentSubtopics.length > 0 ? currentSubtopics : ['Add content here'],
        isBulletPoint: true
      });
    }
  }
  
  // If we couldn't extract any sections, create some default ones
  if (sections.length === 0) {
    sections.push(
      { id: 1, title: 'Introduction', subtopics: ['Overview', 'Background', 'Key points'], isBulletPoint: true },
      { id: 2, title: 'Main Content', subtopics: ['Key concept 1', 'Key concept 2', 'Examples'], isBulletPoint: true },
      { id: 3, title: 'Conclusion', subtopics: ['Summary', 'Next steps', 'Questions'], isBulletPoint: true }
    );
  }
  
  return {
    title,
    sections
  };
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