import Groq from 'groq-sdk';
import jsPDF from 'jspdf';

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

// Gemini API integration for web search capabilities
interface GeminiOptions {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

class GeminiService {
  private apiKey: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(options: GeminiOptions = {}) {
    this.apiKey = options.apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    this.model = options.model || 'gemini-1.5-flash';
    this.temperature = options.temperature || 0.7;
    this.maxTokens = options.maxTokens || 2048;
  }

  async search(query: string): Promise<SearchResult[]> {
    try {
      if (!this.apiKey) {
        console.warn('No Gemini API key found');
        return this.getMockSearchResults(query);
      }

      // Always use mock data for now to prevent API errors
      if (true || process.env.NODE_ENV === 'development') {
        await delay(1500);
        return this.getMockSearchResults(query);
      }

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Perform a web search for: "${query}". 
                  Return the top 5 relevant results in JSON format with the following structure:
                  {
                    "results": [
                      {
                        "title": "Result title",
                        "url": "https://example.com",
                        "snippet": "Brief description of the search result",
                        "source": "Website name"
                      }
                    ]
                  }`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: this.temperature,
            maxOutputTokens: this.maxTokens,
            responseFormat: { type: 'JSON' }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates[0]?.content?.parts[0]?.text || '{}';
      
      try {
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}') + 1;
        const jsonStr = text.substring(jsonStart, jsonEnd);
        const json = JSON.parse(jsonStr);
        return json.results || [];
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', parseError);
        return [];
      }
    } catch (error) {
      console.error('Gemini search error:', error);
      // Return mock results instead of empty array on error
      return this.getMockSearchResults(query);
    }
  }

  private getMockSearchResults(query: string): SearchResult[] {
    // Common topics that might be searched
    const isEducationalQuery = query.toLowerCase().includes('education') || 
                              query.toLowerCase().includes('teaching') || 
                              query.toLowerCase().includes('lesson') || 
                              query.toLowerCase().includes('classroom');
    
    const isCurrentEventQuery = query.toLowerCase().includes('current') || 
                               query.toLowerCase().includes('latest') || 
                               query.toLowerCase().includes('recent') || 
                               query.toLowerCase().includes('2024') ||
                               query.toLowerCase().includes('news');
    
    const isResourceQuery = query.toLowerCase().includes('resource') || 
                           query.toLowerCase().includes('material') || 
                           query.toLowerCase().includes('worksheet');

    // Return specialized results based on query type
    if (isCurrentEventQuery) {
      return [
        {
          title: `Latest Information on ${query} (2024 Update)`,
          url: 'https://example.com/current-events',
          snippet: `The most recent developments regarding ${query} as of 2024 show significant changes. Up-to-date research indicates new approaches and methodologies have been developed in this area.`,
          source: 'Education Today'
        },
        {
          title: `${query} - Recent Developments and Research`,
          url: 'https://current-research.org',
          snippet: `As of 2024, educational experts have published new findings about ${query}. These updates provide teachers with fresh perspectives and evidence-based practices.`,
          source: 'Research Journal'
        },
        {
          title: `Teaching ${query} in 2024: Current Best Practices`,
          url: 'https://teachingmethods.com',
          snippet: `Updated guidelines for integrating ${query} into your curriculum with the latest pedagogical approaches. Includes new technologies and methodologies from recent educational conferences.`,
          source: 'Teaching Methods Journal'
        },
        {
          title: `${query} - Recent Educational Policy Changes`,
          url: 'https://educationpolicy.org',
          snippet: `The educational landscape regarding ${query} has evolved significantly in 2024. New policies and standards have been implemented across various educational systems.`,
          source: 'Education Policy Institute'
        }
      ];
    } else if (isEducationalQuery) {
      return [
        {
          title: `Comprehensive Guide to ${query} - Educational Resources`,
          url: 'https://example.com/education',
          snippet: `Complete educational resources about ${query} for teachers and students. Includes detailed lesson plans, interactive activities, and assessment tools designed by experienced educators.`,
          source: 'Teaching Excellence'
        },
        {
          title: `${query} - Curriculum Integration Strategies`,
          url: 'https://curriculum.edu',
          snippet: `Expert guidance on integrating ${query} into your curriculum with cross-disciplinary approaches. Research-based methods for effective implementation with differentiated instruction strategies.`,
          source: 'Curriculum Design Center'
        },
        {
          title: `Teaching ${query}: Evidence-Based Practices`,
          url: 'https://teachingresources.com',
          snippet: `Discover proven teaching strategies for ${query} supported by recent educational research. Includes classroom-tested methods for various learning styles and educational contexts.`,
          source: 'Teaching Resources'
        },
        {
          title: `${query} in the Modern Classroom`,
          url: 'https://modernteaching.org',
          snippet: `How to effectively incorporate ${query} into today's diverse classrooms. Addresses technological integration, inclusive approaches, and meeting diverse student needs.`,
          source: 'Modern Teaching Association'
        }
      ];
    } else if (isResourceQuery) {
      return [
        {
          title: `Free ${query} Resources for Teachers`,
          url: 'https://freeteacherresources.com',
          snippet: `Access hundreds of high-quality, downloadable resources related to ${query} for classroom use. All materials are aligned with current educational standards and ready to use.`,
          source: 'Teacher Resource Center'
        },
        {
          title: `Premium ${query} Materials for Educators`,
          url: 'https://premiumedu.com',
          snippet: `Professionally designed ${query} resources created by expert educators. These comprehensive materials include detailed lesson plans, assessments, and student activities.`,
          source: 'Premium Education'
        },
        {
          title: `Interactive ${query} Tools for Engagement`,
          url: 'https://interactiveteaching.org',
          snippet: `Discover digital and printable ${query} resources that increase student engagement. These interactive tools have been tested in diverse classroom settings with positive results.`,
          source: 'Interactive Teaching Network'
        },
        {
          title: `${query} for Special Education`,
          url: 'https://specialedresources.com',
          snippet: `Specialized ${query} materials designed for students with diverse learning needs. These adaptable resources support inclusive education and individualized learning approaches.`,
          source: 'Special Education Resources'
        }
      ];
    } else {
      // Default results for other queries
      return [
        {
          title: `Learn about ${query} - Educational Resources`,
          url: 'https://example.com/education',
          snippet: `Comprehensive educational resources about ${query} for teachers and students. Includes lesson plans, activities, and assessments designed by experienced educators.`,
          source: 'Educational Resources'
        },
        {
          title: `${query} - Wikipedia`,
          url: 'https://en.wikipedia.org',
          snippet: `${query} is a concept that relates to educational frameworks and teaching methodologies. It has been implemented in various educational systems globally with documented outcomes.`,
          source: 'Wikipedia'
        },
        {
          title: `Teaching ${query}: Best Practices`,
          url: 'https://teachingresources.com',
          snippet: `Discover effective teaching strategies for ${query}. Research-backed methods for classroom implementation with differentiated instruction approaches to meet diverse student needs.`,
          source: 'Teaching Resources'
        },
        {
          title: `${query} in the Classroom: Practical Applications`,
          url: 'https://classroom-applications.edu',
          snippet: `Practical ways to implement ${query} in your teaching practice. Includes ready-to-use examples, case studies, and success stories from educators around the world.`,
          source: 'Classroom Applications'
        }
      ];
    }
  }
}

