import { createWorker } from 'tesseract.js';
import { ComputerVisionClient } from '@azure/cognitiveservices-computervision';
import { CognitiveServicesCredentials } from '@azure/ms-rest-azure-js';
import { GoogleGenerativeAI } from "@google/generative-ai";

const AZURE_ENDPOINT = process.env.NEXT_PUBLIC_AZURE_VISION_ENDPOINT || '';
const AZURE_KEY = process.env.NEXT_PUBLIC_AZURE_VISION_KEY || '';
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

// Initialize services
const credentials = new CognitiveServicesCredentials(AZURE_KEY);
const computerVisionClient = new ComputerVisionClient(credentials, AZURE_ENDPOINT);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface ExtractedResult {
  text: string;
  confidence: number;
  source: string;
  languagesDetected: string[];
  rtlContent: boolean;
}

export interface TrueFalseFormat {
  type: 'checkbox' | 'circle' | 'parentheses' | 'symbol' | 'arabic' | 'hebrew';
  trueValue: string;
  falseValue: string;
  isSymbol?: boolean;
  selected?: 'true' | 'false';
  correct?: 'true' | 'false';
}

export interface QuestionData {
  type: 'true-false' | 'multiple-choice' | 'open-ended' | 'matching' | 'fill-blank';
  text: string;
  options?: string[];
  correctAnswer?: string;
  points?: number;
  language: string;
  format?: TrueFalseFormat;
  studentAnswer?: string;
  teacherMarks?: {
    correct: boolean;
    points: number;
    feedback?: string;
  };
}

// Add new language detection interface
interface LanguageAnalysis {
  primaryLanguage: string;
  secondaryLanguages: string[];
  direction: 'rtl' | 'ltr';
  confidence: number;
  hasHandwriting: boolean;
  hasMathematical: boolean;
  hasSymbols: boolean;
}

// Add this before the main extraction function
async function analyzeImageLanguage(base64Image: string): Promise<LanguageAnalysis> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    
    const prompt = `
      Analyze this exam image and provide detailed language information:
      1. What is the primary language used?
      2. Are there any secondary languages?
      3. Is the text right-to-left (RTL) or left-to-right (LTR)?
      4. Is there handwritten text?
      5. Are there mathematical equations or symbols?
      6. What percentage of text is in each detected language?
      7. Are there any special characters or symbols?

      Respond in this exact JSON format:
      {
        "primaryLanguage": "language code (eng/ara/heb)",
        "secondaryLanguages": ["list of other language codes"],
        "direction": "rtl or ltr",
        "confidence": 0.95,
        "hasHandwriting": true/false,
        "hasMathematical": true/false,
        "hasSymbols": true/false,
        "languageDistribution": {
          "eng": 70,
          "ara": 30,
          etc.
        }
      }
    `;

    const result = await model.generateContent([prompt, { 
      inlineData: { data: base64Image, mimeType: 'image/jpeg' }
    }]);
    
    const analysis = JSON.parse(result.response.text());
    return analysis;
  } catch (error) {
    console.warn('Language analysis failed:', error);
    return {
      primaryLanguage: 'eng',
      secondaryLanguages: [],
      direction: 'ltr',
      confidence: 0,
      hasHandwriting: false,
      hasMathematical: false,
      hasSymbols: false
    };
  }
}

