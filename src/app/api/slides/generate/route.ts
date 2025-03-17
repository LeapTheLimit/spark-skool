import { NextResponse } from 'next/server';
<<<<<<< HEAD
import { generateImage } from '@/services/imageGeneration';
import { cacheSlides, getCachedSlides } from '@/services/upstashService';
=======
>>>>>>> 90ba128b77a37239696f731a4cbfd4c1385d90f6

const SLIDESGPT_API_KEY = "mwtdxmt1nojedaqf5pznqxkszh80yawc"; // Public key
const API_URL = "https://api.slidesgpt.com/v1/presentations/generate";

<<<<<<< HEAD
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
=======
export async function POST(req: Request) {
  try {
    // Get the data from the client
    const data = await req.json();
    
    console.log("Proxying request to SlidesGPT API");
    
    // Forward the request to the SlidesGPT API
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": SLIDESGPT_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(data)
    });
    
    console.log("SlidesGPT API response status:", response.status);
    
    // Get the response text
    const responseText = await response.text();
    
    // Check if the response is valid JSON
    try {
      // Try to parse as JSON to validate
      JSON.parse(responseText);
      
      // If valid JSON, return the response with appropriate headers
      return new NextResponse(responseText, {
        status: response.status,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (jsonError) {
      console.error("Invalid JSON response from SlidesGPT API:", responseText);
      // If not valid JSON, return error
      return NextResponse.json({ 
        error: "Invalid response from SlidesGPT API",
        details: responseText.substring(0, 500) 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in slides/generate proxy:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error", 
    }, { status: 500 });
  }
}

// Increase the timeout for this route to 60 seconds
>>>>>>> 90ba128b77a37239696f731a4cbfd4c1385d90f6
export const maxDuration = 60; 