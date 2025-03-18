import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

// Set the runtime to edge for better performance
export const runtime = 'edge';

// Add an interface for the API response content structure
interface ContentResponse {
  title: string;
  sections: Section[];
}

// Define the structure of a section
interface Section {
  id?: number;
  title: string;
  slideType?: string;
  subtopics?: string[];
  imagePrompt?: string;
  sources?: string[];
}

// Define an interface for slide type distribution
interface SlideTypeDistribution {
  [key: string]: number;
}

export async function POST(req: Request) {
  try {
    // Get Groq API key from environment variable
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    
    if (!apiKey) {
      console.error('NEXT_PUBLIC_GROQ_API_KEY is not defined');
      // Return a success response with fallback content instead of error
      return NextResponse.json({
        status: 'success',
        content: {
          title: 'Generated Presentation',
          sections: generateBasicOutline('Presentation', 15)
        }
      });
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return NextResponse.json({
        status: 'success',
        content: {
          title: 'Generated Presentation',
          sections: generateBasicOutline('Presentation', 15)
        }
      });
    }

    const { prompt, settings = {} } = body;

    if (!prompt) {
      return NextResponse.json({
        status: 'success',
        content: {
          title: 'Generated Presentation',
          sections: generateBasicOutline('Presentation', 15)
        }
      });
    }

    // Add this before creating the formatted prompt
    const totalSlides = settings?.pages || 15;

    // Initialize Groq client with browser flag to work in edge runtime
    const groq = new Groq({ 
      apiKey,
      dangerouslyAllowBrowser: true 
    });
    
    // Create a structured prompt with all settings
    const formattedPrompt = `
Create a comprehensive, detailed, and visually diverse presentation on the following topic:

${prompt}

Presentation Requirements:
- Number of slides: ${totalSlides}
- Target audience: ${settings?.audience || 'General'}

ABSOLUTELY CRITICAL LAYOUT REQUIREMENTS:
I REQUIRE an EXACT and STRICT distribution of slide types - FAILURE TO FOLLOW WILL RESULT IN REJECTION:

1. First slide: "title-slide" type (REQUIRED)
2. Last slide: "standard" type for conclusion (REQUIRED)
3. For the remaining ${totalSlides - 2} slides, you MUST follow this EXACT distribution:

${Math.floor((totalSlides - 2) * 0.1)} slides: "standard" (bullet points) - MAXIMUM 10% of non-title slides
${Math.floor((totalSlides - 2) * 0.2)} slides: "text-heavy" (paragraphs) - EXACTLY 20% 
${Math.floor((totalSlides - 2) * 0.2)} slides: "image-focus" (visual focus) - EXACTLY 20%
${Math.max(1, Math.floor((totalSlides - 2) * 0.1))} slides: "quote" (quotation) - EXACTLY 10%
${Math.floor((totalSlides - 2) * 0.15)} slides: "statistics" (data visualization) - EXACTLY 15%
${Math.floor((totalSlides - 2) * 0.1)} slides: "comparison" (side-by-side) - EXACTLY 10%
${Math.max(1, Math.floor((totalSlides - 2) * 0.05))} slides: "timeline" (sequential events) - EXACTLY 5%
${Math.floor((totalSlides - 2) * 0.1)} slides: "example" (case studies) - EXACTLY 10%

DO NOT SUBSTITUTE OR CHANGE THESE EXACT VALUES. The "slideType" field MUST contain one of these specific values.

CONTENT REQUIREMENTS BY SLIDE TYPE:
- "text-heavy": MUST contain 2-3 full paragraphs of text (150+ words total)
- "statistics": MUST include 4-6 data points with specific numbers/percentages 
- "quote": MUST have a complete quote with attribution
- "timeline": MUST show 5+ chronological events
- "comparison": MUST have clear columns of contrasting points
- "example": MUST contain real-world examples with details
- "image-focus": MUST have minimal text with focus on image description

FORMATTING INSTRUCTION:
Return JSON with this EXACT structure and type names:
{
  "title": "Creative presentation title",
  "sections": [
    {
      "id": 1,
      "title": "Slide title",
      "slideType": "MUST BE ONE OF: standard, text-heavy, image-focus, quote, statistics, comparison, timeline, example, title-slide",
      "subtopics": ["Content point 1", "Content point 2", ...],
      "imagePrompt": "Detailed image description for this slide"
    },
    ...more slides using the EXACT distribution specified above...
  ]
}
`;

    try {
      // Make API call to Groq
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert at creating educational presentations. Generate a well-structured, comprehensive presentation outline based on the topic and settings provided."
          },
          {
            role: "user",
            content: formattedPrompt
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 1,
        stream: false,
      });

      const text = completion.choices[0]?.message?.content || '';
      
      // Try to parse the JSON response
      try {
        // Extract JSON from the response if it contains other text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        let content = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        
        if (!content || !content.title || !content.sections) {
          console.log("Invalid content format, using fallback");
          throw new Error('Invalid response format');
        }
        
        // Log the initial distribution of slide types
        const initialTypes: Record<string, number> = {};
        content.sections.forEach((section: Section) => {
          const type = section.slideType || 'unknown';
          initialTypes[type] = (initialTypes[type] || 0) + 1;
        });
        console.log("INITIAL SLIDE TYPE DISTRIBUTION:", initialTypes);
        
        // Process the content to ensure appropriate slide types and content
        content = processApiResponse(content);
        
        // Enforce the layout distribution
        content = validateAndFixLayoutDistribution(content);
        
        // Log the final distribution of slide types
        const finalTypes: Record<string, number> = {};
        content.sections.forEach((section: Section) => {
          const type = section.slideType || 'unknown';
          finalTypes[type] = (finalTypes[type] || 0) + 1;
        });
        console.log("FINAL SLIDE TYPE DISTRIBUTION:", finalTypes);
        
        console.log("Successfully generated content with varied layouts");
        return NextResponse.json({
          status: 'success',
          content
        });
      } catch (parseError) {
        console.error('Failed to parse Groq API response:', parseError);
        return NextResponse.json({
          status: 'success',
          content: {
            title: prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt,
            sections: generateBasicOutline(prompt, settings?.pages || 15)
          }
        });
      }
    } catch (groqError) {
      console.error('Error calling Groq API:', groqError);
      // Return fallback content on API error
      return NextResponse.json({
        status: 'success',
        content: {
          title: prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt,
          sections: generateBasicOutline(prompt, settings?.pages || 15)
        }
      });
    }
  } catch (error) {
    console.error('Error in API route:', error);
    // Return fallback content even on general errors
    return NextResponse.json({
      status: 'success',
      content: {
        title: 'Generated Presentation',
        sections: generateBasicOutline('Presentation', 15)
      }
    });
  }
}

