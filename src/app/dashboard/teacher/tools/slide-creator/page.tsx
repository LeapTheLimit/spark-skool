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
      
      // Pass ALL settings as separate parameters
      const settings = {
        pages,
        wordAmount,
        audience,
        slidesForm,
        imageSource,
        isOnline
      };
      
      // Determine which model to use
      const modelName = aiModel === 'standard' 
        ? 'gemini-2.0-flash' 
        : 'gemini-2.0-flash-thinking-exp-01-21';
      
      // Call the API with the enhanced prompt AND settings
      const response = await fetch('/api/gemini-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: enhancedPrompt,
          model: modelName,
          settings: settings
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate presentation outline');
      }
      
      const data = await response.json();
      
      // Process the outline
      let title = '';
      let items: OutlineItem[] = [];
      
      if (data.status === 'success' && data.content) {
        if (data.content.title) {
          title = data.content.title;
        } else if (prompt.trim().length < 60) {
          // If no title in response but prompt is short, use prompt as title
          title = prompt.trim();
        } else {
          // Default title
          title = 'Generated Presentation';
        }
        
        // Process sections if they exist
        if (data.content.sections && Array.isArray(data.content.sections)) {
          items = data.content.sections.map((section: any, index: number) => ({
            id: index + 1,
            title: section.title || `Slide ${index + 1}`,
            subtopics: section.subtopics || [],
            isBulletPoint: section.isBulletPoint !== undefined ? section.isBulletPoint : true
          }));
        } else {
          // Fallback if no sections are provided
          const numSlides = parseInt(pages);
          items = Array(numSlides).fill(0).map((_, i) => ({
            id: i + 1,
            title: i === 0 ? 'Introduction' : i === numSlides - 1 ? 'Conclusion' : `Slide ${i + 1}`,
            subtopics: ['Add content here'],
            isBulletPoint: true
          }));
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
      toast.error('Failed to generate outline. Please try again.', { id: loadingId });
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

  // Render the prompt/input view
  const renderPromptView = () => (
    <div className="border border-gray-200 rounded-lg p-6 mb-6">
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="You can specify the title of presentation or provide enhancing requirement."
          className="w-full h-20 text-black bg-white focus:outline-none resize-none"
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
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12 2h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
    <div className="border border-gray-200 rounded-lg p-6 mb-6">
      {/* Prompt section */}
      <div className="mb-5">
        <h2 className="text-xl font-semibold mb-2">Prompt</h2>
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-black">{prompt}</p>
        </div>
      </div>
      
      {/* Outline section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Outline</h2>
        <div className="space-y-4">
          {/* Title (Slide 1) */}
          <div className="flex">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-600 text-2xl mr-4">
              1
            </div>
            <div className="bg-white border rounded-lg flex-1 p-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-black">{presentationTitle}</h3>
                <button
                  onClick={() => {
                    const newTitle = window.prompt('Edit presentation title:', presentationTitle);
                    if (newTitle) setPresentationTitle(newTitle);
                  }}
                  className="p-1 text-gray-500 hover:text-blue-500"
                  title="Edit title"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Slide Outline Items */}
          {outlineItems.map((item, index) => (
            <div key={item.id} className="flex">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-600 text-2xl mr-4">
                {index + 2}
              </div>
              <div className="bg-white border rounded-lg flex-1 p-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold text-black">{item.title}</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          const newTitle = window.prompt('Edit slide title:', item.title);
                          if (newTitle) {
                            const newItems = [...outlineItems];
                            const itemIndex = newItems.findIndex(i => i.id === item.id);
                            if (itemIndex >= 0) {
                              newItems[itemIndex] = { ...newItems[itemIndex], title: newTitle };
                              setOutlineItems(newItems);
                            }
                          }
                        }}
                        className="p-1 text-gray-500 hover:text-blue-500"
                        title="Edit slide"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {item.isBulletPoint ? (
                    <ul className="list-disc ml-5 space-y-1">
                      {item.subtopics && item.subtopics.map((point, i) => (
                        <li key={i} className="text-black">{point}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-black ml-2">
                      {item.subtopics && item.subtopics.join('\n')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Theme selection button at bottom */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleGenerateSlides}
            className="flex items-center px-6 py-3 bg-indigo-600 rounded-full text-white hover:bg-indigo-700 mx-2"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
        </div>
      </div>
    </div>
  );
} 