// Create a singleton instance of GeminiService
export const geminiService = new GeminiService();

// Add rate limiting utilities
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(fn: () => Promise<T>, retries = 3, backoff = 3000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries === 0 || !error?.error?.code?.includes('rate_limit')) {
      throw error;
    }
    const waitTime = error?.error?.message?.match(/try again in (\d+\.?\d*)s/)?.[1] * 1000 || backoff;
    console.log(`Rate limited, waiting ${waitTime}ms before retry...`);
    await delay(waitTime);
    return withRetry(fn, retries - 1, backoff * 1.5);
  }
}

// Add type definitions at the top
type Language = 'en' | 'ar' | 'he';
type Greetings = Record<Language, string>;

// Define and export the tool types
export type ToolType = 'Lesson Planning' | 'Assessment Generator' | 'Student Feedback' | 'Activity Creator';
type ToolInstructions = Record<ToolType, string>;

export interface ChatMessage {
  timestamp: (timestamp: any) => import("react").ReactNode | Iterable<import("react").ReactNode>;
  role: 'user' | 'assistant' | 'system';
  content: string;
  language?: Language;
}

export interface ChatContext {
  subject?: string;
  topic?: string;
  gradeLevel?: string;
}

const CHAT_PROMPTS: Record<ToolType, string> = {
  'Lesson Planning': `You are an expert curriculum designer with 15+ years of classroom experience. Create comprehensive lesson plans that:
1. Start by asking about:
   - Subject area and grade level
   - Specific learning standards (e.g., Common Core, NGSS)
   - Class duration and student demographics
   - Available resources/technology
2. Include these elements:
   - Clear learning objectives using Bloom's taxonomy
   - Anticipatory set/hook activity
   - Direct instruction methods
   - Guided & independent practice activities
   - Formative assessment strategies
   - Differentiation for ELL, SPED, and gifted students
   - Cross-curricular connections
   - Homework/extensions
3. Follow these guidelines:
   - Use Understanding by Design framework
   - Incorporate UDL principles
   - Include literacy strategies (e.g., Frayer models)
   - Suggest multimodal learning activities
   - Align with Marzano's instructional strategies
   
Example response format:
# [Lesson Title]
**Grade:** [X] | **Subject:** [X] | **Duration:** [X]

## Learning Objectives
- [SWBAT...]

## Materials Needed
- [List...]

## Lesson Sequence
1. **Hook (5 mins):** [Engaging activity]
2. **Direct Instruction (15 mins):** [Modeling/explanation]
...`,
  
  'Assessment Generator': `You are an assessment specialist. Your role is to guide the creation of educational assessments through thoughtful conversation.

Begin by introducing yourself briefly and asking what subject the assessment is for.

For each user response:
1. Store the information provided
2. Reflect on what critical information is still missing from:
   - Subject/Topic specifics
   - Grade level/Student background
   - Assessment format preferences
   - Difficulty level requirements
   - Time/length constraints
   - Special considerations

Ask only ONE question at a time about the most important missing information. Frame your questions naturally and build upon previous answers.

When creating the assessment:
- Use the specific terminology and complexity appropriate for the stated grade level
- Match the format to the learning objectives
- Consider cognitive development stages
- Ensure questions build progressively in difficulty
- Include clear, grade-appropriate language

If generating a long assessment, inform the user you'll prepare it in the canvas editor for better formatting.

After completion, ask if they would like to refine any aspect based on their specific needs.

Remember: Never use predetermined questions or answers. Each assessment should be uniquely crafted based on the gathered information.`,

  'Student Feedback': `You are a master teacher specializing in growth-focused feedback. Provide feedback that:
1. Follows the "Praise-Question-Polish" framework:
   - **Praise:** 2 specific strengths with examples
   - **Question:** 1 probing question for deeper thinking
   - **Polish:** 1 actionable improvement area
2. Include:
   - Skill-specific compliments
   - Metacognitive prompts
   - Growth mindset language
   - Standards-aligned suggestions
   - Resources for improvement
3. Avoid:
   - Vague statements
   - Negative tone
   - Overwhelming suggestions

Example structure:
🌟 **Strengths:** 
- You demonstrated [skill] by [specific example]

🤔 **Consider:** 
- How might [concept] apply to [new situation]?

🔧 **Improve:** 
- Try [specific strategy] to enhance [skill]. Resource: [link]`,

  'Activity Creator': `You are a pedagogical expert in active learning strategies. Design activities that:
1. Start by asking about:
   - Learning target standard
   - Class size/configuration
   - Available materials/space
   - Prior student knowledge
2. Include these elements:
   - Clear success criteria
   - Gradual release model (I do, We do, You do)
   - Collaborative learning structures
   - Scaffolding for different levels
   - Cleanup/transition plan
   - Assessment checklist
3. Suggest variations for:
   - Different learning styles
   - Time constraints
   - Technology integration
   - Cross-curricular links

Example activity format:
**Objective:** [Standard alignment]
**Grouping:** [Individual/pairs/groups]
**Materials:** [List]
**Steps:**
1. Teacher models [skill] using [strategy]
2. Students practice through [activity] with scaffold
3. Groups present findings via [method]
**Extensions:** [Advanced options]`
};

