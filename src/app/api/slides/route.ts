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

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { prompt, pages, wordAmount, audience, slidesForm, imageSource } = await req.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // This would be where you'd integrate with an actual slide generation service
    // For now, just return a success response with some dummy data
    const dummyResponse = {
      title: prompt,
      slides: Array.from({ length: parseInt(pages) || 15 }, (_, i) => ({
        id: i + 1,
        title: i === 0 ? prompt : `Slide ${i + 1}`,
        content: `Content for slide ${i + 1}`,
        imageUrl: `https://source.unsplash.com/random/800x600?${encodeURIComponent(prompt)}&slide=${i}`,
      }))
    };

    return NextResponse.json({
      status: 'success',
      presentation: dummyResponse
    });
  } catch (error) {
    console.error('Slide generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate slides' },
      { status: 500 }
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