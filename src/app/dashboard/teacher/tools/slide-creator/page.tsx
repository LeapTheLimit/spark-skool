'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  FolderIcon, 
  ArrowUpTrayIcon, 
  ChevronDownIcon, 
  DocumentIcon, 
  ClockIcon, 
  XMarkIcon,
  ArrowLeftIcon,
  SparklesIcon,
  CheckIcon,
  PhotoIcon,
  LinkIcon,
  PencilIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { MATERIALS_STORAGE_KEY } from '@/lib/constants';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import pptxgen from 'pptxgenjs';

// Simple tooltip component since the import was broken
function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="invisible absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-white opacity-0 transition-all group-hover:visible group-hover:opacity-100 text-sm z-50">
        {content}
      </div>
    </div>
  );
}

interface SavedSlide {
  id: string;
  title: string;
  createdAt: string;
  thumbnailUrl?: string;
  downloadUrl?: string;
  embedUrl?: string;
}

interface Material {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  fileType?: string;
}

interface OutlineItem {
  id: number;
  title: string;
  subtopics?: string[];
  imagePrompt?: string;
  sources?: string[];
}

// Enhanced interface for the API response
interface OutlineResponse {
  title: string;
  sections: {
    id?: number;
    title: string;
    subtopics?: string[];
    imagePrompt?: string;
    sources?: string[];
  }[];
}

