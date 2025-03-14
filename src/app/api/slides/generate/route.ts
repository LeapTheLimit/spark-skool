import { NextResponse } from 'next/server';

const SLIDESGPT_API_KEY = "mwtdxmt1nojedaqf5pznqxkszh80yawc"; // Public key
const API_URL = "https://api.slidesgpt.com/v1/presentations/generate";

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
export const maxDuration = 60; 