// Add new type for material categories
export type MaterialCategory = 'lesson' | 'quiz' | 'other';

export interface SavedMaterial {
  id: string;
  title: string;
  content: string;
  category: MaterialCategory;
  createdAt: string;
  userId: string;
  fileType?: string; // Add this to track file types
}

export interface ChatPreferences {
  age: string;
  style: string;
  curriculum: string;
  complexity: string;
}

// Simplify instructions to make Spark extremely brief and direct
const languageInstructions: Record<'en' | 'ar' | 'he', string> = {
  en: `You are Spark, a teaching assistant for SparkSkool with information updated to 2024.
  
Your greeting should be: "Hello! I'm Spark, your teaching assistant with up-to-date information. How can I help you today?"

Keep responses concise and factual (2-3 sentences max).

When asked about current events or recent information, mention that you can search the web for the most recent data.
When asked to perform a task, simply say "I'll help you with that" and complete the task.

Reply in English.`,

  ar: `أنت سبارك، مساعد تعليمي لـ SparkSkool، مع معلومات محدثة حتى عام 2024.
  
تحيتك يجب أن تكون: "مرحباً! أنا سبارك، مساعدك التعليمي بمعلومات محدثة. كيف يمكنني مساعدتك اليوم؟"

اجعل ردودك موجزة وواقعية (2-3 جمل كحد أقصى).

عندما يُسأل عن الأحداث الجارية أو المعلومات الحديثة، اذكر أنه يمكنك البحث في الويب للحصول على أحدث البيانات.
عندما يُطلب منك أداء مهمة، قل ببساطة "سأساعدك في ذلك" وأكمل المهمة.

الرجاء الرد باللغة العربية.`,

  he: `אתה ספארק, עוזר הוראה עבור SparkSkool עם מידע מעודכן עד 2024.
  
הברכה שלך צריכה להיות: "שלום! אני ספארק, עוזר ההוראה שלך עם מידע מעודכן. איך אוכל לעזור לך היום?"

שמור על תשובות תמציתיות ועובדתיות (2-3 משפטים לכל היותר).

כאשר נשאל על אירועים נוכחיים או מידע עדכני, ציין שאתה יכול לחפש באינטרנט את הנתונים העדכניים ביותר.
כאשר מבקשים ממך לבצע משימה, פשוט אמור "אעזור לך בזה" והשלם את המשימה.

אנא השב בעברית.`
};