export default function AIPresentationMaker() {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('white');
  const [showMaterials, setShowMaterials] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [previousSlides, setPreviousSlides] = useState<SavedSlide[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, type: string}[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // New states for the outline view
  const [currentView, setCurrentView] = useState<'prompt' | 'outline' | 'slides'>('prompt');
  const [presentationTitle, setPresentationTitle] = useState('');
  const [outlineItems, setOutlineItems] = useState<OutlineItem[]>([]);
  const [isEditingOutline, setIsEditingOutline] = useState(false);
  
  // Add new state variables for slide editing
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isEditingSlide, setIsEditingSlide] = useState(false);
  const [slideContent, setSlideContent] = useState<string>('');
  const [generatedSlideUrl, setGeneratedSlideUrl] = useState<string>('https://slidesept.com/l/sGLi');
  
  // New state for tracking if we're currently saving to materials
  const [isSavingToMaterials, setIsSavingToMaterials] = useState(false);
  
  // New state for slide image generation
  const [isGeneratingImages, setIsGeneratingImages] = useState<boolean>(false);
  const [slideImages, setSlideImages] = useState<{[key: number]: string}>({});
  const [sources, setSources] = useState<{[key: number]: string[]}>({});
  const [showSourcesModal, setShowSourcesModal] = useState<boolean>(false);
  const [currentEditingSources, setCurrentEditingSources] = useState<{id: number, sources: string[]}>({id: 0, sources: []});
  
  // Add new state for slide transition styles
  const [transitionStyle, setTransitionStyle] = useState<'fade' | 'slide' | 'none'>('fade');
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Move these state variables from renderSlidesView to the component level
  const [fontSize, setFontSize] = useState("text-xl");
  const [editingBulletIndex, setEditingBulletIndex] = useState<number | null>(null);
  const [editingBulletContent, setEditingBulletContent] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowThemeDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load previous slides from localStorage
  useEffect(() => {
    const loadPreviousSlides = () => {
      try {
        const stored = localStorage.getItem('previous_slides');
        if (stored) {
          setPreviousSlides(JSON.parse(stored));
        } else {
          // Mock data with downloadUrl
          setPreviousSlides([
            { 
              id: '1', 
              title: 'Introduction to Biology', 
              createdAt: '2023-10-15', 
              thumbnailUrl: 'https://source.unsplash.com/random/300x200?biology',
              downloadUrl: 'https://api.slidesgpt.com/v1/presentations/1/download'
            },
            { 
              id: '2', 
              title: 'Physics 101', 
              createdAt: '2023-10-10', 
              thumbnailUrl: 'https://source.unsplash.com/random/300x200?physics',
              downloadUrl: 'https://api.slidesgpt.com/v1/presentations/2/download'
            },
            { 
              id: '3', 
              title: 'Advanced Mathematics', 
              createdAt: '2023-10-05', 
              thumbnailUrl: 'https://source.unsplash.com/random/300x200?math',
              downloadUrl: 'https://api.slidesgpt.com/v1/presentations/3/download'
            }
          ]);
        }
      } catch (error) {
        console.error('Error loading previous slides:', error);
      }
    };
    loadPreviousSlides();
  }, []);

  // Load materials from localStorage
  useEffect(() => {
    const loadMaterials = () => {
      try {
        const stored = localStorage.getItem(MATERIALS_STORAGE_KEY);
        if (stored) {
          const parsedMaterials = JSON.parse(stored);
          console.log('Loaded materials:', parsedMaterials);
          setMaterials(parsedMaterials);
        }
      } catch (error) {
        console.error('Error loading materials:', error);
      }
    };
    loadMaterials();
  }, []);

  // Enhanced image generation function for high-quality educational visuals
  const generateSlideImages = async () => {
    setIsGeneratingImages(true);
    toast.success('Generating professional visuals for your slides...', {
      duration: 3000
    });
    
    try {
      const newSlideImages: {[key: number]: string} = {};
      
      // Add AI-generated fallback images (professional looking, specific to education)
      const fallbackImages = [
        "https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=1200&h=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?q=80&w=1200&h=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&h=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=1200&h=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=1200&h=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1200&h=800&auto=format&fit=crop"
      ];
      
      // Process each slide sequentially
      for (const item of outlineItems) {
        // Create a specific, educational image prompt
        const basePrompt = item.title.trim();
        
        // Create a more focused, educational image query
        const subtopicsArray = item.subtopics || [];
        const detailPrompt = subtopicsArray.length > 0 ? subtopicsArray[0].trim() : '';
          
        const imageQuery = item.imagePrompt || 
          `${basePrompt} ${detailPrompt}`.trim();
        
        // Much more aggressive cleaning for image query
        const cleanedQuery = imageQuery
          .replace(/create|design|visual|image|picture|photo|showing|include|depicting/gi, '')
          .replace(/and|the|for|with|a|an/gi, ' ')
          .replace(/[^\w\s]/gi, ' ') // Remove special characters
          .replace(/\s+/g, ' ')      // Replace multiple spaces with a single space
          .trim()
          // Add specific educational/academic terms
          .concat(' education concept')
          .slice(0, 50);  // Significantly limit length
        
        toast.success(`Creating visual for "${item.title}"...`, 
          { id: `image-${item.id}`, duration: 1500 });
        
        try {
          // Immediately set a fallback image to ensure something shows right away
          const fallbackImageIndex = (item.id - 1) % fallbackImages.length;
          newSlideImages[item.id] = fallbackImages[fallbackImageIndex];
          
          // Update slides immediately with the fallback image to ensure something is visible right away
          setSlideImages(prev => ({
            ...prev,
            [item.id]: fallbackImages[fallbackImageIndex]
          }));
          
          // Then try to get a more specific image
          const width = 1200;
          const height = 800;
          
          // Add random parameter to avoid caching issues
          const cacheBreaker = Date.now();
          
          // Use simpler educational keywords that work well with Unsplash
          const categoryKeywords = [
            "education", 
            "learning", 
            "academic", 
            "knowledge",
            "concept"
          ];
          
          // Add a random educational keyword to improve results
          const randomKeyword = categoryKeywords[Math.floor(Math.random() * categoryKeywords.length)];
          
          // Create a more specific educational search with properly encoded URI
          // Use a simpler query structure that's less likely to cause 404 errors
          const searchTerm = cleanedQuery.split(' ').slice(0, 2).join(' ');
          const imageUrl = `https://source.unsplash.com/featured/${width}x${height}?${encodeURIComponent(searchTerm + " " + randomKeyword)}&t=${cacheBreaker}`;
          
          // Fetch in background but don't wait for it
          fetch(imageUrl, { method: 'HEAD' })
            .then(imgResponse => {
              if (imgResponse.ok) {
                // Only update if we got a successful response
                newSlideImages[item.id] = imageUrl;
                setSlideImages(prev => ({
                  ...prev,
                  [item.id]: imageUrl
                }));
              }
            })
            .catch(err => {
              console.log("Error fetching image, keeping fallback:", err);
            });
            
        } catch (error) {
          console.error(`Error generating image for slide ${item.id}:`, error);
          // If we encounter any errors, we already have the fallback set
        }
        
        // Short delay between requests
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      toast.success('Professional slide visuals generated successfully!');
    } catch (error) {
      console.error('Image generation error:', error);
      toast.error('Some images could not be generated. Using fallbacks instead.');
    } finally {
      setIsGeneratingImages(false);
    }
  };

  // Greatly improved function to generate outline with enhanced error handling
  const generateOutline = async () => {
    if (!prompt.trim() && uploadedFiles.length === 0) {
      toast.error(t('slideCreator.enterPromptOrUpload', { default: 'Please enter a prompt or upload files first' }));
      return;
    }
    
    setIsLoading(true);
    
    // Show a more detailed loading message
    toast.success('Creating your presentation with advanced AI...', {
      duration: 5000,
      icon: '✨'
    });
    
    try {
      // Prepare the content for the API with improved instruction
      let requestContent = prompt;
      if (uploadedFiles.length > 0) {
        requestContent += "\n\nIncorporated resources: " + uploadedFiles.map(f => f.name).join(", ");
      }
      
      console.log("Requesting presentation outline from AI service");
      
      // Create an abort controller with a shorter timeout (90 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);
      
      try {
        // Make the API call with better timeout handling
        const response = await fetch('/api/gemini-generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: requestContent,
            temperature: 0.7
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Log the response status for debugging
        console.log(`API response status: ${response.status}`);
        
        // First check for 504 or other error responses
        if (response.status === 504) {
          // Handle 504 Gateway Timeout explicitly
          console.log("Server timeout (504). Using fallback outline.");
          toast.error('The server took too long to respond. Using fallback content instead.');
          
          // Create a fallback outline for timeouts
          const fallbackOutline = createFallbackOutline(prompt);
          setPresentationTitle(fallbackOutline.title);
          setOutlineItems(fallbackOutline.sections);
          setCurrentView('outline');
          setIsLoading(false);
          return; // Exit early with fallback content
        }
        
        // For any non-ok response, try to parse as JSON first
        if (!response.ok) {
          let errorMessage = `Error ${response.status}: ${response.statusText}`;
          
          try {
            // Try to get the response as text first
            const responseText = await response.text();
            console.log("Error response text:", responseText);
            
            // Try to parse as JSON
            try {
              const errorData = JSON.parse(responseText);
              console.log("Parsed error data:", errorData);
              
              // If we have content in the error response, we can use it as fallback
              if (errorData.content) {
                try {
                  const parsedContent = JSON.parse(errorData.content);
                  
                  // Use the fallback content
                  toast.error(errorData.message || 'Error generating presentation, using fallback content');
                  setPresentationTitle(parsedContent.title);
                  
                  // Process sections and extract sources
                  const formattedOutline = parsedContent.sections.map((section: any, index: number) => {
                    // Set up sources for this section if available
                    if (section.sources && section.sources.length > 0) {
                      setSources(prev => ({
                        ...prev,
                        [section.id || (index + 1)]: section.sources || []
                      }));
                    }
                    
                    return {
                      id: section.id || (index + 1),
                      title: section.title || `Section ${index + 1}`,
                      subtopics: section.subtopics || [],
                      imagePrompt: section.imagePrompt || `Image for ${section.title}`,
                      sources: section.sources || []
                    };
                  });
                  
                  setOutlineItems(formattedOutline);
                  setCurrentView('outline');
                  return;
                } catch (contentParseError) {
                  console.error("Failed to parse error content:", contentParseError);
                }
              }
              
              errorMessage = errorData.message || errorMessage;
            } catch (jsonError) {
              console.error("Error parsing error response:", jsonError);
              // Not JSON, just use the text response
              if (responseText) {
                errorMessage = responseText.substring(0, 100) + '...';
              }
            }
          } catch (textError) {
            console.error("Error getting response text:", textError);
          }
          
          // Handle timeout errors differently even when status code isn't 504
          if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
            console.log("Timeout error detected in message. Using fallback outline.");
            toast.error('Request timed out. Using fallback content instead.');
            
            const fallbackOutline = createFallbackOutline(prompt);
            setPresentationTitle(fallbackOutline.title);
            setOutlineItems(fallbackOutline.sections);
            setCurrentView('outline');
            setIsLoading(false);
            return; // Exit early with fallback content
          }
          
          // If we got here, we have an error but not a timeout
          throw new Error(errorMessage);
        }
        
        // Response is ok, try to parse it
        const responseText = await response.text();
        
        // First try to parse as JSON
        let responseData;
        try {
          responseData = JSON.parse(responseText);
          console.log("Successfully parsed response as JSON");
        } catch (jsonError) {
          console.error("Failed to parse response as JSON:", jsonError);
          console.log("Response text:", responseText.substring(0, 200) + "...");
          
          // Try to extract JSON from the text if possible
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              responseData = JSON.parse(jsonMatch[0]);
              console.log("Successfully extracted and parsed JSON from text");
            } catch (extractError) {
              console.error("Failed to extract JSON from text:", extractError);
              throw new Error('Invalid response format: Could not parse as JSON');
            }
          } else {
            throw new Error('Invalid response format: No JSON object found');
          }
        }
        
        // Display which model was used if available
        if (responseData.model) {
          console.log(`Generated using model: ${responseData.model}`);
          toast.success(`Using ${responseData.model} for your presentation`, { duration: 3000 });
        }
        
        // Extract or access the content
        let parsedContent;
        
        if (typeof responseData.content === 'string') {
          try {
            parsedContent = JSON.parse(responseData.content);
            console.log("Successfully parsed content string as JSON");
          } catch (parseError) {
            console.error("Error parsing content string:", parseError);
            // Use alternative extraction method
            parsedContent = extractContentFromText(responseData.content);
          }
        } else {
          // Content is already structured data or we'll use responseData directly
          parsedContent = responseData.content || responseData;
        }
        
        // Validate the content structure
        if (!parsedContent?.title || !Array.isArray(parsedContent?.sections)) {
          console.error("Invalid content structure:", parsedContent);
          throw new Error('Invalid presentation structure returned from AI');
        }
        
        // Set the presentation title and process sections
        setPresentationTitle(parsedContent.title);
        
        // Process sections and extract sources
        const formattedOutline = parsedContent.sections.map((section: any, index: number) => {
          // Set up sources for this section if available
          if (section.sources && section.sources.length > 0) {
            setSources(prev => ({
              ...prev,
              [section.id || (index + 1)]: section.sources || []
            }));
          }
          
          return {
            id: section.id || (index + 1),
            title: section.title || `Section ${index + 1}`,
            subtopics: section.subtopics || [],
            imagePrompt: section.imagePrompt || `Image for ${section.title}`,
            sources: section.sources || []
          };
        });
        
        setOutlineItems(formattedOutline);
        
        // Update UI and provide feedback
        setCurrentView('outline');
        toast.success(t('slideCreator.outlineGenerated', { default: 'Professional outline generated successfully!' }));
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        // Handle fetch or parsing errors
        console.error('Fetch or parsing error:', fetchError);
        
        // Type guard to check if fetchError is an instance of Error before accessing the name property
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Request timed out. Please try a simpler prompt or check your internet connection.');
        } else if (fetchError instanceof Error) {
          // For 504 errors, provide a specific message
          if (fetchError.message.includes('504') || fetchError.message.includes('timeout')) {
            toast.error('The server took too long to respond. Using fallback content instead.');
            
            // Create a fallback outline even for timeout errors
            const fallbackOutline = createFallbackOutline(prompt);
            setPresentationTitle(fallbackOutline.title);
            setOutlineItems(fallbackOutline.sections);
            setCurrentView('outline');
            setIsLoading(false);
            return; // Exit early with fallback content
          }
          throw fetchError;
        }
      }
      
    } catch (error) {
      console.error('Error generating outline:', error);
      
      // Show appropriate error message
      let errorMessage = error instanceof Error ? error.message : 'Failed to generate outline';
      
      if (errorMessage.includes('timed out') || errorMessage.includes('504')) {
        errorMessage = 'The request took too long. Please try a simpler prompt or check your internet connection.';
      } else if (errorMessage.includes('parse') || errorMessage.includes('JSON')) {
        errorMessage = 'Error processing AI response. Using fallback outline.';
      }
      
      toast.error(errorMessage);
      
      // Create a useful fallback outline even when the API fails
      const fallbackOutline = createFallbackOutline(prompt);
      setPresentationTitle(fallbackOutline.title);
      setOutlineItems(fallbackOutline.sections);
      
      toast.success("Created a fallback outline you can use and edit", { duration: 5000 });
      
      // Still switch to outline view with the fallback content
      setCurrentView('outline');
      
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to extract content from text when JSON parsing fails
  const extractContentFromText = (text: string) => {
    // Default structure
    let result = {
      title: "Presentation Outline",
      sections: [] as Array<{
        id: number;
        title: string;
        subtopics: string[];
        imagePrompt: string;
      }>
    };
    
    try {
      // Try to find the title
      const titleMatch = text.match(/title:?\s*['"]?([\w\s\-&:,]+)['"]?/i);
      if (titleMatch && titleMatch[1]) {
        result.title = titleMatch[1].trim();
      } else {
        // Look for a line that could be a title (first line, all caps, etc.)
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
          const potentialTitle = lines[0].replace(/^#\s*/, '').trim();
          if (potentialTitle && potentialTitle.length < 100) {
            result.title = potentialTitle;
          }
        }
      }
      
      // Try to find sections
      let sections: Array<{
        id: number;
        title: string;
        subtopics: string[];
        imagePrompt: string;
      }> = [];
      
      // Look for section patterns like "Section 1: Title" or "## Title"
      const sectionMatches = text.matchAll(/(?:section|part|chapter)\s*\d+:?\s*([^\n]+)|##\s*([^\n]+)/gi);
      
      for (const match of sectionMatches) {
        const title = (match[1] || match[2]).trim();
        sections.push({
          id: sections.length + 1,
          title: title,
          subtopics: [] as string[],
          imagePrompt: `Professional image related to ${title}`
        });
      }
      
      // If no sections found, try to create sections from bullet points or paragraphs
      if (sections.length === 0) {
        const lines = text.split('\n').filter(line => line.trim());
        let currentSection: {
          id: number;
          title: string;
          subtopics: string[];
          imagePrompt: string;
        } | null = null;
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          // Skip empty lines and section markers we've already processed
          if (!trimmedLine || trimmedLine.startsWith('#')) continue;
          
          // If line starts with a bullet or number, it might be a subtopic
          if (/^[\*\-•]|\d+[\.)\]]/.test(trimmedLine)) {
            if (currentSection) {
              currentSection.subtopics.push(trimmedLine.replace(/^[\*\-•]|\d+[\.)\]]\s*/, ''));
            }
          } 
          // Otherwise it might be a new section title
          else if (trimmedLine.length < 100 && !currentSection) {
            currentSection = {
              id: sections.length + 1,
              title: trimmedLine,
              subtopics: [] as string[],
              imagePrompt: `Professional image related to ${trimmedLine}`
            };
            sections.push(currentSection);
          }
          // If we have a section and the line doesn't look like a subtopic, 
          // it might be the start of a new section
          else if (trimmedLine.length < 100 && !trimmedLine.startsWith(' ')) {
            currentSection = {
              id: sections.length + 1,
              title: trimmedLine,
              subtopics: [] as string[],
              imagePrompt: `Professional image related to ${trimmedLine}`
            };
            sections.push(currentSection);
          }
        }
      }
      
      // Ensure we have at least some sections
      if (sections.length > 0) {
        result.sections = sections;
      } else {
        // Create default sections if nothing else works
        result.sections = createFallbackOutline(result.title).sections;
      }
      
      return result;
    } catch (e) {
      console.error("Error extracting content from text:", e);
      return createFallbackOutline(prompt);
    }
  };

  // Function to create a high-quality fallback outline from prompt
  const createFallbackOutline = (promptText: string) => {
    const mainSubject = extractMainSubject(promptText);
    const title = `${mainSubject.charAt(0).toUpperCase() + mainSubject.slice(1)}: Key Insights & Applications`;
    
    return {
      title,
      sections: [
        {
          id: 1,
          title: "Introduction",
          subtopics: [
            `Overview of ${mainSubject} and its significance`,
            `Historical context and development of ${mainSubject}`,
            `Current relevance and importance in today's world`
          ],
          imagePrompt: `Professional title slide showing ${mainSubject} concept with modern design elements`
        },
        {
          id: 2,
          title: "Key Concepts",
          subtopics: [
            `Fundamental principles of ${mainSubject}`,
            `Core components and frameworks`,
            `Essential terminology and definitions`
          ],
          imagePrompt: `Conceptual diagram showing the main elements of ${mainSubject} with connecting relationships`
        },
        {
          id: 3,
          title: "Applications & Use Cases",
          subtopics: [
            `Real-world examples of ${mainSubject} in practice`,
            `Industry-specific implementations and benefits`,
            `Case studies demonstrating successful applications`
          ],
          imagePrompt: `Visual showing multiple real-world applications of ${mainSubject} in different contexts`
        },
        {
          id: 4,
          title: "Challenges & Considerations",
          subtopics: [
            `Common obstacles and limitations`,
            `Ethical considerations and potential concerns`,
            `Strategies for overcoming challenges`
          ],
          imagePrompt: `Visual metaphor showing obstacles and solutions related to ${mainSubject}`
        },
        {
          id: 5,
          title: "Future Trends",
          subtopics: [
            `Emerging developments in ${mainSubject}`,
            `Predicted evolution and innovations`,
            `Opportunities for growth and advancement`
          ],
          imagePrompt: `Forward-looking visualization showing future trends in ${mainSubject} with data elements`
        },
        {
          id: 6,
          title: "Conclusion",
          subtopics: [
            `Summary of key takeaways`,
            `Actionable insights and recommendations`,
            `Resources for further exploration`
          ],
          imagePrompt: `Concluding slide with summary elements and next steps for ${mainSubject}`
        }
      ]
    };
  };

  // Helper function to extract the main subject from a prompt
  const extractMainSubject = (prompt: string): string => {
    // Remove common phrases
    const cleanPrompt = prompt
      .replace(/create a presentation (about|on|for)/i, '')
      .replace(/i want a (presentation|slide deck|slides) (about|on|for)/i, '')
      .replace(/make a (presentation|slide deck|slides) (about|on|for)/i, '')
      .replace(/generate (a|some) slides (about|on|for)/i, '')
      .trim();
    
    // Extract first few words as the subject (up to 3)
    const words = cleanPrompt.split(' ');
    return words.slice(0, Math.min(3, words.length)).join(' ');
  };

  // Enhanced slide navigation with transitions
  const handleNextSlide = () => {
    if (currentSlideIndex < outlineItems.length - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlideIndex(prevIndex => prevIndex + 1);
        setIsTransitioning(false);
      }, 300); // Match this timing with CSS transition duration
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlideIndex(prevIndex => prevIndex - 1);
        setIsTransitioning(false);
      }, 300); // Match this timing with CSS transition duration
    }
  };

  // Direct slide navigation with transitions
  const goToSlide = (index: number) => {
    if (index !== currentSlideIndex && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlideIndex(index);
        setIsTransitioning(false);
      }, 300);
    }
  };

  // Handle slide content editing
  const handleSlideContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSlideContent(e.target.value);
  };

  const saveSlideChanges = () => {
    // In a real implementation, this would update the actual slide content
    // and possibly regenerate the slide
    setIsEditingSlide(false);
    toast.success(t('slideCreator.slideUpdated', { default: 'Slide content updated' }));
  };

  // Update the handleGenerateSlides function to create slides without ANY images
  const handleGenerateSlides = async () => {
    const loadingToastId = toast.loading('Creating your presentation...');
    
    try {
      // Format the content for slides, using all slides in the outline
      const allSections = outlineItems.map(item => ({
        title: item.title,
        content: item.subtopics || [],
        sources: sources[item.id] || []
      }));

      const presentationData = {
        title: presentationTitle,
        sections: allSections
      };

      toast.loading('Designing slides...', { id: loadingToastId });
      
      // Generate a unique ID for this presentation
      const presentationId = `presentation_${Date.now()}`;
      
      // CREATE THE PRESENTATION USING PPTXGENJS
      const pptx = new pptxgen();
      
      // Set presentation properties
      pptx.author = "SparkSkool AI";
      pptx.title = presentationTitle;
      pptx.subject = "Generated Presentation";
      
      // Define theme colors - using purple as our primary color
      const themeColors = {
        primary: "#6C63FF", // Purple
        secondary: "#F8F9FA",
        accent: "#4F46E5",
        background: "#FFFFFF",
        text: "#000000"
      };
      
      // Set master slide defaults for consistent styling
      pptx.defineSlideMaster({
        title: 'MASTER_SLIDE',
        background: { color: themeColors.background },
        objects: [
          { 'line': { x: 0, y: 7.1, w: '100%', h: 0, line: { color: themeColors.primary, width: 2 } } }
        ]
      });
      
      // CREATE TITLE SLIDE (NO IMAGES)
      const titleSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
      
      // Add colored sidebar
      titleSlide.addShape("rect", { 
        x: 0, y: 0, w: 3, h: "100%", 
        fill: { color: themeColors.primary }
      });
      
      // Add decorative elements
      for (let i = 0; i < 10; i++) {
        titleSlide.addShape("ellipse", {
          x: 4 + (Math.random() * 6), 
          y: Math.random() * 7,
          w: 0.4, h: 0.4,
          fill: { color: themeColors.primary }
        });
      }
      
      // Add title with modern typography
      titleSlide.addText(presentationTitle, {
        x: 3.5, y: 2.5, w: "60%", h: 2,
        fontFace: "Arial", fontSize: 40, color: themeColors.text,
        bold: true, align: "left"
      });
      
      // Add subtitle with a colored bar
      titleSlide.addShape("rect", {
        x: 3.5, y: 4.3, w: 4, h: 0.1,
        fill: { color: themeColors.primary }
      });
      
      titleSlide.addText("Created with SparkSkool AI", {
        x: 3.5, y: 4.5, w: "60%",
        fontFace: "Arial", fontSize: 18, color: themeColors.text,
        italic: true, align: "left"
      });
      
      // Add date with more professional formatting
      titleSlide.addText(new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      }), {
        x: 3.5, y: 5.5, fontFace: "Arial", fontSize: 14, color: themeColors.text
      });
      
      // Create content slides with different layouts (NO IMAGES)
      allSections.forEach((section, idx) => {
        // Choose layout based on slide index
        const layoutType = idx % 3; // 0, 1, or 2
        
        // LAYOUT TYPE 0: Clean layout with sidebar
        if (layoutType === 0) {
          const slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
          
          // Add purple sidebar
          slide.addShape("rect", { 
            x: 0, y: 0, w: 1.5, h: "100%", 
            fill: { color: themeColors.primary } 
          });
          
          // Title at top
          slide.addText(section.title, {
            x: 1.8, y: 0.5, w: 8, h: 0.8,
            fontFace: "Arial", fontSize: 28, color: themeColors.text,
            bold: true
          });
          
          // Content as bullet points - FULL WIDTH (no image)
          if (section.content && section.content.length > 0) {
            slide.addText(section.content.map(point => point).join('\n'), {
              x: 1.8, y: 1.5, w: 8.5, h: 4.5, // Using full width
              fontFace: "Arial", fontSize: 18, color: themeColors.text,
              bullet: { type: "bullet" },
              lineSpacing: 28
            });
          }
          
          // Slide number
          slide.addText(`${idx + 1}`, {
            x: 0.75, y: 6.5, w: 0.5, h: 0.5,
            fontFace: "Arial", fontSize: 14, color: "#FFFFFF",
            align: "center"
          });
        }
        // LAYOUT TYPE 1: Colored background with content box
        else if (layoutType === 1) {
          const slide = pptx.addSlide();
          
          // Light blue background
          slide.background = { color: "#F0F4FF" };
          
          // Add decorative header bar
          slide.addShape("rect", {
            x: 0, y: 0, w: "100%", h: 1,
            fill: { color: themeColors.primary }
          });
          
          // Add decorative footer bar
          slide.addShape("rect", {
            x: 0, y: 6.5, w: "100%", h: 1,
            fill: { color: themeColors.primary }
          });
          
          // Content box (FULL WIDTH - no image)
          slide.addShape("rect", {
            x: 0.5, y: 1.5, w: 9.5, h: 4.5,
            fill: { color: "#FFFFFF" },
            line: { color: themeColors.primary, width: 1 }
          });
          
          // Title in colored bar
          slide.addShape("rect", {
            x: 0.5, y: 1.5, w: 9.5, h: 0.8,
            fill: { color: themeColors.primary }
          });
          
          slide.addText(section.title, {
            x: 0.8, y: 1.5, w: 8.9, h: 0.8,
            fontFace: "Arial", fontSize: 24, color: "#FFFFFF",
            bold: true, valign: "middle"
          });
          
          // Content in white box
          if (section.content && section.content.length > 0) {
            slide.addText(section.content.map(point => `• ${point}`).join('\n'), {
              x: 0.8, y: 2.5, w: 8.9, h: 3.3,
              fontFace: "Arial", fontSize: 16, color: themeColors.text,
              lineSpacing: 28
            });
          }
          
          // Slide number in bottom right
          slide.addText(`${idx + 1}`, {
            x: 9.5, y: 6.7, w: 0.5, h: 0.3,
            fontFace: "Arial", fontSize: 14, color: "#FFFFFF",
            align: "center", bold: true
          });
        }
        // LAYOUT TYPE 2: Two-column layout with decorative elements
        else {
          const slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
          
          // Title at top with underline
          slide.addText(section.title, {
            x: 0.5, y: 0.5, w: 9.5, h: 0.8,
            fontFace: "Arial", fontSize: 28, color: themeColors.text,
            bold: true
          });
          
          slide.addShape("rect", {
            x: 0.5, y: 1.3, w: 9.5, h: 0.05,
            fill: { color: themeColors.primary }
          });
          
          // Add decorative vertical accent bar
          slide.addShape("rect", { 
            x: 0.5, y: 1.5, w: 0.1, h: 4, 
            fill: { color: themeColors.accent } 
          });
          
          // Add decorative circles
          for (let i = 0; i < 5; i++) {
            slide.addShape("ellipse", {
              x: 0.8 + (i * 0.4), 
              y: 1.7 + (i * 0.8),
              w: 0.3, h: 0.3,
              fill: { color: themeColors.primary },
              line: { color: themeColors.primary, width: 1 }
            });
          }
          
          // Content with numbers instead of bullets - FULL WIDTH (no image)
          if (section.content && section.content.length > 0) {
            const numberedContent = section.content.map((point, i) => 
              `${i + 1}. ${point}`
            ).join('\n\n');
            
            slide.addText(numberedContent, {
              x: 1.5, y: 1.5, w: 8.5, h: 4, // Full width
              fontFace: "Arial", fontSize: 16, color: themeColors.text,
              lineSpacing: 28
            });
          }
          
          // Footer bar
          slide.addShape("rect", {
            x: 0, y: 6.7, w: "100%", h: 0.3,
            fill: { color: themeColors.primary }
          });
          
          // Slide number in footer
          slide.addText(`${idx + 1} / ${allSections.length}`, {
            x: 8.5, y: 6.7, w: 1, h: 0.3,
            fontFace: "Arial", fontSize: 12, color: "#FFFFFF",
            align: "center", valign: "middle"
          });
        }
      });
      
      // Add a professional closing slide
      const closingSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
      
      // Bottom colored area
      closingSlide.addShape("rect", {
        x: 0, y: 4, w: "100%", h: 3.5,
        fill: { color: themeColors.primary }
      });
      
      // Thank you text
      closingSlide.addText("Thank You", {
        x: 0.5, y: 1.5, w: 9, h: 2,
        fontFace: "Arial", fontSize: 60, color: themeColors.text,
        bold: true, align: "center"
      });
      
      // Additional text on colored area
      closingSlide.addText("Questions & Discussion", {
        x: 0.5, y: 5, w: 9, h: 1,
        fontFace: "Arial", fontSize: 32, color: "#FFFFFF",
        align: "center"
      });

      // SAVE THE PRESENTATION
      const pptxOutput = await pptx.write({ outputType: "nodebuffer" });
      const pptxBlob = new Blob([pptxOutput as BlobPart], {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      });
      
      // Create a URL from the blob
      const downloadUrl = URL.createObjectURL(pptxBlob);
      
      // Create a proper download function that the component can use later
      const handleDownload = () => {
        // Create a download link and trigger the download
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${presentationTitle.replace(/[^\w\s]/gi, '')}.pptx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };
      
      // Store the download function in a window property for later use
      // @ts-ignore
      window.downloadCurrentPresentation = handleDownload;
      
      // Create a simple thumbnail for the presentation
      const thumbnailBgColor = themeColors.primary;
      const thumbnailUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="${encodeURIComponent(thumbnailBgColor)}"/><text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">${encodeURIComponent(presentationTitle.substring(0, 20))}</text></svg>`;
      
      // Create new slide object for local storage
      const newSlide: SavedSlide = {
        id: presentationId,
        title: presentationTitle,
        createdAt: new Date().toISOString(),
        thumbnailUrl,
        downloadUrl,
        embedUrl: downloadUrl
      };
      
      // Update state with new slide
      const updatedSlides = [newSlide, ...previousSlides];
      setPreviousSlides(updatedSlides);
      localStorage.setItem('previous_slides', JSON.stringify(updatedSlides));
      
      // Set the preview URL for display
      setGeneratedSlideUrl(downloadUrl);
      
      // Switch to slides view
      setCurrentView('slides');
      
      // Success notification
      toast.dismiss(loadingToastId);
      toast.success('Your presentation is ready! Click Download to save the file.');
      
    } catch (error) {
      console.error('Error in handleGenerateSlides:', error);
      toast.dismiss(loadingToastId);
      
      // Show appropriate error message
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to generate presentation');
      } else {
        toast.error('An unexpected error occurred');
      }
    }
  };

  const handleUploadDocument = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Process each file
    const newFiles = Array.from(files).map(file => ({
      name: file.name,
      type: file.type
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Generate a preview for the first file if it's an image
    if (files[0] && files[0].type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreviewImage(e.target.result.toString());
        }
      };
      reader.readAsDataURL(files[0]);
    }
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    toast.success(`Uploaded ${files.length} file(s)`);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    if (index === 0) setPreviewImage(null);
  };

  const handleMaterialSelect = (material: Material) => {
    // Add material content to prompt or process it
    let newPrompt = prompt;
    
    if (material.fileType) {
      newPrompt = newPrompt ? 
        `${newPrompt}\n\nUsing file: ${material.title}` :
        `Create a presentation using file: ${material.title}`;
    } else {
      // For text materials, include the actual content
      const contentPreview = material.content.substring(0, 100) + (material.content.length > 100 ? '...' : '');
      newPrompt = newPrompt ? 
        `${newPrompt}\n\nIncorporate this material: ${material.title}\n${contentPreview}` :
        `Create a presentation based on: ${material.title}\n${contentPreview}`;
    }
    
    setPrompt(newPrompt);
    setShowMaterials(false);
    toast.success(`Added ${material.title} to your presentation`);
  };

  // Function to handle sources editing
  const openSourcesEditor = (slideId: number) => {
    setCurrentEditingSources({
      id: slideId,
      sources: sources[slideId] || []
    });
    setShowSourcesModal(true);
  };
  
  const saveSourcesChanges = () => {
    setSources(prev => ({
      ...prev,
      [currentEditingSources.id]: currentEditingSources.sources
    }));
    setShowSourcesModal(false);
    toast.success('Sources updated!');
  };
  
  const addSource = () => {
    setCurrentEditingSources(prev => ({
      ...prev,
      sources: [...prev.sources, '']
    }));
  };
  
  const updateSource = (index: number, value: string) => {
    setCurrentEditingSources(prev => {
      const newSources = [...prev.sources];
      newSources[index] = value;
      return {
        ...prev,
        sources: newSources
      };
    });
  };
  
  const removeSource = (index: number) => {
    setCurrentEditingSources(prev => ({
      ...prev,
      sources: prev.sources.filter((_, i) => i !== index)
    }));
  };

  // Also update the deletePresentation function to use our API route
  const deletePresentation = async (id: string) => {
    try {
      const response = await fetch(`/api/slides/${id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        setPreviousSlides(prev => prev.filter(slide => slide.id !== id));
        localStorage.setItem('previous_slides', 
          JSON.stringify(previousSlides.filter(slide => slide.id !== id))
        );
        toast.success('Presentation deleted');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete presentation');
    }
  };

  // Function to save presentation to materials
  const saveToMaterials = () => {
    try {
      setIsSavingToMaterials(true);
      
      // Create content from the presentation structure
      const contentSections = outlineItems.map(item => {
        const subtopics = item.subtopics && item.subtopics.length > 0
          ? item.subtopics.map(sub => `  • ${sub}`).join('\n')
          : '';
        
        return `## ${item.title}\n${subtopics}`;
      }).join('\n\n');
      
      const fullContent = `# ${presentationTitle}\n\n${contentSections}`;
      
      // Create new material object
      const newMaterial = {
        id: Date.now().toString(),
        title: presentationTitle,
        content: fullContent,
        category: 'resource',
        createdAt: new Date().toISOString(),
      };
      
      // Add to materials state
      setMaterials(prev => [newMaterial, ...prev]);
      
      // Save to localStorage
      const existingMaterials = JSON.parse(localStorage.getItem(MATERIALS_STORAGE_KEY) || '[]');
      localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify([newMaterial, ...existingMaterials]));
      
      toast.success(t('slideCreator.savedToMaterials', { default: 'Saved to materials' }));
    } catch (error) {
      console.error('Error saving to materials:', error);
      toast.error('Failed to save to materials');
    } finally {
      setIsSavingToMaterials(false);
    }
  };

  // Function to save bullet point edit
  const saveBulletEdit = () => {
    if (editingBulletIndex !== null) {
      const currentSlide = outlineItems[currentSlideIndex];
      if (currentSlide && currentSlide.subtopics) {
        const newOutlineItems = [...outlineItems];
        const itemIndex = newOutlineItems.findIndex(item => item.id === currentSlide.id);
        if (itemIndex >= 0 && newOutlineItems[itemIndex].subtopics) {
          const newSubtopics = [...newOutlineItems[itemIndex].subtopics!];
          newSubtopics[editingBulletIndex] = editingBulletContent;
          newOutlineItems[itemIndex].subtopics = newSubtopics;
          setOutlineItems(newOutlineItems);
        }
        setEditingBulletIndex(null);
      }
    }
  };

  function renderPromptView(): import("react").ReactNode {
    throw new Error('Function not implemented.');
  }

  function renderOutlineView(): import("react").ReactNode {
    throw new Error('Function not implemented.');
  }

  function renderSlidesView(): import("react").ReactNode {
    throw new Error('Function not implemented.');
  }

  return (
    <div 
      className="min-h-screen max-h-screen bg-gray-50 p-6 md:p-8 overflow-y-auto slide-creator-content"
      ref={containerRef}
    >
      {/* Conditional Rendering Based on Current View */}
      {currentView === 'prompt' && (
        <>
          {/* Title */}
          <h1 className="text-5xl font-bold text-center mb-16 text-purple-600">
            {t('slideCreator.title', { default: 'AI PowerPoint Maker' })}
          </h1>

          {/* Main Input Area */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-100 rounded-3xl p-8 mb-8 shadow-lg">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t('slideCreator.promptPlaceholder', { default: 'I want a slide deck about the future of AI ...' })}
                className="w-full h-32 bg-transparent border-none resize-none text-2xl focus:outline-none placeholder-black text-black"
              />
              
              {/* Uploaded files preview */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <h3 className="font-medium text-black mb-2">{t('slideCreator.uploadedFiles', { default: 'Uploaded Files:' })}</h3>
                  <div className="flex flex-wrap gap-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center bg-white rounded-lg px-3 py-2 shadow-sm">
                        <span className="text-sm text-black truncate max-w-[150px]">{file.name}</span>
                        <button 
                          onClick={() => handleRemoveFile(index)}
                          className="ml-2 text-gray-500 hover:text-red-500"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Preview image if available */}
                  {previewImage && (
                    <div className="mt-4">
                      <div className="relative w-40 h-40 rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={previewImage}
                          alt={t('slideCreator.preview', { default: 'Preview' })}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-center items-center gap-4 mb-8">
              <Tooltip content={t('slideCreator.uploadTooltip', { default: 'Upload PDF, DOC, PPTX, or images' })}>
                <button 
                  onClick={handleUploadDocument}
                  className="flex items-center gap-2 text-black font-medium bg-white px-4 py-2 rounded-lg shadow-sm"
                >
                  <ArrowUpTrayIcon className="w-6 h-6" />
                  <span>{t('slideCreator.uploadDocument', { default: 'Upload Document' })}</span>
                </button>
              </Tooltip>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.jpg,.jpeg,.png"
                multiple
              />
              <Tooltip content={t('slideCreator.materialsTooltip', { default: 'Use your saved materials' })}>
                <button 
                  onClick={() => setShowMaterials(true)}
                  className="flex items-center gap-2 text-black font-medium bg-white px-4 py-2 rounded-lg shadow-sm"
                >
                  <FolderIcon className="w-6 h-6" />
                  <span>{t('slideCreator.savedMaterials', { default: 'Saved Materials' })}</span>
                </button>
              </Tooltip>
            </div>

            {/* Create Button */}
            <div className="flex justify-center">
              <button
                onClick={generateOutline}
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white px-12 py-4 rounded-full text-lg font-medium transition-colors shadow-lg"
              >
                {isLoading ? t('slideCreator.creating', { default: 'Creating...' }) : t('slideCreator.createSlides', { default: 'Create Slides' })}
              </button>
            </div>
          </div>

          {/* Previous Slides Section */}
          <div className="max-w-6xl mx-auto mt-20">
            <div className="flex items-center gap-2 mb-6">
              <ClockIcon className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-black">{t('slideCreator.recentPresentations', { default: 'Recent Presentations' })}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {previousSlides.length > 0 ? (
                previousSlides.map((slide) => (
                  <div key={slide.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="h-40 bg-gray-100 relative">
                      {slide.thumbnailUrl ? (
                        <img 
                          src={slide.thumbnailUrl} 
                          alt={slide.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <DocumentIcon className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-black">{slide.title}</h3>
                      <p className="text-black text-sm mt-1">
                        {t('slideCreator.createdOn', { default: 'Created on', date: new Date(slide.createdAt).toLocaleDateString() })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-10 bg-white rounded-xl shadow-sm">
                  <DocumentIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-black mb-2">{t('slideCreator.noPresentations', { default: 'No Presentations Yet' })}</h3>
                  <p className="text-gray-500">{t('slideCreator.presentationsWillAppear', { default: 'Your recent presentations will appear here' })}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      
      {currentView === 'outline' && (
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8 overflow-y-auto">
          {/* Top Navigation with Improved Progress Indicator */}
          <div className="flex items-center justify-between mb-10">
            <button 
              onClick={() => setCurrentView('prompt')} 
              className="flex items-center text-black hover:text-purple-600 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              <span className="font-medium">{t('slideCreator.back', { default: 'Back' })}</span>
            </button>
            
            <div className="flex items-center space-x-12">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 mr-2 shadow-md">
                  <CheckIcon className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-black">{t('slideCreator.prompt', { default: 'Prompt' })}</span>
              </div>
              <div className="relative">
                <div className="absolute top-1/2 -left-14 w-12 h-1 bg-purple-600"></div>
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 mr-2 shadow-md ring-4 ring-purple-100">
                    <span className="text-white font-semibold">2</span>
                  </div>
                  <span className="font-semibold text-black">{t('slideCreator.outline', { default: 'Outline' })}</span>
                </div>
              </div>
              <div className="relative">
                <div className="absolute top-1/2 -left-14 w-12 h-1 bg-gray-300"></div>
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 mr-2">
                    <span className="text-black font-semibold">3</span>
                  </div>
                  <span className="font-semibold text-black">{t('slideCreator.slides', { default: 'Slides' })}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-b-2 border-purple-100 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-bold text-black">{t('slideCreator.presentationOutline', { default: 'Presentation Outline' })}</h2>
              <button 
                onClick={() => setIsEditingOutline(!isEditingOutline)}
                className="flex items-center px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm shadow-md"
              >
                <SparklesIcon className="w-4 h-4 mr-2" />
                {isEditingOutline ? 
                  t('slideCreator.saveOutline', { default: 'Save Outline' }) : 
                  t('slideCreator.editOutline', { default: 'Edit Outline' })
                }
              </button>
            </div>
          </div>
          
          {/* Improved Outline Content with Better Visual Hierarchy */}
          <div className="mb-16">
            <div className="mb-8 bg-gradient-to-r from-purple-50 to-white p-6 rounded-lg border-l-4 border-purple-600">
              <h3 className="text-2xl font-bold text-black mb-2 tracking-tight">
                {t('slideCreator.title', { default: 'Title' })}: {presentationTitle}
              </h3>
              <p className="text-black opacity-80">{t('slideCreator.structuredAs', { default: 'Your presentation will be structured as follows:' })}</p>
            </div>
            
            <div className="space-y-4">
              {outlineItems.map((item) => (
                <div key={item.id} className={`p-4 rounded-lg transition-all ${isEditingOutline ? 'border border-purple-200 hover:shadow-md cursor-pointer' : 'bg-white border-l-2 border-purple-200'}`}>
                  {isEditingOutline ? (
                    <div className="flex items-center">
                      <span className="font-bold text-black text-xl w-8">{item.id}.</span>
                      <input 
                        type="text" 
                        value={item.title}
                        onChange={(e) => {
                          const newItems = [...outlineItems];
                          newItems[item.id - 1].title = e.target.value;
                          setOutlineItems(newItems);
                        }}
                        className="flex-1 text-black text-lg border-b border-purple-100 focus:border-purple-400 outline-none px-2 py-1"
                      />
                    </div>
                  ) : (
                    <p className="text-lg text-black flex items-start">
                      <span className="font-bold text-purple-600 text-xl w-8">{item.id}.</span>
                      <span className="flex-1">{item.title}</span>
                    </p>
                  )}
                  
                  {item.subtopics && item.subtopics.length > 0 && (
                    <ul className="ml-8 mt-2 space-y-1">
                      {item.subtopics.map((subtopic, idx) => (
                        <li key={idx} className="text-black list-disc ml-4">{subtopic}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Show Slides Button with Enhanced Design */}
          <div className="flex justify-center">
            <button
              onClick={handleGenerateSlides}
              className="bg-purple-600 hover:bg-purple-700 text-white px-12 py-4 rounded-full text-lg font-medium transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1 duration-200 flex items-center"
            >
              <SparklesIcon className="w-5 h-5 mr-2" />
              {t('slideCreator.generateSlides', { default: 'Generate Slides' })}
            </button>
          </div>
        </div>
      )}
      
      {currentView === 'slides' && (
        <div className="flex flex-col h-[calc(100vh-100px)] bg-gray-50 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-black">{presentationTitle}</h2>
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentView('outline')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                Back to Outline
              </button>
              <button
                onClick={() => {
                  // Use the dedicated download function we created
                  // @ts-ignore
                  if (window.downloadCurrentPresentation) {
                    // @ts-ignore
                    window.downloadCurrentPresentation();
                  } else if (previousSlides[0]?.downloadUrl) {
                    // Fallback to creating a download link
                    const a = document.createElement('a');
                    a.href = previousSlides[0].downloadUrl;
                    a.download = `${presentationTitle.replace(/[^\w\s]/gi, '')}.pptx`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  } else {
                    toast.error('Download URL not available');
                  }
                }}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <AcademicCapIcon className="w-5 h-5" />
                Download PowerPoint
              </button>
            </div>
          </div>

          {/* Custom slide viewer with improved height */}
          <div className="flex-1 flex flex-col">
            {/* Slide navigation controls */}
            <div className="flex justify-between items-center mb-3 px-4">
              <button 
                onClick={handlePrevSlide}
                disabled={currentSlideIndex === 0}
                className={`p-2 rounded-full ${currentSlideIndex === 0 ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="text-black font-medium">
                Slide {currentSlideIndex + 1} of {outlineItems.length + 2}
              </div>
              
              <button 
                onClick={handleNextSlide}
                disabled={currentSlideIndex >= outlineItems.length + 1}
                className={`p-2 rounded-full ${currentSlideIndex >= outlineItems.length + 1 ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            {/* Slide thumbnails with better scrolling */}
            <div className="flex overflow-x-auto space-x-2 pb-3 px-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div 
                onClick={() => goToSlide(0)}
                className={`flex-shrink-0 w-20 h-14 border-2 rounded cursor-pointer ${currentSlideIndex === 0 ? 'border-purple-600' : 'border-gray-200'}`}
                style={{backgroundColor: "white"}}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-xs text-black">Title</span>
                </div>
              </div>
              
              {outlineItems.map((item, index) => (
                <div 
                  key={index}
                  onClick={() => goToSlide(index + 1)}
                  className={`flex-shrink-0 w-20 h-14 border-2 rounded cursor-pointer ${currentSlideIndex === index + 1 ? 'border-purple-600' : 'border-gray-200'}`}
                  style={{backgroundColor: "white"}}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs text-black truncate px-1">{item.title.substring(0, 15)}{item.title.length > 15 ? '...' : ''}</span>
                  </div>
                </div>
              ))}
              
              <div 
                onClick={() => goToSlide(outlineItems.length + 1)}
                className={`flex-shrink-0 w-20 h-14 border-2 rounded cursor-pointer ${currentSlideIndex === outlineItems.length + 1 ? 'border-purple-600' : 'border-gray-200'}`}
                style={{backgroundColor: "white"}}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-xs text-black">End</span>
                </div>
              </div>
            </div>
            
            {/* Slide content with improved height and better design - NO IMAGES */}
            <div className="flex-1 bg-gray-100 rounded-xl shadow-xl overflow-hidden relative mx-auto w-full max-w-[900px] aspect-[16/9]">
              <div className={`absolute inset-0 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                {/* Title slide */}
                {currentSlideIndex === 0 && (
                  <div className="w-full h-full flex flex-col relative overflow-hidden bg-white">
                    {/* Left accent bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-[5%] bg-purple-600"></div>
                    
                    {/* Background decorative elements */}
                    <div className="absolute right-[10%] bottom-[15%] w-[15%] h-[15%] rounded-full opacity-10 bg-purple-500"></div>
                    <div className="absolute right-[30%] top-[20%] w-[8%] h-[8%] rounded-full opacity-5 bg-purple-500"></div>
                    
                    <div className="px-[8%] pt-[15%] pb-[10%] flex flex-col flex-1 justify-center">
                      <h1 className="text-4xl md:text-5xl font-bold mb-8 text-black leading-tight">{presentationTitle}</h1>
                      <div className="w-[20%] h-1 mb-6 bg-purple-600"></div>
                      <h2 className="text-xl text-gray-600 italic">Created with SparkSkool AI</h2>
                      <p className="text-gray-500 mt-4">{new Date().toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}</p>
                    </div>
                  </div>
                )}
                
                {/* Content slides - NO IMAGES */}
                {currentSlideIndex > 0 && currentSlideIndex <= outlineItems.length && (
                  <div className="w-full h-full flex flex-col relative overflow-hidden bg-white">
                    {(() => {
                      const item = outlineItems[currentSlideIndex - 1];
                      
                      return (
                        <>
                          {/* Left accent sidebar */}
                          <div className="absolute left-0 top-0 bottom-0 w-[1%] bg-purple-600"></div>
                          
                          {/* Improved title styling */}
                          <div className="w-full h-[15%] bg-gradient-to-r from-purple-50 to-white px-[5%] flex items-center">
                            <h2 className="text-2xl md:text-3xl font-bold text-black tracking-tight">{item.title}</h2>
                          </div>
                          
                          {/* Main content with styled bullet points - FULL WIDTH (no image) */}
                          <div className="px-[5%] pt-[3%] flex-1 overflow-y-auto">
                            {item.subtopics && item.subtopics.length > 0 ? (
                              <ul className="space-y-4 text-lg md:text-xl text-black">
                                {item.subtopics.map((subtopic, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="inline-block w-5 h-5 mr-3 mt-1 rounded-full bg-purple-600 flex-shrink-0"></span>
                                    <span>{subtopic}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="text-center p-12 text-gray-500 italic">
                                This slide has no content.
                              </div>
                            )}
                          </div>
                          
                          {/* Sources and slide number */}
                          <div className="w-full h-[8%] px-[5%] py-[1%] flex justify-between items-center border-t border-gray-200 bg-gray-50">
                            <div className="text-sm text-gray-600 italic">
                              {sources[item.id] && sources[item.id].length > 0 ? (
                                <span>Sources: {sources[item.id].join(', ')}</span>
                              ) : null}
                            </div>
                            <div className="text-sm font-medium text-purple-600">
                              {currentSlideIndex} / {outlineItems.length + 2}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
                
                {/* Closing slide */}
                {currentSlideIndex === outlineItems.length + 1 && (
                  <div className="w-full h-full flex flex-col relative overflow-hidden bg-white">
                    {/* Top color block */}
                    <div className="absolute top-0 left-0 right-0 h-[10%] bg-purple-600"></div>
                    
                    {/* Bottom color block */}
                    <div className="absolute bottom-0 left-0 right-0 h-[35%] bg-purple-600"></div>
                    
                    {/* Add decorative circles */}
                    <div className="absolute top-[20%] left-[10%] w-[8%] h-[8%] rounded-full bg-purple-100"></div>
                    <div className="absolute bottom-[40%] right-[15%] w-[10%] h-[10%] rounded-full bg-purple-200 opacity-50"></div>
                    
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <h1 className="text-4xl md:text-6xl font-bold mb-16 text-black">Thank You</h1>
                      <h2 className="text-xl md:text-3xl text-white mt-12 z-10 font-medium">Questions & Discussion</h2>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Presentation controls */}
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={saveToMaterials}
                disabled={isSavingToMaterials}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <FolderIcon className="w-5 h-5" />
                Save to Materials
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Materials Modal */}
      {showMaterials && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-black">{t('slideCreator.savedMaterials', { default: 'Saved Materials' })}</h2>
              <button 
                onClick={() => setShowMaterials(false)}
                className="text-black hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {materials && materials.length > 0 ? (
              <div className="space-y-4 overflow-y-auto flex-grow pr-2">
                {materials.map((material) => (
                  <div 
                    key={material.id} 
                    onClick={() => handleMaterialSelect(material)}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-black">{material.title}</h3>
                      <span className="text-xs text-white bg-blue-500 px-2 py-1 rounded-full">
                        {material.category}
                      </span>
                    </div>
                    <p className="text-black mt-1 text-sm">
                      {t('slideCreator.createdOn', { default: 'Created on', date: new Date(material.createdAt).toLocaleDateString() })}
                    </p>
                    <p className="text-black mt-2 line-clamp-2 text-sm">
                      {material.fileType ? t('slideCreator.fileDocument', { default: 'File document' }) : material.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <DocumentIcon className="w-16 h-16 mx-auto text-black mb-4" />
                <p className="text-black">{t('slideCreator.noMaterialsFound', { default: 'No materials found' })}</p>
                <p className="text-black mt-2">{t('slideCreator.saveMaterialsFirst', { default: 'Save some materials first to use them in presentations' })}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sources editing modal */}
      {showSourcesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-black">Manage Sources</h2>
              <button 
                onClick={() => setShowSourcesModal(false)}
                className="text-black hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4 max-h-[50vh] overflow-y-auto">
              {currentEditingSources.sources.map((source, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => updateSource(index, e.target.value)}
                    placeholder="Enter source (e.g., Author, Title, Year or URL)"
                    className="flex-1 border border-gray-300 rounded-lg p-2"
                  />
                  <button 
                    onClick={() => removeSource(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
              
              <button
                onClick={addSource}
                className="w-full py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 flex items-center justify-center"
              >
                <span className="mr-1">+</span> Add Source
              </button>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={saveSourcesChanges}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
