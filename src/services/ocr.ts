// Remove the server-only import
// import 'server-only';  <-- Remove this line

// Instead, use a more compatible approach
export async function processImage(file: File | Buffer): Promise<string> {
  try {
    // Check for credentials first
    if (!hasValidCredentials()) {
      return Promise.reject('Azure Vision API credentials not configured properly');
    }
    
    // Convert file to buffer if it's a file
    let buffer: Buffer;
    
    if (Buffer.isBuffer(file)) {
      buffer = file;
    } else if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      throw new Error('Invalid file format');
    }
    
    // Check if we're in a server environment
    if (typeof window !== 'undefined') {
      throw new Error('This function can only be used on the server');
    }
    
    // Dynamically import Azure SDK
    const { ComputerVisionClient } = await import('@azure/cognitiveservices-computervision');
    const { ApiKeyCredentials } = await import('@azure/ms-rest-js');
    
    // Configure Azure Computer Vision credentials
    const computerVisionKey = process.env.NEXT_PUBLIC_AZURE_VISION_KEY || '';
    const computerVisionEndpoint = process.env.NEXT_PUBLIC_AZURE_VISION_ENDPOINT || '';
    
    // Initialize the Computer Vision client
    const credentials = new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': computerVisionKey } });
    const client = new ComputerVisionClient(credentials, computerVisionEndpoint);
    
    // Perform OCR on the image
    const result = await client.recognizePrintedText(true, buffer.toString('base64'));
    
    // Extract text from OCR result
    let extractedText = '';
    if (result && result.regions && result.regions.length > 0) {
      for (const region of result.regions) {
        if (region.lines) {
          for (const line of region.lines) {
            if (line.words) {
              extractedText += line.words.map((w: OcrWord) => w.text || '').join(' ') + '\n';
            }
          }
        }
      }
    }
    
    return extractedText.trim();
  } catch (error) {
    console.error('Error processing image:', error);
    return Promise.reject(error instanceof Error ? error.message : 'Unknown error processing image');
  }
}

// Add the missing extractTextFromImage function that's being imported by other components
import { ComputerVisionClient } from '@azure/cognitiveservices-computervision';
import { OcrWord } from '@azure/cognitiveservices-computervision/esm/models';
import { ApiKeyCredentials } from '@azure/ms-rest-js';
import { createWorker, PSM, OEM } from 'tesseract.js';
import type { Worker } from 'tesseract.js';
import { preprocessImage } from './imagePreprocessing';

export async function extractTextFromImage(input: File | Buffer): Promise<string> {
  let worker: Worker | null = null;
  try {
    // First preprocess the image
    let preprocessedImage;
    if (input instanceof File) {
      preprocessedImage = await preprocessImage(input);
    } else {
      preprocessedImage = await preprocessImage(
        new File([input], 'image.png', { type: 'image/png' })
      );
    }
    
    // Initialize worker
    worker = await createWorker();
    
    // Initialize English with improved settings
    await worker.reinitialize('eng');
    
    // Enhanced parameters for better text recognition
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,?!()[]{}:;"\'-\n ',
      preserve_interword_spaces: '1',
      textord_heavy_nr: '1',
      textord_min_linesize: '2.5',
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      tessedit_ocr_engine_mode: OEM.LSTM_ONLY,
      tessedit_do_invert: '0',
      debug_file: '/dev/null',
      tessjs_create_pdf: '0',
      tessjs_create_hocr: '0',
      tessedit_write_images: '0',
      tessedit_create_boxfile: '0',
      tessedit_create_txt: '0',
      tessedit_adapt_to_char_fragments: '1',
      textord_noise_debug: '0',
      textord_noise_rejwords: '1',
      textord_noise_rejrows: '1',
      textord_noise_rejexp: '1'
    });

    // First attempt with English
    const { data: { text: englishText, confidence: engConfidence } } = await worker.recognize(preprocessedImage);
    
    // Lower confidence threshold for English text
    if (englishText && englishText.trim().length > 10 && engConfidence > 45) {
      return postProcessText(englishText);
    }
    
    // Try Arabic with specific settings
    await worker.reinitialize('ara');
    await worker.setParameters({
      preserve_interword_spaces: '1',
      textord_heavy_nr: '1',
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      tessedit_ocr_engine_mode: OEM.LSTM_ONLY,
      tessedit_adapt_to_char_fragments: '1'
    });
    
    const { data: { text: arabicText, confidence: araConfidence } } = await worker.recognize(preprocessedImage);
    
    // Try Hebrew with specific settings
    await worker.reinitialize('heb');
    await worker.setParameters({
      preserve_interword_spaces: '1',
      textord_heavy_nr: '1',
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      tessedit_ocr_engine_mode: OEM.LSTM_ONLY,
      tessedit_adapt_to_char_fragments: '1'
    });
    
    const { data: { text: hebrewText, confidence: hebConfidence } } = await worker.recognize(preprocessedImage);
    
    // Combine results based on confidence scores with lower threshold
    const results = [
      { text: englishText, confidence: engConfidence },
      { text: arabicText, confidence: araConfidence },
      { text: hebrewText, confidence: hebConfidence }
    ].filter(result => result.text && result.text.trim().length > 0 && result.confidence > 35);

    if (results.length === 0) {
      // Try one more time with even lower confidence threshold
      const lowConfResults = [
        { text: englishText, confidence: engConfidence },
        { text: arabicText, confidence: araConfidence },
        { text: hebrewText, confidence: hebConfidence }
      ].filter(result => result.text && result.text.trim().length > 0 && result.confidence > 25);

      if (lowConfResults.length === 0) {
        throw new Error('No text could be extracted with sufficient confidence');
      }

      return postProcessText(lowConfResults[0].text);
    }

    // Sort by confidence and combine
    const combinedText = results
      .sort((a, b) => b.confidence - a.confidence)
      .map(result => result.text)
      .join('\n');

    return postProcessText(combinedText);
  } catch (error) {
    console.error('Error in OCR processing:', error);
    throw new Error('Failed to extract text from image');
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}

function postProcessText(text: string): string {
  return text
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .replace(/[\r\n]+/g, '\n')  // Replace multiple newlines with single newline
    .replace(/[^\S\r\n]+/g, ' ')  // Replace multiple horizontal whitespace with single space
    .replace(/^\s+|\s+$/gm, '')  // Remove leading/trailing whitespace from all lines
    .replace(/\n{3,}/g, '\n\n')  // Replace 3+ consecutive newlines with 2
    .trim();  // Remove leading/trailing whitespace
}

// Check credentials at runtime
const hasValidCredentials = () => {
  if (!process.env.NEXT_PUBLIC_AZURE_VISION_KEY || !process.env.NEXT_PUBLIC_AZURE_VISION_ENDPOINT) {
    console.error('Azure Vision credentials missing. Check your .env file.');
    return false;
  }
  return true;
}; 