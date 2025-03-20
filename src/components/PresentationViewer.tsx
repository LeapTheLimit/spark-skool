import React, { useState, useEffect, ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

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
  
  // At the top of your component where you define state
  // Use these state variables to manage the toolbar functionality

  // Add these state variables
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
  
  // Update the generateImage function to handle errors better
  const generateImage = async () => {
    if (!currentSlide || !imagePrompt.trim()) {
      return;
    }
    
    setIsGeneratingImage(true);
    
    try {
      // Create a more specific prompt using the slide title and user input
      const enhancedPrompt = `${currentSlide.title} ${imagePrompt.trim()} conceptual professional`;
      
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const imageUrl = `https://source.unsplash.com/featured/800x600?${encodeURIComponent(enhancedPrompt)}&t=${timestamp}`;
      
      // Create an Image object with proper typing
      const img = document.createElement('img') as HTMLImageElement;
      
      // Set up promise to handle image loading
      const loadImage = new Promise<string>((resolve, reject) => {
        img.onload = () => resolve(imageUrl);
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = imageUrl;
      });
      
      // Wait for image to load or timeout after 10 seconds
      const timeoutPromise = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error("Image loading timed out")), 10000);
      });
      
      // Race the image loading against the timeout
      const finalImageUrl = await Promise.race([loadImage, timeoutPromise]);
      
      // Update the slide with the new image
      const updatedSlides = [...internalSlides];
      const slideIndex = updatedSlides.findIndex(s => s.id === currentSlide.id);
      
      if (slideIndex !== -1) {
        updatedSlides[slideIndex] = {
          ...updatedSlides[slideIndex],
          slideImage: finalImageUrl
        };
        setInternalSlides(updatedSlides);
        
        // Reset the prompt
        setImagePrompt("");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      // Don't attempt to update the DOM on failure
    } finally {
      setIsGeneratingImage(false);
    }
  };
  
  // Add this function to enhance content with AI
  const enhanceContentWithAI = async () => {
    if (!aiWritingPrompt.trim()) {
      toast.error("Please enter writing instructions");
      return;
    }
    
    setIsEnhancingContent(true);
    toast.loading("Enhancing content with AI...");
    
    try {
      // Simulate AI enhancement (would connect to real API in production)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate enhanced content based on the current slide type
      const slideType = internalSlides[currentSlideIndex]?.slideType || 'standard';
      const enhancedContent = generateEnhancedContent(slideType, aiWritingPrompt);
      
      // Update the slide with enhanced content
      const updatedSlides = [...internalSlides];
      updatedSlides[currentSlideIndex] = {
        ...updatedSlides[currentSlideIndex],
        content: enhancedContent
      };
      
      // Update slides state
      setInternalSlides(updatedSlides);
      toast.success("Content enhanced successfully!");
    } catch (error) {
      console.error("Error enhancing content:", error);
      toast.error("Failed to enhance content. Please try again.");
    } finally {
      setIsEnhancingContent(false);
    }
  };
  
  // Generate enhanced content based on slide type and prompt
  const generateEnhancedContent = (slideType: string, prompt: string): string[] => {
    // Base enhanced content that's generally applicable
    const baseContent = [
      "This enhanced point provides significantly more detail and supporting evidence for better audience comprehension.",
      "Statistical analysis reveals that 78% of presentations benefit from this type of clarified explanation with concrete examples.",
      "Consider the real-world implications: organizations implementing these principles have documented 3.5x return on investment.",
      "Studies from leading research institutions confirm these approaches drive measurable improvements in key performance metrics."
    ];
    
    // Specialized content based on slide type
    switch (slideType) {
      case 'quote':
        return [
          `"${prompt} represents one of the most transformative opportunities in this field today. The implications cannot be overstated." - Industry Expert`,
          "Leading Authority in the Field"
        ];
        
      case 'statistics':
        return [
          "87%: Proportion of industry leaders adopting this approach within the last 2 years",
          "$4.3M: Average annual savings reported by enterprise-level implementations",
          "3.2x: Productivity multiplier documented in peer-reviewed research",
          "68%: Reduction in implementation failures when following this methodology",
          "18 months: Average time to positive ROI after full deployment"
        ];
        
      case 'comparison':
        return [
          "Traditional Approach: Requires extensive manual oversight with higher error rates and diminished scalability",
          "Modern Solution: Leverages automation and intelligent systems for 3x efficiency with minimal human intervention",
          "Legacy Systems: Typically need 6-12 months for full deployment and show limited integration capabilities",
          "Current Technology: Can be implemented within 8-10 weeks and offers seamless integration with existing infrastructure"
        ];
        
      case 'timeline':
        return [
          "2018: Initial concept development and theoretical framework established by pioneering researchers",
          "2019: First prototype implementations demonstrate proof-of-concept in controlled environments",
          "2020: Early adopters begin small-scale deployments with promising preliminary results",
          "2021: Refinement of methodologies based on real-world implementation feedback",
          "2022: Widespread adoption begins as success metrics become impossible to ignore",
          "2023: Industry standardization efforts formalize best practices and implementation guidelines"
        ];
        
      case 'text-heavy':
        return [
          "The fundamental principles underlying this approach represent a paradigm shift in how organizations conceptualize and implement solutions to complex challenges. Rather than relying on traditional methodologies that tend to compartmentalize problems, this integrated framework recognizes the interconnected nature of modern systems and addresses them holistically.",
          "Empirical evidence supports the efficacy of this approach across diverse contexts and industries. A comprehensive meta-analysis of 47 independent studies conducted between 2019-2023 found statistically significant improvements in key performance indicators, with effect sizes ranging from moderate to substantial (Cohen's d = 0.62-0.89).",
          "Implementation considerations require careful attention to organizational readiness factors, including leadership alignment, resource allocation, and cultural receptivity to change. The most successful implementations follow a phased approach with clearly defined milestones and robust feedback mechanisms to enable continuous adaptation."
        ];
        
      default:
        return baseContent;
    }
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
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button 
          onClick={increaseFontSize}
          className="p-1 hover:bg-gray-100 rounded" 
          title="Increase font size"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <div className="h-5 w-px bg-gray-300 mx-1"></div>
        <button 
          className="p-1 hover:bg-gray-100 rounded" 
          title="Bold"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h8a4 4 0 100-8H6v8zm0 0h8a4 4 0 110 8H6v-8z" />
          </svg>
        </button>
        <button 
          className="p-1 hover:bg-gray-100 rounded" 
          title="Italic"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </button>
        <button 
          onClick={() => setSelectedElement(null)}
          className="ml-auto p-1 text-red-500 hover:bg-red-50 rounded" 
          title="Close editor"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
  
  // Replace the handleDoubleClick function completely
  const handleDoubleClick = (id: string, content: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Double-click detected on:", id, "with content:", content);
    
    setEditingContentId(id);
    setEditedContentValue(content);
  };

  // Replace the saveEditedContent function completely
  const saveEditedContent = (id: string) => {
    if (!editingContentId) return;
    console.log("Saving content for:", id, "with value:", editedContentValue);
    
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
        title: editedContentValue
      };
    } else if (contentType === 'content') {
      const contentCopy = [...updatedSlides[slideIndex].content];
      contentCopy[contentIndex] = editedContentValue;
      
      updatedSlides[slideIndex] = {
        ...updatedSlides[slideIndex],
        content: contentCopy
      };
    }
    
    setInternalSlides(updatedSlides);
    setEditingContentId(null);
    
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
    
    switch(slideType) {
      case 'title-slide':
        return (
          <div className="p-8 flex flex-col justify-center items-center h-full text-center">
            <h1 
              className="text-4xl font-bold mb-6 text-black"
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
                  className="text-xl text-black"
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
                    item
                  )}
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'text-heavy':
        return (
          <div className="p-8 overflow-auto flex-1">
            <h2 
              className="text-3xl font-bold mb-6 text-black"
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
                  className="text-lg leading-relaxed text-black"
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
                    item
                  )}
                </p>
              ))}
            </div>
          </div>
        );
        
      case 'standard':
      default:
        return (
          <div className="p-8 overflow-auto flex-1">
            <h2 
              className="text-3xl font-bold mb-6 text-black"
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
            <div className="text-content">
              {slide.content.map((item, index) => (
                <div key={index} className="flex items-start mb-4">
                  <span className="mr-2 text-lg text-black">•</span>
                  <div 
                    className="flex-1 text-black"
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
                      <span>{item}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  // Define the renderToolSidebar function
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
    
    // Common styles for the sidebar
    const sidebarStyle = "absolute right-20 top-0 bottom-0 w-80 bg-white border-l shadow-lg p-4 overflow-y-auto z-10";
    
    switch (activeToolTab) {
      case 'theme':
        return (
          <div className={sidebarStyle}>
            <h3 className="text-lg font-semibold mb-4 text-black">Theme Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Template</label>
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
                <label className="block text-sm font-medium text-gray-600 mb-1">Color Palette</label>
                <div className="flex space-x-2">
                  {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#000000'].map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full ${
                        getColorsForTemplate(activeTheme).primary === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        // This would normally update the primary color in the theme
                        toast.success(`Changed primary color to ${color}`);
                      }}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Font</label>
                <select className="w-full p-2 border rounded bg-white text-black">
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
                  // Apply theme changes
                  toast.success("Theme updated!");
                  setActiveToolTab(null);
                }}
              >
                Apply Theme
              </button>
            </div>
          </div>
        );
        
      case 'aiImage':
        return (
          <div className={sidebarStyle}>
            <h3 className="text-lg font-semibold mb-4 text-black">AI Image Generator</h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Describe the image you want to generate for this slide:
              </p>
              <textarea
                className="w-full p-3 border rounded h-32 bg-white text-black"
                placeholder="Describe the image you want (e.g., 'A professional looking pie chart showing market data')"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
              ></textarea>
              <button
                className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={generateImage}
                disabled={isGeneratingImage}
              >
                {isGeneratingImage ? 'Generating...' : 'Generate Image'}
              </button>
              
              {currentSlide?.slideImage && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Current Image:</p>
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
                    Remove Image
                  </button>
                </div>
              )}
            </div>
          </div>
        );
        
      case 'aiWriting':
        return (
          <div className={sidebarStyle}>
            <h3 className="text-lg font-semibold mb-4 text-black">AI Writing Assistant</h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Describe how you want to enhance this slide's content:
              </p>
              <textarea
                className="w-full p-3 border rounded h-32 bg-white text-black"
                placeholder="What would you like to add or improve? (e.g., 'Add more detailed statistics about market growth')"
                value={aiWritingPrompt}
                onChange={(e) => setAiWritingPrompt(e.target.value)}
              ></textarea>
              <button
                className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={enhanceContentWithAI}
                disabled={isEnhancingContent}
              >
                {isEnhancingContent ? 'Enhancing...' : 'Enhance Content'}
              </button>
              
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-600 mb-2">Current Content:</p>
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
      case 'layout':
      default:
        return (
          <div className={sidebarStyle}>
            <h3 className="text-lg font-semibold mb-4 text-black">
              {activeToolTab === 'pages' ? 'Pages Manager' : 'Layout Options'}
            </h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {activeToolTab === 'pages' 
                  ? 'Manage your presentation pages here.'
                  : 'Customize the layout of your current slide.'}
              </p>
              
              {activeToolTab === 'layout' && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Slide Type</label>
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
                    <option value="standard">Standard (Bullet Points)</option>
                    <option value="text-heavy">Text Heavy (Paragraphs)</option>
                    <option value="quote">Quote</option>
                    <option value="statistics">Statistics</option>
                    <option value="comparison">Comparison</option>
                    <option value="timeline">Timeline</option>
                    <option value="image-focus">Image Focus</option>
                    <option value="example">Example</option>
                  </select>
                </div>
              )}
              
              {activeToolTab === 'pages' && (
                <div className="space-y-2">
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
                      toast.success('New slide added!');
                    }}
                  >
                    Add New Slide
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
                      toast.success('Slide duplicated!');
                    }}
                  >
                    Duplicate Slide
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
                        toast.success('Slide deleted!');
                      }}
                    >
                      Delete Current Slide
                    </button>
                  )}
                </div>
              )}
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
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button 
            onClick={toggleFullscreen}
            className="p-2 bg-white border rounded-full text-black"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
            <button
              onClick={() => {
                toast.success("Double-click any text to edit", { duration: 3000 });
              }}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Edit
            </button>
          </div>
        </div>
        
        {/* Always show formatting toolbar */}
        <div className="bg-white border-b border-gray-200 py-2 px-4 flex items-center space-x-3 shadow-sm sticky top-0 z-50">
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
          
          <button className="p-1.5 hover:bg-gray-100 rounded text-black flex items-center" title="Text Color">
            <div className="w-4 h-4 bg-black rounded-sm"></div>
          </button>
          
          <div className="flex space-x-1">
            <button className="p-1.5 hover:bg-gray-100 rounded text-black" title="Align Left">≡</button>
            <button className="p-1.5 hover:bg-gray-100 rounded text-black" title="Align Center">::</button>
          </div>
        </div>
        
        {/* Presentation content and sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar - slide thumbnails - always visible with fixed width */}
          <div className="w-64 border-r bg-white overflow-y-auto">
            {internalSlides.map((slide, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlideIndex(index)}
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
          
          {/* Main slide preview - center section with fixed spacing */}
          <div className="flex-1 p-4 flex items-center justify-center overflow-auto">
            <div className="relative" style={{ width: '85%', maxWidth: '1000px' }}>
              <div className="pb-[56.25%] bg-white border rounded-lg shadow-lg overflow-hidden">
                <div 
                  className="absolute inset-0"
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
                    {isEditingSlide 
                      ? renderSlideContent(editedSlide || currentSlide, true) 
                      : renderSlideContent(currentSlide, false)
                    }
                    
                    {/* Instruction for double-click editing */}
                    {!isEditingSlide && !isFullscreen && (
                      <div className="absolute top-4 right-4 text-sm text-gray-600 italic">
                        Double-click any text to edit
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Slide navigation */}
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                <button 
                  onClick={prevSlide} 
                  disabled={currentSlideIndex === 0}
                  className="p-2 bg-white border rounded-full text-black disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* Right sidebar - tools - always visible with fixed width */}
          <div className="w-20 border-l bg-white flex flex-col items-center py-6">
            {/* Sidebar navigation for tools */}
            <div className="fixed right-4 top-1/2 transform -translate-y-1/2 flex flex-col space-y-2">
              <button 
                onClick={() => {
                  setActiveToolTab(activeToolTab === 'theme' ? null : 'theme');
                }}
                className={`p-3 rounded-full ${activeToolTab === 'theme' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 shadow-md'}`}
                title="Theme Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </button>
              <Tooltip content="Pages">
                <button
                  onClick={() => setActiveToolTab(activeToolTab === 'pages' ? null : 'pages')}
                  className={`p-3 rounded-full ${activeToolTab === 'pages' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-700'} shadow hover:shadow-md transition-all`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                </button>
              </Tooltip>
              
              <Tooltip content="AI Image">
                <button
                  onClick={() => setActiveToolTab(activeToolTab === 'aiImage' ? null : 'aiImage')}
                  className={`p-3 rounded-full ${activeToolTab === 'aiImage' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-700'} shadow hover:shadow-md transition-all`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </Tooltip>
              
              <Tooltip content="AI Writing">
                <button
                  onClick={() => setActiveToolTab(activeToolTab === 'aiWriting' ? null : 'aiWriting')}
                  className={`p-3 rounded-full ${activeToolTab === 'aiWriting' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-700'} shadow hover:shadow-md transition-all`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </Tooltip>
              
              <Tooltip content="Layout">
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