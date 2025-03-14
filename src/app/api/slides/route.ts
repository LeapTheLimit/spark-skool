import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { getUnsplashImage, getSlideImage } from '@/services/imageService';
import { cacheSlides, getCachedSlides } from '@/services/upstashService';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// Fallback slide content in case the API fails
const FALLBACK_SLIDES = [
  {
    title: "Introduction",
    content: "This is an automatically generated presentation. The content will help you get started with your topic.",
    layout: "title"
  },
  {
    title: "Key Points",
    content: "• First important point\n• Second important point\n• Third important point",
    layout: "bullets"
  },
  {
    title: "Visual Example",
    content: "This slide contains a visual representation of the concept.",
    layout: "image-text"
  },
  {
    title: "Detailed Information",
    content: "More detailed information about the topic goes here. You can expand on the key points mentioned earlier.",
    layout: "content"
  },
  {
    title: "Conclusion",
    content: "Summary of the main points covered in this presentation.",
    layout: "content"
  }
];

export async function POST(req: Request) {
  try {
    // Validate request
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    if (!body || !body.prompt) {
      return NextResponse.json(
        { error: 'Invalid request. Prompt is required.' },
        { status: 400 }
      );
    }
    
    const { prompt, context = '', language = 'en' } = body;
    
    // Try to get cached slides first
    const cacheKey = `${prompt.toLowerCase().trim()}-${language}`;
    const cachedSlides = await getCachedSlides(cacheKey);
    
    if (cachedSlides && cachedSlides.length > 0) {
      console.log('Using cached slides for:', prompt);
      return NextResponse.json({ slides: cachedSlides, cached: true });
    }

    // Initialize Gemini API
    let genAI;
    try {
      if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key is not configured');
      }
      genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    } catch (error) {
      console.error('Error initializing Gemini API:', error);
      
      // Return fallback slides with the user's prompt
      const customizedFallbackSlides = await addImagesToSlides(FALLBACK_SLIDES, prompt);
      
      return NextResponse.json({ 
        slides: customizedFallbackSlides,
        fallback: true,
        message: 'Using fallback slides due to AI configuration issue'
      });
    }

    // Generate slide content
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const result = await model.generateContent(`
        Create a presentation with the following details:
        Topic: ${prompt}
        Context: ${context || prompt}
        Language: ${language}

        For each slide, provide:
        1. A clear title (prefix with "TITLE:")
        2. Well-structured content (prefix with "CONTENT:")
        3. Image description (prefix with "IMAGE:")
        4. Layout type (prefix with "LAYOUT:" - one of: title, content, two-column, image-text, bullets)

        Format each slide as:
        ---SLIDE START---
        TITLE: [Slide Title]
        CONTENT: [Slide Content]
        IMAGE: [Brief image description for Unsplash]
        LAYOUT: [layout type]
        ---SLIDE END---

        Create 5-7 slides that are engaging and professional.
      `);

      const response = await result.response;
      const slidesText = response.text();
      
      if (!slidesText) {
        throw new Error('No content generated');
      }

      // Parse the slides and add Unsplash image URLs
      const slides = await parseSlides(slidesText, prompt);
      
      // Cache the slides for future use
      await cacheSlides(cacheKey, slides);
      
      return NextResponse.json({ 
        slides: slides,
        raw: slidesText 
      });
    } catch (error: any) {
      console.error('Error generating content with Gemini:', error);
      
      // Return fallback slides with the user's prompt
      const customizedFallbackSlides = await addImagesToSlides(FALLBACK_SLIDES, prompt);
      
      return NextResponse.json({ 
        slides: customizedFallbackSlides,
        fallback: true,
        message: 'Using fallback slides due to content generation issue'
      });
    }
  } catch (error: any) {
    console.error('Unhandled error in slide generation:', error);
    
    // Create fallback slides with images
    const fallbackWithImages = await addImagesToSlides(FALLBACK_SLIDES, 'presentation');
    
    return NextResponse.json(
      { 
        error: 'Failed to generate slides. Please try again.',
        details: error.message,
        fallback: true,
        slides: fallbackWithImages
      },
      { status: 200 } // Return 200 with fallback content instead of 500
    );
  }
}

async function parseSlides(text: string, defaultTopic: string) {
  try {
    const slideRegex = /---SLIDE START---([\s\S]*?)---SLIDE END---/g;
    const titleRegex = /TITLE:(.*)/i;
    const contentRegex = /CONTENT:([\s\S]*?)(?=IMAGE:|LAYOUT:|---SLIDE END---)/i;
    const imageRegex = /IMAGE:(.*?)(?=LAYOUT:|---SLIDE END---)/i;
    const layoutRegex = /LAYOUT:(.*)/i;
    
    const slides = [];
    let match;
    
    while ((match = slideRegex.exec(text)) !== null) {
      const slideContent = match[1];
      
      const titleMatch = slideContent.match(titleRegex);
      const contentMatch = slideContent.match(contentRegex);
      const imageMatch = slideContent.match(imageRegex);
      const layoutMatch = slideContent.match(layoutRegex);
      
      const title = titleMatch ? titleMatch[1].trim() : `Slide about ${defaultTopic}`;
      const content = contentMatch ? contentMatch[1].trim() : '';
      const imagePrompt = imageMatch ? imageMatch[1].trim() : title;
      const layout = layoutMatch ? layoutMatch[1].trim() : 'content';
      
      // Get Unsplash image URL based on the image prompt
      const imageUrl = await getUnsplashImage(imagePrompt || title);
      
      slides.push({
        title,
        content,
        imagePrompt,
        imageUrl,
        layout
      });
    }
    
    // If no slides were parsed but we have text, create a single slide
    if (slides.length === 0 && text.trim().length > 0) {
      const imageUrl = await getUnsplashImage(defaultTopic);
      slides.push({
        title: `About ${defaultTopic}`,
        content: text.trim(),
        imagePrompt: defaultTopic,
        imageUrl,
        layout: 'content'
      });
    }
    
    // If still no slides, return fallback with images
    if (slides.length === 0) {
      return addImagesToSlides(FALLBACK_SLIDES, defaultTopic);
    }
    
    return slides;
  } catch (error) {
    console.error('Error parsing slides:', error);
    return addImagesToSlides(FALLBACK_SLIDES, defaultTopic);
  }
}

async function addImagesToSlides(slides: any[], topic: string) {
  try {
    const customizedSlides = await Promise.all(slides.map(async (slide) => {
      const customTitle = slide.title.includes("Introduction") 
        ? `Introduction to ${topic}` 
        : slide.title;
        
      const imageUrl = await getSlideImage(customTitle, slide.content);
      
      return {
        ...slide,
        title: customTitle,
        imageUrl
      };
    }));
    
    return customizedSlides;
  } catch (error) {
    console.error('Error adding images to slides:', error);
    
    // Fallback to simpler image approach if there's an error
    return slides.map(slide => ({
      ...slide,
      title: slide.title.includes("Introduction") ? `Introduction to ${topic}` : slide.title,
      imageUrl: `https://source.unsplash.com/random/800x600?${encodeURIComponent((slide.title + " " + topic).trim())}`
    }));
  }
} 