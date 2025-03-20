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
  AcademicCapIcon,
  PaperClipIcon,
  QrCodeIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { MATERIALS_STORAGE_KEY } from '@/lib/constants';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import pptxgen from 'pptxgenjs';
import { Switch } from '@headlessui/react';
import TeacherMascot from '@/components/TeacherMascot';
import TemplateCustomizer, { TemplateSettings } from '@/components/TemplateCustomizer';
import PresentationViewer from '@/components/PresentationViewer';

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
  isBulletPoint?: boolean;
  slideType?: string;
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

// Define our option types
interface DropdownOption {
  value: string;
  label: string;
}

// Custom Dropdown component
const Dropdown = ({ 
  value, 
  onChange, 
  options, 
  icon = null 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  options: DropdownOption[]; 
  icon?: React.ReactNode;
}) => (
  <div className="relative">
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-8 pr-8 rounded appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
      {icon}
    </div>
    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
);

// Update the SlideContent interface to match the expected structure
interface SlideContent {
  id: string;
  title: string;
  content: string[];
  slideType: string; // Required, not optional
  backgroundImage: string | undefined; // Required, but can be undefined
  slideImage: string; // Required, not optional
  quote?: string;
  quoteAuthor?: string;
  statistics?: Array<{ value: string; label: string }>;
}

