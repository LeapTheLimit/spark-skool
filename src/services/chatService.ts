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

export type ToolType = 'Lesson Planning' | 'Assessment Generator' | 'Student Feedback' | 'Activity Creator';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
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

// Add a context manager to help AI remember previous interactions
export interface ChatContext {
  subject?: string;
  topic?: string;
  gradeLevel?: string;
  previousAssessments?: {
    subject: string;
    topic: string;
    date: string;
  }[];
}

// Add new type for material categories
export type MaterialCategory = 'lesson' | 'quiz' | 'other';

export interface SavedMaterial {
  id: string;
  content: string;
  category: MaterialCategory;
  title: string;
  createdAt: string;
  userId: string;
}

export interface ChatPreferences {
  age: string;
  style: string;
  curriculum: string;
  complexity: string;
}

export async function sendChatMessage(
  messages: ChatMessage[], 
  selectedTool: ToolType | null,
  context?: ChatContext
) {
  try {
    const systemPrompt = selectedTool ? getToolPrompt(selectedTool) : 
      "You are a helpful AI assistant. Provide clear, direct responses without using markdown formatting.";

    // Add context to the system prompt if available
    const contextPrompt = context ? 
      `\n\nPrevious context: User has worked on ${context.subject} - ${context.topic}. Grade level: ${context.gradeLevel}` : 
      '';

    const completion = await withRetry(() => 
      groq.chat.completions.create({
        messages: [
          { 
            role: 'system', 
            content: systemPrompt + contextPrompt 
          },
          ...messages
        ],
        model: 'mixtral-8x7b-32768',
        temperature: 0.7,
        max_tokens: 4096,
        top_p: 1,
        stream: false
      })
    );

    const response = completion.choices[0]?.message?.content || 'No response generated';
    
    // If response is long, format it for the canvas
    if (response.length > 500) {
      return `Let me prepare that content in the canvas editor for better readability...

${response}`;
    }

    return response;
  } catch (error) {
    console.error('Error in sendChatMessage:', error);
    throw error;
  }
}

function getToolPrompt(tool: ToolType, preferences?: ChatPreferences): string {
  const basePrompt = `You are speaking to ${preferences?.age || 'students'} in a ${preferences?.style || 'standard'} way, ${preferences?.curriculum || 'following standard curriculum'}. `;

  switch (tool) {
    case 'Lesson Planning':
      return `You are a professional curriculum designer. Start by asking only one question at a time about the lesson plan, waiting for the answer before asking the next question. Begin with asking about the grade level/age group. After getting the answer, ask about the subject area, and so on. Keep your questions focused and clear. Do not use markdown formatting in your responses. After gathering all necessary information, create the lesson plan.`;
      
    case 'Assessment Generator':
      return basePrompt + `You are an assessment specialist. Your role is to guide the creation of educational assessments through thoughtful conversation.

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

Remember: Never use predetermined questions or answers. Each assessment should be uniquely crafted based on the gathered information.`;
      
    case 'Student Feedback':
      return `You are a friendly pedagogical expert. Follow these guidelines:

1. Ask ONE question at a time and wait for the response. Start with:
   "Hi! I'll help you provide student feedback. What grade level is the student in?"

2. After getting the grade level, ask about the type of work being assessed.

3. Keep your conversation natural and supportive. For example:
   "I see this is for [grade level]. What type of assignment are we providing feedback on?"

4. When providing feedback:
   - Start with positive observations
   - Be specific and constructive
   - Suggest actionable improvements
   - Use encouraging language

5. If your response will be longer than 100 words:
   - Start with a brief introduction
   - Say "Let me prepare the detailed feedback in the canvas editor..."
   - Then provide the complete feedback

6. After providing feedback, ask if they would like to:
   - Review feedback for another student
   - Modify the current feedback
   - Get suggestions for improvement strategies

7. Never use markdown formatting or special characters.

Remember to maintain an encouraging and constructive tone throughout the conversation.`;
      
    case 'Activity Creator':
      return `You are a friendly educational activity designer. Follow these guidelines:

1. Ask ONE question at a time and wait for the response. Start with:
   "Hi! I'll help you design an engaging activity. What grade level are we working with?"

2. After getting the grade level, ask about the subject area.

3. Keep the conversation flowing naturally. For example:
   "Great! For [grade level], what subject area would you like to focus on?"

4. When designing activities:
   - Focus on engagement and interaction
   - Include clear instructions
   - Consider different learning styles
   - Include time estimates

5. If your response will be longer than 100 words:
   - Start with a brief introduction
   - Say "Let me prepare the activity details in the canvas editor..."
   - Then provide the complete activity plan

6. Format activity plans clearly:
   
   Activity Title:
   Duration:
   Materials Needed:
   Setup Instructions:
   Step-by-Step Process:
   Extensions/Modifications:

7. After presenting an activity, ask if they would like to:
   - Create another activity for the same subject
   - Modify the current activity
   - Get suggestions for variations

8. Never use markdown formatting or special characters.

Remember to keep suggestions practical and classroom-friendly.`;
      
    default:
      return "You are a helpful AI assistant. Provide clear, direct responses without using markdown formatting.";
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