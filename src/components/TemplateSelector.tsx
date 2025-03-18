import React, { useState } from 'react';
import Image from 'next/image';

interface Template {
  id: string;
  name: string;
  thumbnailUrl: string;
  isPro?: boolean;
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
}

interface TemplateSelectorProps {
  onSelect: (template: Template) => void;
  onBack: () => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelect, onBack }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  const templates: Template[] = [
    {
      id: 'modern-blue',
      name: 'Modern Blue',
      thumbnailUrl: '/templates/modern-blue.png',
      colors: {
        primary: '#1a73e8',
        secondary: '#f8f9fa',
        accent: '#4285f4',
        background: '#ffffff',
        text: '#202124'
      },
      fonts: {
        heading: 'Poppins',
        body: 'Roboto'
      }
    },
    {
      id: 'dark-elegance',
      name: 'Dark Elegance',
      thumbnailUrl: '/templates/dark-elegance.png',
      colors: {
        primary: '#121212',
        secondary: '#333333',
        accent: '#bb86fc',
        background: '#1f1f1f',
        text: '#ffffff'
      },
      fonts: {
        heading: 'Montserrat',
        body: 'Open Sans'
      }
    },
    {
      id: 'green-nature',
      name: 'Green Tech Innovation',
      thumbnailUrl: '/templates/green-tech.png',
      isPro: true,
      colors: {
        primary: '#34a853',
        secondary: '#f1f8e9',
        accent: '#43a047',
        background: '#ffffff',
        text: '#212121'
      },
      fonts: {
        heading: 'Raleway',
        body: 'Lato'
      }
    },
    {
      id: 'vibrant-coral',
      name: 'Digital Transformation',
      thumbnailUrl: '/templates/digital-transformation.png',
      colors: {
        primary: '#ff7043',
        secondary: '#fff8f6',
        accent: '#ff5722',
        background: '#ffffff',
        text: '#263238'
      },
      fonts: {
        heading: 'Playfair Display',
        body: 'Source Sans Pro'
      }
    },
    {
      id: 'clean-minimal',
      name: 'Clean Minimal',
      thumbnailUrl: '/templates/clean-minimal.png',
      isPro: true,
      colors: {
        primary: '#607d8b',
        secondary: '#f5f7f8',
        accent: '#78909c',
        background: '#ffffff',
        text: '#37474f'
      },
      fonts: {
        heading: 'Work Sans',
        body: 'Nunito'
      }
    },
    {
      id: 'financial-pro',
      name: 'Strategic Financial',
      thumbnailUrl: '/templates/financial-pro.png',
      colors: {
        primary: '#0277bd',
        secondary: '#e1f5fe',
        accent: '#039be5',
        background: '#ffffff',
        text: '#263238'
      },
      fonts: {
        heading: 'Merriweather',
        body: 'IBM Plex Sans'
      }
    },
    {
      id: 'edu-template',
      name: 'Educational Research',
      thumbnailUrl: '/templates/educational.png',
      isPro: true,
      colors: {
        primary: '#7e57c2',
        secondary: '#f3e5f5',
        accent: '#9575cd',
        background: '#ffffff',
        text: '#311b92'
      },
      fonts: {
        heading: 'Quicksand',
        body: 'Nunito'
      }
    },
    {
      id: 'tech-startup',
      name: 'Tech Startup',
      thumbnailUrl: '/templates/tech-startup.png',
      colors: {
        primary: '#00897b',
        secondary: '#e0f2f1',
        accent: '#26a69a',
        background: '#ffffff',
        text: '#004d40'
      },
      fonts: {
        heading: 'Lexend',
        body: 'Inter'
      }
    },
  ];

  // Function to handle template selection
  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template.id);
    onSelect(template);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Select a Template</h2>
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 flex items-center"
        >
          <svg className="w-5 h-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {templates.map(template => (
          <div 
            key={template.id}
            className={`relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer
              ${selectedTemplate === template.id ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
            onClick={() => handleTemplateSelect(template)}
          >
            {/* Template Preview Image */}
            <div className="aspect-[4/3] relative">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${template.thumbnailUrl})` }}>
                {/* Fallback if image doesn't load */}
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 opacity-0">
                  <div 
                    className="w-full h-full" 
                    style={{ 
                      background: `linear-gradient(135deg, ${template.colors.primary} 0%, ${template.colors.accent} 100%)` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Template Name */}
            <div className="p-3 bg-white">
              <p className="text-black font-medium">{template.name}</p>
              <p className="text-gray-500 text-sm">a few seconds ago</p>
            </div>
            
            {/* PRO Badge if applicable */}
            {template.isPro && (
              <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
                PRO
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <button
          onClick={() => {
            if (selectedTemplate) {
              const template = templates.find(t => t.id === selectedTemplate);
              if (template) onSelect(template);
            } else {
              // If no template selected, use the first one
              onSelect(templates[0]);
            }
          }}
          className="flex items-center px-6 py-3 bg-indigo-600 rounded-full text-white hover:bg-indigo-700 mx-2"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Create Presentation
        </button>
      </div>
    </div>
  );
};

export default TemplateSelector; 