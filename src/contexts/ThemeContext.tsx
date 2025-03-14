'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface ThemeSettings {
  theme: 'light' | 'dark' | 'system';
  colorScheme: string;
  background: string;
}

interface ThemeContextType {
  settings: ThemeSettings;
  updateSettings: (newSettings: Partial<ThemeSettings>) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  settings: {
    theme: 'system',
    colorScheme: 'spark',
    background: 'white'
  },
  updateSettings: () => {}
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>({
    theme: 'system',
    colorScheme: 'spark',
    background: 'white'
  });

  // Load settings on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const updateSettings = (newSettings: Partial<ThemeSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('appSettings', JSON.stringify(updated));
      return updated;
    });
  };

  // Get color values based on scheme
  const getPrimaryColor = () => {
    switch (settings.colorScheme) {
      case 'spark': return '#3AB8FE';
      case 'blue': return '#3B82F6';
      case 'purple': return '#8B5CF6';
      case 'green': return '#22C55E';
      case 'rose': return '#F43F5E';
      default: return '#3AB8FE';
    }
  };

  // Get background color
  const getBackgroundColor = () => {
    switch (settings.background) {
      case 'white': return 'bg-white';
      case 'light': return 'bg-gray-50';
      case 'cool': return 'bg-blue-50';
      case 'warm': return 'bg-orange-50';
      default: return 'bg-white';
    }
  };

  return (
    <ThemeContext.Provider value={{ settings, updateSettings }}>
      <div className={`min-h-screen ${getBackgroundColor()}`}
           style={{ 
             '--primary-color': getPrimaryColor(),
             colorScheme: settings.theme === 'system' 
               ? 'light dark' 
               : settings.theme 
           } as any}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext); 