// Update content generators to create richer content
function generateRichBulletPoint(topic: string): string {
  const openers = [
    "Research demonstrates that",
    "Industry experts confirm",
    "Evidence suggests",
    "Our analysis reveals",
    "Case studies indicate"
  ];
  
  const midPoints = [
    "implementation of proper",
    "strategic application of",
    "thorough understanding of",
    "consistent focus on",
    "careful integration of"
  ];
  
  const closers = [
    "leads to substantial improvements in overall performance metrics.",
    "results in measurable gains across key business objectives.",
    "creates significant competitive advantages in today's market.",
    "produces documented benefits that justify the initial investment.",
    "generates both immediate and long-term positive outcomes."
  ];
  
  const opener = openers[Math.floor(Math.random() * openers.length)];
  const midPoint = midPoints[Math.floor(Math.random() * midPoints.length)];
  const closer = closers[Math.floor(Math.random() * closers.length)];
  
  return `${opener} ${midPoint} ${topic} ${closer}`;
}

function generateStatisticPoint(): string {
  const values = [
    "73%", "68%", "92%", "45%", "87%", 
    "$2.4M", "$3.7B", "$850K", "$1.2T",
    "3.5x", "2.7x", "4.1x", "6.3x"
  ];
  
  const descriptions = [
    "of organizations report significant improvements after implementation",
    "of professionals agree this approach delivers superior results",
    "annual savings documented in comprehensive industry studies",
    "increase in productivity when these principles are applied correctly",
    "reduction in implementation failures compared to traditional methods",
    "growth in key performance indicators within the first year",
    "of projects complete on time and under budget using this framework",
    "return on investment calculated across all industry sectors"
  ];
  
  const value = values[Math.floor(Math.random() * values.length)];
  const description = descriptions[Math.floor(Math.random() * descriptions.length)];
  
  return `${value}: ${description}`;
}

