import Groq from 'groq-sdk';
import jsPDF from 'jspdf';

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

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
  en: `You are Spark, a teaching assistant for SparkSkool.
  
Your greeting should be exactly and only: "Hello! I'm Spark. How can I help you today?"

Keep all responses extremely brief (1-2 short sentences max). 

Do not explain your capabilities unless specifically asked.
When asked to perform a task, simply say "I'll handle that for you" and get to work.

Reply in English.`,

  ar: `أنت سبارك، مساعد تعليمي لـ SparkSkool.
  
تحيتك يجب أن تكون بالضبط وفقط: "مرحباً! أنا سبارك. كيف يمكنني مساعدتك اليوم؟"

اجعل جميع ردودك موجزة للغاية (1-2 جمل قصيرة كحد أقصى).

لا تشرح قدراتك إلا إذا طُلب منك ذلك تحديداً.
عندما يُطلب منك أداء مهمة، قل ببساطة "سأتولى ذلك من أجلك" وابدأ العمل.

الرجاء الرد باللغة العربية.`,

  he: `אתה ספארק, עוזר הוראה עבור SparkSkool.
  
הברכה שלך צריכה להיות בדיוק ורק: "שלום! אני ספארק. איך אוכל לעזור לך היום?"

שמור על כל התשובות קצרות ביותר (1-2 משפטים קצרים לכל היותר).

אל תסביר את היכולות שלך אלא אם התבקשת במפורש.
כאשר מבקשים ממך לבצע משימה, פשוט אמור "אטפל בזה עבורך" והתחל לעבוד.

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
      model: 'mixtral-8x7b-32768',
      temperature: 0.7,
      max_tokens: 2048,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Chat error:', error);
    throw error;
  }
};

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