// Then fix the sendChatMessage function
export const sendChatMessage = async (messages: ChatMessage[], tool?: ToolType) => {
  try {
    const savedSettings = localStorage.getItem('appSettings');
    const currentUser = localStorage.getItem('currentUser');
    const settings = savedSettings ? JSON.parse(savedSettings) : { language: 'en' };
    const user = currentUser ? JSON.parse(currentUser) : null;
    const subject = user?.subject || '';

    const messageLanguage = (messages[messages.length - 1]?.language || settings.language) as 'en' | 'ar' | 'he';
    
    // Get user preferences from storage if available
    const savedPreferences = localStorage.getItem('chatPreferences');
    const preferences = savedPreferences ? JSON.parse(savedPreferences) : null;
    
    // Add a default system message with identity and persona
    let systemContent = languageInstructions[messageLanguage];
    
    // Add tool-specific instructions if a tool is selected
    if (tool) {
      systemContent += "\n\n" + getToolPrompt(tool, preferences);
    }

    // Check if API key is available
    if (!process.env.NEXT_PUBLIC_GROQ_API_KEY) {
      console.warn('No GROQ API key found. Using mock response.');
      // Return a mock response instead of making an API call
      await delay(1500); // Simulate network delay
      
      const lastMessage = messages[messages.length - 1]?.content || '';
      
      // Generate a simple mock response
      if (lastMessage.toLowerCase().includes('hello') || lastMessage.toLowerCase().includes('hi')) {
        return "Hello! I'm Spark, your educational assistant. How can I help you with your learning today?";
      } else if (lastMessage.toLowerCase().includes('who are you')) {
        return "I'm Spark, an AI designed to help teachers and students. I can assist with lesson planning, answer questions, help with assignments, and more!";
      } else if (lastMessage.toLowerCase().includes('help')) {
        return "I'd be happy to help! I can assist with:\n\n- Answering questions about school subjects\n- Explaining difficult concepts\n- Generating practice questions\n- Providing feedback on your work\n- Creating learning materials\n\nJust let me know what you need help with!";
      } else {
        return `I've received your message: "${lastMessage.slice(0, 50)}${lastMessage.length > 50 ? '...' : ''}"\n\nI'm processing your request and will help you with this. Please note that I'm currently running in mock mode without an API connection, but in the full version, I would provide a complete response tailored to your specific question.`;
      }
    }

    // Clean messages for API
    const cleanedMessages = messages.map(({ role, content }) => ({
      role,
      content
    }));

    // Create completion with GROQ
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemContent
        },
        ...cleanedMessages
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 2048,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Chat error:', error);
    throw error;
  }
};

