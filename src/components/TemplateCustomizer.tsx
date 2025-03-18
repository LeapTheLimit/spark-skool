import React, { useState, useEffect, useRef } from 'react';
import { HexColorPicker } from 'react-colorful';
import { toast } from 'react-hot-toast';

interface TemplateCustomizerProps {
  presentationTitle: string;
  prompt: string;
  onBack: () => void;
  onApply: (template: TemplateSettings) => void;
}

export interface TemplateSettings {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  layout: 'modern' | 'classic' | 'minimal' | 'creative';
  backgroundImage?: string;
}

const TemplateCustomizer: React.FC<TemplateCustomizerProps> = ({ 
  presentationTitle, 
  prompt, 
  onBack, 
  onApply 
}) => {
  // Default template settings
  const [template, setTemplate] = useState<TemplateSettings>({
    colors: {
      primary: '#3B82F6',
      secondary: '#F3F4F6',
      accent: '#6366F1',
      background: '#FFFFFF',
      text: '#111827'
    },
    fonts: {
      heading: 'Arial',
      body: 'Roboto'
    },
    layout: 'modern'
  });
  
  // Modal reference for closing when clicking outside
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Which color is currently being edited
  const [editingColor, setEditingColor] = useState<keyof TemplateSettings['colors'] | null>(null);
  
  // Background images from Pexels
  const [backgroundImages, setBackgroundImages] = useState<string[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [aiImagePrompt, setAiImagePrompt] = useState('');
  const [isGeneratingAiImage, setIsGeneratingAiImage] = useState(false);
  const [imageSearchTerm, setImageSearchTerm] = useState('');
  
  // Predefined color schemes
  const colorSchemes = [
    {
      name: 'Professional Blue',
      colors: {
        primary: '#1A73E8',
        secondary: '#F8F9FA',
        accent: '#4285F4',
        background: '#FFFFFF',
        text: '#202124'
      }
    },
    {
      name: 'Dark Elegance',
      colors: {
        primary: '#121212',
        secondary: '#333333',
        accent: '#BB86FC',
        background: '#1F1F1F',
        text: '#FFFFFF'
      }
    },
    {
      name: 'Green Nature',
      colors: {
        primary: '#34A853',
        secondary: '#F1F8E9',
        accent: '#43A047',
        background: '#FFFFFF',
        text: '#212121'
      }
    },
    {
      name: 'Vibrant Coral',
      colors: {
        primary: '#FF7043',
        secondary: '#FFF8F6',
        accent: '#FF5722',
        background: '#FFFFFF',
        text: '#263238'
      }
    },
    {
      name: 'Minimal Grey',
      colors: {
        primary: '#607D8B',
        secondary: '#F5F7F8',
        accent: '#78909C',
        background: '#FFFFFF',
        text: '#37474F'
      }
    },
    {
      name: 'Royal Purple',
      colors: {
        primary: '#7E57C2',
        secondary: '#F3E5F5',
        accent: '#9575CD',
        background: '#FFFFFF',
        text: '#311B92'
      }
    }
  ];
  
  // Font families
  const fontFamilies = [
    { value: 'Arial', label: 'Arial' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Verdana', label: 'Verdana' },
    { value: 'Tahoma', label: 'Tahoma' },
    { value: 'Trebuchet MS', label: 'Trebuchet MS' }
  ];
  
  // Layout options
  const layoutOptions = [
    { value: 'modern', label: 'Modern' },
    { value: 'classic', label: 'Classic' },
    { value: 'minimal', label: 'Minimal' },
    { value: 'creative', label: 'Creative' }
  ];
  
  // Move the function here, to component scope
  const fetchBackgroundImages = async (searchQuery?: string) => {
    if (!searchQuery && !prompt) return;
    
    // Use the provided search query or fallback to title/prompt
    const query = searchQuery || presentationTitle || prompt;
    // Clean query by removing common words
    const cleanedQuery = query.replace(/presentation|about|create|make|please|the|and|for|with|a|an|in|on|at|by|of/gi, '');
    const finalQuery = cleanedQuery.trim() || 'abstract background';
    
    setIsLoadingImages(true);
    try {
      const response = await fetch(`/api/pexels?query=${encodeURIComponent(finalQuery)}&per_page=8`);
      const data = await response.json();
      
      if (data.photos && data.photos.length > 0) {
        const imageUrls = data.photos.map((photo: any) => photo.src.large);
        setBackgroundImages(imageUrls);
      } else {
        // Fallback to abstract backgrounds
        const fallbackResponse = await fetch(`/api/pexels?query=abstract+background&per_page=8`);
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.photos && fallbackData.photos.length > 0) {
          const imageUrls = fallbackData.photos.map((photo: any) => photo.src.large);
          setBackgroundImages(imageUrls);
        }
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      toast.error('Failed to load background images');
    } finally {
      setIsLoadingImages(false);
    }
  };
  
  // Then in useEffect, just call it
  useEffect(() => {
    fetchBackgroundImages();
  }, [prompt, presentationTitle]);
  
  // Handle click outside to close modal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onBack();
      }
    }
    
    // Add escape key listener
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onBack();
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onBack]);
  
  // Apply color scheme
  const applyColorScheme = (scheme: typeof colorSchemes[0]) => {
    setTemplate(prev => ({
      ...prev,
      colors: { ...scheme.colors }
    }));
  };
  
  // Handle font change
  const handleFontChange = (type: 'heading' | 'body', value: string) => {
    setTemplate(prev => ({
      ...prev,
      fonts: {
        ...prev.fonts,
        [type]: value
      }
    }));
  };
  
  // Handle layout change
  const handleLayoutChange = (layout: 'modern' | 'classic' | 'minimal' | 'creative') => {
    setTemplate(prev => ({
      ...prev,
      layout
    }));
  };
  
  // Handle color change
  const handleColorChange = (colorType: keyof TemplateSettings['colors'], color: string) => {
    setTemplate(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorType]: color
      }
    }));
  };
  
  // Select background image
  const selectBackgroundImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setTemplate(prev => ({
      ...prev,
      backgroundImage: imageUrl
    }));
  };
  
  // Generate AI image
  const generateAiImage = async () => {
    setIsGeneratingAiImage(true);
    
    try {
      // This would be connected to your AI image generation API
      // For now we'll simulate with a timeout and a placeholder image
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Placeholder for AI-generated image URL - replace with actual API call
      const placeholderAiImageUrl = `https://source.unsplash.com/random/800x600/?${encodeURIComponent(aiImagePrompt || presentationTitle)}`;
      
      // Add the generated image to the list
      setBackgroundImages(prev => [placeholderAiImageUrl, ...prev]);
      
      // Select the new image
      selectBackgroundImage(placeholderAiImageUrl);
      
      toast.success('AI image generated successfully!');
      setAiImagePrompt('');
    } catch (error) {
      console.error('Error generating AI image:', error);
      toast.error('Failed to generate AI image');
    } finally {
      setIsGeneratingAiImage(false);
    }
  };
  
  // Generate a preview of the presentation
  const renderPreview = () => {
    return (
      <div className="border rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <div 
          className="w-full h-full relative"
          style={{ 
            backgroundColor: template.colors.background,
            fontFamily: template.fonts.body
          }}
        >
          {/* Background image if selected */}
          {selectedImage && (
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-20" 
              style={{ backgroundImage: `url(${selectedImage})` }}
            ></div>
          )}
          
          {/* Slide content based on layout */}
          {template.layout === 'modern' && (
            <div className="absolute inset-0 flex flex-col p-6">
              {/* Left sidebar */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-1/4"
                style={{ backgroundColor: template.colors.primary }}
              ></div>
              
              <div className="ml-[28%] mt-[10%]">
                <h1 
                  className="text-3xl font-bold mb-4"
                  style={{ 
                    color: template.colors.text,
                    fontFamily: template.fonts.heading
                  }}
                >
                  {presentationTitle || 'Presentation Title'}
                </h1>
                
                <div 
                  className="h-1 w-16 mb-6"
                  style={{ backgroundColor: template.colors.accent }}
                ></div>
                
                <p 
                  className="text-lg"
                  style={{ color: template.colors.text }}
                >
                  Your presentation content will appear here
                </p>
              </div>
            </div>
          )}
          
          {template.layout === 'classic' && (
            <div className="absolute inset-0 flex flex-col p-8">
              <div 
                className="w-full h-1.5 mb-4"
                style={{ backgroundColor: template.colors.primary }}
              ></div>
              
              <h1 
                className="text-3xl font-bold text-center mb-6"
                style={{ 
                  color: template.colors.text,
                  fontFamily: template.fonts.heading
                }}
              >
                {presentationTitle || 'Presentation Title'}
              </h1>
              
              <div className="flex flex-1">
                <div className="flex-1 pr-8">
                  <p 
                    className="text-lg"
                    style={{ color: template.colors.text }}
                  >
                    Your presentation content will appear here
                  </p>
                </div>
              </div>
              
              <div 
                className="w-full h-1.5 mt-4"
                style={{ backgroundColor: template.colors.primary }}
              ></div>
            </div>
          )}
          
          {template.layout === 'minimal' && (
            <div className="absolute inset-0 flex flex-col p-10">
              <h1 
                className="text-3xl font-bold mb-8"
                style={{ 
                  color: template.colors.text,
                  fontFamily: template.fonts.heading
                }}
              >
                {presentationTitle || 'Presentation Title'}
              </h1>
              
              <p 
                className="text-lg"
                style={{ color: template.colors.text }}
              >
                • Your first bullet point<br/>
                • Your second bullet point<br/>
                • Your third bullet point
              </p>
              
              <div 
                className="absolute bottom-6 right-6 p-2 rounded"
                style={{ backgroundColor: template.colors.primary }}
              >
                <span className="text-white text-sm">1</span>
              </div>
            </div>
          )}
          
          {template.layout === 'creative' && (
            <div className="absolute inset-0 flex flex-col">
              <div 
                className="h-2/5 w-full"
                style={{ backgroundColor: template.colors.primary }}
              >
                <div className="h-full flex items-center justify-center p-6">
                  <h1 
                    className="text-4xl font-bold text-white"
                    style={{ fontFamily: template.fonts.heading }}
                  >
                    {presentationTitle || 'Presentation Title'}
                  </h1>
                </div>
              </div>
              
              <div className="flex-1 p-8">
                <p 
                  className="text-lg"
                  style={{ color: template.colors.text }}
                >
                  Your presentation content will appear here with a creative layout
                </p>
                
                <div 
                  className="mt-4 p-3 rounded-lg"
                  style={{ backgroundColor: template.colors.secondary }}
                >
                  <p 
                    className="text-base"
                    style={{ color: template.colors.text }}
                  >
                    Featured content or quote could go here
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl p-6 max-w-6xl mx-auto max-h-[90vh] overflow-y-auto"
        style={{ width: '95%' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-black">Customize Your Template</h2>
          <button 
            onClick={onBack}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-black flex items-center"
            aria-label="Close"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Preview Panel */}
          <div>
            <h3 className="text-lg font-medium text-black mb-4">Preview</h3>
            {renderPreview()}
            <div className="mt-4 text-center text-black text-sm">
              This is a preview of your first slide
            </div>
          </div>
          
          {/* Settings Panel */}
          <div className="space-y-6">
            {/* Color Schemes */}
            <div>
              <h3 className="text-lg font-medium text-black mb-3">Color Schemes</h3>
              <div className="grid grid-cols-3 gap-3">
                {colorSchemes.map((scheme, index) => (
                  <button 
                    key={index}
                    onClick={() => applyColorScheme(scheme)}
                    className="border rounded-lg p-2 hover:bg-gray-50 transition"
                  >
                    <div className="flex space-x-1 mb-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: scheme.colors.primary }}
                      ></div>
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: scheme.colors.accent }}
                      ></div>
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: scheme.colors.text }}
                      ></div>
                    </div>
                    <div className="text-sm text-black">{scheme.name}</div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Custom Colors */}
            <div>
              <h3 className="text-lg font-medium text-black mb-3">Custom Colors</h3>
              <div className="grid grid-cols-5 gap-3">
                {Object.entries(template.colors).map(([key, color]) => (
                  <div key={key} className="text-center">
                    <button
                      onClick={() => setEditingColor(key as keyof TemplateSettings['colors'])}
                      className="w-8 h-8 rounded-full mx-auto block border"
                      style={{ backgroundColor: color }}
                    ></button>
                    <div className="mt-1 text-sm capitalize text-black">{key}</div>
                  </div>
                ))}
              </div>
              
              {/* Color Picker */}
              {editingColor && (
                <div className="mt-4 p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium capitalize text-black">{editingColor} Color</h4>
                    <button 
                      onClick={() => setEditingColor(null)}
                      className="text-black hover:text-gray-700"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <HexColorPicker 
                    color={template.colors[editingColor]} 
                    onChange={(color) => handleColorChange(editingColor, color)}
                    className="w-full"
                  />
                  <div className="mt-2">
                    <input
                      type="text"
                      value={template.colors[editingColor]}
                      onChange={(e) => handleColorChange(editingColor, e.target.value)}
                      className="w-full p-2 border rounded text-sm text-black"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Fonts */}
            <div>
              <h3 className="text-lg font-medium text-black mb-3">Fonts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Heading Font
                  </label>
                  <select
                    value={template.fonts.heading}
                    onChange={(e) => handleFontChange('heading', e.target.value)}
                    className="w-full p-2 border rounded bg-white text-black"
                  >
                    {fontFamilies.map(font => (
                      <option key={font.value} value={font.value}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Body Font
                  </label>
                  <select
                    value={template.fonts.body}
                    onChange={(e) => handleFontChange('body', e.target.value)}
                    className="w-full p-2 border rounded bg-white text-black"
                  >
                    {fontFamilies.map(font => (
                      <option key={font.value} value={font.value}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Layout */}
            <div>
              <h3 className="text-lg font-medium text-black mb-3">Layout Style</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {layoutOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleLayoutChange(option.value as any)}
                    className={`p-3 border rounded-lg text-center ${
                      template.layout === option.value ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-sm font-medium text-black">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Background Images */}
            <div>
              <h3 className="text-lg font-medium text-black mb-3">Background Image</h3>
              
              {/* AI Image Generation */}
              <div className="mb-4 p-4 border rounded-lg bg-blue-50">
                <h4 className="text-sm font-medium text-black mb-2">Generate AI Image</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiImagePrompt}
                    onChange={(e) => setAiImagePrompt(e.target.value)}
                    placeholder="Describe the image you want..."
                    className="flex-1 p-2 border rounded text-black bg-white"
                  />
                  <button
                    onClick={generateAiImage}
                    disabled={isGeneratingAiImage || !aiImagePrompt.trim()}
                    className={`px-3 py-2 rounded bg-blue-600 text-white ${
                      isGeneratingAiImage || !aiImagePrompt.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                    }`}
                  >
                    {isGeneratingAiImage ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </span>
                    ) : (
                      'Generate'
                    )}
                  </button>
                </div>
              </div>
              
              {/* Image search enhancement */}
              <div className="mb-4">
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={imageSearchTerm}
                    onChange={(e) => setImageSearchTerm(e.target.value)}
                    placeholder="Search for background images..."
                    className="flex-1 p-2 border rounded text-black bg-white"
                  />
                  <button
                    onClick={() => fetchBackgroundImages(imageSearchTerm)}
                    disabled={isLoadingImages || !imageSearchTerm.trim()}
                    className={`px-3 py-2 rounded bg-gray-600 text-white ${
                      isLoadingImages || !imageSearchTerm.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'
                    }`}
                  >
                    {isLoadingImages ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      'Search'
                    )}
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2 text-black text-xs">
                  <span className="text-gray-500">Popular:</span>
                  {['abstract', 'nature', 'business', 'technology', 'minimal'].map(term => (
                    <button 
                      key={term}
                      onClick={() => {
                        setImageSearchTerm(term);
                        fetchBackgroundImages(term);
                      }}
                      className="px-2 py-1 bg-gray-100 rounded-full hover:bg-gray-200"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
              
              {isLoadingImages ? (
                <div className="text-center py-8">
                  <svg className="animate-spin h-8 w-8 mx-auto text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="mt-2 text-sm text-black">Loading images...</p>
                </div>
              ) : backgroundImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* No image option */}
                  <button
                    onClick={() => setSelectedImage(null)}
                    className={`aspect-[3/2] border rounded-lg flex items-center justify-center ${
                      selectedImage === null ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="ml-1 text-sm text-black">None</span>
                  </button>
                  
                  {backgroundImages.map((imageUrl, index) => (
                    <button
                      key={index}
                      onClick={() => selectBackgroundImage(imageUrl)}
                      className={`aspect-[3/2] border rounded-lg overflow-hidden ${
                        selectedImage === imageUrl ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      <img 
                        src={imageUrl} 
                        alt={`Background ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Replace broken images with a placeholder
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Image+Not+Available';
                        }}
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <div className="text-center py-8 text-black bg-gray-50 rounded-lg mb-4">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-600 mb-2">No background images found</p>
                    <p className="text-sm text-gray-500">Try different search terms or use the AI image generator above</p>
                  </div>
                </div>
              )}
              <div className="mt-2 text-xs text-black text-right">
                Images provided by Pexels
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => onApply(template)}
            className="flex items-center px-6 py-3 bg-indigo-600 rounded-full text-white hover:bg-indigo-700"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Apply Template
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateCustomizer; 