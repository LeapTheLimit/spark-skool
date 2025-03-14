import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerateContentResult } from '@google/generative-ai';

// Make the timeout even shorter to avoid serverless function timeouts
const API_TIMEOUT_MS = 30000; // 30 seconds to stay within serverless function limits

// Use faster models and simpler configuration
const MODEL_OPTIONS = [
  "gemini-1.5-flash", // Use the fastest model first
  "gemini-pro"        // Fallback to the standard model
];

const MAX_RETRIES = 1; // Only retry once to avoid timeouts

// Type helper for errors
interface ErrorWithMessage {
  message: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

function getErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  return String(error);
}

export async function POST(req: Request) {
  // Create a header timestamp to track request timing
  const requestStart = Date.now();
  console.log(`API Request started at: ${new Date().toISOString()}`);
  
  // Get API key from environment variables
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("API key is missing");
    return NextResponse.json(
      { 
        message: "API key is missing. Please add NEXT_PUBLIC_GEMINI_API_KEY to your environment variables.", 
        status: "error",
        content: createFallbackContent("Missing API key")
      }, 
      { status: 200 } // Always return 200 with error in content
    );
  }
  
  // Log partial key for debugging
  const keyLength = apiKey.length;
  const partialKey = keyLength > 8 
    ? `${apiKey.substring(0, 5)}...${apiKey.substring(keyLength - 3)}` 
    : "***";
  console.log(`Using Gemini API key: ${partialKey}`);

  try {
    // Parse request body with timeout handling
    let prompt, temperature;
    try {
      const body = await req.json();
      prompt = body.prompt;
      temperature = body.temperature || 0.7;
      
      if (!prompt) {
        return NextResponse.json(
          { 
            message: "Prompt is required", 
            status: "error",
            content: createFallbackContent("No prompt provided")
          }, 
          { status: 200 }
        );
      }
    } catch (parseError) {
      console.error("Error parsing request:", parseError);
      return NextResponse.json(
        { 
          message: "Invalid request format", 
          status: "error",
          content: createFallbackContent("Invalid request")
        }, 
        { status: 200 }
      );
    }

    // Log request details
    console.log(`Processing prompt: "${prompt.substring(0, 50)}..." (length: ${prompt.length})`);

    let lastError = null;
    let responseText = null;

    // Try each model with fewer retries
    for (const model of MODEL_OPTIONS) {
      console.log(`Attempting to use model: ${model}`);
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const genModel = genAI.getGenerativeModel({ model });

      // Simplified safety settings
      const safetySettings = [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        }
      ];

      // Enhanced prompt for better content quality, similar to the example image
      const enhancedPrompt = `Create a high-quality, educational presentation outline about: ${prompt}

Format your response as JSON with this EXACT structure:
{
  "title": "Clear, professional title",
  "subtitle": "A concise, explanatory subtitle that clarifies the main topic",
  "sections": [
    {
      "id": 1,
      "title": "Section Title (formatted as a key concept)",
      "subtopics": [
        "Detailed, substantive point with educational value (1-2 sentences)",
        "Another detailed point with clear explanations and examples",
        "A third well-written point with concrete information"
      ],
      "imagePrompt": "Specific, detailed description for a professional image that illustrates this section"
    }
  ]
}

IMPORTANT INSTRUCTIONS:
1. Create a title that is professional and concise
2. Include a meaningful subtitle that expands on the title
3. Create 4-6 well-structured sections
4. For each section:
   - Make the title educational and knowledge-based
   - Write 3-4 substantive bullet points that are detailed and informative (not just short phrases)
   - Each bullet point should be written as a complete thought with educational value (similar to textbook content)
   - Include detailed image prompts that would create relevant, educational visuals
5. Use academic, professional language throughout
6. Focus on educational value and content depth

Return ONLY valid JSON following the exact structure above.`;

      // Limited retries
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          console.log(`Attempt ${attempt + 1} with model ${model}`);
          
          // Set a shorter timeout for the API call
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            console.log(`Aborting request after ${API_TIMEOUT_MS}ms`);
            controller.abort();
          }, API_TIMEOUT_MS);
          
          try {
            // Call the Gemini API with the enhanced prompt
            const result = await genModel.generateContent({
              contents: [{ role: "user", parts: [{ text: enhancedPrompt }] }],
              generationConfig: {
                temperature,
                maxOutputTokens: 4096, // Reduce token count for faster response
              },
              safetySettings,
            }, { signal: controller.signal });
            
            clearTimeout(timeoutId);
            responseText = result.response.text();
            
            // Validate JSON response
            try {
              JSON.parse(responseText);
              console.log("Valid JSON response received");
              
              // Check how long the request took
              const requestEnd = Date.now();
              console.log(`Request completed in ${requestEnd - requestStart}ms`);
              
              return NextResponse.json({ 
                content: responseText, 
                model: model,
                status: "success",
                requestTime: requestEnd - requestStart
              });
            } catch (jsonError) {
              console.error("Response is not valid JSON:", jsonError);
              
              // Try to extract JSON
              const jsonMatch = responseText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                try {
                  const extractedJson = jsonMatch[0];
                  JSON.parse(extractedJson); // Validate it's actually JSON
                  console.log("Extracted valid JSON from response");
                  
                  return NextResponse.json({ 
                    content: extractedJson, 
                    model: model,
                    status: "success",
                    extracted: true
                  });
                } catch (extractError) {
                  console.error("Failed to extract valid JSON:", extractError);
                }
              }
              
              throw new Error("Invalid JSON response from model");
            }
          } catch (apiError) {
            clearTimeout(timeoutId);
            throw apiError;
          }
        } catch (error) {
          lastError = error;
          console.error(`Error with model ${model}, attempt ${attempt + 1}:`, error);
          
          // Check for timeout
          if (error instanceof Error && error.name === 'AbortError') {
            console.log(`Timeout with model ${model}, will try different model if available`);
            break; // Break out of retry loop for this model
          }
          
          // Short wait before retry
          if (attempt < MAX_RETRIES - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
    }

    // All models and retries failed
    console.error("All models failed:", lastError);
    const requestEnd = Date.now();
    console.log(`Request failed after ${requestEnd - requestStart}ms`);
    
    // Always return a valid fallback
    return NextResponse.json({ 
      message: lastError instanceof Error ? lastError.message : "Failed to generate content",
      status: "error",
      content: createFallbackContent(prompt),
      requestTime: requestEnd - requestStart
    }, { status: 200 }); // Always return 200 with error content
    
  } catch (error) {
    console.error("Server error:", error);
    const requestEnd = Date.now();
    
    // Always return valid JSON
    return NextResponse.json({ 
      message: error instanceof Error ? error.message : "An unexpected error occurred",
      status: "error",
      content: createFallbackContent("Error"),
      requestTime: requestEnd - requestStart
    }, { status: 200 }); // Always return 200 to avoid platform errors
  }
}

// Function to create valid fallback content
function createFallbackContent(prompt: string): string {
  const subject = prompt.split(' ').slice(0, 3).join(' ');
  
  return JSON.stringify({
    title: `Presentation about ${subject}`,
    sections: [
      {
        id: 1,
        title: "Introduction",
        subtopics: ["Overview of the topic", "Key concepts", "Importance and relevance"],
        imagePrompt: "An introductory image showing the main concept"
      },
      {
        id: 2,
        title: "Main Points",
        subtopics: ["First key point", "Second key point", "Supporting evidence"],
        imagePrompt: "A diagram illustrating the main points"
      },
      {
        id: 3,
        title: "Practical Applications",
        subtopics: ["Real-world example 1", "Real-world example 2", "Benefits and outcomes"],
        imagePrompt: "Real-world application of the concept"
      },
      {
        id: 4,
        title: "Conclusion",
        subtopics: ["Summary of key points", "Final thoughts", "Next steps"],
        imagePrompt: "A concluding image summarizing the main takeaways"
      }
    ]
  });
} 