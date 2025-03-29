'use client';

export default function SaveMaterialButton({
  content,
  type,
  userId,
  onSaveSuccess,
  className
}: {
  content: string | object;
  type: string;
  userId: string;
  onSaveSuccess?: () => void;
  className?: string;
}) {
  const handleSave = async () => {
    try {
      const response = await fetch('/api/save-material', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: typeof content === 'string' ? content : JSON.stringify(content), 
          type, 
          userId,
          timestamp: new Date().toISOString()
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Save failed');
      }
      
      onSaveSuccess?.();
      alert('Material saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save material: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <button
      onClick={handleSave}
      className={className || "px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"}
    >
      Save to Materials
    </button>
  );
} 