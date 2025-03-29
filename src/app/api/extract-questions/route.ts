import { NextRequest } from 'next/server';
import { extractQuestionsWithGroq } from '@/services/groq';
import { extractTextFromPDF } from '@/services/pdfExtractor';
import { extractTextFromImage } from '@/services/ocr';

// Use new Next.js config options
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Get the raw body as ArrayBuffer first
    const arrayBuffer = await request.arrayBuffer();
    const formData = await new Response(arrayBuffer).formData();
    
    const file = formData.get('file') as File;
    if (!file) {
      return new Response(JSON.stringify({ error: 'No valid file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Convert Blob to Buffer for processing
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Extract text based on file type
    let extractedText = '';
    try {
      if (file.type === 'application/pdf') {
        extractedText = await extractTextFromPDF(fileBuffer);
      } else if (file.type.startsWith('image/')) {
        // Create a File object from the buffer
        const imageFile = new File([fileBuffer], file.name, { type: file.type });
        extractedText = await extractTextFromImage(imageFile);
      } else {
        return new Response(JSON.stringify({ 
          error: 'Invalid file type',
          details: 'Only PDF and images (JPEG, PNG) are supported'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (!extractedText || extractedText.trim().length < 10) {
        throw new Error('Extracted text is too short or empty');
      }

      // Extract questions using Groq
      const questions = await extractQuestionsWithGroq(extractedText);

      return new Response(JSON.stringify({
        success: true,
        questions,
        text: extractedText,
        count: questions.length
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error processing file:', error);
      return new Response(JSON.stringify({
        error: 'Failed to process file',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error in route handler:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 