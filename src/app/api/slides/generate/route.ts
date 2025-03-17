import { NextResponse } from 'next/server';
import { generateImage } from '@/services/imageGeneration';
import { cacheSlides, getCachedSlides } from '@/services/upstashService';

const SLIDESGPT_API_KEY = "mwtdxmt1nojedaqf5pznqxkszh80yawc"; // Public key
const API_URL = "https://api.slidesgpt.com/v1/presentations/generate";

export async function POST(request: Request) {
  try {
    const { prompt, slides } = await request.json();
    
    if (!slides || !Array.isArray(slides)) {
      return NextResponse.json(
        { error: 'Invalid slides data' },
        { status: 400 }
      );
    }

    // Check cache first
    const cachedSlides = await getCachedSlides(prompt);
    if (cachedSlides) {
      return NextResponse.json({
        status: 'success',
        slides: cachedSlides,
        fromCache: true
      });
    }

    // Process each slide and generate images
    const processedSlides = await Promise.all(slides.map(async (slide: any, index: number) => {
      try {
        if (slide.imagePrompt) {
          const imageUrl = await generateImage(slide.imagePrompt);
          return { 
            ...slide, 
            imageUrl,
            id: index + 1 // Ensure each slide has an ID
          };
        }
        return { ...slide, id: index + 1 };
      } catch (error) {
        console.error(`Error processing slide ${index + 1}:`, error);
        // Return slide without image if generation fails
        return { ...slide, id: index + 1 };
      }
    }));

    // Cache the results
    await cacheSlides(prompt, processedSlides);

    return NextResponse.json({
      status: 'success',
      slides: processedSlides
    });

  } catch (error) {
    console.error('Slide generation error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate slides',
        details: error
      },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';
export const maxDuration = 60; 