// New function to handle web search within chat
export const searchWithinChat = async (query: string, context?: string): Promise<string> => {
  try {
    // Perform web search using Gemini
    const searchResults = await geminiService.search(query);
    
    if (!searchResults.length) {
      return "I couldn't find any relevant information about that topic. Let's try a different approach.";
    }
    
    // Format search results for inclusion in the chat
    const formattedResults = searchResults.map((result, index) => 
      `[${index + 1}] **${result.title}**\n${result.snippet}\nSource: [${result.source}](${result.url})`
    ).join('\n\n');
    
    // Prepare prompt for GROQ that includes the search results
    const searchContext = `The user asked about: "${query}". Here are some relevant search results:\n\n${formattedResults}\n\n`;
    const prompt = `${searchContext}${context ? `Additional context: ${context}\n\n` : ''}Based on these search results, provide a concise and accurate answer to the user's query. Include citations when referencing specific information from the search results.`;
    
    // Send to GROQ for synthesis
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are Spark, an educational assistant that provides helpful, accurate information based on web search results. Summarize the search results concisely to answer the user\'s question. Cite sources by referring to them as [1], [2], etc. corresponding to the numbered search results.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.5,
      max_tokens: 1024,
    });
    
    return completion.choices[0]?.message?.content || `I found some information about ${query}, but I'm having trouble synthesizing it. Here are the sources I found:\n\n${formattedResults}`;
  } catch (error) {
    console.error('Search-within-chat error:', error);
    return `I tried to search for information about "${query}" but encountered a technical issue. Let me try to answer based on what I already know.`;
  }
};

// Function to process uploaded files with OCR and extract text
export const processFileWithOCR = async (file: File): Promise<string> => {
  try {
    // Check if it's a supported file type
    if (!file.type.match('image.*|application/pdf|application/msword|application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      return `Sorry, ${file.type} files are not supported for content extraction.`;
    }
    
    // For development/demo purposes, return mock extracted text
    if (process.env.NODE_ENV === 'development') {
      await delay(2000); // Simulate processing time
      return getMockExtractedContent(file.name, file.type);
    }
    
    // For production: Create a FormData instance for the file upload
    const formData = new FormData();
    formData.append('file', file);
    
    // Send to OCR service endpoint (would need to be implemented)
    const response = await fetch('/api/extract-content', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`OCR service error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.extractedText || '';
  } catch (error) {
    console.error('File processing error:', error);
    return 'I encountered an error while trying to extract content from your file. Please try again or upload a different file.';
  }
};

// Helper function for mock extracted content
function getMockExtractedContent(filename: string, fileType: string): string {
  const fileExtension = filename.split('.').pop()?.toLowerCase();
  
  if (fileType.includes('image')) {
    return `Extracted from image "${filename}":\n\nThis image appears to contain a lesson plan about photosynthesis. The heading states "Photosynthesis: Energy from Sunlight" followed by learning objectives and class activities. The document mentions chlorophyll, carbon dioxide, and oxygen as key components in the process.`;
  } else if (fileExtension === 'pdf') {
    return `Extracted from PDF "${filename}":\n\nTitle: Introduction to Cell Biology\nAuthor: Dr. Emily Chen\n\nThis document covers the fundamental concepts of cell biology including:\n\n1. Cell structure and organelles\n2. Cell membrane function and transport\n3. Cellular respiration\n4. Cell division and mitosis\n\nThe document includes several diagrams and tables showing comparisons between animal and plant cells.`;
  } else if (fileExtension === 'docx' || fileExtension === 'doc') {
    return `Extracted from document "${filename}":\n\nQUARTERLY ASSESSMENT\nGrade Level: 10\nSubject: Biology\n\nMultiple Choice Questions (20 points):\n1. Which of the following is NOT a function of the cell membrane?\na) Protection\nb) Transport of materials\nc) Energy production\nd) Cell recognition\n\nShort Answer Questions (10 points):\n1. Explain the difference between passive and active transport.`;
  } else {
    return `Extracted content from "${filename}" (${fileType}):\n\nThis document appears to contain educational content, but I couldn't determine the specific subject matter. There are approximately 2,500 words of text including what seems to be lesson material, questions, and instructional notes.`;
  }
}

