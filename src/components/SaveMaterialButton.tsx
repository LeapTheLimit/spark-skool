'use client';

export default function SaveMaterialButton({
  content,
  type,
  userId
}: {
  content: string;
  type: string;
  userId: string;
}) {
  const handleSave = async () => {
    try {
      const response = await fetch('/api/save-material', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, type, userId }),
      });
      
      if (!response.ok) throw new Error('Save failed');
      alert('Material saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save material');
    }
  };

  return (
    <button
      onClick={handleSave}
      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
    >
      Save to Materials
    </button>
  );
} 