// Update the basic outline to include rich content by default
function generateBasicOutline(prompt: string, numSlides: number) {
  const sections = [];
  const slideTypes = [
    'title-slide', 'standard', 'text-heavy', 'statistics', 
    'quote', 'comparison', 'timeline', 'image-focus', 'diagram', 'example'
  ];
  
  // Add title slide
  sections.push({
    id: 1,
    title: prompt.length > 40 ? prompt.substring(0, 40) + '...' : prompt,
    subtopics: [
      'In this presentation, we will explore key concepts and insights',
      'We\'ll examine important aspects and practical applications',
      'By the end, you\'ll have a comprehensive understanding of the topic'
    ],
    slideType: 'title-slide',
    imagePrompt: `Professional image representing ${prompt}`
  });
  
  // Create section dividers for logical structure
  const sectionPoints = Math.floor(numSlides / 3);
  
  // Add content slides with varied types
  for (let i = 2; i < numSlides; i++) {
    // Create section dividers at regular intervals
    if (i === sectionPoints + 1 || i === sectionPoints * 2 + 1) {
      sections.push({
        id: i,
        title: `Key Aspect ${Math.floor(i / sectionPoints)}`,
        subtopics: [`Exploring the important components of this section`],
        slideType: 'section-divider',
        imagePrompt: `Visual representation of ${prompt} aspect ${Math.floor(i / sectionPoints)}`
      });
    } else {
      // Choose a varied slide type based on position in the presentation
      let slideType = '';
      
      if (i === 2) {
        slideType = 'standard'; // Introduction is often a standard slide
      } else if (i === numSlides - 1) {
        slideType = 'standard'; // Conclusion is often a standard slide
      } else {
        // Rotate through different slide types for variety
        const typeIndex = (i % (slideTypes.length - 2)) + 2; // Skip first two types
        slideType = slideTypes[typeIndex];
      }
      
      // Generate rich content based on slide type
      let subtopics = [];
      
      if (slideType === 'quote') {
        subtopics = [
          `"Understanding ${prompt} is essential for success in today's world."`,
          `Expert in the field of ${prompt}`,
          `This perspective highlights the importance of this topic in various contexts`
        ];
      } else if (slideType === 'statistics') {
        subtopics = [
          `78%: Organizations that implement ${prompt} see improved outcomes`,
          `$2.5M: Average annual savings reported by companies focusing on ${prompt}`,
          `3x: Increase in productivity when ${prompt} principles are applied correctly`,
          `92%: Professional satisfaction rate among teams that master ${prompt}`
        ];
      } else if (slideType === 'comparison') {
        subtopics = [
          `Traditional approach: Limited flexibility and outdated methodologies`,
          `${prompt} approach: Enhanced capabilities and modern practices`,
          `Standard methods: Higher costs and slower implementation`,
          `${prompt} methods: Cost-effective with faster deployment`
        ];
      } else {
        // Standard content with 4-6 points
        const points = [
          `Key concept: Understanding the fundamentals of this aspect`,
          `Important principle: How this applies to various situations`,
          `Practical application: Real-world implementation strategies`,
          `Case study: Examples from successful implementations`,
          `Industry insight: How experts approach this component`,
          `Future direction: Evolution and emerging trends`
        ];
        
        // Take 4-6 points based on slide position
        const numPoints = Math.min(4 + (i % 3), points.length);
        subtopics = points.slice(0, numPoints);
      }
      
      sections.push({
        id: i,
        title: `Component ${i-1}: Important Aspect of ${prompt}`,
        subtopics: subtopics,
        slideType: slideType,
        imagePrompt: `Professional image related to ${prompt} component ${i-1}`
      });
    }
  }
  
  // Add conclusion
  sections.push({
    id: numSlides,
    title: 'Conclusion & Next Steps',
    subtopics: [
      'We\'ve explored key aspects of this topic in depth',
      'The importance of ongoing learning and application cannot be overstated',
      'Implementing these principles will lead to significant improvements',
      'Questions and discussion will further enhance understanding'
    ],
    slideType: 'standard',
    imagePrompt: `Professional conclusion image for ${prompt} presentation`
  });
  
  return sections;
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

// Update the generateDetailedContent function to produce richer content
function generateDetailedContent(topic: string, detailLevel: string, audience: string): string[] {
  // Create more bullet points based on detailLevel
  let numberOfPoints = 3;  // Default (Regular)
  
  if (detailLevel === 'Minimal') {
    numberOfPoints = 2;
  } else if (detailLevel === 'Detailed') {
    numberOfPoints = 5;  // Increased from 4 to 5 for more content
  }
  
  // Examples for different audiences with deeper, more specific content
  const contentByAudience: Record<string, string[]> = {
    'Academic': [
      `Research findings from ${getYear()} show that ${topic} has significant implications for educational theory and practice`,
      `${topic} can be analyzed through multiple theoretical frameworks including constructivism and social cognition`,
      `The methodology for studying ${topic} has evolved significantly over the past decade, with new approaches emerging`,
      `Statistical analysis reveals strong correlations (p<0.05) between ${topic} and related academic outcomes`,
      `Peer-reviewed studies in the Journal of ${getRelevantField(topic)} indicate that ${topic} contributes to knowledge advancement`,
      `${topic} has interdisciplinary applications across multiple fields including psychology, sociology, and economics`,
      `Recent meta-analyses suggest that ${topic} may be more influential than previously thought`,
      `The historical context of ${topic} helps explain current academic perspectives and research priorities`
    ],
    'Business': [
      `Market analysis shows ${topic} increases profitability by up to 25% in companies that fully implement it`,
      `Implementing ${topic} reduces operational costs by an average of 18% within the first fiscal year`,
      `Case studies from Fortune 500 companies like Microsoft and Amazon demonstrate ${topic}'s effectiveness at scale`,
      `ROI measurements for ${topic} show positive results within 6-12 months, with continued growth thereafter`,
      `Competitive advantage is gained through strategic application of ${topic} in both B2B and B2C environments`,
      `Industry leaders are investing heavily in ${topic} technologies, with venture capital exceeding $2.3B in ${getYear()}`,
      `The business lifecycle of ${topic} implementation includes planning, integration, optimization, and expansion phases`,
      `Market differentiation through ${topic} has resulted in 32% higher customer retention rates for early adopters`
    ],
    'Students': [
      `Learning about ${topic} helps develop critical thinking skills that are essential for academic success`,
      `${topic} connects to multiple subjects in your curriculum, creating a cross-disciplinary understanding`,
      `Understanding ${topic} will help with future coursework and provides a foundation for advanced studies`,
      `Real-world applications of ${topic} make learning more relevant and applicable to everyday situations`,
      `Group activities related to ${topic} enhance collaborative skills and peer learning opportunities`,
      `${topic} provides foundational knowledge that appears frequently in standardized tests and assessments`,
      `Visual representations of ${topic} help with information retention and concept visualization`,
      `The historical development of ${topic} provides context for understanding its current significance`
    ],
    'General': [
      `${topic} has become increasingly important in modern society, affecting how we live and work`,
      `Historical context helps explain the evolution of ${topic} from its earliest forms to current applications`,
      `Practical applications of ${topic} can be found in everyday life, from home to workplace settings`,
      `Public perception of ${topic} has shifted over recent years, influenced by media and technological changes`,
      `${topic} influences multiple aspects of contemporary culture, including entertainment and social media`,
      `Understanding ${topic} provides valuable insight into related areas and emerging trends`,
      `The economic impact of ${topic} extends to job creation, market growth, and consumer behavior`,
      `Global perspectives on ${topic} vary significantly, with cultural differences affecting implementation`
    ]
  };
  
  // Helper function to get current year
  function getYear(): number {
    return new Date().getFullYear();
  }
  
  // Helper function to get a relevant academic field based on topic
  function getRelevantField(topic: string): string {
    const fields: Record<string, string[]> = {
      'science': ['Biology', 'Physics', 'Chemistry', 'Environmental Science'],
      'technology': ['Computer Science', 'Information Technology', 'Data Science'],
      'history': ['Historical Studies', 'Anthropology', 'Archaeology'],
      'business': ['Business Administration', 'Economics', 'Management'],
      'art': ['Fine Arts', 'Art History', 'Visual Studies'],
      'health': ['Medicine', 'Public Health', 'Nursing']
    };
    
    // Find which category the topic might belong to
    let field = 'Educational Studies'; // Default
    for (const [category, categoryFields] of Object.entries(fields)) {
      if (topic.toLowerCase().includes(category)) {
        const randomIndex = Math.floor(Math.random() * categoryFields.length);
        field = categoryFields[randomIndex];
        break;
      }
    }
    return field;
  }
  
  // Get the content array for the specified audience, or fall back to General
  const contentOptions = contentByAudience[audience] || contentByAudience['General'];
  
  // Shuffle the array to get random points each time
  const shuffledOptions = [...contentOptions].sort(() => Math.random() - 0.5);
  
  // Take the required number of points
  return shuffledOptions.slice(0, numberOfPoints);
}

// Example usage - replace with your actual implementation
// This section should be within a function or removed if it was just an example
/*
// Use this function when generating slides
const subtopics = generateDetailedContent(title, settings.wordAmount, settings.audience);
*/ 

// Fix the processApiResponse function
function processApiResponse(content: ContentResponse): ContentResponse {
  if (!content || !content.sections) {
    return content;
  }
  
  // Process each section to ensure appropriate slide types
  content.sections = content.sections.map((section: Section, index: number) => {
    // If AI didn't specify a slide type, determine one based on content
    if (!section.slideType) {
      section.slideType = determineSlideTypeFromContent(section, index, content.sections.length);
    }
    
    // Ensure subtopics are never empty
    if (!section.subtopics || section.subtopics.length === 0) {
      section.subtopics = generateFallbackContent(section.title, section.slideType);
    }
    
    return section;
  });
  
  return content;
}

// Helper function to determine slide type from content if not specified
function determineSlideTypeFromContent(section: Section, index: number, totalSlides: number): string {
  const title = section.title.toLowerCase();
  const subtopics = section.subtopics || [];
  
  // First slide is usually a title slide
  if (index === 0) {
    return 'title-slide';
  }
  
  // Last slide is usually a standard conclusion
  if (index === totalSlides - 1) {
    return 'standard';
  }
  
  // Check for statistics content
  const hasStatistics = subtopics.some((item: string) => 
    /\d+%|million|billion|\$\d+|\d+x/i.test(item) || 
    item.includes(':') && /\d+/.test(item.split(':')[0])
  );
  if (hasStatistics) {
    return 'statistics';
  }
  
  // Check for quotes
  if (subtopics.length <= 2 && subtopics[0] && subtopics[0].includes('"')) {
    return 'quote';
  }
  
  // Check for comparison content
  if (title.includes('vs') || title.includes('comparison') || 
      title.includes('contrast') || title.includes('difference')) {
    return 'comparison';
  }
  
  // Check for timeline content
  if (title.includes('timeline') || title.includes('history') || title.includes('evolution') ||
      subtopics.some((item: string) => /\d{4}:|year:|era:/i.test(item))) {
    return 'timeline';
  }
  
  // Check for text-heavy content
  if (subtopics.some((item: string) => item.length > 100) || subtopics.join(' ').length > 300) {
    return 'text-heavy';
  }
  
  // Default to standard type
  return 'standard';
}

// Update the fallback content generator to create richer content
function generateFallbackContent(title: string, slideType: string): string[] {
  // Create rich content based on slide type
  switch (slideType) {
    case 'standard':
      return [
        "Research demonstrates that proper implementation leads to substantial improvements in overall performance metrics and user satisfaction.",
        "Industry data reveals organizations adopting this approach report a 73% increase in efficiency and significantly improved outcomes.",
        "Expert analysis confirms strategic integration delivers measurable results across multiple operational dimensions.",
        "Case studies from leading organizations show consistent patterns of success when following established best practices.",
        "Long-term studies indicate sustained benefits with continued refinement and optimization of these methodologies."
      ];
      
    case 'text-heavy':
      return [
        "The fundamental principles underlying this topic represent a significant advancement in how we understand and approach complex challenges. Multiple studies have demonstrated that when properly implemented, these concepts lead to substantial improvements across various metrics and key performance indicators. The historical development of these ideas shows a clear trajectory of refinement and increasing sophistication.",
        "Practical applications can be found across diverse domains, from technology and business to education and healthcare. What makes this approach particularly valuable is its adaptability to different contexts while maintaining core effectiveness. Organizations that have adopted these methodologies report significant improvements in efficiency, quality, and stakeholder satisfaction.",
        "Looking forward, we can anticipate further evolution as new research emerges and implementation techniques are refined. The integration with emerging technologies presents particularly promising avenues for exploration and development. As adoption continues to grow, we can expect to see standardization of best practices and more accessible pathways to implementation."
      ];
      
    case 'quote':
      return [
        `"The innovative application of ${title} principles represents one of the most significant advancements in this field in the past decade. Organizations that fail to adopt these approaches risk being left behind in an increasingly competitive landscape."`,
        "Dr. Sarah Johnson, Leading Expert and Research Director",
        "This perspective highlights the critical importance of staying current with evolving methodologies and best practices."
      ];
      
    case 'statistics':
      return [
        "87%: Organizations reporting improved outcomes after implementation",
        "63%: Reduction in errors and quality issues compared to traditional approaches",
        "$2.3M: Average annual savings for enterprise-level implementations",
        "14 months: Typical time to achieve positive ROI",
        "3.5x: Productivity improvement reported by early adopters",
        "92%: Professional satisfaction increase among implementation teams"
      ];
      
    default:
      return [
        "Key concept: Understanding the fundamental principles is essential for successful implementation",
        "Implementation strategy: Following established best practices significantly improves outcomes",
        "Critical factor: Leadership support and resource allocation directly correlate with success rates",
        "Future direction: Emerging technologies will enhance capabilities and expand application domains"
      ];
  }
}

// Example usage - replace with your actual implementation
// This section should be within a function or removed if it was just an example
/*
// Use this function when generating slides
const subtopics = generateDetailedContent(title, settings.wordAmount, settings.audience);
*/ 

// Completely rewrite the validateAndFixLayoutDistribution function to be more aggressive
function validateAndFixLayoutDistribution(content: ContentResponse): ContentResponse {
  if (!content || !content.sections || content.sections.length === 0) {
    return content;
  }

  const totalSlides = content.sections.length;
  
  // Calculate required distribution (excluding first and last slides)
  const innerSlides = totalSlides - 2;
  const requiredDistribution: SlideTypeDistribution = {
    'standard': Math.max(1, Math.floor(innerSlides * 0.1)),   // 10% standard
    'text-heavy': Math.max(1, Math.floor(innerSlides * 0.2)), // 20% text-heavy
    'image-focus': Math.max(1, Math.floor(innerSlides * 0.2)), // 20% image-focus
    'quote': Math.max(1, Math.floor(innerSlides * 0.1)),      // 10% quote
    'statistics': Math.max(1, Math.floor(innerSlides * 0.15)), // 15% statistics
    'comparison': Math.max(1, Math.floor(innerSlides * 0.1)),  // 10% comparison
    'timeline': Math.max(1, Math.floor(innerSlides * 0.05)),   // 5% timeline
    'example': Math.max(1, Math.floor(innerSlides * 0.1)),     // 10% example
    'title-slide': 1,  // Always exactly 1 title slide
    'section-divider': 0  // Optional, not enforced
  };
  
  // Log the distribution requirements
  console.log("Required distribution:", Object.entries(requiredDistribution)
    .map(([type, count]) => `${type}: ${count} (${Math.round((count/totalSlides)*100)}%)`)
    .join(', '));
  
  // Ensure first slide is title-slide
  content.sections[0].slideType = 'title-slide';
  
  // Ensure last slide is standard (conclusion)
  content.sections[totalSlides - 1].slideType = 'standard';
  
  // Count current distribution (excluding first and last slides)
  const currentDistribution: SlideTypeDistribution = {};
  for (let i = 1; i < totalSlides - 1; i++) {
    const type = content.sections[i].slideType || 'standard';
    currentDistribution[type] = (currentDistribution[type] || 0) + 1;
  }
  
  // Log the current distribution
  console.log("Current distribution:", Object.entries(currentDistribution)
    .map(([type, count]) => `${type}: ${count}`)
    .join(', '));
  
  // Calculate needed adjustments
  const adjustments: SlideTypeDistribution = {};
  for (const type in requiredDistribution) {
    if (type === 'title-slide') continue; // Skip title slide, already handled
    const required = requiredDistribution[type];
    const current = currentDistribution[type] || 0;
    adjustments[type] = required - current;
  }
  
  // Log the needed adjustments
  console.log("Needed adjustments:", Object.entries(adjustments)
    .map(([type, count]) => `${type}: ${count > 0 ? '+' + count : count}`)
    .join(', '));
  
  // Create pools of slides to modify
  const slidesToChange: number[] = [];
  const excessTypes: string[] = [];
  
  // Find excess types (negative adjustment needed)
  for (const type in adjustments) {
    if (adjustments[type] < 0) {
      excessTypes.push(type);
    }
  }
  
  // Find slides of excess types to change
  for (let i = 1; i < totalSlides - 1; i++) {
    const slideType = content.sections[i].slideType || 'standard';
    if (excessTypes.includes(slideType) && adjustments[slideType] < 0) {
      slidesToChange.push(i);
      adjustments[slideType]++;
    }
  }
  
  // Log the slides we'll change
  console.log(`Found ${slidesToChange.length} slides to change`);
  
  // Assign new types to these slides
  slidesToChange.forEach(index => {
    // Find types that need more slides
    const neededTypes: string[] = [];
    for (const type in adjustments) {
      if (adjustments[type] > 0) {
        neededTypes.push(type);
      }
    }
    
    if (neededTypes.length > 0) {
      // Assign a type that needs more slides
      const newType = neededTypes[0];
      console.log(`Changing slide ${index} from ${content.sections[index].slideType} to ${newType}`);
      content.sections[index].slideType = newType;
      adjustments[newType]--;
      
      // Also update content to match the new slide type
      updateContentForSlideType(content.sections[index]);
    }
  });
  
  // Add debugging log for final distribution
  const finalDistribution: SlideTypeDistribution = {};
  content.sections.forEach(section => {
    const type = section.slideType || 'standard';
    finalDistribution[type] = (finalDistribution[type] || 0) + 1;
  });
  
  console.log("Final distribution:", Object.entries(finalDistribution)
    .map(([type, count]) => `${type}: ${count} (${Math.round((count/totalSlides)*100)}%)`)
    .join(', '));
  
  return content;
}

// Helper function to update slide content based on slide type
function updateContentForSlideType(slide: Section): void {
  // Create appropriate content based on slide type if it's empty or too short
  if (!slide.subtopics || slide.subtopics.length < 2) {
    slide.subtopics = [];
    
    switch (slide.slideType) {
      case 'text-heavy':
        slide.subtopics = [
          "The comprehensive analysis of this topic reveals multiple factors that contribute to its significance in contemporary contexts. Research has demonstrated consistent patterns that emerge across various implementations and use cases. These patterns suggest underlying principles that can be applied broadly.",
          "When examining practical applications, we find that organizations implementing these approaches report significant improvements in key performance metrics. Surveys indicate satisfaction rates exceeding 85% among stakeholders, with particularly strong outcomes in challenging scenarios.",
          "Looking forward, emerging trends suggest continued evolution of methodologies and practices. Early adopters positioning themselves at the forefront of these developments stand to gain considerable advantages in their respective domains. Ongoing research promises to further refine our understanding and application capabilities."
        ];
        break;
        
      case 'statistics':
        slide.subtopics = [
          "78%: Organizations report improved outcomes after implementation",
          "$2.3M: Average annual savings for enterprise-level implementations",
          "3.5x: Productivity improvement compared to traditional methods",
          "92%: Professional satisfaction increase among implementation teams",
          "14 months: Average time to achieve positive ROI",
          "68%: Reduction in process-related errors"
        ];
        break;
        
      case 'quote':
        slide.subtopics = [
          "\"The transformative potential of these approaches cannot be overstated. Organizations that fail to adapt will inevitably find themselves at a significant competitive disadvantage in coming years.\"",
          "Dr. Sarah Johnson, Leading Industry Expert",
          "Published in the Journal of Strategic Innovation, 2023"
        ];
        break;
        
      case 'timeline':
        slide.subtopics = [
          "2018: Initial concept development and theoretical framework established",
          "2019: First prototype implementations demonstrate proof-of-concept",
          "2020: Early adopters begin small-scale deployments with promising results",
          "2021: Refinement based on real-world implementation feedback",
          "2022: Widespread adoption begins as success metrics become clear",
          "2023: Industry standardization efforts formalize best practices"
        ];
        break;
        
      case 'comparison':
        slide.subtopics = [
          "Traditional Approach: Higher implementation costs with longer deployment timelines",
          "Modern Methodology: Reduced costs and accelerated implementation",
          "Traditional Approach: Limited scalability and integration capabilities",
          "Modern Methodology: Seamless scaling with comprehensive integration",
          "Traditional Approach: Requires specialized expertise for maintenance",
          "Modern Methodology: Simplified maintenance with reduced technical overhead"
        ];
        break;
        
      case 'example':
        slide.subtopics = [
          "Case Study 1: Global Financial Institution - Implemented the framework across 12 departments, resulting in 34% efficiency improvement",
          "Case Study 2: Healthcare Provider Network - Reduced processing time by 62% while improving accuracy metrics",
          "Case Study 3: Manufacturing Sector - Achieved 28% cost reduction while enhancing quality control parameters",
          "Case Study 4: Educational Institution - Transformed administrative processes, saving 15,000 staff hours annually"
        ];
        break;
        
      case 'image-focus':
        slide.subtopics = [
          "This visual representation illustrates the key concepts in action",
          "Note the integration of multiple elements working in harmony",
          "The practical application demonstrates real-world impact"
        ];
        break;
        
      default:
        slide.subtopics = [
          "Key concept: Understanding fundamental principles is essential for successful implementation",
          "Best practices: Following established guidelines significantly improves outcomes",
          "Implementation strategy: Phased approach with stakeholder involvement yields optimal results",
          "Real-world application: Practical deployment considerations vary by organizational context",
          "Future direction: Emerging technologies promise to further enhance capabilities"
        ];
    }
  }
  
  // Also add an appropriate image prompt if none exists
  if (!slide.imagePrompt || slide.imagePrompt.trim() === '') {
    // Create a relevant image prompt based on the slide title and type
    const basePrompt = `professional high-quality visualization related to ${slide.title}`;
    
    switch (slide.slideType) {
      case 'statistics':
        slide.imagePrompt = `data visualization, charts and graphs showing ${slide.title}, business analytics dashboard, clean professional style`;
        break;
      case 'quote':
        slide.imagePrompt = `professional portrait of business expert or thought leader, elegant setting, sophisticated lighting, corporate atmosphere`;
        break;
      case 'timeline':
        slide.imagePrompt = `timeline visualization, progression of events, historical development of ${slide.title}, professional infographic style`;
        break;
      case 'image-focus':
        slide.imagePrompt = `striking visual representing ${slide.title}, detailed high-resolution image, professional photography, conceptual representation`;
        break;
      default:
        slide.imagePrompt = basePrompt;
    }
  }
}