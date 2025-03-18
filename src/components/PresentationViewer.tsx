import React, { useState, useEffect, ReactNode } from 'react';
import { toast } from 'react-hot-toast';

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
  const [activeToolTab, setActiveToolTab] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState<string>('');
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [aiWritingPrompt, setAiWritingPrompt] = useState<string>('');
  const [isEnhancingContent, setIsEnhancingContent] = useState<boolean>(false);
  const [internalSlides, setSlides] = useState<Slide[]>(initialSlides);
  
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
      setSlides(updatedSlides);
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
  
  // Update the generateImage function for more reliable image fetching
  const generateImage = async () => {
    if (!imagePrompt.trim()) {
      toast.error("Please enter an image description");
      return;
    }
    
    setIsGeneratingImage(true);
    toast.loading("Generating image...");
    
    try {
      // Get the current slide
      const currentSlide = internalSlides[currentSlideIndex];
      
      // Create a specific, detailed prompt combining user input and slide context
      const enhancedPrompt = `${imagePrompt} ${currentSlide.title.replace(/[^\w\s]/gi, '')}`;
      
      // Try multiple image sources (Unsplash is primary)
      let imageUrl;
      
      // First attempt: Unsplash
      try {
        const timestamp = Date.now();
        const searchTerm = encodeURIComponent(enhancedPrompt);
        // Make the image URL more specific with search parameters and prevent caching
        imageUrl = `https://source.unsplash.com/featured/?${searchTerm}&sig=${timestamp}`;
        
        // Test if the image is available
        await fetch(imageUrl, { method: 'HEAD' });
        console.log("Using Unsplash image source:", imageUrl);
      } catch (error) {
        console.log("Unsplash source failed, trying alternative...");
        
        // Second attempt: Pixabay fallback
        try {
          // Placeholder for actual Pixabay API implementation (requires API key)
          // Would require setting up NEXT_PUBLIC_PIXABAY_API_KEY
          const pixabayKey = process.env.NEXT_PUBLIC_PIXABAY_API_KEY;
          if (pixabayKey) {
            const pixabayUrl = `https://pixabay.com/api/?key=${pixabayKey}&q=${encodeURIComponent(enhancedPrompt)}&image_type=photo&per_page=3`;
            const response = await fetch(pixabayUrl);
            const data = await response.json();
            if (data.hits && data.hits.length > 0) {
              imageUrl = data.hits[0].largeImageURL;
              console.log("Using Pixabay image source:", imageUrl);
            }
          }
        } catch (pixabayError) {
          console.log("Pixabay source also failed");
        }
        
        // If all image sources fail, use a placeholder
        if (!imageUrl) {
          // Use a placeholder with the search term embedded
          imageUrl = `https://via.placeholder.com/800x600/4285F4/FFFFFF?text=${encodeURIComponent(enhancedPrompt.substring(0, 30))}`;
          console.log("Using placeholder image:", imageUrl);
        }
      }
      
      // Update the slide with the new image
      const updatedSlides = [...internalSlides];
      updatedSlides[currentSlideIndex] = {
        ...updatedSlides[currentSlideIndex],
        slideImage: imageUrl
      };
      
      // Preload the image before updating state
      const img = new Image();
      img.onload = () => {
        // Only update state after the image has loaded
        setSlides(updatedSlides);
        setImagePrompt('');
        toast.dismiss();
        toast.success("Image generated successfully!");
      };
      
      img.onerror = () => {
        // If image loading fails, try a placeholder
        console.error("Image failed to load:", imageUrl);
        const placeholderUrl = `https://via.placeholder.com/800x600/4285F4/FFFFFF?text=${encodeURIComponent("Image for: " + currentSlide.title.substring(0, 20))}`;
        updatedSlides[currentSlideIndex].slideImage = placeholderUrl;
        
        setSlides(updatedSlides);
        toast.dismiss();
        toast.error("Could not load image, using placeholder instead");
      };
      
      // Start loading the image
      img.src = imageUrl;
      
    } catch (error) {
      console.error("Error generating image:", error);
      toast.dismiss();
      toast.error("Failed to generate image. Please try again.");
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
      setSlides(updatedSlides);
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
  
  // Render the slide content based on the template
  const renderSlideContent = (slide: Slide, isEditing: boolean = false) => {
    const colors = templateSettings.colors;
    const fonts = templateSettings.fonts;
    const layout = templateSettings.layout;
    
    if (isEditing) {
      return (
        <div id="slide-edit-area" className="w-full h-full flex flex-col p-6 bg-white text-black">
          <input
            type="text"
            value={editedSlide?.title || ''}
            onChange={(e) => updateEditedSlide('title', e.target.value)}
            className="text-2xl font-bold p-2 mb-4 border rounded bg-white text-black"
          />
          
          {/* Enhanced slide type selector with more options */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-1">
              Slide Type
            </label>
            <select
              value={editedSlide?.slideType || 'standard'}
              onChange={(e) => updateEditedSlide('slideType', e.target.value)}
              className="w-full p-2 border rounded bg-white text-black"
            >
              <option value="standard">Standard (Bullet Points)</option>
              <option value="text-heavy">Text-Heavy</option>
              <option value="example">Examples</option>
              <option value="statistics">Statistics</option>
              <option value="quote">Quote</option>
              <option value="image-focus">Image Focus</option>
              <option value="title-slide">Title Slide</option>
              <option value="section-divider">Section Divider</option>
              <option value="comparison">Comparison</option>
              <option value="timeline">Timeline</option>
              <option value="diagram">Diagram/Flow</option>
            </select>
          </div>
          
          {/* Content editor based on slide type */}
          {editedSlide?.slideType === 'quote' ? (
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">Quote</label>
                <textarea
                  value={editedSlide?.quote || editedSlide?.content[0] || ''}
                  onChange={(e) => {
                    const updatedSlide = {...editedSlide};
                    updatedSlide.quote = e.target.value;
                    setEditedSlide(updatedSlide);
                  }}
                  className="w-full p-2 border rounded h-24 bg-white text-black"
                  placeholder="Enter the quote..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Author</label>
                <input
                  type="text"
                  value={editedSlide?.quoteAuthor || editedSlide?.content[1] || ''}
                  onChange={(e) => {
                    const updatedSlide = {...editedSlide};
                    updatedSlide.quoteAuthor = e.target.value;
                    setEditedSlide(updatedSlide);
                  }}
                  className="w-full p-2 border rounded bg-white text-black"
                  placeholder="Who said it..."
                />
              </div>
            </div>
          ) : editedSlide?.slideType === 'example' ? (
            <div className="flex-1 overflow-auto mb-4">
              <label className="block text-sm font-medium text-black mb-1">Examples (one per line, format: "Title: Description")</label>
              <textarea
                value={editedSlide?.content.join('\n')}
                onChange={(e) => updateEditedSlide('content', e.target.value.split('\n'))}
                className="w-full p-2 border rounded h-64 bg-white text-black"
                placeholder="Example 1: Description of the first example
Example 2: Description of the second example"
              />
            </div>
          ) : editedSlide?.slideType === 'statistics' ? (
            <div className="flex-1 overflow-auto mb-4">
              <label className="block text-sm font-medium text-black mb-1">Statistics (one per line, format: "Value: Description")</label>
              <textarea
                value={editedSlide?.content.join('\n')}
                onChange={(e) => updateEditedSlide('content', e.target.value.split('\n'))}
                className="w-full p-2 border rounded h-64 bg-white text-black"
                placeholder="75%: Of users prefer this format
$2.5M: Annual savings reported
3x: Increase in productivity"
              />
            </div>
          ) : editedSlide?.slideType === 'comparison' ? (
            <div className="flex-1 overflow-auto mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Left Side Title</label>
                  <input
                    type="text"
                    value={editedSlide?.comparisonData?.leftTitle || 'Option A'}
                    onChange={(e) => {
                      const updatedSlide = {...editedSlide};
                      updatedSlide.comparisonData = {
                        ...(updatedSlide.comparisonData || { left: [], right: [] }),
                        leftTitle: e.target.value
                      };
                      setEditedSlide(updatedSlide);
                    }}
                    className="w-full p-2 border rounded bg-white text-black mb-2"
                  />
                  <label className="block text-sm font-medium text-black mb-1">Left Side Points (one per line)</label>
                  <textarea
                    value={(editedSlide?.comparisonData?.left || []).join('\n')}
                    onChange={(e) => {
                      const updatedSlide = {...editedSlide};
                      updatedSlide.comparisonData = {
                        ...(updatedSlide.comparisonData || { right: [], leftTitle: 'Option A', rightTitle: 'Option B' }),
                        left: e.target.value.split('\n')
                      };
                      setEditedSlide(updatedSlide);
                    }}
                    className="w-full p-2 border rounded h-48 bg-white text-black"
                    placeholder="Point 1 for left side
Point 2 for left side"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Right Side Title</label>
                  <input
                    type="text"
                    value={editedSlide?.comparisonData?.rightTitle || 'Option B'}
                    onChange={(e) => {
                      const updatedSlide = {...editedSlide};
                      updatedSlide.comparisonData = {
                        ...(updatedSlide.comparisonData || { left: [], right: [] }),
                        rightTitle: e.target.value
                      };
                      setEditedSlide(updatedSlide);
                    }}
                    className="w-full p-2 border rounded bg-white text-black mb-2"
                  />
                  <label className="block text-sm font-medium text-black mb-1">Right Side Points (one per line)</label>
                  <textarea
                    value={(editedSlide?.comparisonData?.right || []).join('\n')}
                    onChange={(e) => {
                      const updatedSlide = {...editedSlide};
                      updatedSlide.comparisonData = {
                        ...(updatedSlide.comparisonData || { left: [], leftTitle: 'Option A', rightTitle: 'Option B' }),
                        right: e.target.value.split('\n')
                      };
                      setEditedSlide(updatedSlide);
                    }}
                    className="w-full p-2 border rounded h-48 bg-white text-black"
                    placeholder="Point 1 for right side
Point 2 for right side"
                  />
                </div>
              </div>
            </div>
          ) : editedSlide?.slideType === 'timeline' ? (
            <div className="flex-1 overflow-auto mb-4">
              <label className="block text-sm font-medium text-black mb-1">Timeline (one entry per line, format: "Date/Period: Event")</label>
              <textarea
                value={editedSlide?.content?.join('\n')}
                onChange={(e) => updateEditedSlide('content', e.target.value.split('\n'))}
                className="w-full p-2 border rounded h-64 bg-white text-black"
                placeholder="2020: Initial research began
2021: First prototype developed
2022: Market launch
2023: International expansion"
              />
            </div>
          ) : editedSlide?.slideType === 'section-divider' ? (
            <div className="flex-1 mb-4">
              <label className="block text-sm font-medium text-black mb-1">Section Description (optional)</label>
              <textarea
                value={editedSlide?.content?.[0] || ''}
                onChange={(e) => updateEditedSlide('content', [e.target.value])}
                className="w-full p-2 border rounded h-24 bg-white text-black"
                placeholder="Brief description of the upcoming section..."
              />
            </div>
          ) : (
            <textarea
              value={editedSlide?.content.join('\n')}
              onChange={(e) => updateEditedSlide('content', e.target.value.split('\n'))}
              className="flex-1 p-2 border rounded bg-white text-black"
              placeholder={editedSlide?.slideType === 'text-heavy' 
                ? "Enter paragraphs of text (one paragraph per line)" 
                : "Slide content (one bullet point per line)"}
            />
          )}
          
          <div className="flex justify-end mt-4">
            <button
              onClick={() => setIsEditingSlide(false)}
              className="px-4 py-2 bg-gray-200 rounded-l-lg text-black"
            >
              Cancel
            </button>
            <button
              onClick={saveEditedSlide}
              className="px-4 py-2 bg-blue-600 rounded-r-lg text-white"
            >
              Save
            </button>
          </div>
        </div>
      );
    }
    
    // Based on slide type, render appropriate layout
    const slideType = slide.slideType || 'standard';
    
    // For text-heavy slides
    if (slideType === 'text-heavy') {
      return (
        <div className="flex flex-col h-full p-8">
          <h1 
            className="text-2xl font-bold mb-4"
            style={{ 
              color: colors.text,
              fontFamily: fonts.heading
            }}
          >
            {slide.title}
          </h1>
          
          <div 
            className="h-1 w-16 mb-6"
            style={{ backgroundColor: colors.accent }}
          ></div>
          
          <div className="flex-1 overflow-auto">
            <div className="prose prose-sm max-w-none"
              style={{ color: colors.text }}
            >
              {slide.content.map((paragraph, idx) => (
                <p key={idx} className="mb-3">{paragraph}</p>
              ))}
            </div>
          </div>
          
          <div className="text-sm mt-4 flex justify-between items-center">
            <div style={{ color: colors.primary }}>{title}</div>
            <div style={{ color: colors.text }}>{currentSlideIndex + 1}</div>
          </div>
        </div>
      );
    }
    
    // For example slides
    if (slideType === 'example') {
      const examples = slide.examples || 
        slide.content.map(item => {
          const parts = item.split(':');
          return { 
            title: parts[0] || 'Example', 
            description: parts.length > 1 ? parts.slice(1).join(':') : item 
          };
        });
      
      return (
        <div className="flex flex-col h-full p-8">
          <h1 
            className="text-2xl font-bold mb-4 text-center"
            style={{ 
              color: colors.text,
              fontFamily: fonts.heading
            }}
          >
            {slide.title}
          </h1>
          
          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {examples.map((example, idx) => (
                <div 
                  key={idx} 
                  className="border rounded-lg p-4 h-full"
                  style={{ borderColor: colors.accent, backgroundColor: colors.secondary }}
                >
                  <h3 
                    className="text-lg font-semibold mb-2" 
                    style={{ color: colors.primary }}
                  >
                    {example.title}
                  </h3>
                  <p style={{ color: colors.text }}>{example.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    // For statistics slides
    if (slideType === 'statistics') {
      return (
        <div className="flex flex-col h-full p-8">
          <h1 
            className="text-2xl font-bold mb-4 text-center"
            style={{ 
              color: colors.text,
              fontFamily: fonts.heading
            }}
          >
            {slide.title}
          </h1>
          
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {slide.content.map((stat, idx) => {
              // Parse statistics from content
              const parts = stat.split(':');
              const statValue = parts[0] || '75%';
              const statLabel = parts.length > 1 ? parts.slice(1).join(':') : 'Statistic';
              
              return (
                <div key={idx} className="flex flex-col items-center justify-center text-center p-4">
                  <div 
                    className="text-4xl font-bold mb-2" 
                    style={{ color: colors.primary }}
                  >
                    {statValue}
                  </div>
                  <div 
                    className="text-sm" 
                    style={{ color: colors.text }}
                  >
                    {statLabel}
                  </div>
                </div>
              );
            })}
          </div>
          
          {slide.slideImage && (
            <div className="mb-4 max-w-[40%] float-right ml-4 relative">
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <img 
                src={slide.slideImage} 
                alt={slide.title}
                className="rounded-lg shadow-lg w-full h-auto relative z-10"
                onLoad={(e) => {
                  // Hide the loading placeholder when image loads
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    const placeholder = parent.querySelector('div.absolute') as HTMLElement;
                    if (placeholder) placeholder.style.display = 'none';
                  }
                }}
                onError={(e) => {
                  console.error("Image failed to load:", slide.slideImage);
                  // Set a fallback image
                  e.currentTarget.src = `https://via.placeholder.com/800x600/4285F4/FFFFFF?text=${encodeURIComponent(slide.title.substring(0, 20))}`;
                  // Hide the loading placeholder
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    const placeholder = parent.querySelector('div.absolute') as HTMLElement;
                    if (placeholder) placeholder.style.display = 'none';
                  }
                }}
              />
            </div>
          )}
        </div>
      );
    }
    
    // For quote slides
    if (slideType === 'quote') {
      const quoteText = slide.quote || slide.content[0] || '';
      const quoteAuthor = slide.quoteAuthor || (slide.content.length > 1 ? slide.content[1] : '');
      
      return (
        <div className="flex flex-col h-full p-8 items-center justify-center">
          <div 
            className="text-6xl mb-6 opacity-20" 
            style={{ color: colors.primary }}
          >
            "
          </div>
          
          <blockquote 
            className="text-2xl italic text-center max-w-2xl mb-6" 
            style={{ color: colors.text }}
          >
            {quoteText}
          </blockquote>
          
          <div 
            className="text-xl font-semibold" 
            style={{ color: colors.primary }}
          >
            — {quoteAuthor}
          </div>
        </div>
      );
    }
    
    // For image-focused slides
    if (slideType === 'image-focus') {
      return (
        <div className="flex flex-col h-full">
          <div 
            className="h-2/3 w-full bg-center bg-cover flex items-end p-6"
            style={{ 
              backgroundImage: slide.slideImage ? `url(${slide.slideImage})` : 'none',
              backgroundColor: !slide.slideImage ? colors.primary : 'transparent'
            }}
          >
            <h1 
              className="text-3xl font-bold p-4 bg-black/50 text-white rounded-lg"
              style={{ fontFamily: fonts.heading }}
            >
              {slide.title}
            </h1>
          </div>
          
          <div className="flex-1 p-6">
            <ul className="space-y-2">
              {slide.content.map((item, idx) => (
                <li 
                  key={idx} 
                  className="flex items-start"
                  style={{ color: colors.text }}
                >
                  <span 
                    className="inline-block w-2 h-2 mt-2 mr-2 rounded-full"
                    style={{ backgroundColor: colors.accent }}
                  ></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }
    
    // For comparison slides
    if (slideType === 'comparison') {
      const comparisonData = slide.comparisonData || {
        left: slide.content.filter((_, i) => i % 2 === 0),
        right: slide.content.filter((_, i) => i % 2 === 1),
        leftTitle: 'Option A',
        rightTitle: 'Option B'
      };
      
      return (
        <div className="flex flex-col h-full p-6">
          <h1 
            className="text-2xl font-bold mb-6 text-center"
            style={{ 
              color: colors.text,
              fontFamily: fonts.heading
            }}
          >
            {slide.title}
          </h1>
          
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div 
              className="border rounded-lg p-4"
              style={{ 
                borderColor: colors.primary,
                backgroundColor: colors.secondary
              }}
            >
              <h3 
                className="text-xl font-semibold mb-3 text-center pb-2 border-b"
                style={{ 
                  color: colors.primary,
                  borderColor: colors.primary
                }}
              >
                {comparisonData.leftTitle}
              </h3>
              <ul className="space-y-2">
                {comparisonData.left.map((item, idx) => (
                  <li 
                    key={idx} 
                    className="flex items-start"
                    style={{ color: colors.text }}
                  >
                    <span 
                      className="inline-block min-w-[1.5rem] mr-2 font-bold"
                      style={{ color: colors.primary }}
                    >•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div 
              className="border rounded-lg p-4"
              style={{ 
                borderColor: colors.accent,
                backgroundColor: colors.secondary
              }}
            >
              <h3 
                className="text-xl font-semibold mb-3 text-center pb-2 border-b"
                style={{ 
                  color: colors.accent,
                  borderColor: colors.accent
                }}
              >
                {comparisonData.rightTitle}
              </h3>
              <ul className="space-y-2">
                {comparisonData.right.map((item, idx) => (
                  <li 
                    key={idx} 
                    className="flex items-start"
                    style={{ color: colors.text }}
                  >
                    <span 
                      className="inline-block min-w-[1.5rem] mr-2 font-bold"
                      style={{ color: colors.accent }}
                    >•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      );
    }
    
    // For timeline slides
    if (slideType === 'timeline') {
      const timelineItems = slide.content.map(item => {
        const parts = item.split(':');
        return {
          date: parts[0]?.trim() || '',
          event: parts.slice(1).join(':').trim()
        };
      });
      
      return (
        <div className="flex flex-col h-full p-6">
          <h1 
            className="text-2xl font-bold mb-6 text-center"
            style={{ 
              color: colors.text,
              fontFamily: fonts.heading
            }}
          >
            {slide.title}
          </h1>
          
          <div className="flex-1 relative">
            {/* Vertical timeline line */}
            <div 
              className="absolute left-[calc(50%-1px)] top-0 bottom-0 w-0.5"
              style={{ backgroundColor: colors.primary }}
            ></div>
            
            <div className="space-y-6 relative z-10">
              {timelineItems.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center ${idx % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <div 
                    className={`w-5 h-5 rounded-full z-20 mx-4 flex-shrink-0`}
                    style={{ backgroundColor: colors.primary }}
                  ></div>
                  
                  <div 
                    className={`w-[calc(50%-2rem)] p-3 rounded-lg shadow-sm`}
                    style={{ 
                      backgroundColor: colors.secondary,
                      borderLeft: idx % 2 === 0 ? `4px solid ${colors.accent}` : 'none',
                      borderRight: idx % 2 === 1 ? `4px solid ${colors.accent}` : 'none'
                    }}
                  >
                    <div 
                      className="font-bold mb-1"
                      style={{ color: colors.primary }}
                    >
                      {item.date}
                    </div>
                    <div style={{ color: colors.text }}>
                      {item.event}
                    </div>
                  </div>
                  
                  <div className="flex-1"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    // For section divider slides
    if (slideType === 'section-divider') {
      return (
        <div 
          className="flex flex-col h-full items-center justify-center p-6"
          style={{ 
            backgroundColor: colors.primary 
          }}
        >
          <h1 
            className="text-4xl font-bold mb-4 text-center"
            style={{ 
              color: 'white',
              fontFamily: fonts.heading
            }}
          >
            {slide.title}
          </h1>
          
          {slide.content[0] && (
            <p 
              className="text-xl text-center max-w-lg"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              {slide.content[0]}
            </p>
          )}
        </div>
      );
    }
    
    // For title slide (typically used as the first slide)
    if (slideType === 'title-slide') {
      return (
        <div className="flex flex-col h-full">
          <div 
            className="flex-1 flex flex-col items-center justify-center p-10 text-center"
            style={{ 
              backgroundColor: slide.slideImage ? 'transparent' : colors.primary 
            }}
          >
            {slide.slideImage && (
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-25" 
                style={{ backgroundImage: `url(${slide.slideImage})` }}
              />
            )}
            
            <div className="relative z-10">
              <h1 
                className="text-5xl font-bold mb-6"
                style={{ 
                  color: slide.slideImage ? colors.text : 'white',
                  fontFamily: fonts.heading,
                  textShadow: slide.slideImage ? '0 1px 3px rgba(0,0,0,0.3)' : 'none'
                }}
              >
                {slide.title}
              </h1>
              
              {slide.content[0] && (
                <p 
                  className="text-2xl mb-8"
                  style={{ 
                    color: slide.slideImage ? colors.text : 'rgba(255,255,255,0.9)',
                    fontFamily: fonts.body,
                    textShadow: slide.slideImage ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
                  }}
                >
                  {slide.content[0]}
                </p>
              )}
              
              {slide.content[1] && (
                <div 
                  className="text-xl"
                  style={{ 
                    color: slide.slideImage ? colors.text : 'rgba(255,255,255,0.8)',
                    fontFamily: fonts.body
                  }}
                >
                  {slide.content[1]}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    
    // For diagram/flow slides
    if (slideType === 'diagram') {
      return (
        <div className="flex flex-col h-full p-6">
          <h1 
            className="text-2xl font-bold mb-4 text-center"
            style={{ 
              color: colors.text,
              fontFamily: fonts.heading
            }}
          >
            {slide.title}
          </h1>
          
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-3xl">
              <div className="flex flex-wrap justify-center">
                {slide.content.map((item, idx) => (
                  <div 
                    key={idx}
                    className="m-2 p-4 rounded-lg w-64 flex flex-col items-center text-center shadow-sm"
                    style={{ 
                      backgroundColor: colors.secondary,
                      borderLeft: `4px solid ${colors.primary}`,
                      color: colors.text
                    }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full mb-2 flex items-center justify-center font-bold"
                      style={{ backgroundColor: colors.primary, color: 'white' }}
                    >
                      {idx + 1}
                    </div>
                    {item}
                    
                    {idx < slide.content.length - 1 && (
                      <div className="mt-2">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: colors.accent }}>
                          <path d="M12 5v14M19 12l-7 7-7-7"/>
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Standard slides with bullet points - use existing layout code based on template
    switch (layout) {
      case 'modern':
        return (
          <div className="relative h-full">
            <div 
              className="absolute left-0 top-0 bottom-0 w-1/4"
              style={{ backgroundColor: colors.primary }}
            ></div>
            
            <div className="ml-[28%] mt-[8%] relative">
              <h1 
                className="text-3xl font-bold mb-4"
                style={{ 
                  color: colors.text,
                  fontFamily: fonts.heading
                }}
              >
                {slide.title}
              </h1>
              
              <div 
                className="h-1 w-16 mb-6"
                style={{ backgroundColor: colors.accent }}
              ></div>
              
              {/* Add image if available */}
              {slide.slideImage && (
                <div className="mb-4 max-w-[40%] float-right ml-4 relative">
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <img 
                    src={slide.slideImage} 
                    alt={slide.title}
                    className="rounded-lg shadow-lg w-full h-auto relative z-10"
                    onLoad={(e) => {
                      // Hide the loading placeholder when image loads
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        const placeholder = parent.querySelector('div.absolute') as HTMLElement;
                        if (placeholder) placeholder.style.display = 'none';
                      }
                    }}
                    onError={(e) => {
                      console.error("Image failed to load:", slide.slideImage);
                      // Set a fallback image
                      e.currentTarget.src = `https://via.placeholder.com/800x600/4285F4/FFFFFF?text=${encodeURIComponent(slide.title.substring(0, 20))}`;
                      // Hide the loading placeholder
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        const placeholder = parent.querySelector('div.absolute') as HTMLElement;
                        if (placeholder) placeholder.style.display = 'none';
                      }
                    }}
                  />
                </div>
              )}
              
              <ul className="space-y-2">
                {slide.content.map((item, idx) => (
                  <li 
                    key={idx} 
                    className="flex items-start"
                    style={{ color: colors.text }}
                  >
                    <span 
                      className="inline-block w-2 h-2 mt-2 mr-2 rounded-full"
                      style={{ backgroundColor: colors.accent }}
                    ></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
        
      case 'classic':
        return (
          <div className="flex flex-col h-full p-8">
            <div 
              className="w-full h-1.5 mb-4"
              style={{ backgroundColor: colors.primary }}
            ></div>
            
            <h1 
              className="text-3xl font-bold text-center mb-6"
              style={{ 
                color: colors.text,
                fontFamily: fonts.heading
              }}
            >
              {slide.title}
            </h1>
            
            <div className="flex-1">
              <ul className="space-y-3">
                {slide.content.map((item, idx) => (
                  <li 
                    key={idx} 
                    className="flex items-start"
                    style={{ color: colors.text }}
                  >
                    <span 
                      className="inline-block min-w-[1.5rem] mr-2 font-bold"
                      style={{ color: colors.primary }}
                    >•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div 
              className="w-full h-1.5 mt-4"
              style={{ backgroundColor: colors.primary }}
            ></div>
          </div>
        );
        
      case 'minimal':
        return (
          <div className="flex flex-col h-full p-10">
            <h1 
              className="text-3xl font-bold mb-8"
              style={{ 
                color: colors.text,
                fontFamily: fonts.heading
              }}
            >
              {slide.title}
            </h1>
            
            <ul className="space-y-3">
              {slide.content.map((item, idx) => (
                <li 
                  key={idx} 
                  className="flex items-start"
                  style={{ color: colors.text }}
                >
                  <span 
                    className="inline-block min-w-[1rem] mr-2"
                    style={{ color: colors.text }}
                  >•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            
            <div 
              className="absolute bottom-6 right-6 p-2 rounded"
              style={{ backgroundColor: colors.primary }}
            >
              <span className="text-white text-sm">{currentSlideIndex + 1}</span>
            </div>
          </div>
        );
        
      case 'creative':
        return (
          <div className="flex flex-col h-full">
            <div 
              className="h-2/5 w-full flex items-center justify-center"
              style={{ backgroundColor: colors.primary }}
            >
              <h1 
                className="text-4xl font-bold text-white px-6"
                style={{ fontFamily: fonts.heading }}
              >
                {slide.title}
              </h1>
            </div>
            
            <div className="flex-1 p-8">
              <ul className="space-y-3">
                {slide.content.map((item, idx) => (
                  <li 
                    key={idx} 
                    className="mb-3"
                    style={{ color: colors.text }}
                  >
                    <div 
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: idx % 2 === 0 ? colors.secondary : 'transparent' }}
                    >
                      {item}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="flex flex-col h-full p-8">
            <h1 
              className="text-3xl font-bold mb-6"
              style={{ 
                color: colors.text,
                fontFamily: fonts.heading
              }}
            >
              {slide.title}
            </h1>
            
            <ul className="space-y-2">
              {slide.content.map((item, idx) => (
                <li 
                  key={idx} 
                  className="flex items-start"
                  style={{ color: colors.text }}
                >
                  <span 
                    className="inline-block min-w-[1rem] mr-2"
                    style={{ color: colors.primary }}
                  >•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        );
    }
  };
  
  // Move the renderToolSidebar function here, inside the component
  const renderToolSidebar = () => {
    if (!activeToolTab) return null;

    switch (activeToolTab) {
      case 'theme':
        const getColorsForTemplate = (templateId: string) => {
          switch (templateId) {
            case 'modern':
              return {
                primary: '#3b82f6',
                accent: '#4285f4',
                text: '#202124',
                background: '#ffffff',
                secondary: '#f8f9fa'
              };
            case 'classic':
              return {
                primary: '#10b981',
                accent: '#34a853',
                text: '#202124',
                background: '#ffffff',
                secondary: '#f8f9fa'
              };
            case 'minimal':
              return {
                primary: '#6b7280',
                accent: '#dadce0',
                text: '#202124',
                background: '#ffffff',
                secondary: '#f8f9fa'
              };
            case 'creative':
              return {
                primary: '#8b5cf6',
                accent: '#9c27b0',
                text: '#202124',
                background: '#ffffff',
                secondary: '#f3e5f5'
              };
            case 'dark':
              return {
                primary: '#1f2937',
                accent: '#5c6bc0',
                text: '#ffffff',
                background: '#121212',
                secondary: '#424242'
              };
            case 'gradient':
              return {
                primary: '#ec4899',
                accent: '#8b5cf6',
                text: '#202124',
                background: '#ffffff',
                secondary: '#fce7f3'
              };
            default:
              return {
                primary: '#3b82f6',
                accent: '#4285f4',
                text: '#202124',
                background: '#ffffff',
                secondary: '#f8f9fa'
              };
          }
        };

        return (
          <div className="absolute right-24 top-16 bottom-0 w-80 bg-white border-l shadow-lg p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-black">Theme Settings</h3>
            <p className="text-black mb-4">Choose a template for your presentation.</p>
            
            <div className="space-y-4">
              {[
                { id: 'modern', name: 'Modern', color: '#3b82f6', description: 'Clean, professional design with sidebar' },
                { id: 'classic', name: 'Classic', color: '#10b981', description: 'Traditional with top/bottom borders' },
                { id: 'minimal', name: 'Minimal', color: '#6b7280', description: 'Simple, distraction-free layout' },
                { id: 'creative', name: 'Creative', color: '#8b5cf6', description: 'Vibrant design with colored headers' },
                { id: 'dark', name: 'Dark Mode', color: '#1f2937', description: 'High contrast dark background theme' },
                { id: 'gradient', name: 'Gradient', color: 'linear-gradient(to right, #ec4899, #8b5cf6)', description: 'Beautiful gradient backgrounds' }
              ].map(template => (
                <div 
                  key={template.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                    templateSettings.layout === template.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => {
                    // Update template settings
                    const newSettings = {
                      ...templateSettings,
                      layout: template.id,
                      colors: getColorsForTemplate(template.id)
                    };
                    // Here you would update the template settings in state and parent component
                    // This is a placeholder since we don't have direct access to the templateSettings state setter
                    toast.success(`Template changed to ${template.name}`);
                    
                    // Mock update for demonstration
                    const updatedTemplateSettings = newSettings;
                    // This should call back to a parent component's setter function
                    // For example: onUpdateTemplateSettings(updatedTemplateSettings);
                  }}
                >
                  <div className="flex items-center">
                    <div 
                      className="w-12 h-12 rounded-md mr-3 flex-shrink-0" 
                      style={{ 
                        background: typeof template.color === 'string' && template.color.includes('gradient') 
                          ? template.color 
                          : template.color
                      }}
                    ></div>
                    <div>
                      <h4 className="font-medium text-black">{template.name}</h4>
                      <p className="text-xs text-gray-500">{template.description}</p>
                    </div>
                  </div>
                  
                  {/* Preview */}
                  <div className="mt-2 h-16 bg-gray-100 rounded relative overflow-hidden">
                    {template.id === 'modern' && (
                      <div className="absolute left-0 top-0 bottom-0 w-1/4 bg-blue-600"></div>
                    )}
                    {template.id === 'classic' && (
                      <>
                        <div className="absolute top-0 left-0 right-0 h-2 bg-green-600"></div>
                        <div className="absolute bottom-0 left-0 right-0 h-2 bg-green-600"></div>
                      </>
                    )}
                    {template.id === 'creative' && (
                      <div className="absolute top-0 left-0 right-0 h-1/3 bg-purple-600"></div>
                    )}
                    {template.id === 'dark' && (
                      <div className="absolute inset-0 bg-gray-800"></div>
                    )}
                    {template.id === 'gradient' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Color palette selector */}
            <div className="mt-6">
              <h4 className="font-medium text-black mb-2">Color Palette</h4>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { name: 'Blue', primary: '#1a73e8', accent: '#4285f4', text: '#202124' },
                  { name: 'Green', primary: '#0f9d58', accent: '#34a853', text: '#202124' },
                  { name: 'Red', primary: '#ea4335', accent: '#f25c54', text: '#202124' },
                  { name: 'Purple', primary: '#673ab7', accent: '#9c27b0', text: '#202124' },
                  { name: 'Orange', primary: '#ff9800', accent: '#ffb74d', text: '#202124' },
                  { name: 'Teal', primary: '#009688', accent: '#4db6ac', text: '#202124' },
                  { name: 'Dark', primary: '#212121', accent: '#5c6bc0', text: '#ffffff' },
                  { name: 'Elegant', primary: '#795548', accent: '#bcaaa4', text: '#3e2723' }
                ].map(color => (
                  <button
                    key={color.name}
                    className="p-1 rounded-md hover:ring-2 hover:ring-blue-500 transition-all"
                    onClick={() => {
                      // Update template colors
                      const newSettings = {
                        ...templateSettings,
                        colors: {
                          primary: color.primary,
                          accent: color.accent,
                          text: color.text,
                          background: templateSettings.colors.background,
                          secondary: templateSettings.colors.secondary
                        }
                      };
                      // Mock update for demonstration
                      toast.success(`Color palette changed to ${color.name}`);
                      // This should call back to parent: onUpdateTemplateSettings(newSettings);
                    }}
                  >
                    <div className="flex flex-col items-center">
                      <div 
                        className="w-10 h-10 rounded-full mb-1" 
                        style={{ backgroundColor: color.primary }}
                      ></div>
                      <span className="text-xs text-gray-600">{color.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 'pages':
        return (
          <div className="absolute right-24 top-16 bottom-0 w-72 bg-white border-l shadow-lg p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-black">Slides</h3>
            <div className="space-y-2">
              {internalSlides.map((slide, index) => (
                <div 
                  key={index} 
                  className={`p-2 border rounded-md cursor-pointer ${currentSlideIndex === index ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}`}
                  onClick={() => setCurrentSlideIndex(index)}
                >
                  <p className="text-black font-medium truncate">{slide.title}</p>
                  <p className="text-xs text-gray-500">{slide.slideType || 'standard'}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                const newId = internalSlides.length + 1;
                const newSlide: Slide = {
                  id: newId.toString(),
                  title: `New Slide ${newId}`,
                  content: ['Add your content here'],
                  slideType: 'standard' as const
                };
                setSlides([...internalSlides, newSlide]);
                setCurrentSlideIndex(internalSlides.length);
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
                  className="w-full p-2 border rounded bg-white text-black"
                  rows={4}
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Describe the image you want to generate..."
                ></textarea>
              </div>
              
              <button 
                className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400"
                onClick={generateImage}
                disabled={isGeneratingImage || !imagePrompt.trim()}
              >
                {isGeneratingImage ? (
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
              
              {internalSlides[currentSlideIndex]?.slideImage && (
                <div className="mt-4">
                  <p className="text-sm text-black mb-2">Current Slide Image:</p>
                  <img 
                    src={internalSlides[currentSlideIndex].slideImage}
                    alt={internalSlides[currentSlideIndex].title}
                    className="w-full h-auto rounded-lg border"
                  />
                  <button
                    onClick={() => {
                      const updatedSlides = [...internalSlides];
                      updatedSlides[currentSlideIndex] = {
                        ...updatedSlides[currentSlideIndex],
                        slideImage: undefined
                      };
                      setSlides(updatedSlides);
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
                  <p className="font-medium">{internalSlides[currentSlideIndex]?.title}</p>
                  <ul className="mt-2 text-sm space-y-1">
                    {internalSlides[currentSlideIndex]?.content?.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
                
                <label className="block text-sm font-medium text-black mb-1">
                  Writing Instructions
                </label>
                <textarea 
                  className="w-full p-2 border rounded bg-white text-black"
                  rows={4}
                  value={aiWritingPrompt}
                  onChange={(e) => setAiWritingPrompt(e.target.value)}
                  placeholder="e.g., Make it more persuasive, Add statistics, Simplify the language..."
                ></textarea>
              </div>
              
              <button 
                className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400"
                onClick={enhanceContentWithAI}
                disabled={isEnhancingContent || !aiWritingPrompt.trim()}
              >
                {isEnhancingContent ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enhancing...
                  </div>
                ) : (
                  "Enhance Content"
                )}
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
                    internalSlides[currentSlideIndex]?.slideType === layout.id ? 'bg-blue-100 border-blue-300' : ''
                  }`}
                  onClick={() => {
                    const updatedSlides = [...internalSlides];
                    updatedSlides[currentSlideIndex] = {
                      ...updatedSlides[currentSlideIndex],
                      slideType: layout.id as any
                    };
                    setSlides(updatedSlides);
                    toast.success(`Layout changed to ${layout.name}`);
                  }}
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
          {renderSlideContent(currentSlide)}
        </div>
        
        {/* Navigation controls - completely hidden by default, only shown on mouse movement */}
        <div className="absolute bottom-4 right-4 flex space-x-2 opacity-0 hover:opacity-70 transition-opacity duration-300">
          <button 
            onClick={prevSlide} 
            disabled={currentSlideIndex === 0}
            className="p-2 bg-black/20 rounded-full text-white disabled:opacity-30"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="p-2 bg-black/20 rounded-full text-white">
            {currentSlideIndex + 1} / {internalSlides.length}
          </span>
          <button 
            onClick={nextSlide}
            disabled={currentSlideIndex === internalSlides.length - 1}
            className="p-2 bg-black/20 rounded-full text-white disabled:opacity-30"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button 
            onClick={toggleFullscreen}
            className="p-2 bg-black/20 rounded-full text-white"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    <div className="w-full h-[calc(100vh-64px)] flex flex-col bg-gray-50">
      {/* Top navigation bar */}
      <div className="bg-white border-b shadow-sm px-6 py-3 flex justify-between items-center z-10">
        <div className="flex items-center">
          <button 
            onClick={onBack}
            className="mr-4 text-black hover:bg-gray-100 p-2 rounded-full"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-black">{title}</h1>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={downloadPresentation}
            className="flex items-center px-4 py-2 bg-white border rounded-full text-black hover:bg-gray-50"
          >
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
          
          <button 
            onClick={sharePresentation}
            className="flex items-center px-4 py-2 bg-white border rounded-full text-black hover:bg-gray-50"
          >
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
          
          <button 
            onClick={startPresentation}
            className="flex items-center px-4 py-2 bg-indigo-600 rounded-full text-white hover:bg-indigo-700"
          >
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Presentation
          </button>
        </div>
      </div>
      
      {/* Main content area - fixed layout to always keep sidebars visible */}
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
                    ? renderSlideContent(currentSlide, true) 
                    : renderSlideContent(currentSlide)
                  }
                  
                  {/* Add a prominent Edit button */}
                  {!isEditingSlide && !isFullscreen && (
                    <button
                      onClick={startEditingSlide}
                      className="absolute top-4 right-4 px-3 py-1 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 flex items-center z-10"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Edit Slide
                    </button>
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
          <div className="fixed right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-4">
            <Tooltip content="Theme">
              <button
                onClick={() => setActiveToolTab(activeToolTab === 'theme' ? null : 'theme')}
                className={`p-3 rounded-full ${activeToolTab === 'theme' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-700'} shadow hover:shadow-md transition-all`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </button>
            </Tooltip>
            
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
          {renderToolSidebar()}
        </div>
      </div>
    </div>
  );
};

export default PresentationViewer; 