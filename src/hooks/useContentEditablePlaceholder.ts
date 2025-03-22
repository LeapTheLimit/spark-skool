import { useRef, useEffect } from 'react';

interface ContentEditableOptions {
  onInput?: (content: string) => void;
  initialValue?: string;
}

export function useContentEditablePlaceholder(options: ContentEditableOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    // Initialize with any initial value
    if (options.initialValue) {
      el.innerHTML = options.initialValue;
    }
    
    const handleInput = () => {
      if (options.onInput) {
        options.onInput(el.innerHTML);
      }
    };
    
    el.addEventListener('input', handleInput);
    
    return () => {
      el.removeEventListener('input', handleInput);
    };
  }, [options.initialValue, options.onInput]);
  
  return {
    ref,
    contentEditableProps: {
      contentEditable: true,
      ref,
      className: 'empty-content',
    }
  };
} 