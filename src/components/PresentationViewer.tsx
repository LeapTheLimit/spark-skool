import React, { useState, useEffect, ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

interface Slide {
  id: string;
  title: string;
  content: string[];
  slideType?: 'standard' | 'text-heavy' | 'example' | 'statistics' | 'quote' | 'image-focus' | 'title-slide' | 'section-divider' | 'comparison' | 'timeline' | 'diagram' | 'interactive' | 'split';
  backgroundImage?: string;
  slideImage?: string;
  chartData?: any; // For statistics slides
  quote?: string;
  quoteAuthor?: string;
  examples?: { title: string; description: string }[];
  comparisonData?: { left: string[]; right: string[]; leftTitle?: string; rightTitle?: string; };
  timelineData?: { date: string; event: string; }[];
}

interface PresentationViewerProps {
  title: string;
  slides: Slide[];
  templateSettings: any;
  onEdit: () => void;
  onBack: () => void;
}

// Add this Tooltip component definition
interface TooltipProps {
  children: ReactNode;
  content: string;
}

const Tooltip: React.FC<TooltipProps> = ({ children, content }) => {
  return (
    <div className="relative group">
      {children}
      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity">
        {content}
      </div>
    </div>
  );
};

// Add this function to try multiple image sources if one fails
const fetchImageFromMultipleSources = async (prompt: string): Promise<string> => {
  const encodedPrompt = encodeURIComponent(prompt);
  const timestamp = Date.now();
  
  // Try Unsplash first
  try {
    const unsplashUrl = `https://source.unsplash.com/random/800x600/?${encodedPrompt}&sig=${timestamp}`;
    // Quick test to see if URL is accessible
    await fetch(unsplashUrl, { method: 'HEAD' });
    return unsplashUrl;
  } catch (error) {
    console.log("Unsplash image fetch failed, trying fallback");
  }
  
  // Fallback to Pixabay if available (needs API key setup)
  // This is just a placeholder, would need actual implementation
  try {
    // If you have a Pixabay API key
    // const pixabayUrl = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodedPrompt}&image_type=photo`;
    // const response = await fetch(pixabayUrl);
    // const data = await response.json();
    // if (data.hits && data.hits.length > 0) {
    //   return data.hits[0].largeImageURL;
    // }
    // throw new Error("No images found");
  } catch (error) {
    console.log("Pixabay image fetch failed, using placeholder");
  }
  
  // Final fallback - placeholder image with the text
  return `https://via.placeholder.com/800x600/007ACC/FFFFFF?text=${encodedPrompt}`;
};

// Replace the FormatToolbar component with this simpler version
const FormatToolbar: React.FC = () => {
  return (
    <div className="bg-white border-b border-gray-200 py-2 px-4 flex items-center space-x-3 shadow-sm w-full">
      {/* Font controls */}
      <select className="border rounded px-2 py-1 text-sm bg-white text-black">
        <option value="Arial">Arial</option>
        <option value="Helvetica">Helvetica</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Courier New">Courier New</option>
      </select>
      
      <select className="border rounded px-2 py-1 w-16 text-sm bg-white text-black">
        <option value="12">12</option>
        <option value="14">14</option>
        <option value="16">16</option>
        <option value="18">18</option>
        <option value="24">24</option>
      </select>
      
      {/* Formatting buttons */}
      <div className="flex space-x-1 border-l border-r px-2">
        <button className="p-1.5 hover:bg-gray-100 rounded text-black" title="Bold">
          <strong>B</strong>
        </button>
        <button className="p-1.5 hover:bg-gray-100 rounded text-black" title="Italic">
          <em>I</em>
        </button>
        <button className="p-1.5 hover:bg-gray-100 rounded text-black" title="Underline">
          <u>U</u>
        </button>
      </div>
      
      {/* Text color */}
      <button className="p-1.5 hover:bg-gray-100 rounded flex items-center text-black" title="Text Color">
        <div className="w-4 h-4 bg-black rounded-sm"></div>
      </button>
      
      {/* Alignment */}
      <div className="flex space-x-1">
        <button className="p-1.5 hover:bg-gray-100 rounded text-black" title="Align Left">≡</button>
        <button className="p-1.5 hover:bg-gray-100 rounded text-black" title="Align Center">::</button>
      </div>
    </div>
  );
};

const PresentationViewer: React.FC<PresentationViewerProps> = ({
  title,
  slides: initialSlides,
  templateSettings,
  onEdit,
  onBack
}) => {
  // Get language from context
  const { t, language } = useLanguage();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditingSlide, setIsEditingSlide] = useState(false);
  const [editedSlide, setEditedSlide] = useState<Slide | null>(null);
  const [activeToolTab, setActiveToolTab] = useState<'theme' | 'pages' | 'aiImage' | 'aiWriting' | 'layout' | null>(null);
  const [imagePrompt, setImagePrompt] = useState<string>('');
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [aiWritingPrompt, setAiWritingPrompt] = useState<string>('');
  const [isEnhancingContent, setIsEnhancingContent] = useState<boolean>(false);
  const [internalSlides, setInternalSlides] = useState<Slide[]>(initialSlides);
  
  // Add these new state variables at the top of the component
  const [directEditMode, setDirectEditMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [elementStyles, setElementStyles] = useState<{[id: string]: any}>({});
  const [textSizes, setTextSizes] = useState<{[id: string]: string}>({});
  const [editingText, setEditingText] = useState<{[id: string]: string}>({});
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [imagePositions, setImagePositions] = useState<{[id: string]: {x: number, y: number}}>({});
  
  // Add these state variables for mobile functionality
  const [showThumbnailsOnMobile, setShowThumbnailsOnMobile] = useState(false);
  const [showToolsOnMobile, setShowToolsOnMobile] = useState(false);
  
  // Add these state variables at the top of your component
  const [editingElement, setEditingElement] = useState<string | null>(null);
  const [editableContent, setEditableContent] = useState<{[key: string]: string}>({});
  const [showFormatBar, setShowFormatBar] = useState(false);
  const [formatBarPosition, setFormatBarPosition] = useState({ top: 0, left: 0 });
  const [selectedFormat, setSelectedFormat] = useState({
    fontSize: 'normal',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'left',
    color: 'black'
  });
  
  // Use these state variables to manage the toolbar functionality
  const [selectedFontFamily, setSelectedFontFamily] = useState("Arial");
  const [selectedFontSize, setSelectedFontSize] = useState("16");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textColor, setTextColor] = useState("#000000");
  const [textAlignment, setTextAlignment] = useState("left");
  
  // State for editing content
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [editedContentValue, setEditedContentValue] = useState<string>("");
  const [isDirectEditMode, setIsDirectEditMode] = useState<boolean>(true); // Set to true by default to always allow editing
  
  // Add this state variable at the component level
  const [activeTheme, setActiveTheme] = useState<string>(templateSettings?.templateId || 'modern');
  const [showThemeSettings, setShowThemeSettings] = useState<boolean>(false);
  
  // Get the current slide from internalSlides instead of slides
  const currentSlide = internalSlides[currentSlideIndex];
  
  // Check if the current language requires RTL
  const isRTL = ['ar', 'he'].includes(language);
  
  // Apply text direction based on language
  const getTextDirection = () => isRTL ? 'rtl' : 'ltr';
  
  // Utility function to determine text color based on theme - defined at component level
  const getThemeTextClass = () => {
    if (!templateSettings) return "text-black";
    
    if (templateSettings.layout === 'dark') return "text-white";
    if (templateSettings.layout === 'creative') return "text-purple-900";
    if (templateSettings.layout === 'gradient') return "text-indigo-900";
    
    return "text-black";
  };
  
  // Utility function to apply theme-specific styling to slides - defined at component level
  const getSlideStyles = (): React.CSSProperties => {
    if (!templateSettings) return {};
    
    const baseStyle: React.CSSProperties = {
      backgroundColor: templateSettings.layout === 'dark' ? '#0f172a' : '#ffffff',
      fontFamily: templateSettings.fonts?.body || 'Arial',
      position: 'relative'
    };
    
    switch (templateSettings.layout) {
      case 'modern':
        return {
          ...baseStyle,
          paddingLeft: '80px',
          borderLeft: `8px solid ${templateSettings.colors?.primary || '#3b82f6'}`
        };
      case 'gradient':
        return {
          ...baseStyle,
          background: `linear-gradient(135deg, ${templateSettings.colors?.background || '#ffffff'}, ${templateSettings.colors?.secondary || '#e0e7ff'})`
        };
      case 'creative':
        return {
          ...baseStyle,
          background: templateSettings.colors?.background || '#f5f3ff',
          borderRadius: '8px',
          boxShadow: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`
        };
      case 'dark':
        return {
          ...baseStyle,
          color: '#f1f5f9',
          background: '#0f172a'
        };
      case 'classic':
        return {
          ...baseStyle,
          borderTop: `4px solid ${templateSettings.colors?.primary || '#4b5563'}`,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        };
      default:
        return baseStyle;
    }
  };
  
  // Utility function to apply text formatting - defined at component level
  const applyTextFormatting = (text: string): string => {
    if (!text) return '';
    
    let formattedText = text;
    
    // Apply formatting based on the current state
    if (isBold) formattedText = `<strong>${formattedText}</strong>`;
    if (isItalic) formattedText = `<em>${formattedText}</em>`;
    if (isUnderline) formattedText = `<u>${formattedText}</u>`;
    
    return formattedText;
  };
  
  // Function to navigate to the next slide
  const nextSlide = () => {
    if (currentSlideIndex < internalSlides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };
  
  // Function to navigate to the previous slide
  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };
  
  // Function to handle fullscreen mode
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };
  
  // Check fullscreen status
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Function to download the presentation
  const downloadPresentation = () => {
    toast.success("Starting download...");
    // This would be replaced with actual download logic
    setTimeout(() => {
      toast.success("Presentation downloaded successfully!");
    }, 1500);
  };
  
  // Function to share the presentation
  const sharePresentation = () => {
    // Example share functionality
    if (navigator.share) {
      navigator.share({
        title: title,
        text: 'Check out my presentation!',
        url: window.location.href,
      })
      .then(() => toast.success('Shared successfully!'))
      .catch(error => toast.error('Error sharing: ' + error));
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href)
        .then(() => toast.success('Link copied to clipboard!'))
        .catch(() => toast.error('Failed to copy link'));
    }
  };
  
  // Function to start editing a slide
  const startEditingSlide = () => {
    setEditedSlide({...currentSlide});
    setIsEditingSlide(true);
    setActiveToolTab(null);
  };
  
  // Function to save the edited slide
  const saveEditedSlide = () => {
    if (editedSlide) {
      // Update the internalSlides array
      const updatedSlides = [...internalSlides];
      updatedSlides[currentSlideIndex] = editedSlide;
      setInternalSlides(updatedSlides);
      setIsEditingSlide(false);
      toast.success('Slide updated!');
    }
  };
  
  // Function to update the edited slide
  const updateEditedSlide = (field: 'title' | 'content' | 'slideType', value: string | string[]) => {
    if (editedSlide) {
      setEditedSlide({
        ...editedSlide,
        [field]: value
      });
    }
  };
  
  // Function to start presentation mode
  const startPresentation = () => {
    toggleFullscreen();
    // Additional presentation mode setup could go here
  };
  
  // Handle theme tab click
  const handleThemeClick = () => {
    setActiveToolTab(activeToolTab === 'theme' ? null : 'theme');
    setIsEditingSlide(false);
    toast.success('Theme editor opened');
    // Here you would implement theme customization
    onEdit(); // This would open the theme customizer
  };
  
  // Handle pages tab click
  const handlePagesClick = () => {
    setActiveToolTab(activeToolTab === 'pages' ? null : 'pages');
    setIsEditingSlide(false);
    toast.success('Pages manager opened');
    // Here you would implement page management functionality
  };
  
  // Handle AI Image tab click
  const handleAiImageClick = () => {
    setActiveToolTab(activeToolTab === 'aiImage' ? null : 'aiImage');
    setIsEditingSlide(false);
    toast.success('AI Image generator opened');
    // Here you would implement AI image generation
  };
  
  // Handle AI Writing tab click
  const handleAiWritingClick = () => {
    setActiveToolTab(activeToolTab === 'aiWriting' ? null : 'aiWriting');
    setIsEditingSlide(false);
    toast.success('AI Writing assistant opened');
    // Here you would implement AI writing assistance
  };
  
  // Handle Layout tab click
  const handleLayoutClick = () => {
    setActiveToolTab(activeToolTab === 'layout' ? null : 'layout');
    setIsEditingSlide(false);
    // Here you would implement layout customization
    startEditingSlide();
  };
  
  // Improve the generateImage function with better error handling and fallbacks
  const generateImage = async () => {
    if (!currentSlide || !imagePrompt.trim()) {
      toast.error("Please enter an image description");
      return;
    }
    
    setIsGeneratingImage(true);
    toast.loading("Generating image...");
    
    try {
      // Create a more specific prompt based on slide type and content
      let enhancedPrompt = imagePrompt.trim();
      const slideType = currentSlide.slideType || 'standard';
      
      // Add variation based on slide type
      if (slideType === 'statistics') {
        enhancedPrompt = `${enhancedPrompt} data visualization chart graph statistics`;
      } else if (slideType === 'quote') {
        enhancedPrompt = `${enhancedPrompt} inspirational conceptual abstract`;
      } else if (slideType === 'image-focus') {
        enhancedPrompt = `${enhancedPrompt} high quality professional photo`;
      } else {
        // Add some randomized descriptors for more variety
        const descriptors = [
          'professional', 'conceptual', 'creative', 'business', 
          'educational', 'modern', 'detailed', 'artistic'
        ];
        const randomDescriptor = descriptors[Math.floor(Math.random() * descriptors.length)];
        enhancedPrompt = `${enhancedPrompt} ${randomDescriptor}`;
      }
      
      // Use multiple fallback image sources for better reliability
      let imageUrl: string;
      
      try {
        // Try Unsplash with a CORS proxy if needed
        const encodedPrompt = encodeURIComponent(enhancedPrompt);
        const timestamp = Date.now();
        const randomSeed = Math.floor(Math.random() * 1000);
        imageUrl = `https://source.unsplash.com/random/800x600?${encodedPrompt}&t=${timestamp}&seed=${randomSeed}`;
        
        // Verify image loads before using it
        await new Promise((resolve, reject) => {
          const img = document.createElement('img');
          img.onload = () => resolve(true);
          img.onerror = () => reject(new Error("Failed to load Unsplash image"));
          img.crossOrigin = "anonymous"; // Add CORS support
          img.src = imageUrl;
        });
      } catch (error) {
        console.log("Unsplash failed, trying placeholder...");
        // Use a reliable placeholder as fallback
        imageUrl = `https://placehold.co/800x600/random/png?text=${encodeURIComponent(enhancedPrompt.substring(0, 20))}`;
      }
      
      // Update the slide with the new image
      const updatedSlides = [...internalSlides];
      const slideIndex = updatedSlides.findIndex(s => s.id === currentSlide.id);
      
      if (slideIndex !== -1) {
        updatedSlides[slideIndex] = {
          ...updatedSlides[slideIndex],
          slideImage: imageUrl
        };
        setInternalSlides(updatedSlides);
        setImagePrompt("");
        toast.success("Image generated successfully!");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate image. Using placeholder instead.");
      
      // Always provide a fallback image even if everything fails
      try {
        const fallbackImage = `https://placehold.co/800x600/random/png?text=${encodeURIComponent(imagePrompt.substring(0, 20))}`;
        
        const updatedSlides = [...internalSlides];
        const slideIndex = updatedSlides.findIndex(s => s.id === currentSlide.id);
        
        if (slideIndex !== -1) {
          updatedSlides[slideIndex] = {
            ...updatedSlides[slideIndex],
            slideImage: fallbackImage
          };
          setInternalSlides(updatedSlides);
        }
      } catch (fallbackError) {
        console.error("Even fallback failed:", fallbackError);
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };
  
  // Enhance the generateEnhancedContent function for more diverse output
  const generateEnhancedContent = (
    slideType: string, 
    prompt: string, 
    title: string, 
    currentContent: string[],
    languageContext: string
  ): string[] => {
    // Start with the current content as a base
    const contentBase = currentContent.length > 0 ? [...currentContent] : [];
    
    // Various enhancement options based on slide type and prompt
    const enhancements = {
      facts: [
        "Research shows that 78% of audiences remember visual content more effectively.",
        "Studies indicate a 42% improvement in comprehension with structured presentations.",
        "Organizations implementing these approaches report 65% higher engagement metrics."
      ],
      examples: [
        "For example, leading organizations like Microsoft have successfully implemented this approach.",
        "Case study: A Fortune 500 company achieved 3x ROI after adopting this methodology.",
        "Practical demonstration: Consider how this works in everyday scenarios."
      ],
      conclusions: [
        "The implications extend far beyond immediate applications to long-term strategic outcomes.",
        "This approach synthesizes multiple disciplines for comprehensive solutions.",
        "Future developments will likely extend these capabilities further."
      ],
      paragraphs: [
        "This concept represents a fundamental shift in how we approach problem-solving in this domain. By integrating multiple perspectives and methodologies, we create a more comprehensive framework that addresses the complexity of real-world challenges.",
        "The historical context provides essential background for understanding current developments. From the earliest iterations to modern implementations, the evolution of this approach demonstrates both continuity and innovation in response to changing needs.",
        "When examining the practical implications, we find significant opportunities for application across diverse sectors. The adaptability of these principles allows for customization while maintaining core effectiveness."
      ]
    };
    
    // If we're starting fresh, generate complete content based on type
    if (contentBase.length === 0) {
      switch (slideType) {
        case 'quote':
          return [
            `"${prompt || title} represents a transformative opportunity worth exploring in depth." - Industry Expert`,
            "Leading Authority in the Field"
          ];
          
        case 'statistics':
          return [
            "87%: Adoption rate among industry leaders",
            "$4.3M: Average annual value creation",
            "3.2x: Productivity multiplier documented in research",
            "68%: Reduction in implementation failures"
          ];
          
        case 'comparison':
          return [
            "Traditional Approach: Higher manual oversight and limited scalability",
            "Modern Solution: Automated processes with 3x efficiency gains",
            "Legacy Systems: Lengthy deployment cycles with integration challenges",
            "Current Technology: Rapid implementation with seamless integration"
          ];
          
        case 'timeline':
          return [
            "2020: Initial concept development and theoretical framework",
            "2021: First prototype implementations with promising results",
            "2022: Early adoption with iterative improvements",
            "2023: Widespread implementation and standardization",
            "2024: Next-generation enhancements and ecosystem development"
          ];
        
        case 'text-heavy':
          // For text-heavy slides, use paragraphs rather than bullet points
          return enhancements.paragraphs;
          
        default:
          // Mix of bullet points and a paragraph for standard slides
          return [
            `${title} provides a comprehensive framework for addressing complex challenges.`,
            "Key advantages include improved efficiency, scalability, and integration capabilities.",
            enhancements.paragraphs[0],
            "Organizations report significant ROI after full deployment across operations."
          ];
      }
    }
    
    // For existing content, enhance based on the prompt with more variety
    let enhancedContent = [...contentBase];
    
    // Add a paragraph if the content looks too bullet-pointy
    const allBulletPoints = enhancedContent.every(item => item.length < 100);
    if (allBulletPoints && enhancedContent.length >= 3) {
      // Replace one bullet point with a paragraph for more variety
      const index = Math.floor(Math.random() * enhancedContent.length);
      enhancedContent[index] = enhancements.paragraphs[Math.floor(Math.random() * enhancements.paragraphs.length)];
    }
    
    // Look for keywords in the prompt to determine enhancement type
    if (prompt.toLowerCase().includes('fact') || prompt.toLowerCase().includes('statistic')) {
      if (enhancedContent.length < 6) {
        enhancedContent.push(enhancements.facts[Math.floor(Math.random() * enhancements.facts.length)]);
      } else {
        const index = Math.floor(Math.random() * enhancedContent.length);
        enhancedContent[index] = enhancements.facts[Math.floor(Math.random() * enhancements.facts.length)];
      }
    }
    
    if (prompt.toLowerCase().includes('example') || prompt.toLowerCase().includes('case')) {
      if (enhancedContent.length < 6) {
        enhancedContent.push(enhancements.examples[Math.floor(Math.random() * enhancements.examples.length)]);
      } else {
        const index = Math.floor(Math.random() * enhancedContent.length);
        enhancedContent[index] = enhancements.examples[Math.floor(Math.random() * enhancements.examples.length)];
      }
    }
    
    return enhancedContent;
  };
  
  // Add a toolbar component for formatting options
  const EditingToolbar = () => {
    if (!selectedElement) return null;
    
    const increaseFontSize = () => {
      setTextSizes(prev => {
        const currentSize = prev[selectedElement] || 'text-base';
        let newSize = 'text-lg';
        if (currentSize === 'text-base') newSize = 'text-lg';
        else if (currentSize === 'text-lg') newSize = 'text-xl';
        else if (currentSize === 'text-xl') newSize = 'text-2xl';
        return {...prev, [selectedElement]: newSize};
      });
    };
    
    const decreaseFontSize = () => {
      setTextSizes(prev => {
        const currentSize = prev[selectedElement] || 'text-base';
        let newSize = 'text-sm';
        if (currentSize === 'text-lg') newSize = 'text-base';
        else if (currentSize === 'text-xl') newSize = 'text-lg';
        else if (currentSize === 'text-2xl') newSize = 'text-xl';
        return {...prev, [selectedElement]: newSize};
      });
    };
    
    return (
      <div className="absolute top-0 left-0 right-0 bg-white border-b shadow-sm z-20 py-2 px-4 flex items-center space-x-2">
        <button 
          onClick={decreaseFontSize}
          className="p-1 hover:bg-gray-100 rounded" 
          title="Decrease font size"
        >
          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <button 
          onClick={increaseFontSize}
          className="p-1 hover:bg-gray-100 rounded" 
          title="Increase font size"
        >
          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <div className="h-5 w-px bg-gray-300 mx-1"></div>
        <button 
          className="p-1 hover:bg-gray-100 rounded" 
          title="Bold"
        >
          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 12 12 12 12 18"></polyline>
          </svg>
        </button>
        <button 
          className="p-1 hover:bg-gray-100 rounded" 
          title="Italic"
        >
          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="10 6 10 10 14 10"></polyline>
          </svg>
        </button>
        <button 
          onClick={() => setSelectedElement(null)}
          className="ml-auto p-1 text-red-500 hover:bg-red-50 rounded" 
          title="Close editor"
        >
          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 6 6 18 6 6"></polyline>
          </svg>
        </button>
      </div>
    );
  };
  
  // Add functions to handle direct editing
  const startDragging = (elementId: string, e: React.MouseEvent) => {
    if (!directEditMode) return;
    setDraggedElement(elementId);
    // Calculate offset to maintain relative position when dragging
    const element = e.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };
  
  const handleDrag = (e: React.MouseEvent) => {
    if (!draggedElement || !directEditMode) return;
    const slideContainer = document.querySelector('.slide-container');
    if (!slideContainer) return;
    
    const containerRect = slideContainer.getBoundingClientRect();
    const newX = e.clientX - containerRect.left - dragOffset.x;
    const newY = e.clientY - containerRect.top - dragOffset.y;
    
    setImagePositions(prev => ({
      ...prev,
      [draggedElement]: { x: newX, y: newY }
    }));
  };
  
  const stopDragging = () => {
    setDraggedElement(null);
  };
  
  // Toggle direct editing mode
  const toggleDirectEditMode = () => {
    setIsDirectEditMode(!isDirectEditMode);
    if (isDirectEditMode) {
      // When exiting edit mode, save any pending edits
      if (editingContentId) {
        saveEditedContent(editingContentId);
      }
    } else {
      toast.success("Edit mode activated. Double-click on text to edit.");
    }
  };
  
  // Save all edits made in direct edit mode
  const saveAllEdits = () => {
    const updatedSlides = [...internalSlides];
    // Apply all text and position changes to slides
    // This would need to be implemented based on your data structure
    setInternalSlides(updatedSlides);
    
    // Reset editing state
    setSelectedElement(null);
    setDraggedElement(null);
  };
  
  // Update the renderSlideContent function to support direct editing
  // Modify existing renderSlideContent function to make elements editable
  
  // Update the handleDoubleClick function to initialize formatting controls properly
  const handleDoubleClick = (id: string, content: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Double-click detected on:", id, "with content:", content);
    
    // Set formatting state based on current content (detect bold, italic, underline)
    setIsBold(/<strong>|<b>/.test(content));
    setIsItalic(/<em>|<i>/.test(content));
    setIsUnderline(/<u>/.test(content));
    
    // Store the original text content without formatting tags for editing
    const plainContent = content
      .replace(/<strong>|<\/strong>|<b>|<\/b>/g, '')
      .replace(/<em>|<\/em>|<i>|<\/i>/g, '')
      .replace(/<u>|<\/u>/g, '');
    
    setEditingContentId(id);
    setEditedContentValue(plainContent);
  };

  // Apply formatting when saving content
  const saveEditedContent = (id: string) => {
    if (!editingContentId) return;
    console.log("Saving content for:", id, "with value:", editedContentValue);
    
    // Apply formatting based on toolbar state
    let formattedContent = editedContentValue;
    if (isBold) formattedContent = `<strong>${formattedContent}</strong>`;
    if (isItalic) formattedContent = `<em>${formattedContent}</em>`;
    if (isUnderline) formattedContent = `<u>${formattedContent}</u>`;
    
    const parts = id.split('-');
    const slideId = parts[0];
    const contentType = parts[1];
    const contentIndex = parseInt(parts[2] || '0');
    
    const slideIndex = internalSlides.findIndex(slide => slide.id === slideId);
    if (slideIndex === -1) return;
    
    const updatedSlides = [...internalSlides];
    
    if (contentType === 'title') {
      updatedSlides[slideIndex] = {
        ...updatedSlides[slideIndex],
        title: formattedContent
      };
    } else if (contentType === 'content') {
      const contentCopy = [...updatedSlides[slideIndex].content];
      contentCopy[contentIndex] = formattedContent;
      
      updatedSlides[slideIndex] = {
        ...updatedSlides[slideIndex],
        content: contentCopy
      };
    }
    
    setInternalSlides(updatedSlides);
    setEditingContentId(null);
    setEditedContentValue("");
    toast.success("Content updated successfully", { duration: 1500 });
  };

  // Add this useEffect hook for handling clicks outside editing areas
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (editingElement && !(e.target as HTMLElement).closest('.editable-element')) {
        saveEditedContent(editingElement);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingElement, editableContent]);
  
  // Define the renderSlideContent function before it's used
  const renderSlideContent = (slide: Slide, isEditing: boolean = false) => {
    if (!slide) return null;
    
    // Use the slideType to determine how to render
    const slideType = slide.slideType || 'standard';
    
    // Apply theme-specific styling to headings
    const headingStyle: React.CSSProperties = {
      color: templateSettings?.layout === 'dark' ? '#ffffff' : templateSettings?.colors?.text || '#1e293b',
      fontFamily: templateSettings?.fonts?.heading || templateSettings?.fonts?.body || 'Arial',
      borderBottom: templateSettings?.layout === 'classic' ? `2px solid ${templateSettings?.colors?.primary || '#4b5563'}` : 'none',
      direction: getTextDirection() // Add direction based on language
    };
    
    // Apply theme-specific styling to content
    const contentStyle: React.CSSProperties = {
      color: templateSettings?.layout === 'dark' ? '#e2e8f0' : templateSettings?.colors?.text || '#1e293b',
      fontFamily: templateSettings?.fonts?.body || 'Arial',
      textAlign: textAlignment as 'left' | 'center' | 'right' | 'justify',
      direction: getTextDirection() // Add direction based on language
    };
    
    switch(slideType) {
      case 'title-slide':
        return (
          <div className="p-8 flex flex-col justify-center items-center h-full text-center" style={getSlideStyles()}>
            <h1 
              className={`text-4xl font-bold mb-6 ${getThemeTextClass()}`}
              style={headingStyle}
              onDoubleClick={(e) => handleDoubleClick(`${slide.id}-title-0`, slide.title, e)}
            >
              {editingContentId === `${slide.id}-title-0` ? (
                <input
                  type="text"
                  value={editedContentValue}
                  onChange={(e) => setEditedContentValue(e.target.value)}
                  className="w-full p-2 bg-white text-black border border-blue-300 rounded"
                  autoFocus
                  onBlur={() => saveEditedContent(`${slide.id}-title-0`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      saveEditedContent(`${slide.id}-title-0`);
                    }
                  }}
                />
              ) : (
                slide.title
              )}
            </h1>
            <div className="space-y-4 max-w-3xl">
              {slide.content.map((item, index) => (
                <div 
                  key={index}
                  className={`text-xl ${getThemeTextClass()}`}
                  style={contentStyle}
                  onDoubleClick={(e) => handleDoubleClick(`${slide.id}-content-${index}`, item, e)}
                >
                  {editingContentId === `${slide.id}-content-${index}` ? (
                    <textarea
                      value={editedContentValue}
                      onChange={(e) => setEditedContentValue(e.target.value)}
                      className="w-full p-2 min-h-[50px] bg-white text-black border border-blue-300 rounded"
                      autoFocus
                      onBlur={() => saveEditedContent(`${slide.id}-content-${index}`)}
                    />
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: applyTextFormatting(item) }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'text-heavy':
        return (
          <div className="p-8 overflow-auto flex-1" style={getSlideStyles()}>
            <h2 
              className={`text-3xl font-bold mb-6 ${getThemeTextClass()}`}
              style={headingStyle}
              onDoubleClick={(e) => handleDoubleClick(`${slide.id}-title-0`, slide.title, e)}
            >
              {editingContentId === `${slide.id}-title-0` ? (
                <input
                  type="text"
                  value={editedContentValue}
                  onChange={(e) => setEditedContentValue(e.target.value)}
                  className="w-full p-2 bg-white text-black border border-blue-300 rounded"
                  autoFocus
                  onBlur={() => saveEditedContent(`${slide.id}-title-0`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      saveEditedContent(`${slide.id}-title-0`);
                    }
                  }}
                />
              ) : (
                slide.title
              )}
            </h2>
            <div className="space-y-6">
              {slide.content.map((item, index) => (
                <p 
                  key={index} 
                  className={`text-lg leading-relaxed ${getThemeTextClass()}`}
                  style={contentStyle}
                  onDoubleClick={(e) => handleDoubleClick(`${slide.id}-content-${index}`, item, e)}
                >
                  {editingContentId === `${slide.id}-content-${index}` ? (
                    <textarea
                      value={editedContentValue}
                      onChange={(e) => setEditedContentValue(e.target.value)}
                      className="w-full p-2 min-h-[100px] bg-white text-black border border-blue-300 rounded"
                      autoFocus
                      onBlur={() => saveEditedContent(`${slide.id}-content-${index}`)}
                    />
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: applyTextFormatting(item) }} />
                  )}
                </p>
              ))}
            </div>
          </div>
        );
        
      case 'quote':
        return (
          <div className="p-8 flex flex-col justify-center items-center h-full" style={getSlideStyles()}>
            <h2 
              className={`text-3xl font-bold mb-8 ${getThemeTextClass()}`}
              style={headingStyle}
              onDoubleClick={(e) => handleDoubleClick(`${slide.id}-title-0`, slide.title, e)}
            >
              {editingContentId === `${slide.id}-title-0` ? (
                <input
                  type="text"
                  value={editedContentValue}
                  onChange={(e) => setEditedContentValue(e.target.value)}
                  className="w-full p-2 bg-white text-black border border-blue-300 rounded"
                  autoFocus
                  onBlur={() => saveEditedContent(`${slide.id}-title-0`)}
                />
              ) : (
                slide.title
              )}
            </h2>
            <div className="text-center max-w-3xl mx-auto">
              <div className="text-5xl text-gray-300 mb-4">"</div>
              <blockquote 
                className={`text-2xl italic mb-6 ${getThemeTextClass()}`}
                style={{...contentStyle, fontStyle: 'italic'}}
                onDoubleClick={(e) => handleDoubleClick(`${slide.id}-content-0`, slide.content[0] || slide.quote || '', e)}
              >
                {editingContentId === `${slide.id}-content-0` ? (
                  <textarea
                    value={editedContentValue}
                    onChange={(e) => setEditedContentValue(e.target.value)}
                    className="w-full p-2 min-h-[100px] bg-white text-black border border-blue-300 rounded"
                    autoFocus
                    onBlur={() => saveEditedContent(`${slide.id}-content-0`)}
                  />
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: applyTextFormatting(slide.content[0] || slide.quote || '') }} />
                )}
              </blockquote>
              <div 
                className="text-xl mt-6 font-medium" 
                style={{color: templateSettings?.colors?.primary || '#3b82f6'}}
                onDoubleClick={(e) => handleDoubleClick(`${slide.id}-content-1`, slide.content[1] || slide.quoteAuthor || '', e)}
              >
                {editingContentId === `${slide.id}-content-1` ? (
                  <input
                    type="text"
                    value={editedContentValue}
                    onChange={(e) => setEditedContentValue(e.target.value)}
                    className="p-2 bg-white text-black border border-blue-300 rounded"
                    autoFocus
                    onBlur={() => saveEditedContent(`${slide.id}-content-1`)}
                  />
                ) : (
                  slide.content[1] || slide.quoteAuthor || ''
                )}
              </div>
            </div>
          </div>
        );
        
      case 'statistics':
        return (
          <div className="p-8 overflow-auto flex-1" style={getSlideStyles()}>
            <h2 
              className={`text-3xl font-bold mb-6 ${getThemeTextClass()}`}
              style={headingStyle}
              onDoubleClick={(e) => handleDoubleClick(`${slide.id}-title-0`, slide.title, e)}
            >
              {editingContentId === `${slide.id}-title-0` ? (
                <input
                  type="text"
                  value={editedContentValue}
                  onChange={(e) => setEditedContentValue(e.target.value)}
                  className="w-full p-2 bg-white text-black border border-blue-300 rounded"
                  autoFocus
                  onBlur={() => saveEditedContent(`${slide.id}-title-0`)}
                />
              ) : (
                slide.title
              )}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
              {slide.content.map((item, index) => (
                <div key={index} className="bg-white/10 p-6 rounded-lg shadow-sm">
                  <div 
                    className="text-4xl font-bold mb-2" 
                    style={{color: templateSettings?.colors?.primary || '#3b82f6'}}
                    onDoubleClick={(e) => handleDoubleClick(`${slide.id}-content-${index}`, item, e)}
                  >
                    {editingContentId === `${slide.id}-content-${index}` ? (
                      <input
                        type="text"
                        value={editedContentValue}
                        onChange={(e) => setEditedContentValue(e.target.value)}
                        className="w-full p-2 bg-white text-black border border-blue-300 rounded"
                        autoFocus
                        onBlur={() => saveEditedContent(`${slide.id}-content-${index}`)}
                      />
                    ) : (
                      <div dangerouslySetInnerHTML={{ __html: applyTextFormatting(item) }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'comparison':
        if (slide.comparisonData) {
          return (
            <div className="p-8 overflow-auto flex-1" style={getSlideStyles()}>
              <h2 
                className={`text-3xl font-bold mb-6 ${getThemeTextClass()}`}
                style={headingStyle}
                onDoubleClick={(e) => handleDoubleClick(`${slide.id}-title-0`, slide.title, e)}
              >
                {editingContentId === `${slide.id}-title-0` ? (
                  <input
                    type="text"
                    value={editedContentValue}
                    onChange={(e) => setEditedContentValue(e.target.value)}
                    className="w-full p-2 bg-white text-black border border-blue-300 rounded"
                    autoFocus
                    onBlur={() => saveEditedContent(`${slide.id}-title-0`)}
                  />
                ) : (
                  slide.title
                )}
              </h2>
              <div className="grid grid-cols-2 gap-8 mt-6">
                <div>
                  <h3 
                    className="text-xl font-semibold mb-4" 
                    style={{color: templateSettings?.colors?.primary || '#3b82f6'}}
                  >
                    {slide.comparisonData.leftTitle || 'Option A'}
                  </h3>
                  <ul className="space-y-3">
                    {slide.comparisonData.left.map((item, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="inline-block mr-2">•</span>
                        <span dangerouslySetInnerHTML={{ __html: applyTextFormatting(item) }} />
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 
                    className="text-xl font-semibold mb-4" 
                    style={{color: templateSettings?.colors?.secondary || '#93c5fd'}}
                  >
                    {slide.comparisonData.rightTitle || 'Option B'}
                  </h3>
                  <ul className="space-y-3">
                    {slide.comparisonData.right.map((item, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="inline-block mr-2">•</span>
                        <span dangerouslySetInnerHTML={{ __html: applyTextFormatting(item) }} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        }
        break;
        
      case 'image-focus':
        return (
          <div className="p-8 overflow-auto flex-1" style={getSlideStyles()}>
            <h2 
              className={`text-3xl font-bold mb-6 ${getThemeTextClass()}`}
              style={headingStyle}
              onDoubleClick={(e) => handleDoubleClick(`${slide.id}-title-0`, slide.title, e)}
            >
              {editingContentId === `${slide.id}-title-0` ? (
                <input
                  type="text"
                  value={editedContentValue}
                  onChange={(e) => setEditedContentValue(e.target.value)}
                  className="w-full p-2 bg-white text-black border border-blue-300 rounded"
                  autoFocus
                  onBlur={() => saveEditedContent(`${slide.id}-title-0`)}
                />
              ) : (
                slide.title
              )}
            </h2>
            
            {slide.slideImage && (
              <div className="relative aspect-video mb-6 rounded-lg overflow-hidden">
                <img 
                  src={slide.slideImage} 
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="space-y-3">
              {slide.content.map((item, index) => (
                <p 
                  key={index} 
                  className={`text-lg ${getThemeTextClass()}`}
                  style={contentStyle}
                  onDoubleClick={(e) => handleDoubleClick(`${slide.id}-content-${index}`, item, e)}
                >
                  {editingContentId === `${slide.id}-content-${index}` ? (
                    <textarea
                      value={editedContentValue}
                      onChange={(e) => setEditedContentValue(e.target.value)}
                      className="w-full p-2 min-h-[50px] bg-white text-black border border-blue-300 rounded"
                      autoFocus
                      onBlur={() => saveEditedContent(`${slide.id}-content-${index}`)}
                    />
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: applyTextFormatting(item) }} />
                  )}
                </p>
              ))}
            </div>
          </div>
        );
        
      case 'standard':
      default:
        return (
          <div className="p-8 overflow-auto flex-1" style={getSlideStyles()}>
            <h2 
              className={`text-3xl font-bold mb-6 ${getThemeTextClass()}`}
              style={headingStyle}
              onDoubleClick={(e) => handleDoubleClick(`${slide.id}-title-0`, slide.title, e)}
            >
              {editingContentId === `${slide.id}-title-0` ? (
                <input
                  type="text"
                  value={editedContentValue}
                  onChange={(e) => setEditedContentValue(e.target.value)}
                  className="w-full p-2 bg-white text-black border border-blue-300 rounded"
                  autoFocus
                  onBlur={() => saveEditedContent(`${slide.id}-title-0`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      saveEditedContent(`${slide.id}-title-0`);
                    }
                  }}
                />
              ) : (
                slide.title
              )}
            </h2>
            <div className="text-content space-y-4">
              {slide.content.map((item, index) => (
                <div key={index} className="flex items-start mb-3">
                  <span 
                    className="mr-2 text-lg mt-0.5" 
                    style={{ color: templateSettings?.colors?.primary || '#3b82f6' }}
                  >•</span>
                  <div 
                    className={`flex-1 ${getThemeTextClass()}`}
                    style={contentStyle}
                    onDoubleClick={(e) => handleDoubleClick(`${slide.id}-content-${index}`, item, e)}
                  >
                    {editingContentId === `${slide.id}-content-${index}` ? (
                      <textarea
                        value={editedContentValue}
                        onChange={(e) => setEditedContentValue(e.target.value)}
                        className="w-full p-2 min-h-[50px] bg-white text-black border border-blue-300 rounded"
                        autoFocus
                        onBlur={() => saveEditedContent(`${slide.id}-content-${index}`)}
                      />
                    ) : (
                      <div dangerouslySetInnerHTML={{ __html: applyTextFormatting(item) }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  // Update the renderToolSidebar function to include translations
  const renderToolSidebar = () => {
    if (!activeToolTab) return null;
    
    // Get colors based on template
    const getColorsForTemplate = (templateId: string) => {
      switch (templateId) {
        case 'modern':
          return {
            primary: '#3b82f6',
            secondary: '#93c5fd',
            background: '#ffffff',
            text: '#1e293b'
          };
        case 'classic':
          return {
            primary: '#4b5563',
            secondary: '#9ca3af',
            background: '#f9fafb',
            text: '#111827'
          };
        case 'minimal':
          return {
            primary: '#000000',
            secondary: '#d1d5db',
            background: '#ffffff',
            text: '#000000'
          };
        case 'creative':
          return {
            primary: '#8b5cf6',
            secondary: '#c4b5fd',
            background: '#f5f3ff',
            text: '#4c1d95'
          };
        case 'dark':
          return {
            primary: '#0ea5e9',
            secondary: '#7dd3fc',
            background: '#0f172a',
            text: '#f1f5f9'
          };
        case 'gradient':
          return {
            primary: '#6366f1',
            secondary: '#a5b4fc',
            background: 'linear-gradient(135deg, #e0e7ff, #ffffff)',
            text: '#1e1b4b'
          };
        default:
          return {
            primary: '#3b82f6',
            secondary: '#93c5fd',
            background: '#ffffff',
            text: '#1e293b'
          };
      }
    };
    
    // Common styles for the sidebar - make responsive for mobile
    const sidebarStyle = "absolute h-full bg-white border-l shadow-lg overflow-y-auto z-10 w-full md:w-80 md:right-20 md:top-0";
    
    switch (activeToolTab) {
      case 'theme':
        return (
          <div className={sidebarStyle}>
            <h3 className="text-lg font-semibold mb-4 text-black p-4">{t('theme')}</h3>
            <div className="space-y-4 p-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">{t('template')}</label>
                <div className="grid grid-cols-2 gap-3">
                  {['modern', 'classic', 'minimal', 'creative', 'dark', 'gradient'].map(template => (
                    <button
                      key={template}
                      className={`p-3 border rounded text-left 
                        ${activeTheme === template ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                      onClick={() => setActiveTheme(template)}
                    >
                      <div className="font-medium text-black capitalize">{template}</div>
                      <div 
                        className="w-full h-2 mt-2 rounded-full"
                        style={{ backgroundColor: getColorsForTemplate(template).primary }}
                      ></div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">{t('colorScheme')}</label>
                <div className="flex flex-wrap gap-2">
                  {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#000000'].map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full ${
                        getColorsForTemplate(activeTheme).primary === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        // Actually update the color
                        const colors = getColorsForTemplate(activeTheme);
                        colors.primary = color;
                        
                        const updatedTemplateSettings = {
                          ...templateSettings,
                          colors: {
                            ...colors
                          }
                        };
                        
                        // Update slides with new color
                        const updatedSlides = [...internalSlides];
                        setInternalSlides(updatedSlides);
                        
                        toast.success(`${t('colorChanged')}: ${color}`);
                      }}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">{t('font')}</label>
                <select 
                  className="w-full p-2 border rounded bg-white text-black"
                  value={selectedFontFamily}
                  onChange={(e) => {
                    setSelectedFontFamily(e.target.value);
                    
                    // Update template settings with the new font
                    const updatedTemplateSettings = {
                      ...templateSettings,
                      fonts: {
                        ...templateSettings.fonts,
                        body: e.target.value,
                        heading: e.target.value
                      }
                    };
                    
                    // Apply font change to slides
                    const updatedSlides = [...internalSlides];
                    setInternalSlides(updatedSlides);
                  }}
                >
                  <option>Arial</option>
                  <option>Helvetica</option>
                  <option>Times New Roman</option>
                  <option>Georgia</option>
                  <option>Verdana</option>
                </select>
              </div>
              
              <button
                className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mt-4"
                onClick={() => {
                  // Apply theme changes - update templateSettings properly
                  const colors = getColorsForTemplate(activeTheme);
                  
                  // Create a new template settings object with updated values
                  const updatedTemplateSettings = {
                    ...templateSettings,
                    layout: activeTheme,
                    colors: colors,
                    fonts: {
                      heading: selectedFontFamily,
                      body: selectedFontFamily
                    }
                  };
                  
                  // Update the component state with the new template settings
                  templateSettings.layout = activeTheme;
                  templateSettings.colors = colors;
                  templateSettings.fonts = {
                    heading: selectedFontFamily,
                    body: selectedFontFamily
                  };
                  
                  // Force a re-render of slides with new theme
                  const updatedSlides = [...internalSlides];
                  setInternalSlides(updatedSlides);
                  
                  toast.success(t('themeUpdated'));
                  setActiveToolTab(null);
                  setShowToolsOnMobile(false);
                }}
              >
                {t('applyTheme')}
              </button>
            </div>
          </div>
        );
        
      case 'aiImage':
        return (
          <div className={sidebarStyle}>
            <h3 className="text-lg font-semibold mb-4 text-black p-4">{t('aiImageGenerator')}</h3>
            <div className="space-y-4 p-4">
              <p className="text-sm text-gray-600">
                {t('aiImageGeneratorDesc')}
              </p>
              <textarea
                className="w-full p-3 border rounded h-32 bg-white text-black"
                placeholder={t('describeImage')}
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
              ></textarea>
              <button
                className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={generateImage}
                disabled={isGeneratingImage}
              >
                {isGeneratingImage ? t('generating') : t('generateImage')}
              </button>
              
              {currentSlide?.slideImage && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">{t('currentImage')}:</p>
                  <div className="relative pb-[56.25%] bg-gray-100 rounded overflow-hidden">
                    <img 
                      src={currentSlide.slideImage} 
                      alt={currentSlide.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        // If image fails to load, hide container
                        const target = e.target as HTMLImageElement;
                        if (target.parentElement) {
                          target.parentElement.style.display = 'none';
                        }
                      }}
                    />
                  </div>
                  <button
                    className="w-full py-1 mt-2 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                    onClick={() => {
                      // Remove image
                      const updatedSlides = [...internalSlides];
                      updatedSlides[currentSlideIndex] = {
                        ...updatedSlides[currentSlideIndex],
                        slideImage: undefined
                      };
                      setInternalSlides(updatedSlides);
                    }}
                  >
                    {t('removeImage')}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
        
      case 'aiWriting':
        return (
          <div className={sidebarStyle}>
            <h3 className="text-lg font-semibold mb-4 text-black p-4">{t('aiWritingAssistant')}</h3>
            <div className="space-y-4 p-4">
              <p className="text-sm text-gray-600">
                {t('aiWritingAssistantDesc')}
              </p>
              <textarea
                className="w-full p-3 border rounded h-32 bg-white text-black"
                placeholder={t('describeEnhancement')}
                value={aiWritingPrompt}
                onChange={(e) => setAiWritingPrompt(e.target.value)}
              ></textarea>
              <button
                className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={() => {
                  if (!aiWritingPrompt.trim()) {
                    toast.error("Please enter writing instructions");
                    return;
                  }
                  
                  setIsEnhancingContent(true);
                  toast.loading("Enhancing content with AI...");
                  
                  try {
                    // Simulate AI enhancement (would connect to real API in production)
                    setTimeout(async () => {
                      // Get information about the current context for better content generation
                      const slideType = internalSlides[currentSlideIndex]?.slideType || 'standard';
                      const slideTitle = internalSlides[currentSlideIndex]?.title || '';
                      const currentContent = internalSlides[currentSlideIndex]?.content || [];
                      
                      // Add language awareness to the content generation
                      const languageContext = isRTL ? 'right-to-left language' : 'left-to-right language';
                      
                      // Generate enhanced content based on all available context
                      const enhancedContent = generateEnhancedContent(
                        slideType, 
                        aiWritingPrompt, 
                        slideTitle, 
                        currentContent,
                        languageContext
                      );
                      
                      // Update the slide with enhanced content
                      const updatedSlides = [...internalSlides];
                      updatedSlides[currentSlideIndex] = {
                        ...updatedSlides[currentSlideIndex],
                        content: enhancedContent
                      };
                      
                      // Update slides state
                      setInternalSlides(updatedSlides);
                      setIsEnhancingContent(false);
                      toast.success("Content enhanced successfully!");
                    }, 1500);
                  } catch (error) {
                    console.error("Error enhancing content:", error);
                    toast.error("Failed to enhance content. Please try again.");
                    setIsEnhancingContent(false);
                  }
                }}
                disabled={isEnhancingContent}
              >
                {isEnhancingContent ? t('enhancing') : t('enhanceContent')}
              </button>
              
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-600 mb-2">{t('currentContent')}:</p>
                <div className="bg-gray-50 p-3 rounded text-sm text-black">
                  <p className="font-semibold">{currentSlide.title}</p>
                  <ul className="mt-2 list-disc pl-5 space-y-1">
                    {currentSlide.content.map((item, i) => (
                      <li key={i}>{item.length > 60 ? item.substring(0, 60) + '...' : item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'pages':
        return (
          <div className={sidebarStyle}>
            <h3 className="text-lg font-semibold mb-4 text-black p-4">{t('pagesManager')}</h3>
            <div className="space-y-4 p-4">
              <p className="text-sm text-gray-600">
                {t('pagesManagerDesc')}
              </p>
              
              <button
                className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={() => {
                  // Add new slide
                  const newSlide: Slide = {
                    id: `slide-${internalSlides.length + 1}`,
                    title: 'New Slide',
                    content: ['Add your content here'],
                    slideType: 'standard'
                  };
                  setInternalSlides([...internalSlides, newSlide]);
                  setCurrentSlideIndex(internalSlides.length);
                  toast.success(t('newSlideAdded'));
                }}
              >
                {t('addNewSlide')}
              </button>
              
              <button
                className="w-full py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                onClick={() => {
                  // Duplicate current slide
                  const duplicatedSlide = {
                    ...currentSlide,
                    id: `slide-${internalSlides.length + 1}`,
                    title: `${currentSlide.title} (Copy)`
                  };
                  const newSlides = [...internalSlides];
                  newSlides.splice(currentSlideIndex + 1, 0, duplicatedSlide);
                  setInternalSlides(newSlides);
                  setCurrentSlideIndex(currentSlideIndex + 1);
                  toast.success(t('slideDuplicated'));
                }}
              >
                {t('duplicateSlide')}
              </button>
              
              {internalSlides.length > 1 && (
                <button
                  className="w-full py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                  onClick={() => {
                    // Delete current slide
                    const newSlides = internalSlides.filter((_, index) => index !== currentSlideIndex);
                    setInternalSlides(newSlides);
                    if (currentSlideIndex >= newSlides.length) {
                      setCurrentSlideIndex(newSlides.length - 1);
                    }
                    toast.success(t('slideDeleted'));
                    setShowToolsOnMobile(false);
                  }}
                >
                  {t('deleteCurrentSlide')}
                </button>
              )}
            </div>
          </div>
        );
        
      case 'layout':
        return (
          <div className={sidebarStyle}>
            <h3 className="text-lg font-semibold mb-4 text-black p-4">{t('layoutOptions')}</h3>
            <div className="space-y-4 p-4">
              <p className="text-sm text-gray-600">
                {t('layoutOptionsDesc')}
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">{t('slideType')}</label>
                <select 
                  className="w-full p-2 border rounded bg-white text-black"
                  value={currentSlide.slideType || 'standard'}
                  onChange={(e) => {
                    const updatedSlides = [...internalSlides];
                    updatedSlides[currentSlideIndex] = {
                      ...updatedSlides[currentSlideIndex],
                      slideType: e.target.value as Slide['slideType']
                    };
                    setInternalSlides(updatedSlides);
                  }}
                >
                  <option value="standard">{t('standard')}</option>
                  <option value="text-heavy">{t('textHeavy')}</option>
                  <option value="quote">{t('quote')}</option>
                  <option value="statistics">{t('statistics')}</option>
                  <option value="comparison">{t('comparison')}</option>
                  <option value="timeline">{t('timeline')}</option>
                  <option value="image-focus">{t('imageFocus')}</option>
                  <option value="example">{t('example')}</option>
                </select>
              </div>
            </div>
          </div>
        );
    }
  };

  // If in fullscreen presentation mode, show a simplified view with nothing obscuring content
  if (isFullscreen) {
    return (
      <div 
        className="h-screen w-screen relative bg-white"
        style={{ 
          backgroundColor: templateSettings.colors.background,
          fontFamily: templateSettings.fonts.body
        }}
      >
        {/* Background image if any */}
        {templateSettings.backgroundImage && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-20" 
            style={{ backgroundImage: `url(${templateSettings.backgroundImage})` }}
          ></div>
        )}
        
        {/* Slide content */}
        <div className="absolute inset-0">
          {renderSlideContent(currentSlide, false)}
        </div>
        
        {/* Navigation controls - completely hidden by default, only shown on mouse movement */}
        <div className="absolute bottom-4 right-4 flex space-x-2 opacity-0 hover:opacity-70 transition-opacity duration-300">
          <button 
            onClick={prevSlide} 
            disabled={currentSlideIndex === 0}
            className="p-2 bg-white border rounded-full text-black disabled:opacity-50"
          >
            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          
          <span className="text-black">
            {currentSlideIndex + 1} / {internalSlides.length}
          </span>
          
          <button 
            onClick={nextSlide}
            disabled={currentSlideIndex === internalSlides.length - 1}
            className="p-2 bg-white border rounded-full text-black disabled:opacity-50"
          >
            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button 
            onClick={toggleFullscreen}
            className="p-2 bg-white border rounded-full text-black"
          >
            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 18 18 6 6 6"></polyline>
            </svg>
          </button>
        </div>
        
        {/* Keyboard event listener for navigation */}
        <div 
          tabIndex={0} 
          className="fixed inset-0 outline-none"
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
            else if (e.key === 'ArrowLeft') prevSlide();
            else if (e.key === 'Escape') toggleFullscreen();
          }}
          autoFocus
        />
      </div>
    );
  }
  
  // Regular view with editing capabilities - Now as a standalone page
  return (
    <div className="relative min-h-screen bg-white">
      <div className="w-full h-[calc(100vh-64px)] flex flex-col bg-gray-50">
        {/* Top navigation bar */}
        <div className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-2 flex items-center justify-between">
            <button 
              onClick={onBack}
              className="text-gray-700 hover:text-gray-900 focus:outline-none flex items-center"
            >
              <svg className="w-5 h-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              {t('back')}
            </button>
            <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
            <button
              onClick={() => {
                toast.success(t('doubleClickToEdit'), { duration: 3000 });
              }}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {t('edit')}
            </button>
          </div>
        </div>
        
        {/* Always show formatting toolbar - hide on smaller screens */}
        <div className="bg-white border-b border-gray-200 py-2 px-4 flex items-center space-x-3 shadow-sm sticky top-0 z-50 overflow-x-auto md:overflow-visible">
          <select 
            className="border rounded px-2 py-1 text-sm bg-white text-black"
            value={selectedFontFamily}
            onChange={(e) => setSelectedFontFamily(e.target.value)}
          >
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
          </select>
          
          <select 
            className="border rounded px-2 py-1 w-16 text-sm bg-white text-black"
            value={selectedFontSize}
            onChange={(e) => setSelectedFontSize(e.target.value)}
          >
            <option value="12">12</option>
            <option value="14">14</option>
            <option value="16">16</option>
            <option value="18">18</option>
            <option value="24">24</option>
          </select>
          
          <div className="flex space-x-1 border-l border-r px-2">
            <button 
              className={`p-1.5 hover:bg-gray-100 rounded text-black ${isBold ? 'bg-gray-200' : ''}`} 
              title={t('bold')}
              onClick={() => setIsBold(!isBold)}
            >
              <strong>B</strong>
            </button>
            <button 
              className={`p-1.5 hover:bg-gray-100 rounded text-black ${isItalic ? 'bg-gray-200' : ''}`} 
              title={t('italic')}
              onClick={() => setIsItalic(!isItalic)}
            >
              <em>I</em>
            </button>
            <button 
              className={`p-1.5 hover:bg-gray-100 rounded text-black ${isUnderline ? 'bg-gray-200' : ''}`} 
              title={t('underline')}
              onClick={() => setIsUnderline(!isUnderline)}
            >
              <u>U</u>
            </button>
          </div>
          
          <button className="p-1.5 hover:bg-gray-100 rounded text-black flex items-center" title={t('textColor')}>
            <div className="w-4 h-4 bg-black rounded-sm" style={{ backgroundColor: textColor }}></div>
          </button>
          
          <div className="flex space-x-1">
            <button 
              className={`p-1.5 hover:bg-gray-100 rounded text-black ${textAlignment === 'left' ? 'bg-gray-200' : ''}`} 
              title={t('alignLeft')}
              onClick={() => setTextAlignment('left')}
            >≡</button>
            <button 
              className={`p-1.5 hover:bg-gray-100 rounded text-black ${textAlignment === 'center' ? 'bg-gray-200' : ''}`} 
              title={t('alignCenter')}
              onClick={() => setTextAlignment('center')}
            >::</button>
          </div>
        </div>
        
        {/* Presentation content and sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar - slide thumbnails - toggleable on mobile */}
          <div className={`${activeToolTab ? 'hidden md:block' : 'block'} w-full md:w-64 border-r bg-white overflow-y-auto md:relative fixed inset-y-0 left-0 z-10 transform transition-transform duration-300 ease-in-out ${showThumbnailsOnMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
            <div className="md:hidden flex justify-between items-center p-3 border-b">
              <h3 className="font-medium text-black">{t('slides')}</h3>
              <button 
                onClick={() => setShowThumbnailsOnMobile(false)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-full"
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 18 18 6 6 6"></polyline>
                </svg>
              </button>
            </div>
            {internalSlides.map((slide, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentSlideIndex(index);
                  setShowThumbnailsOnMobile(false);
                }}
                className={`p-2 w-full ${
                  currentSlideIndex === index 
                    ? 'ring-2 ring-indigo-500' 
                    : 'hover:ring-1 hover:ring-gray-300'
                }`}
              >
                <div className="relative pb-[56.25%] bg-white border rounded-lg overflow-hidden">
                  {/* Slide thumbnail */}
                  <div 
                    className="absolute inset-0 flex flex-col p-2 text-left"
                    style={{ 
                      backgroundColor: templateSettings.colors.background,
                      fontFamily: templateSettings.fonts.body
                    }}
                  >
                    {templateSettings.layout === 'modern' && (
                      <>
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-1/4"
                          style={{ backgroundColor: templateSettings.colors.primary }}
                        ></div>
                        <div 
                          className="ml-[28%] mt-2 text-xs font-semibold truncate"
                          style={{ color: templateSettings.colors.text }}
                        >
                          {slide.title}
                        </div>
                      </>
                    )}
                    
                    {templateSettings.layout === 'classic' && (
                      <>
                        <div 
                          className="w-full h-1 mb-1"
                          style={{ backgroundColor: templateSettings.colors.primary }}
                        ></div>
                        <div 
                          className="text-xs font-semibold text-center truncate"
                          style={{ color: templateSettings.colors.text }}
                        >
                          {slide.title}
                        </div>
                      </>
                    )}
                    
                    {templateSettings.layout === 'minimal' && (
                      <div 
                        className="text-xs font-semibold truncate"
                        style={{ color: templateSettings.colors.text }}
                      >
                        {slide.title}
                      </div>
                    )}
                    
                    {templateSettings.layout === 'creative' && (
                      <>
                        <div 
                          className="h-1/3 w-full flex items-center justify-center mb-1"
                          style={{ backgroundColor: templateSettings.colors.primary }}
                        >
                          <div 
                            className="text-xs font-semibold text-white truncate px-1"
                          >
                            {slide.title}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Slide number */}
                  <div className="absolute top-1 left-1 w-5 h-5 bg-black/10 rounded-full flex items-center justify-center text-xs text-black">
                    {index + 1}
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          {/* Mobile buttons for thumbnail toggle and tools toggle */}
          <div className="fixed bottom-4 left-4 md:hidden z-20 flex space-x-2">
            <button
              onClick={() => setShowThumbnailsOnMobile(!showThumbnailsOnMobile)}
              className="p-3 bg-white rounded-full shadow-lg text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <button
              onClick={() => setShowToolsOnMobile(!showToolsOnMobile)}
              className="p-3 bg-white rounded-full shadow-lg text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </button>
          </div>
          
          {/* Main slide preview - center section with fixed spacing */}
          <div className="flex-1 p-4 flex items-center justify-center overflow-auto">
            <div className="relative w-full md:w-[85%] md:max-w-[1000px]">
              <div className="pb-[56.25%] bg-white border rounded-lg shadow-lg overflow-hidden">
                <div 
                  className="absolute inset-0"
                  style={{ 
                    backgroundColor: templateSettings.colors.background,
                    fontFamily: templateSettings.fonts.body,
                    color: templateSettings.colors.text
                  }}
                >
                  {/* Themed slide content */}
                  <div className={`absolute inset-0 ${templateSettings.layout}`}>
                    {/* Apply layout-specific styling based on theme */}
                    {templateSettings.layout === 'modern' && (
                      <div 
                        className="absolute left-0 top-0 bottom-0 w-16 md:w-24"
                        style={{ backgroundColor: templateSettings.colors.primary }}
                      ></div>
                    )}
                    
                    {templateSettings.layout === 'gradient' && (
                      <div 
                        className="absolute inset-0 opacity-20"
                        style={{ 
                          background: `linear-gradient(135deg, ${templateSettings.colors.primary}40, ${templateSettings.colors.secondary}40)`
                        }}
                      ></div>
                    )}
                    
                    {templateSettings.layout === 'dark' && (
                      <div className="absolute inset-0 bg-gray-900"></div>
                    )}
                    
                    {/* Actual slide content */}
                    <div className={`absolute inset-0 ${
                      templateSettings.layout === 'modern' ? 'pl-20 md:pl-28' : 'px-8'
                    }`}>
                      {isEditingSlide 
                        ? renderSlideContent(editedSlide || currentSlide, true) 
                        : renderSlideContent(currentSlide, false)
                      }
                      
                      {/* Instruction for double-click editing */}
                      {!isEditingSlide && !isFullscreen && (
                        <div className="absolute top-4 right-4 text-sm text-gray-600 italic">
                          {t('doubleClickToEdit')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Slide navigation - make more touch-friendly on mobile */}
              <div className="absolute -bottom-14 md:-bottom-10 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                <button 
                  onClick={prevSlide} 
                  disabled={currentSlideIndex === 0}
                  className="p-3 md:p-2 bg-white border rounded-full text-black disabled:opacity-50 shadow-md md:shadow-none"
                >
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                
                <span className="text-black">
                  {currentSlideIndex + 1} / {internalSlides.length}
                </span>
                
                <button 
                  onClick={nextSlide}
                  disabled={currentSlideIndex === internalSlides.length - 1}
                  className="p-3 md:p-2 bg-white border rounded-full text-black disabled:opacity-50 shadow-md md:shadow-none"
                >
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* Right sidebar - tools - toggleable on mobile */}
          <div className={`fixed md:static inset-y-0 right-0 w-[280px] md:w-20 border-l bg-white flex flex-col items-center py-6 z-10 transform transition-transform duration-300 ease-in-out ${showToolsOnMobile ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
            {/* Mobile close button */}
            <div className="md:hidden absolute top-4 left-4">
              <button 
                onClick={() => setShowToolsOnMobile(false)}
                className="p-2 bg-white rounded-full shadow-md text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 18 18 6 6 6"></polyline>
                </svg>
              </button>
            </div>
            
            {/* Sidebar navigation for tools */}
            <div className="md:fixed md:right-4 md:top-1/2 md:transform md:-translate-y-1/2 flex md:flex-col space-y-0 space-x-2 md:space-y-2 md:space-x-0 p-4 md:p-0">
              <button 
                onClick={() => {
                  setActiveToolTab(activeToolTab === 'theme' ? null : 'theme');
                }}
                className={`p-3 rounded-full ${activeToolTab === 'theme' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 shadow-md'}`}
                title={t('themeSettings')}
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="7 21 3 17 7 13 11 17 7 21"></polyline>
                </svg>
              </button>
              <Tooltip content={t('pages')}>
                <button
                  onClick={() => setActiveToolTab(activeToolTab === 'pages' ? null : 'pages')}
                  className={`p-3 rounded-full ${activeToolTab === 'pages' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-700'} shadow hover:shadow-md transition-all`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                </button>
              </Tooltip>
              
              <Tooltip content={t('aiImage')}>
                <button
                  onClick={() => setActiveToolTab(activeToolTab === 'aiImage' ? null : 'aiImage')}
                  className={`p-3 rounded-full ${activeToolTab === 'aiImage' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-700'} shadow hover:shadow-md transition-all`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </Tooltip>
              
              <Tooltip content={t('aiWriting')}>
                <button
                  onClick={() => setActiveToolTab(activeToolTab === 'aiWriting' ? null : 'aiWriting')}
                  className={`p-3 rounded-full ${activeToolTab === 'aiWriting' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-700'} shadow hover:shadow-md transition-all`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </Tooltip>
              
              <Tooltip content={t('layout')}>
                <button
                  onClick={() => setActiveToolTab(activeToolTab === 'layout' ? null : 'layout')}
                  className={`p-3 rounded-full ${activeToolTab === 'layout' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-700'} shadow hover:shadow-md transition-all`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </Tooltip>
            </div>

            {/* Render the active tool sidebar */}
            {activeToolTab && renderToolSidebar()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresentationViewer; 