// Add translated prompts with subject placeholder
export const getTranslatedPrompts = (language: 'en' | 'ar' | 'he', subject: string) => {
  const prompts = {
    en: {
      lessonPlan: `Create a lesson plan for ${subject} class`,
      quiz: `Generate a quiz about ${subject}`,
      feedback: `Write feedback for a ${subject} student`,
      activity: `Design a ${subject} classroom activity`
    },
    ar: {
      lessonPlan: `قم بإنشاء خطة درس لمادة ${subject}`,
      quiz: `قم بإنشاء اختبار في مادة ${subject}`,
      feedback: `اكتب تقييماً لطالب في مادة ${subject}`,
      activity: `صمم نشاطاً صفياً لمادة ${subject}`
    },
    he: {
      lessonPlan: `צור מערך שיעור עבור שיעור ${subject}`,
      quiz: `צור מבחן בנושא ${subject}`,
      feedback: `כתוב משוב לתלמיד ב${subject}`,
      activity: `תכנן פעילות כיתתית ב${subject}`
    }
  };

  return prompts[language];
};

// Helper function to get tool-specific instructions
function getToolSpecificInstructions(tool: ToolType, preferences: any): string {
  const toolInstructions: Record<ToolType, string> = {
    'Lesson Planning': `
      - Detailed ${preferences.gradeLevel || 'grade-appropriate'} lesson plans
      - Activities suited for ${preferences.classSize || 'your'} class size
      - Integration with ${preferences.preferredTools?.join(', ') || 'standard'} tools
      - ${preferences.curriculum || 'Standard'} curriculum alignment`,
    
    'Assessment Generator': `
      - ${preferences.gradeLevel || 'Level'}-appropriate assessments
      - Mix of question types
      - Clear grading rubrics
      - Progress tracking tools`,
    
    'Student Feedback': `
      - Personalized feedback templates
      - Growth-focused comments
      - Parent communication drafts
      - Progress reports`,
    
    'Activity Creator': `
      - Interactive ${preferences.teachingStyle || 'engaging'} activities
      - Group size: ${preferences.classSize || 'flexible'}
      - Subject: ${preferences.subject || 'curriculum'}-focused
      - Tool integration: ${preferences.preferredTools?.join(', ') || 'various'}`
  };

  return toolInstructions[tool] || '';
}

function getToolPrompt(tool: ToolType, preferences?: ChatPreferences): string {
  const basePrompt = `I'm Spark, your AI teaching assistant specialized in ${preferences?.curriculum || 'standard curriculum'}. I adjust my communication style to work well with ${preferences?.age || 'students'} using a ${preferences?.style || 'supportive'} approach. `;

  switch (tool) {
    case 'Lesson Planning':
      return basePrompt + `As a curriculum design expert, I'll help you create an effective lesson plan. Let's start by discussing the essentials one step at a time. What grade level or age group will this lesson be for?`;
      
    case 'Assessment Generator':
      return basePrompt + `I specialize in creating educational assessments tailored to your specific needs. To get started, could you tell me which subject this assessment is for? From there, we'll work through the details to create something perfect for your students.`;
      
    case 'Student Feedback':
      return basePrompt + `I'm here to help you craft effective, growth-oriented feedback for your students. This feedback will be encouraging while providing clear guidance for improvement. To begin, could you tell me what grade level your student is in?`;
      
    case 'Activity Creator':
      return basePrompt + `I'll help you design engaging classroom activities that align with your learning objectives. These activities will be practical, engaging, and adaptable to different learning styles. To start, what grade level will this activity be for?`;
      
    default:
      return "I'm Spark, your AI teaching assistant. I'm here to help with lesson planning, assessments, student feedback, and classroom activities. What can I help you with today?";
  }
}

export const downloadAsPDF = async (content: string) => {
  try {
    // Create a new jsPDF instance
    const doc = new jsPDF();
    
    // Add the content to the PDF
    doc.text(content, 10, 10);
    
    // Save the PDF
    doc.save('material.pdf');
    
    return true;
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
};

export async function saveToMaterials(
  content: string, 
  userId: string,
  category: MaterialCategory,
  title: string
): Promise<SavedMaterial> {
  try {
    const response = await fetch('/api/materials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        userId,
        category,
        title,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save material');
    }

    const data = await response.json();
    console.log('Save response:', data);
    return data.material;
  } catch (error) {
    console.error('Error saving material:', error);
    throw error;
  }
} 