export default function SlideCreator() {
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
  
  // Add these state variables at the top of your component
  const [editingTitleId, setEditingTitleId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(prompt);
  
  // Replace the showTemplateSelector and selectedTemplate state variables
  const [showTemplateCustomizer, setShowTemplateCustomizer] = useState(false);
  const [templateSettings, setTemplateSettings] = useState<TemplateSettings | null>(null);
  
  // Add a state variable to track when to show the presentation viewer
  const [showPresentationViewer, setShowPresentationViewer] = useState(false);
  const [generatedSlides, setGeneratedSlides] = useState<any[]>([]);
  
  // Add these state variables with the other state definitions at the top of your component
  const [imagePrompt, setImagePrompt] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State for the configuration options
  const [pages, setPages] = useState('15');
  const [wordAmount, setWordAmount] = useState('Regular');
  const [audience, setAudience] = useState('General');
  const [slidesForm, setSlidesForm] = useState('Creative');
  const [imageSource, setImageSource] = useState('Custom');
  const [isOnline, setIsOnline] = useState(true);
  const [aiModel, setAiModel] = useState('standard');
  
  // Dropdown options
  const pagesOptions: DropdownOption[] = [
    { value: '5', label: '5' },
    { value: '10', label: '10' },
    { value: '15', label: '15' },
    { value: '20', label: '20' },
    { value: '25', label: '25' },
  ];
  
  const wordAmountOptions: DropdownOption[] = [
    { value: 'Minimal', label: 'Minimal' },
    { value: 'Regular', label: 'Regular' },
    { value: 'Detailed', label: 'Detailed' },
  ];
  
  const audienceOptions: DropdownOption[] = [
    { value: 'General', label: 'General' },
    { value: 'Academic', label: 'Academic' },
    { value: 'Business', label: 'Business' },
    { value: 'Students', label: 'Students' },
  ];
  
  const slidesFormOptions: DropdownOption[] = [
    { value: 'General', label: 'General' },
    { value: 'Creative', label: 'Creative' },
    { value: 'Professional', label: 'Professional' },
    { value: 'Minimalist', label: 'Minimalist' },
  ];
  
  const imageSourceOptions: DropdownOption[] = [
    { value: 'Basic Search', label: 'Basic Search' },
    { value: 'Premium', label: 'Premium' },
    { value: 'Custom', label: 'Custom' },
  ];
  
  const aiModelOptions: DropdownOption[] = [
    { value: 'standard', label: 'Standard' },
    { value: 'thinking', label: 'Spark AI Think 1' },
  ];

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

  // Update the generateSlideImages function to work better with different slide types
  const generateSlideImages = async () => {
    setIsGeneratingImages(true);
    toast.success('Generating contextual visuals for your slides...', {
      duration: 3000
    });
    
    try {
      const newSlideImages: {[key: number]: string} = {};
      
      // Process each slide sequentially
      for (const item of outlineItems) {
        // Skip image generation for slide types that don't need images
        const slideType = item.slideType || 'standard';
        if (slideType === 'quote' && !item.imagePrompt) {
          continue;
        }
        
        // Create a specific image prompt based on the slide content and type
        let imagePrompt = item.imagePrompt || '';
        
        if (!imagePrompt) {
          // If no image prompt is provided, generate one based on the title and content
          const title = item.title.trim();
          const subtopicsText = (item.subtopics || []).join(' ').trim();
          
          // Get the most significant words from title and content
          const words = [...title.split(' '), ...subtopicsText.split(' ')]
            .filter(word => word.length > 3)
            .filter(word => !['with', 'that', 'this', 'from', 'there', 'their', 'about'].includes(word.toLowerCase()));
          
          // Use the most significant words for the image prompt
          const significantWords = [...new Set(words)].slice(0, 5).join(' ');
          
          // Customize prompt based on slide type
          if (slideType === 'statistics') {
            imagePrompt = `data visualization chart graph ${title} ${significantWords}`.trim();
          } else if (slideType === 'image-focus') {
            imagePrompt = `high quality professional photo of ${title} ${significantWords}`.trim();
          } else {
            imagePrompt = `${title} ${significantWords}`.trim().slice(0, 50);
          }
        }
        
        // Clean up the image prompt to be more effective
        const cleanedPrompt = imagePrompt
          .replace(/create|design|visual|image|picture|photo|showing|include|depicting/gi, '')
          .replace(/[^\w\s]/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        toast.success(`Creating visual for "${item.title}"...`, 
          { id: `image-${item.id}`, duration: 1500 });
        
        try {
          // Add category-specific keywords to improve image relevance
          const topicKeywords = getTopicKeywords(item.title);
          let searchTerm = `${cleanedPrompt} ${topicKeywords}`;
          
          // For statistics slides, focus on chart/graph images
          if (slideType === 'statistics') {
            searchTerm = `${cleanedPrompt} data visualization chart`;
          }
          
          const encodedTerm = encodeURIComponent(searchTerm);
          
          // Determine best image source based on slide type
          let imageUrl = '';
          
          // Try to get an image from Unsplash or other sources
          try {
            // Use a cache breaker to avoid getting the same image
          const cacheBreaker = Date.now();
            const unsplashUrl = `https://source.unsplash.com/featured/800x600?${encodedTerm}&t=${cacheBreaker}`;
            
            // For statistics, we could try to get a chart image
            if (slideType === 'statistics') {
              // You could use a different source for charts or graphs here
              // For now, we'll still use Unsplash but with specific terms
              imageUrl = unsplashUrl;
            } else {
              imageUrl = unsplashUrl;
            }
            
            // Wait for the image to be available (simple approach)
            await new Promise(resolve => setTimeout(resolve, 500));
            
          } catch (imageError) {
            console.error(`Error fetching image from primary source: ${imageError}`);
            // Fall back to a placeholder service
            imageUrl = `https://via.placeholder.com/800x600/cccccc/333333?text=${encodeURIComponent(item.title)}`;
          }
          
          // Set the image for this slide
                newSlideImages[item.id] = imageUrl;
                setSlideImages(prev => ({
                  ...prev,
                  [item.id]: imageUrl
                }));
        } catch (error) {
          console.error(`Error generating image for slide ${item.id}:`, error);
          // Set a fallback image
          const fallbackImage = `https://via.placeholder.com/800x600/cccccc/333333?text=${encodeURIComponent(item.title)}`;
          setSlideImages(prev => ({
            ...prev,
            [item.id]: fallbackImage
          }));
        }
        
        // Short delay between requests
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      toast.success('Slide visuals generated successfully!');
      
      // Return the new images
      return newSlideImages;
    } catch (error) {
      console.error('Image generation error:', error);
      toast.error('Some images could not be generated. Using fallbacks instead.');
      return {};
    } finally {
      setIsGeneratingImages(false);
    }
  };

  // Helper function to get topic-specific keywords
  function getTopicKeywords(title: string): string {
    const topics = [
      { keywords: ['history', 'ancient', 'empire', 'civilization'], categories: 'historical artifact vintage' },
      { keywords: ['business', 'economy', 'finance', 'marketing'], categories: 'professional business corporate' },
      { keywords: ['science', 'biology', 'physics', 'chemistry'], categories: 'scientific laboratory research' },
      { keywords: ['technology', 'computer', 'digital', 'software'], categories: 'technology digital modern' },
      { keywords: ['art', 'design', 'creative', 'visual'], categories: 'artistic creative colorful' },
      { keywords: ['health', 'medical', 'wellness', 'fitness'], categories: 'healthcare medical wellness' },
      { keywords: ['nature', 'environment', 'climate', 'ecosystem'], categories: 'nature environmental landscape' },
      { keywords: ['education', 'learning', 'teaching', 'school'], categories: 'education learning academic' }
    ];
    
    // Default category if no match is found
    let categoryTerms = 'conceptual professional';
    
    // Check if the title contains any of the topic keywords
    const lowerTitle = title.toLowerCase();
    for (const topic of topics) {
      for (const keyword of topic.keywords) {
        if (lowerTitle.includes(keyword)) {
          categoryTerms = topic.categories;
          break;
        }
      }
    }
    
    return categoryTerms;
  }

  // Update the generateOutline function to properly pass settings to the API
  const generateOutline = async () => {
    if (!prompt.trim() && uploadedFiles.length === 0) {
      toast.error('Please enter a topic or upload a document');
      return;
    }
    
    setIsLoading(true);
    const loadingId = toast.loading('Creating your presentation outline...');
    
    try {
      // Build the enhanced prompt with all configuration options
      const enhancedPrompt = buildEnhancedPrompt();
      
      // Create a clean settings object with all user preferences
      const settings = {
        pages: pages,
        wordAmount: wordAmount,
        audience: audience,
        slidesForm: slidesForm,
        imageSource: imageSource,
        isOnline: isOnline,
        layoutDistribution: {
          standard: 10,      // 10% bullet points
          "text-heavy": 20,  // 20% text-heavy
          "image-focus": 20, // 20% image-focused
          quote: 10,         // 10% quotes
          statistics: 15,    // 15% statistics
          comparison: 10,    // 10% comparisons
          timeline: 5,       // 5% timelines
          example: 10        // 10% examples
        }
      };
      
      console.log("Sending settings to API:", settings); // For debugging
      
      // Call the API with the enhanced prompt AND settings
        const response = await fetch('/api/gemini-generate', {
          method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
          prompt: enhancedPrompt,
          model: aiModel === 'standard' ? 'gemini-2.0-flash' : 'gemini-2.0-flash-thinking-exp-01-21',
          settings: settings
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate presentation outline: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process the outline
      let title = '';
      let items: OutlineItem[] = [];
      
      if (data.status === 'success' && data.content) {
        // Use title from API response
        title = data.content.title || 'Generated Presentation';
        
        // Process sections if they exist
        if (data.content.sections && Array.isArray(data.content.sections)) {
          items = data.content.sections.map((section: any, index: number) => ({
            id: index + 1,
            title: section.title || `Slide ${index + 1}`,
            subtopics: section.subtopics || [],
            isBulletPoint: section.isBulletPoint !== undefined ? section.isBulletPoint : true
          }));
          
          // Ensure we have exactly the number of pages requested
          const requestedPages = parseInt(pages);
          
          // If we have fewer items than requested, add more
          if (items.length < requestedPages) {
            for (let i = items.length; i < requestedPages; i++) {
              items.push({
                id: i + 1,
                title: `Additional Slide ${i + 1}`,
                subtopics: ['Content will be added here'],
                isBulletPoint: true
              });
            }
          }
          // If we have more items than requested, trim the list
          else if (items.length > requestedPages) {
            items = items.slice(0, requestedPages);
            }
          } else {
          // Fallback if no sections are provided
          throw new Error('Invalid response format from API');
          }
        } else {
        // Show error if we didn't get proper content
        throw new Error(data.error || 'Failed to generate content');
      }
      
      // Update state with generated outline
      setPresentationTitle(title);
      setOutlineItems(items);
      
      // Switch to outline view
        setCurrentView('outline');
      
      toast.success('Outline generated successfully!', { id: loadingId });
      
    } catch (error) {
      console.error('Error generating outline:', error);
      toast.error(`Failed to generate outline: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: loadingId });
    } finally {
      setIsLoading(false);
    }
  };

  // Improve the buildEnhancedPrompt function to better incorporate file information
  const buildEnhancedPrompt = () => {
    let enhancedPrompt = prompt.trim();
    
    // Add uploaded files information more prominently
    if (uploadedFiles.length > 0) {
      enhancedPrompt = `${enhancedPrompt}\n\nImportant: Create a presentation incorporating content from these uploaded files: ${uploadedFiles.map(f => f.name).join(', ')}`;
    }
    
    return enhancedPrompt;
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

  // Update the handleGenerateSlides function
  const handleGenerateSlides = async () => {
    // Show the template customizer instead of template selector
    setShowTemplateCustomizer(true);
  };

  // Update the handleApplyTemplate function
  const handleApplyTemplate = (settings: TemplateSettings) => {
    setTemplateSettings(settings);
    generatePresentation(settings);
  };

  // Update the enrichSlideContent function to ensure all required properties are present
  const enrichSlideContent = (slides: SlideContent[]): SlideContent[] => {
    return slides.map(slide => {
      // Ensure slide has a valid type
      if (!slide.slideType) {
        slide.slideType = 'standard';
      }
      
      // Ensure slideImage is always present
      if (!slide.slideImage) {
        slide.slideImage = ''; // Provide a default empty string
      }
      
      // Fix: Use type assertion to handle the backgroundImage property
      if (!('backgroundImage' in slide)) {
        (slide as any).backgroundImage = undefined;
      }
      
      // Ensure slide has content
      if (!slide.content || slide.content.length === 0 || 
          (slide.content.length === 1 && slide.content[0].trim() === '')) {
        
        // Generate appropriate content based on slide type
        if (slide.slideType === 'quote') {
          slide.content = [
            `"A well-crafted presentation on ${slide.title} can transform understanding."`,
            "Presentation Expert"
          ];
        } else if (slide.slideType === 'statistics') {
          slide.content = [
            "67%: Increase in engagement with visual content",
            "$1.2M: Average value added through clear communication",
            "3x: Higher retention of information with structured presentations"
          ];
        } else {
          slide.content = [
            "Key aspects of this topic include comprehensive understanding",
            "Important principles guide successful implementation",
            "Real-world applications demonstrate practical value",
            "Future developments will continue to enhance possibilities"
          ];
        }
      }
      
      // Ensure content has sufficient depth (at least 3 items for most slide types)
      if (slide.slideType !== 'quote' && slide.slideType !== 'section-divider' && 
          slide.content.length < 3) {
        
        // Add generic but relevant points to reach minimum content amount
        const additionalPoints = [
          "This aspect connects to broader industry trends and developments",
          "Case studies reveal consistent patterns of success when implemented properly",
          "Expert analysis supports these conclusions across multiple contexts",
          "Integration with existing systems enhances overall effectiveness"
        ];
        
        // Add enough points to reach at least 3
        const pointsToAdd = Math.max(3 - slide.content.length, 0);
        slide.content = [
          ...slide.content,
          ...additionalPoints.slice(0, pointsToAdd)
        ];
      }
      
      return slide;
    });
  };

  // Update the generatePresentation function to ensure slides have the correct structure
  const generatePresentation = async (template: TemplateSettings) => {
    const loadingToastId = toast.loading('Creating your presentation...');
    
    try {
      // First generate images for slides
      const slideImages = await generateSlideImages();
      
      // Format the content for slides, adding images
      let slides: SlideContent[] = outlineItems.map(item => ({
        id: item.id.toString(),
        title: item.title,
        content: item.subtopics || [],
        slideType: item.slideType || 'standard', // Ensure slideType is never undefined
        backgroundImage: template.backgroundImage, // Include backgroundImage
        slideImage: slideImages[item.id] || '', // Ensure slideImage is never undefined
        // Add special fields based on slide type
        ...(item.slideType === 'quote' ? {
          quote: item.subtopics?.[0] || '',
          quoteAuthor: item.subtopics?.[1] || ''
        } : {}),
        ...(item.slideType === 'statistics' ? {
          statistics: item.subtopics?.map(stat => {
            const parts = stat.split(':');
            return {
              value: parts[0]?.trim() || '',
              label: parts.slice(1).join(':').trim() || ''
            };
          }) || []
        } : {})
      }));
      
      // Enrich and validate slide content
      slides = enrichSlideContent(slides);

      // Save the slides
      setGeneratedSlides(slides);
      
      // Show the presentation viewer
      setShowTemplateCustomizer(false);
      setShowPresentationViewer(true);
      
      toast.success('Presentation created successfully!', { id: loadingToastId });
    } catch (error) {
      console.error('Error in generatePresentation:', error);
      toast.error('Failed to generate presentation. Please try again.', { id: loadingToastId });
    }
  };

  const handleUploadFile = () => {
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
    
    // Update prompt with file information
    const fileNames = newFiles.map(f => f.name).join(', ');
    setPrompt(prev => {
      const newPrompt = prev ? 
        `${prev}\n\nIncorporate content from: ${fileNames}` : 
        `Create a presentation using content from: ${fileNames}`;
      return newPrompt;
    });
    
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

  // Add these functions to handle slide management
  const handleDeleteSlide = (slideId: number) => {
    const newItems = outlineItems.filter(item => item.id !== slideId);
    // Renumber the IDs to keep them sequential
    const renumberedItems = newItems.map((item, index) => ({
      ...item,
      id: index + 1
    }));
    setOutlineItems(renumberedItems);
    toast.success('Slide deleted');
  };

  const handleMoveSlide = (slideId: number, direction: 'up' | 'down') => {
    const currentIndex = outlineItems.findIndex(item => item.id === slideId);
    if (currentIndex === -1) return;
    
    // Calculate new index
    const newIndex = direction === 'up' 
      ? Math.max(0, currentIndex - 1) 
      : Math.min(outlineItems.length - 1, currentIndex + 1);
    
    // Don't move if already at the edge
    if (newIndex === currentIndex) return;
    
    // Create a new array with the item moved
    const newItems = [...outlineItems];
    const [movedItem] = newItems.splice(currentIndex, 1);
    newItems.splice(newIndex, 0, movedItem);
    
    // Renumber IDs to keep them sequential
    const renumberedItems = newItems.map((item, index) => ({
      ...item,
      id: index + 1
    }));
    
    setOutlineItems(renumberedItems);
  };

  const handleTitleEdit = (id: number, title: string) => {
    setEditingTitleId(id);
    setEditingTitle(title);
  };

  const saveTitleEdit = () => {
    if (editingTitleId === null) return;
    
    const newItems = [...outlineItems];
    const itemIndex = newItems.findIndex(item => item.id === editingTitleId);
    
    if (itemIndex >= 0) {
      newItems[itemIndex] = { ...newItems[itemIndex], title: editingTitle };
      setOutlineItems(newItems);
    } else if (editingTitleId === 0) {
      // Editing presentation title
      setPresentationTitle(editingTitle);
    }
    
    setEditingTitleId(null);
  };

  const savePromptEdit = () => {
    setPrompt(editedPrompt);
    setIsEditingPrompt(false);
    toast.success('Prompt updated');
  };

  // Add this function to manage the active tool tab
  const [activeToolTab, setActiveToolTab] = useState<'theme' | 'pages' | 'aiImage' | 'aiWriting' | 'layout' | null>(null);

  // Add this to handle updating the current slide layout
  const updateCurrentSlideLayout = (layoutType: string) => {
    if (currentSlideIndex < outlineItems.length) {
      const newItems = [...outlineItems];
      newItems[currentSlideIndex] = {
        ...newItems[currentSlideIndex],
        slideType: layoutType
      };
      setOutlineItems(newItems);
      toast.success(`Slide layout updated to ${layoutType}`);
    }
  };

  // Add this function to generate image for current slide
  const generateImageForCurrentSlide = async (prompt: string) => {
    if (!prompt.trim()) {
      toast.error("Please enter an image description");
      return;
    }
    
    setIsGeneratingImages(true);
    toast.loading(`Generating image for "${outlineItems[currentSlideIndex]?.title}"...`);
    
    try {
      // Optimize the prompt for better image search
      const slideTitle = outlineItems[currentSlideIndex]?.title || '';
      const optimizedPrompt = `${prompt} ${slideTitle}`.trim();
      const encodedPrompt = encodeURIComponent(optimizedPrompt);
      
      // Add cache breaker for fresh results
      const cacheBreaker = Date.now();
      const imageUrl = `https://source.unsplash.com/featured/800x600?${encodedPrompt}&t=${cacheBreaker}`;
      
      // Wait for image to be available
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the slide with the new image
      const newItems = [...outlineItems];
      newItems[currentSlideIndex] = {
        ...newItems[currentSlideIndex],
        imagePrompt: prompt
      };
      setOutlineItems(newItems);
      
      // Update image in the slideImages state
      setSlideImages(prev => ({
        ...prev,
        [newItems[currentSlideIndex].id]: imageUrl
      }));
      
      toast.success("Image generated successfully!");
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate image. Please try again.");
    } finally {
      setIsGeneratingImages(false);
    }
  };

  // Add this function to enhance current slide content with AI
  const enhanceSlideContent = async (instruction: string) => {
    if (!instruction.trim()) {
      toast.error("Please enter writing instructions");
      return;
    }
    
    const loadingToast = toast.loading("Enhancing slide content...");
    
    try {
      const currentSlide = outlineItems[currentSlideIndex];
      
      // Call the AI API to enhance the content
      const response = await fetch('/api/gemini-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Enhance this slide content: "${currentSlide.title}"
                   Current content: ${currentSlide.subtopics?.join(", ") || "Empty"}
                   
                   User instructions: ${instruction}
                   
                   Provide 4-6 enhanced bullet points that maintain the slide's purpose but make it more engaging, 
                   informative, and aligned with the user's instructions.
                   Return ONLY the bullet points as an array, no other text.`,
          model: 'gemini-2.0-flash'
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to enhance content");
      }
      
      const data = await response.json();
      
      // Extract the enhanced content
      let enhancedContent: string[] = [];
      if (data.status === 'success' && data.content) {
        if (Array.isArray(data.content)) {
          enhancedContent = data.content;
        } else if (data.content.sections && data.content.sections[0]?.subtopics) {
          enhancedContent = data.content.sections[0].subtopics;
        }
      }
      
      // Fallback if no content was generated
      if (enhancedContent.length === 0) {
        throw new Error("No enhanced content generated");
      }
      
      // Update the slide with enhanced content
      const newItems = [...outlineItems];
      newItems[currentSlideIndex] = {
        ...newItems[currentSlideIndex],
        subtopics: enhancedContent
      };
      setOutlineItems(newItems);
      
      toast.success("Content enhanced successfully!", { id: loadingToast });
    } catch (error) {
      console.error("Error enhancing content:", error);
      toast.error("Failed to enhance content. Please try again.", { id: loadingToast });
    }
  };

  // Add this component for the sidebar tools
  const renderToolSidebar = () => {
    switch (activeToolTab) {
      case 'theme':
  return (
          <div className="absolute right-24 top-16 bottom-0 w-72 bg-white border-l shadow-lg p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-black">Theme Settings</h3>
            <p className="text-black mb-4">Choose a theme for your presentation.</p>
            <div className="grid grid-cols-2 gap-3">
              {['Modern', 'Classic', 'Minimal', 'Bold', 'Creative', 'Professional'].map(theme => (
                <button
                  key={theme}
                  className="p-2 border rounded-md hover:bg-blue-50 text-black"
                  onClick={() => {
                    toast.success(`Theme set to ${theme}`);
                  }}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>
        );
        
      case 'pages':
        return (
          <div className="absolute right-24 top-16 bottom-0 w-72 bg-white border-l shadow-lg p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-black">Slides</h3>
            <div className="space-y-2">
              {outlineItems.map((item, index) => (
                <div 
                  key={item.id} 
                  className={`p-2 border rounded-md cursor-pointer ${currentSlideIndex === index ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}`}
                  onClick={() => setCurrentSlideIndex(index)}
                >
                  <p className="text-black font-medium truncate">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.slideType || 'standard'}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                const newId = outlineItems.length + 1;
                setOutlineItems([...outlineItems, {
                  id: newId,
                  title: `New Slide ${newId}`,
                  subtopics: ['Content will be added here'],
                  slideType: 'standard'
                }]);
                setCurrentSlideIndex(outlineItems.length);
                toast.success("New slide added");
              }}
              className="mt-4 w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add New Slide
            </button>
          </div>
        );
        
      case 'aiImage':
        return (
          <div className="absolute right-24 top-16 bottom-0 w-72 bg-white border-l shadow-lg p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-black">AI Image Generator</h3>
            <p className="text-black mb-4">Generate images for your slides using AI.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Image Description
                </label>
              <textarea
                  className="w-full p-2 border rounded text-black"
                  rows={4}
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Describe the image you want to generate..."
                ></textarea>
              </div>
              
                        <button 
                className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400"
                onClick={() => generateImageForCurrentSlide(imagePrompt)}
                disabled={isGeneratingImages || !imagePrompt.trim()}
              >
                {isGeneratingImages ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                      </div>
                ) : (
                  "Generate Image"
                )}
              </button>
              
              {slideImages[outlineItems[currentSlideIndex]?.id] && (
                    <div className="mt-4">
                  <p className="text-sm text-black mb-2">Current Slide Image:</p>
                  <img 
                    src={slideImages[outlineItems[currentSlideIndex]?.id]}
                    alt={outlineItems[currentSlideIndex]?.title}
                    className="w-full h-auto rounded-lg border"
                  />
                  <button
                    onClick={() => {
                      const newSlideImages = {...slideImages};
                      delete newSlideImages[outlineItems[currentSlideIndex]?.id];
                      setSlideImages(newSlideImages);
                      toast.success("Image removed");
                    }}
                    className="mt-2 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded border border-red-200 w-full"
                  >
                    Remove Image
                  </button>
                    </div>
                  )}
                </div>
            </div>
        );
        
      case 'aiWriting':
        return (
          <div className="absolute right-24 top-16 bottom-0 w-72 bg-white border-l shadow-lg p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-black">AI Writing Assistant</h3>
            <p className="text-black mb-4">Enhance your slide content with AI.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Current Slide Content:
                </label>
                <div className="p-3 bg-gray-50 rounded border mb-4 text-black">
                  <p className="font-medium">{outlineItems[currentSlideIndex]?.title}</p>
                  <ul className="mt-2 text-sm space-y-1">
                    {outlineItems[currentSlideIndex]?.subtopics?.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
                
                <label className="block text-sm font-medium text-black mb-1">
                  Writing Instructions
                </label>
                <textarea 
                  className="w-full p-2 border rounded text-black"
                  rows={4}
                  value={slideContent}
                  onChange={(e) => setSlideContent(e.target.value)}
                  placeholder="e.g., Make it more persuasive, Add statistics, Simplify the language..."
                ></textarea>
              </div>
              
                <button 
                className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                onClick={() => enhanceSlideContent(slideContent)}
                disabled={!slideContent.trim()}
                >
                Enhance Content
                </button>
            </div>
          </div>
        );
        
      case 'layout':
        return (
          <div className="absolute right-24 top-16 bottom-0 w-72 bg-white border-l shadow-lg p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-black">Layout Options</h3>
            <p className="text-black mb-4">Choose a layout for the current slide.</p>
            
            <div className="space-y-2">
              {[
                { id: 'standard', name: 'Bullet Points', icon: '•' },
                { id: 'title-slide', name: 'Title Only', icon: 'T' },
                { id: 'text-heavy', name: 'Text Heavy', icon: '¶' },
                { id: 'split', name: 'Split Content/Image', icon: '◧' },
                { id: 'quote', name: 'Quote', icon: '"' },
                { id: 'statistics', name: 'Statistics', icon: '#' },
                { id: 'timeline', name: 'Timeline', icon: '↔' },
                { id: 'comparison', name: 'Comparison', icon: '⇄' },
                { id: 'image-focus', name: 'Image Focus', icon: '🖼' },
                { id: 'diagram', name: 'Diagram', icon: '◉' },
                { id: 'example', name: 'Example', icon: '★' }
              ].map(layout => (
                <button
                  key={layout.id}
                  className={`flex items-center w-full p-3 border rounded-md hover:bg-blue-50 text-black ${
                    outlineItems[currentSlideIndex]?.slideType === layout.id ? 'bg-blue-100 border-blue-300' : ''
                  }`}
                  onClick={() => updateCurrentSlideLayout(layout.id)}
                >
                  <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-md mr-3 text-lg font-medium">
                    {layout.icon}
                  </span>
                  <span>{layout.name}</span>
                </button>
              ))}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  // Render the prompt/input view
  const renderPromptView = () => (
    <div className="border border-gray-200 rounded-lg p-6 mb-6">
      <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
          placeholder="You can specify the title of presentation or provide enhancing requirement."
          className="w-full h-20 text-black bg-white focus:outline-none resize-none font-medium"
        />
        
        {previewImage && (
          <div className="mt-2 relative">
            <img 
              src={previewImage} 
              alt="Preview" 
              className="h-20 w-auto rounded border border-gray-200" 
            />
                <button 
              onClick={() => setPreviewImage(null)}
              className="absolute top-1 right-1 bg-gray-800 bg-opacity-70 rounded-full p-1 text-white"
                >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
                </button>
            </div>
        )}
        
              {uploadedFiles.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
                    {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm">
                <DocumentIcon className="w-4 h-4 mr-1" />
                <span className="truncate max-w-[150px] text-black">{file.name}</span>
              <button
                          onClick={() => handleRemoveFile(index)}
                  className="ml-1 text-blue-500 hover:text-blue-700"
              >
                          <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
                    ))}
          </div>
        )}
          </div>

      {/* Configuration options */}
      <div className="mt-6 grid grid-cols-5 gap-4 bg-gray-50 p-4 rounded-lg">
        <div>
          <p className="text-sm text-black mb-2">Pages</p>
          <Dropdown 
            value={pages}
            onChange={setPages}
            options={pagesOptions}
                        />
            </div>
            
        <div>
          <p className="text-sm text-black mb-2">Word Amount</p>
          <Dropdown 
            value={wordAmount}
            onChange={setWordAmount}
            options={wordAmountOptions}
            icon={<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>}
          />
                        </div>

        <div>
          <p className="text-sm text-black mb-2">Audience</p>
          <Dropdown 
            value={audience}
            onChange={setAudience}
            options={audienceOptions}
          />
                    </div>

        <div>
          <p className="text-sm text-black mb-2">Slides Form</p>
          <Dropdown 
            value={slidesForm}
            onChange={setSlidesForm}
            options={slidesFormOptions}
          />
                    </div>

        <div>
          <p className="text-sm text-black mb-2">Image Source</p>
          <Dropdown 
            value={imageSource}
            onChange={setImageSource}
            options={imageSourceOptions}
          />
                  </div>
                </div>
      
      {/* Bottom toolbar */}
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <Switch
              checked={isOnline}
              onChange={setIsOnline}
              className={`${isOnline ? 'bg-blue-600' : 'bg-gray-200'}
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
            >
              <span
                className={`${isOnline ? 'translate-x-6' : 'translate-x-1'}
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
            <span className="ml-2 text-sm font-medium text-black">Online</span>
            </div>
      
            <button 
            onClick={handleUploadFile}
            className="text-gray-500 hover:text-gray-700 p-2"
            title="Attach file"
            >
            <PaperClipIcon className="w-5 h-5" />
            </button>
                </div>

        <div className="flex items-center space-x-4">
          {/* AI model dropdown with black text */}
              <div className="relative">
            <select
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              className="appearance-none bg-gray-100 rounded-lg px-3 py-1.5 pr-8 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {aiModelOptions.map(option => (
                <option key={option.value} value={option.value} className="text-black">{option.label}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                  </div>
                </div>
          
              <button
                onClick={generateOutline}
                disabled={isLoading}
            className={`bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-3 transition ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
              </button>
              </div>
                  </div>
                </div>
  );

  // Render the outline view
  const renderOutlineView = () => (
    <div className="border border-gray-200 rounded-lg p-4 mb-6">
      {/* Prompt section with inline editing */}
      <div className="mb-5">
        <h2 className="text-md font-semibold mb-2 text-black">Prompt</h2>
        <div className="border rounded-lg p-3 bg-white relative">
          {isEditingPrompt ? (
            <div className="flex flex-col">
              <textarea 
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                className="w-full p-2 text-black bg-white border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={3}
              />
              <div className="flex justify-end mt-2 space-x-2">
                <button 
                  onClick={() => setIsEditingPrompt(false)}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button 
                  onClick={savePromptEdit}
                  className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-start">
              <p className="text-black">{prompt}</p>
              <button 
                onClick={() => {
                  setIsEditingPrompt(true);
                  setEditedPrompt(prompt);
                }}
                className="ml-2 p-1 text-gray-500 hover:text-blue-500"
                title="Edit prompt"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>
          )}
          </div>
            </div>
            
      {/* Outline section */}
      <div>
        <h2 className="text-md font-semibold mb-2 text-black">Outline</h2>
        <div className="space-y-2">
          {/* Title (First slide) */}
                    <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center font-bold text-gray-600 text-lg mr-2">
              1
                  </div>
            <div className="bg-white border rounded flex-1">
              {editingTitleId === 0 ? (
                <div className="flex items-center p-2">
                      <input 
                        type="text" 
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={saveTitleEdit}
                    onKeyDown={(e) => e.key === 'Enter' && saveTitleEdit()}
                    className="flex-1 px-2 py-1 text-black bg-white border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                      />
                    </div>
                  ) : (
                <div className="flex items-center justify-between p-2">
                  <h3 className="text-md font-bold text-black">{presentationTitle}</h3>
                  <div className="flex space-x-1">
            <button
                      onClick={() => {
                        handleTitleEdit(0, presentationTitle);
                      }}
                      className="p-1 text-gray-500 hover:text-blue-500"
                      title="Edit title"
                    >
                      <PencilIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
            </div>
            </div>
            
          {/* Slide Items - with reordering and deletion options */}
          {outlineItems.map((item, index) => (
            <div key={item.id} className="flex items-center">
              <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center font-bold text-gray-600 text-lg mr-2">
                {index + 2}
              </div>
              <div className="bg-white border rounded flex-1">
                {editingTitleId === item.id ? (
                  <div className="flex items-center p-2">
                      <input 
                        type="text" 
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={saveTitleEdit}
                      onKeyDown={(e) => e.key === 'Enter' && saveTitleEdit()}
                      className="flex-1 px-2 py-1 text-black bg-white border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      autoFocus
                      />
                    </div>
                  ) : (
                  <div className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-2">
                      {item.isBulletPoint && <span className="text-black">•</span>}
                      <h3 className="text-md font-medium text-black">{item.title}</h3>
                </div>
                    <div className="flex space-x-1">
              <button
                        onClick={() => handleMoveSlide(item.id, 'up')}
                        className="p-1 text-gray-500 hover:text-blue-500"
                        title="Move up"
                        disabled={index === 0}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
              </button>
              <button
                        onClick={() => handleMoveSlide(item.id, 'down')}
                        className="p-1 text-gray-500 hover:text-blue-500"
                        title="Move down"
                        disabled={index === outlineItems.length - 1}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
              </button>
              <button 
                        onClick={() => handleTitleEdit(item.id, item.title)}
                        className="p-1 text-gray-500 hover:text-blue-500"
                        title="Edit slide"
                      >
                        <PencilIcon className="w-4 h-4" />
              </button>
              <button 
                        onClick={() => handleDeleteSlide(item.id)}
                        className="p-1 text-gray-500 hover:text-red-500"
                        title="Delete slide"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
                </div>
                )}
                  </div>
                </div>
              ))}
          </div>

        {/* Button to add a new slide */}
              <button 
          onClick={() => {
            const newId = outlineItems.length + 1;
            setOutlineItems([...outlineItems, {
              id: newId,
              title: `New Slide ${newId}`,
              subtopics: ['Content will be added here'],
              isBulletPoint: true
            }]);
          }}
          className="mt-3 flex items-center px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
        >
          <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
          Add Slide
              </button>
              
        {/* Theme selection button at bottom */}
        <div className="mt-6 flex justify-center">
              <button 
            onClick={handleGenerateSlides}
            className="flex items-center px-6 py-3 bg-indigo-600 rounded-full text-white hover:bg-indigo-700 mx-2"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            Select Theme
              </button>
                    </div>
                  </div>
                          </div>
  );

  // Render the slides view
  const renderSlidesView = () => (
    <div className="border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentView('outline')}
          className="flex items-center text-blue-600 hover:text-blue-800"
              >
          <ArrowLeftIcon className="w-5 h-5 mr-1" />
                Back to Outline
              </button>
        
        <div className="flex space-x-3">
              <button
            onClick={() => saveToMaterials()}
                disabled={isSavingToMaterials}
            className="flex items-center px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100"
              >
            <FolderIcon className="w-4 h-4 mr-1" />
                Save to Materials
              </button>
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
                  // @ts-ignore
                  if (window.downloadCurrentPresentation) {
                    // @ts-ignore
                    window.downloadCurrentPresentation();
              }
            }}
            className="flex items-center px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
          >
            <ArrowUpTrayIcon className="w-4 h-4 mr-1" />
            Download
          </a>
            </div>
          </div>

      {/* Simplified slide view */}
      <div className="mt-8 max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-blue-600 text-white p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">{presentationTitle}</h2>
            <p className="text-xl">Presentation created successfully!</p>
        </div>
          <div className="p-8">
            <div className="text-center mb-8">
              <p className="text-gray-600 mb-4">Your presentation has been generated with {outlineItems.length} slides.</p>
              <p className="text-gray-600">Click the Download button to save your presentation.</p>
              </div>
              
            <div className="flex justify-center">
              <button 
                onClick={() => {
                  // @ts-ignore
                  if (window.downloadCurrentPresentation) {
                    // @ts-ignore
                    window.downloadCurrentPresentation();
                  }
                }}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg flex items-center"
              >
                <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
                Download Presentation
              </button>
            </div>
                    </div>
                  </div>
              </div>
              </div>
  );
                      
                      return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Only show the main content when not viewing the presentation */}
      {!showPresentationViewer && (
        <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 pb-0">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-800">
                {currentView === 'prompt' ? 'Presentation from User and Internet Content with AI' : presentationTitle}
              </h1>
              <TeacherMascot 
                width={80} 
                height={80} 
                variant={selectedTheme as "white" | "blue" | "yellow" | "teal" | "purple" | "orange" | "rose" | "indigo" | "emerald" | "amber"} 
                toolType="creator" 
                className="hidden md:block" 
              />
            </div>
            
            {/* Render the appropriate view */}
            {currentView === 'prompt' 
              ? renderPromptView() 
              : currentView === 'outline' 
                ? renderOutlineView() 
                : renderSlidesView()
            }
            
            {/* Hidden file input */}
                  <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
            />
            
            {/* Template customizer */}
            {showTemplateCustomizer && (
              <TemplateCustomizer 
                presentationTitle={presentationTitle}
                prompt={prompt}
                onBack={() => setShowTemplateCustomizer(false)}
                onApply={handleApplyTemplate}
              />
            )}
          </div>
        </div>
      )}

      {/* Presentation viewer - now completely separate */}
      {showPresentationViewer && (
        <PresentationViewer
          title={presentationTitle}
          slides={generatedSlides}
          templateSettings={templateSettings}
          onEdit={() => {
            setShowPresentationViewer(false);
            setShowTemplateCustomizer(true);
          }}
          onBack={() => {
            setShowPresentationViewer(false);
          }}
        />
      )}
    </div>
  );
} 