export interface Slide {
  id: string;
  title: string;
  content: string[];
  slideImage?: string;
  slideType?: 'title-slide' | 'standard' | 'split' | 'text-heavy' | 'example' | 'statistics' | 'quote' | 'image-focus' | 'section-divider' | 'comparison' | 'timeline' | 'diagram' | 'interactive';
}

export interface TemplateSettings {
  layout: 'modern' | 'classic' | 'minimal' | 'creative' | 'dark' | 'gradient';
  fonts: {
    heading: string;
    body: string;
  };
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  backgroundImage?: string;
}

export interface Presentation {
  id: string;
  title: string;
  slides: Slide[];
  templateSettings: TemplateSettings;
  createdAt?: string;
  updatedAt?: string;
  author?: string;
} 