// Update the main extraction function
export const extractTextFromImage = async (imageFile: File): Promise<string> => {
  try {
    const base64Image = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Content = base64String.split(',')[1];
        resolve(base64Content);
      };
      reader.readAsDataURL(imageFile);
    });

    // First, analyze the image language
    const languageAnalysis = await analyzeImageLanguage(base64Image);
    console.log('Language Analysis:', languageAnalysis);

    // Customize extraction based on language analysis
    const extractionStrategies = [];

    // Add Azure strategy with language-specific settings
    if (languageAnalysis.direction === 'rtl') {
      extractionStrategies.push(
        extractWithAzure(base64Image, {
          language: languageAnalysis.primaryLanguage,
          readingOrder: 'rtl',
          detectOrientation: true
        })
      );
    } else {
      extractionStrategies.push(
        extractWithAzure(base64Image, {
          language: languageAnalysis.primaryLanguage,
          readingOrder: 'natural',
          detectOrientation: false
        })
      );
    }

    // Add Tesseract with optimal language settings
    const tesseractLangs = [
      languageAnalysis.primaryLanguage,
      ...languageAnalysis.secondaryLanguages
    ].join('+');
    
    extractionStrategies.push(
      extractWithTesseract(base64Image, {
        languages: tesseractLangs,
        direction: languageAnalysis.direction
      })
    );

    // Add specialized handwriting recognition if needed
    if (languageAnalysis.hasHandwriting) {
      extractionStrategies.push(
        extractWithGemini(base64Image, imageFile.type, {
          focus: 'handwriting',
          languages: [languageAnalysis.primaryLanguage, ...languageAnalysis.secondaryLanguages],
          direction: languageAnalysis.direction
        })
      );
    }

    // Add mathematical content extraction if needed
    if (languageAnalysis.hasMathematical) {
      extractionStrategies.push(
        extractMathematicalContent(base64Image, { 
          primaryLanguage: languageAnalysis.primaryLanguage,
          direction: languageAnalysis.direction
        })
      );
    }

    // Run all strategies in parallel
    const results = await Promise.all(extractionStrategies);

    // Filter and combine results
    const validResults = results.filter(r => r.text.trim().length > 0);
    
    if (validResults.length === 0) {
      throw new Error('No service could extract text successfully');
    }

    // Choose best result based on language analysis
    const bestResult = chooseBestResult(validResults, languageAnalysis);

    // Apply language-specific post-processing
    let processedText = postProcessText(
      bestResult.text,
      [languageAnalysis.primaryLanguage, ...languageAnalysis.secondaryLanguages],
      languageAnalysis.direction === 'rtl'
    );

    // Enhance with AI understanding
    processedText = await enhanceExtractedText(processedText, {
      languageAnalysis,
      originalImage: base64Image
    });

    return processedText;

  } catch (error) {
    console.error('Text extraction failed:', error);
    throw new Error(`Failed to analyze exam: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Add new interfaces for multi-pass analysis
interface AnalysisPass {
  text: string;
  confidence: number;
  source: string;
  analysisType: 'full' | 'segment' | 'handwriting' | 'structure';
  segments?: ImageSegment[];
}

interface ImageSegment {
  type: 'question' | 'answer' | 'header' | 'instructions' | 'handwriting';
  content: string;
  bounds: { x: number; y: number; width: number; height: number };
  confidence: number;
}

// Update the extraction function to use multiple passes
async function extractWithAzure(base64Image: string, p0: { language: string; readingOrder: string; detectOrientation: boolean; }): Promise<ExtractedResult> {
  try {
    // First pass: Full document analysis
    const fullAnalysis = await analyzeFullDocument(base64Image);
    
    // Second pass: Segment-based analysis
    const segments = await analyzeSegments(base64Image);
    
    // Third pass: Focused handwriting analysis
    const handwritingResults = await analyzeHandwriting(base64Image);
    
    // Fourth pass: Structure analysis
    const structureAnalysis = await analyzeStructure(base64Image);

    // Combine all passes
    const combinedResult = combineAnalysisPasses([
      fullAnalysis,
      ...segments.map(s => ({ text: s.content, confidence: s.confidence, source: 'azure-segment', analysisType: 'segment' as const })),
      ...handwritingResults,
      structureAnalysis
    ]);

    return {
      text: combinedResult.text,
      confidence: combinedResult.confidence,
      source: 'azure-combined',
      languagesDetected: detectLanguages(combinedResult.text),
      rtlContent: /[\u0591-\u07FF]/.test(combinedResult.text)
    };
  } catch (error) {
    console.warn('Azure extraction failed:', error);
    return { text: '', confidence: 0, source: 'azure', languagesDetected: [], rtlContent: false };
  }
}

async function analyzeFullDocument(base64Image: string): Promise<AnalysisPass> {
  const result = await computerVisionClient.read(base64Image);
  const operationLocation = result.operationLocation;
  
  let analysisResult = await computerVisionClient.getReadResult(operationLocation);
  while (analysisResult.status !== "succeeded" && analysisResult.status !== "failed") {
    await new Promise(resolve => setTimeout(resolve, 1000));
    analysisResult = await computerVisionClient.getReadResult(operationLocation);
  }

  const lines = analysisResult.analyzeResult?.readResults?.[0]?.lines || [];
  return {
    text: lines.map(l => l.text).join('\n'),
    confidence: calculateAverageConfidence(lines),
    source: 'azure-full',
    analysisType: 'full'
  };
}

async function analyzeSegments(base64Image: string): Promise<ImageSegment[]> {
  const segments: ImageSegment[] = [];
  
  try {
    // Use read API instead of analyzeLayout
    const result = await computerVisionClient.read(base64Image);
    const operationLocation = result.operationLocation;
    
    let analysisResult = await computerVisionClient.getReadResult(operationLocation);
    while (analysisResult.status !== "succeeded" && analysisResult.status !== "failed") {
      await new Promise(resolve => setTimeout(resolve, 1000));
      analysisResult = await computerVisionClient.getReadResult(operationLocation);
    }

    // Process each region from readResults
    const regions = analysisResult.analyzeResult?.readResults?.[0]?.lines || [];
    for (const region of regions) {
      const segmentType = determineSegmentType({ lines: [region] });
      if (segmentType) {
        segments.push({
          type: segmentType,
          content: region.text || '',
          bounds: region.boundingBox ? { x: region.boundingBox[0], y: region.boundingBox[1], width: region.boundingBox[2], height: region.boundingBox[3] } : { x: 0, y: 0, width: 0, height: 0 },
          confidence: 0.8 // Use fixed confidence value since Line type doesn't expose confidence
        });
      }
    }
  } catch (error) {
    console.warn('Segment analysis failed:', error);
  }
  
  return segments;
}

async function analyzeHandwriting(base64Image: string): Promise<AnalysisPass[]> {
  const passes: AnalysisPass[] = [];
  
  try {
    // Multiple passes with different recognition models
    const models = ['handwritten', 'printed', 'mixed'];
    
    for (const model of models) {
      const result = await computerVisionClient.read(base64Image, { model });
      const operationLocation = result.operationLocation;
      
      let analysisResult = await computerVisionClient.getReadResult(operationLocation);
      while (analysisResult.status !== "succeeded" && analysisResult.status !== "failed") {
        await new Promise(resolve => setTimeout(resolve, 1000));
        analysisResult = await computerVisionClient.getReadResult(operationLocation);
      }

      if (analysisResult.analyzeResult?.readResults) {
        passes.push({
          text: analysisResult.analyzeResult.readResults
            .map(page => page.lines?.map(line => line.text).join('\n'))
            .join('\n'),
          confidence: calculateAverageConfidence(analysisResult.analyzeResult.readResults[0]?.lines || []),
          source: `azure-${model}`,
          analysisType: 'handwriting'
        });
      }
    }
  } catch (error) {
    console.warn('Handwriting analysis failed:', error);
  }

  return passes;
}

async function analyzeStructure(base64Image: string): Promise<AnalysisPass> {
  try {
    const result = await computerVisionClient.read(base64Image);
    const operationLocation = result.operationLocation;
    
    let analysisResult = await computerVisionClient.getReadResult(operationLocation);
    while (analysisResult.status !== "succeeded" && analysisResult.status !== "failed") {
      await new Promise(resolve => setTimeout(resolve, 1000));
      analysisResult = await computerVisionClient.getReadResult(operationLocation);
    }

    const text = analysisResult.analyzeResult?.readResults?.[0]?.lines
      ?.map(line => line.text)
      .join('\n') || '';

    return {
      text,
      confidence: 0.8,
      source: 'azure-structure',
      analysisType: 'structure'
    };
  } catch (error) {
    console.warn('Structure analysis failed:', error);
    return {
      text: '',
      confidence: 0,
      source: 'azure-structure',
      analysisType: 'structure'
    };
  }
}

function combineAnalysisPasses(passes: AnalysisPass[]): { text: string; confidence: number } {
  // Weight different passes based on their type and confidence
  const weightedResults = passes.map(pass => ({
    ...pass,
    weight: calculatePassWeight(pass)
  }));

  // Combine texts using a voting system for overlapping content
  const textSegments = new Map<string, { count: number; confidence: number }>();
  
  weightedResults.forEach(result => {
    const segments = result.text.split('\n');
    segments.forEach(segment => {
      const normalized = normalizeText(segment);
      const existing = textSegments.get(normalized);
      if (existing) {
        textSegments.set(normalized, {
          count: existing.count + 1,
          confidence: Math.max(existing.confidence, result.confidence * result.weight)
        });
      } else {
        textSegments.set(normalized, {
          count: 1,
          confidence: result.confidence * result.weight
        });
      }
    });
  });

  // Build final text using segments with highest confidence
  const finalSegments = Array.from(textSegments.entries())
    .filter(([_, data]) => data.count > 1 || data.confidence > 0.7)
    .sort((a, b) => b[1].confidence - a[1].confidence);

  return {
    text: finalSegments.map(([text]) => text).join('\n'),
    confidence: finalSegments.reduce((acc, [_, data]) => acc + data.confidence, 0) / finalSegments.length
  };
}

function calculatePassWeight(pass: AnalysisPass): number {
  switch (pass.analysisType) {
    case 'handwriting': return 1.2; // Prioritize handwriting analysis
    case 'segment': return 1.1;     // Segment analysis is also important
    case 'structure': return 1.0;    // Structure provides context
    case 'full': return 0.9;        // Full pass as baseline
    default: return 1.0;
  }
}

function normalizeText(text: string): string {
  return text.trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\u0590-\u07FF]/g, ''); // Keep Hebrew and Arabic characters
}

async function extractWithTesseract(base64Image: string, p0: { languages: string; direction: "rtl" | "ltr"; }): Promise<ExtractedResult> {
  try {
    // Try multiple language combinations
    const languageSets = [
      'eng+ara+heb',
      'ara+heb+eng',
      'eng+ara',
      'ara+eng',
      'heb+eng'
    ];

    const results = await Promise.all(languageSets.map(async (langSet) => {
      const worker = await createWorker(langSet);
      const result = await worker.recognize(base64Image);
      await worker.terminate();
      return {
        text: result.data.text,
        confidence: result.data.confidence,
        langs: langSet
      };
    }));

    // Choose best Tesseract result
    const bestResult = results.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    const hasRTL = /[\u0591-\u07FF]/.test(bestResult.text);

    return {
      text: bestResult.text,
      confidence: bestResult.confidence,
      source: 'tesseract',
      languagesDetected: bestResult.langs.split('+'),
      rtlContent: hasRTL
    };
  } catch (error) {
    console.warn('Tesseract extraction failed:', error);
    return {
      text: '',
      confidence: 0,
      source: 'tesseract',
      languagesDetected: [],
      rtlContent: false
    };
  }
}

async function extractWithGemini(base64Image: string, mimeType: string, p0: { focus: string; languages: string[]; direction: "rtl" | "ltr"; }): Promise<ExtractedResult> {
  if (!GEMINI_API_KEY) {
    return {
      text: '',
      confidence: 0,
      source: 'gemini',
      languagesDetected: [],
      rtlContent: false
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    
    const imageData = {
      inlineData: {
        data: base64Image,
        mimeType
      }
    };

    const examAnalysisPrompt = `
      You are an expert exam analysis system specialized in educational assessments. Analyze this exam with extreme precision:

      EXAM STRUCTURE ANALYSIS:
      1. Header Information:
         - Course/Subject name: [English Language]
         - Stream/Track: [Humanities & Scientific]
         - Duration: [3:00 Hours]
         - Total marks: [90]
         - Date: [9/6/2016]

      2. Section Recognition:
         - Reading Comprehension
         - Question sections
         - Sub-questions
         - Point allocations per section

      3. Question Components:
         Reading Text Analysis:
         - Identify main passage
         - Locate quoted text
         - Find reference material
         - Note any tables/figures

         Question Types:
         - Multiple Choice [A, B, C, D]
         - True/False [T/F]
         - Fill in blanks [___]
         - Matching exercises
         - Open-ended questions
         - Short answer questions

      4. Answer Format Detection:
         - Answer spaces [________]
         - Multiple choice bubbles [○]
         - Checkboxes [□]
         - Tables for matching
         - Lines for writing
         - Point values in margins

      5. Detailed Extraction:
         For each question:
         NUMBER: [Question number]
         TYPE: [Question type]
         TEXT: [Full question text]
         OPTIONS: [If multiple choice]
         POINTS: [Point value]
         INSTRUCTIONS: [Any specific instructions]
         REFERENCE: [Related passage/material]

      6. Special Elements:
         - Instructions blocks
         - Section headers
         - Point distributions
         - Time allocations
         - Special notes
         - Grading rubrics

      OUTPUT FORMAT:
      EXAM METADATA:
      Subject: [Subject]
      Level: [Level/Stream]
      Duration: [Time]
      Total Marks: [Total]
      Date: [Date]

      SECTIONS:
      [Section Name] ([Points])
      Instructions: [Section instructions]
      Questions:
      1. [Full question with all components]
         Points: [X]
         Type: [Question type]
         [Additional components]

      2. [Next question...]
         ...

      NOTES:
      - Preserve exact formatting
      - Maintain numbering systems
      - Keep all point values
      - Note any special instructions
      - Flag any ambiguous elements

      VALIDATION:
      - Confirm total points add up
      - Check section numbering
      - Verify question completeness
      - Note any missing elements
    `;

    const result = await model.generateContent([examAnalysisPrompt, imageData]);
    const text = result.response.text();
    
    const hasRTL = /[\u0591-\u07FF]/.test(text);
    const detectedLanguages = detectLanguages(text);

    return {
      text,
      confidence: 0.8, // Gemini doesn't provide confidence scores
      source: 'gemini',
      languagesDetected: detectedLanguages,
      rtlContent: hasRTL
    };
  } catch (error) {
    console.warn('Gemini extraction failed:', error);
    return {
      text: '',
      confidence: 0,
      source: 'gemini',
      languagesDetected: [],
      rtlContent: false
    };
  }
}

function detectLanguages(text: string): string[] {
  const languages: string[] = [];
  if (/[a-zA-Z]/.test(text)) languages.push('eng');
  if (/[\u0600-\u06FF]/.test(text)) languages.push('ara');
  if (/[\u0590-\u05FF]/.test(text)) languages.push('heb');
  return languages;
}

function chooseBestResult(results: ExtractedResult[], languageAnalysis: LanguageAnalysis): ExtractedResult {
  // Prioritize results with more detected languages
  const multilingualResults = results.filter(r => r.languagesDetected.length > 1);
  if (multilingualResults.length > 0) {
    return multilingualResults.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
  }

  // Fall back to highest confidence result
  return results.reduce((best, current) => 
    current.confidence > best.confidence ? current : best
  );
}

function postProcessText(text: string, languages: string[], hasRTL: boolean): string {
  let processed = text;

  // Add RTL markers for Arabic/Hebrew content
  if (hasRTL) {
    processed = processed.split('\n').map(line => {
      return /[\u0591-\u07FF]/.test(line) ? `\u202B${line}\u202C` : line;
    }).join('\n');
  }

  // Clean up common OCR artifacts
  processed = processed
    .replace(/[^\S\n]+/g, ' ')  // normalize spaces
    .replace(/\n{3,}/g, '\n\n') // normalize line breaks
    .trim();

  return processed;
}

interface EnhancementOptions {
  languageAnalysis: LanguageAnalysis;
  originalImage: string;
}

async function enhanceExtractedText(rawText: string, options: EnhancementOptions): Promise<string> {
  if (!GEMINI_API_KEY) return rawText;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const contextPrompt = `
      EXAM CONTEXT:
      Languages: ${options.languageAnalysis.primaryLanguage}, ${options.languageAnalysis.secondaryLanguages.join(', ')}
      Content Type: Educational Assessment
      Original Text:
      ${rawText}

      ENHANCEMENT TASKS:
      1. Layout Reconstruction:
         - Restore original visual structure
         - Maintain spacing and alignment
         - Preserve section breaks
         - Keep question grouping

      2. Language Processing:
         - Apply proper RTL/LTR formatting
         - Fix common OCR errors
         - Correct language-specific characters
         - Handle mixed language content

      3. Question Analysis:
         - Structure question hierarchies
         - Format answer choices
         - Preserve scoring information
         - Maintain answer markings

      4. Formatting:
         - Use appropriate markers for RTL text
         - Maintain consistent spacing
         - Preserve special characters
         - Keep mathematical notation

      RETURN FORMAT:
      [Properly formatted and structured exam content]
    `;

    const result = await model.generateContent([contextPrompt, { text: rawText }]);
    const enhancedText = result.response.text();
    
    // Apply additional post-processing
    return postProcessEnhancedText(enhancedText, options.languageAnalysis);
  } catch (error) {
    console.warn('Enhancement failed:', error);
    return rawText;
  }
}

// Add new post-processing function
function postProcessEnhancedText(text: string, languageAnalysis: LanguageAnalysis): string {
  let processed = text;

  // Handle RTL content
  if (languageAnalysis.secondaryLanguages.includes('ara') || languageAnalysis.secondaryLanguages.includes('heb')) {
    processed = processed.split('\n').map(line => {
      // Add RTL markers for lines with Arabic/Hebrew content
      if (/[\u0591-\u07FF]/.test(line)) {
        return `\u202B${line}\u202C`;
      }
      // Handle mixed content lines
      if (/[\u0591-\u07FF]/.test(line) && /[A-Za-z]/.test(line)) {
        return line.split(/(\s+)/).map(part => {
          if (/[\u0591-\u07FF]/.test(part)) {
            return `\u202B${part}\u202C`;
          }
          return part;
        }).join('');
      }
      return line;
    }).join('\n');
  }

  // Fix common OCR errors
  processed = processed
    // Fix common Arabic character mistakes
    .replace(/[إأآ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ي]/g, 'ى')
    // Fix common Hebrew character mistakes
    .replace(/[װ]/g, 'ו')
    .replace(/[ײ]/g, 'י')
    // Fix common number formats
    .replace(/[٠-٩]/g, d => String.fromCharCode(d.charCodeAt(0) - 1632 + 48))
    // Clean up spaces
    .replace(/\s+/g, ' ')
    // Fix line breaks
    .replace(/\n{3,}/g, '\n\n');

  return processed;
}

function parseQuestions(text: string): QuestionData[] {
  const questions: QuestionData[] = [];
  const questionBlocks = text.split('Question').filter(block => block.trim());

  for (const block of questionBlocks) {
    try {
      const lines = block.split('\n').map(l => l.trim()).filter(l => l);
      const questionData: Partial<QuestionData> = {
        language: detectLanguage(lines[0] || '')
      };

      // Extract question type
      const typeMatch = block.match(/Type:\s*([^\n]+)/);
      if (typeMatch) {
        questionData.type = parseQuestionType(typeMatch[1]);
      }

      // Extract question text
      const textMatch = block.match(/Text:\s*([^\n]+)/);
      if (textMatch) {
        questionData.text = textMatch[1];
      }

      // Extract options if present
      const optionsMatch = block.match(/Options:\s*([\s\S]+?)(?=Correct Answer:|$)/);
      if (optionsMatch) {
        questionData.options = optionsMatch[1]
          .split('\n')
          .map(o => o.trim())
          .filter(o => o);
      }

      // Extract correct answer if present
      const answerMatch = block.match(/Correct Answer:\s*([^\n]+)/);
      if (answerMatch) {
        questionData.correctAnswer = answerMatch[1];
      }

      // Extract points if present
      const pointsMatch = block.match(/Points:\s*(\d+)/);
      if (pointsMatch) {
        questionData.points = parseInt(pointsMatch[1]);
      }

      if (questionData.text) {
        questions.push(questionData as QuestionData);
      }
    } catch (e) {
      console.warn('Failed to parse question block:', e);
    }
  }

  return questions;
}

function formatQuestions(questions: QuestionData[]): string {
  return questions.map((q, index) => {
    const isRTL = q.language === 'ara' || q.language === 'heb';
    const directionMarker = isRTL ? '\u202B' : '';
    const endMarker = isRTL ? '\u202C' : '';

    let formatted = `${directionMarker}Question ${index + 1}:${endMarker}\n`;
    formatted += `${directionMarker}${q.text}${endMarker}\n`;

    if (q.type === 'true-false' && q.format) {
      const format = q.format;
      const selected = q.studentAnswer;
      const correct = q.teacherMarks?.correct;

      if (format.isSymbol) {
        formatted += `${directionMarker}${
          selected === 'true' ? format.trueValue :
          selected === 'false' ? format.falseValue :
          '[ ]'
        }${endMarker}\n`;
      } else {
        formatted += `${directionMarker}${format.trueValue}${
          selected === 'true' ? ' ✓' : ''
        }${
          correct !== undefined && selected === 'true' ? 
            correct ? ' ✅' : ' ❌' : ''
        }${endMarker}\n`;
        
        formatted += `${directionMarker}${format.falseValue}${
          selected === 'false' ? ' ✓' : ''
        }${
          correct !== undefined && selected === 'false' ? 
            correct ? ' ✅' : ' ❌' : ''
        }${endMarker}\n`;
      }

      if (q.points) {
        formatted += `${directionMarker}(${q.points} points)${endMarker}\n`;
      }

      if (q.teacherMarks?.feedback) {
        formatted += `${directionMarker}Feedback: ${q.teacherMarks.feedback}${endMarker}\n`;
      }
    } else if (q.type === 'multiple-choice' && q.options) {
      formatted += q.options.map(opt => 
        `${directionMarker}[ ] ${opt}${endMarker}`
      ).join('\n') + '\n';
    }

    return formatted;
  }).join('\n');
}

function parseQuestionType(type: string): QuestionData['type'] {
  type = type.toLowerCase();
  if (type.includes('true') || type.includes('false') || 
      type.includes('صح') || type.includes('خطأ')) {
    return 'true-false';
  }
  if (type.includes('multiple') || type.includes('choice')) {
    return 'multiple-choice';
  }
  if (type.includes('match')) {
    return 'matching';
  }
  if (type.includes('fill') || type.includes('blank')) {
    return 'fill-blank';
  }
  return 'open-ended';
}

function detectLanguage(text: string): string {
  if (/[\u0600-\u06FF]/.test(text)) return 'ara';
  if (/[\u0590-\u05FF]/.test(text)) return 'heb';
  return 'eng';
}

// Add this function to detect true/false format
export function detectTrueFalseFormat(text: string, language: string): TrueFalseFormat | null {
  const formats: { [key: string]: RegExp[] } = {
    checkbox: [/\[\s*\].*(?:T|F|True|False)/i, /\[\s*[✓×]\s*\]/],
    circle: [/\(\s*\).*(?:T|F|True|False)/i, /○.*(?:T|F)/i],
    parentheses: [/\(T\)|\(F\)/i, /\(True\)|\(False\)/i],
    symbol: [/[✓×]/, /[✔✗]/, /[⭕❌]/],
    arabic: [/صح|خطأ/, /\[\s*\].*(?:صح|خطأ)/, /\(\s*\).*(?:صح|خطأ)/],
    hebrew: [/נכון|לא נכון/, /\[\s*\].*(?:נכון|לא נכון)/, /\(\s*\).*(?:נכון|לא נכון)/]
  };

  for (const [formatType, patterns] of Object.entries(formats)) {
    if (patterns.some(pattern => pattern.test(text))) {
      switch (formatType) {
        case 'checkbox':
          return {
            type: 'checkbox',
            trueValue: language === 'ara' ? '[ ] صح' : language === 'heb' ? '[ ] נכון' : '[ ] True',
            falseValue: language === 'ara' ? '[ ] خطأ' : language === 'heb' ? '[ ] לא נכון' : '[ ] False'
          };
        case 'circle':
          return {
            type: 'circle',
            trueValue: language === 'ara' ? '○ صح' : language === 'heb' ? '○ נכון' : '○ True',
            falseValue: language === 'ara' ? '○ خطأ' : language === 'heb' ? '○ לא נכון' : '○ False'
          };
        case 'symbol':
          return {
            type: 'symbol',
            trueValue: '✓',
            falseValue: '×',
            isSymbol: true
          };
        case 'arabic':
          return {
            type: 'arabic',
            trueValue: 'صح',
            falseValue: 'خطأ'
          };
        case 'hebrew':
          return {
            type: 'hebrew',
            trueValue: 'נכון',
            falseValue: 'לא נכון'
          };
        default:
          return {
            type: 'parentheses',
            trueValue: '(T)',
            falseValue: '(F)'
          };
      }
    }
  }
  return null;
}

interface ExamSection {
  name: string;
  points: number;
  instructions?: string;
  questions: QuestionData[];
}

interface ExamStructure {
  metadata: {
    subject: string;
    level: string;
    duration: string;
    totalMarks: number;
    date: string;
  };
  sections: ExamSection[];
}

function parseExamStructure(text: string): ExamStructure {
  // Split into sections based on headers
  const sections = text.split(/(?=SECTION|PART|Reading Comprehension)/i);
  
  const examStructure: ExamStructure = {
    metadata: extractMetadata(sections[0]),
    sections: []
  };

  // Process each section
  for (const section of sections.slice(1)) {
    const parsedSection = parseSection(section);
    if (parsedSection) {
      examStructure.sections.push(parsedSection);
    }
  }

  return examStructure;
}

function extractMetadata(headerText: string) {
  const metadata = {
    subject: '',
    level: '',
    duration: '',
    totalMarks: 0,
    date: ''
  };

  // Extract using regex patterns
  const subjectMatch = headerText.match(/(\w+\s+Language|\w+\s+Studies)/i);
  const levelMatch = headerText.match(/(Scientific|Humanities|Grade \d+)/i);
  const durationMatch = headerText.match(/Time\s*:\s*(\d+:\d+)/i);
  const marksMatch = headerText.match(/Total\s+Marks\s*\((\d+)\)/i);
  const dateMatch = headerText.match(/Date\s*:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);

  if (subjectMatch) metadata.subject = subjectMatch[1];
  if (levelMatch) metadata.level = levelMatch[1];
  if (durationMatch) metadata.duration = durationMatch[1];
  if (marksMatch) metadata.totalMarks = parseInt(marksMatch[1]);
  if (dateMatch) metadata.date = dateMatch[1];

  return metadata;
}

function parseQuestionBlock(block: string): QuestionData | null {
  try {
    const lines = block.trim().split('\n').map(l => l.trim());
    if (lines.length === 0) return null;

    const questionData: Partial<QuestionData> = {
      language: detectLanguage(lines[0] || ''),
      text: lines[0]?.replace(/^\d+\.\s*/, '') || '',
      type: 'open-ended'
    };

    // Look for point values
    const pointsMatch = block.match(/\((\d+)\s*(?:points|marks|نقاط)\)/i);
    if (pointsMatch) {
      questionData.points = parseInt(pointsMatch[1]);
    }

    // Detect true/false questions
    const tfFormat = questionData.language ? 
      detectTrueFalseFormat(block, questionData.language) : 
      null;
    if (tfFormat) {
      questionData.type = 'true-false';
      questionData.format = tfFormat;
    }

    // Detect multiple choice
    const hasOptions = /(?:[A-D]|\([A-D]\)|\d+)\)\s+/i.test(block);
    if (hasOptions) {
      questionData.type = 'multiple-choice';
      questionData.options = block
        .split(/(?:[A-D]|\([A-D]\)|\d+)\)\s+/i)
        .slice(1)
        .map(opt => opt.trim())
        .filter(opt => opt);
    }

    return questionData as QuestionData;
  } catch (error) {
    console.warn('Failed to parse question block:', error);
    return null;
  }
}

function parseSection(sectionText: string): ExamSection | null {
  const nameMatch = sectionText.match(/^([^(]+)(?:\((\d+)[^)]*\))?/m);
  if (!nameMatch) return null;

  const section: ExamSection = {
    name: nameMatch[1].trim(),
    points: nameMatch[2] ? parseInt(nameMatch[2]) : 0,
    questions: []
  };

  // Extract instructions
  const instructionsMatch = sectionText.match(/Instructions?:([^]*?)(?=Question|\d+\.)/i);
  if (instructionsMatch) {
    section.instructions = instructionsMatch[1].trim();
  }

  // Extract questions
  const questionBlocks = sectionText.split(/(?=\d+\.|\([a-z]\))/i);
  for (const block of questionBlocks) {
    const question = parseQuestionBlock(block);  // Use parseQuestionBlock instead of questionBlocks
    if (question) {
      section.questions.push(question);
    }
  }

  return section;
}

function calculateAverageConfidence(lines: any[]): number {
  if (!lines || lines.length === 0) return 0;
  
  let totalConfidence = 0;
  let validLines = 0;

  for (const line of lines) {
    if (line && typeof line.confidence === 'number') {
      totalConfidence += line.confidence;
      validLines++;
    }
  }

  return validLines > 0 ? totalConfidence / validLines : 0;
}

function determineSegmentType(region: any): ImageSegment['type'] | null {
  if (!region || !region.lines) return null;

  const text = region.lines.map((l: any) => l.text || '').join(' ').toLowerCase();
  
  // Check for headers
  if (/^(section|part|question|instructions?)/i.test(text)) {
    return 'header';
  }

  // Check for instructions
  if (/^(note|please|read|answer|write|choose|select)/i.test(text)) {
    return 'instructions';
  }

  // Check for handwriting (usually student answers)
  if (region.lines.some((l: any) => l.appearance?.style === 'handwriting')) {
    return 'handwriting';
  }

  // Check for questions
  if (/^(\d+[\.)]\s|[A-Z][\.)]\s|\([0-9]+\))/i.test(text)) {
    return 'question';
  }

  // Check for answers
  if (/^(answer|solution|response):/i.test(text) || 
      /[\[\(\{□○]/.test(text) || // Common answer markers
      text.includes('true') || text.includes('false') ||
      text.includes('صح') || text.includes('خطأ') ||
      text.includes('נכון') || text.includes('לא נכון')) {
    return 'answer';
  }

  return null;
}

function extractMathematicalContent(base64Image: string, arg1: { primaryLanguage: string; direction: "rtl" | "ltr"; }): any {
  throw new Error('Function not implemented.');
}

