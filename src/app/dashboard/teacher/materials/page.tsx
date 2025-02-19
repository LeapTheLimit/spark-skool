'use client';

import { useEffect, useState } from 'react';
import { MATERIALS_STORAGE_KEY } from '@/lib/constants';
import type { SavedMaterial } from '@/services/chatService';
import { toast } from 'react-hot-toast';
import { downloadAsPDF } from '@/services/chatService';
import LessonCanvas from '@/components/LessonCanvas';
import { 
  PencilSquareIcon,  // For Edit in Canvas
  ArrowDownTrayIcon, // For Download
  ClipboardIcon      // For Copy
} from '@heroicons/react/24/outline';

const DEMO_USER_ID = 'teacher123'; // We'll use this temporarily

export default function TeacherMaterialsPage() {
  const [materials, setMaterials] = useState<SavedMaterial[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showCanvas, setShowCanvas] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<SavedMaterial | null>(null);

  useEffect(() => {
    const loadMaterials = () => {
      try {
        setIsLoading(true);
        const stored = localStorage.getItem(MATERIALS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setMaterials(parsed);
          console.log('Loaded materials:', parsed.length);
        }
      } catch (e) {
        console.error('Failed to load materials:', e);
        toast.error('Failed to load materials');
      } finally {
        setIsLoading(false);
      }
    };

    loadMaterials();
    window.addEventListener('storage', loadMaterials);
    return () => window.removeEventListener('storage', loadMaterials);
  }, []);

  const fetchMaterials = async () => {
    try {
      setIsLoading(true);
      console.log('Page: Fetching materials for userId:', DEMO_USER_ID);
      
      const response = await fetch(`/api/materials?userId=${DEMO_USER_ID}`);
      const data = await response.json();
      
      console.log('Page: Response status:', response.status);
      console.log('Page: Full response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch materials');
      }

      if (!Array.isArray(data.materials)) {
        console.error('Page: Invalid materials data:', data);
        toast.error('Received invalid data format');
        setMaterials([]);
        return;
      }

      console.log('Page: Setting materials array:', data.materials);
      setMaterials(data.materials);
    } catch (error) {
      console.error('Page: Failed to fetch materials:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load materials');
      setMaterials([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMaterials = selectedCategory === 'all' 
    ? materials 
    : materials.filter(m => m.category === selectedCategory);

  const handleEditInCanvas = (material: SavedMaterial) => {
    setSelectedMaterial(material);
    setShowCanvas(true);
  };

  const handleDownload = async (material: SavedMaterial) => {
    try {
      // Create a filename from the title
      const filename = `${material.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      
      // Call downloadAsPDF with just the content
      await downloadAsPDF(material.content);
      toast.success('Downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-black">Materials</h1>
        <div className="flex gap-2">
          {['all', 'lesson', 'quiz', 'other'].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {showCanvas && selectedMaterial && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg w-[90vw] h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-black">Edit Material</h3>
              <button 
                onClick={() => setShowCanvas(false)}
                className="text-gray-500 hover:text-black"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <LessonCanvas 
                content={selectedMaterial.content}
                onSave={(newContent) => {
                  const updatedMaterials = materials.map(m => 
                    m.id === selectedMaterial.id 
                      ? { ...m, content: newContent }
                      : m
                  );
                  localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(updatedMaterials));
                  setMaterials(updatedMaterials);
                  setShowCanvas(false);
                  toast.success('Material updated');
                }}
                onClose={() => setShowCanvas(false)}
              />
            </div>
          </div>
        </div>
      )}

      {filteredMaterials.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-black font-medium">No materials found</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMaterials.map((material) => (
            <div
              key={material.id}
              className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-black truncate flex-1">
                  {material.title}
                </h2>
                <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  material.category === 'quiz' 
                    ? 'bg-purple-100 text-black'
                    : material.category === 'lesson'
                    ? 'bg-blue-100 text-black'
                    : 'bg-gray-100 text-black'
                }`}>
                  {material.category}
                </span>
                </div>
              <p className="text-black text-base mb-4 line-clamp-3 min-h-[3rem]">
                {material.content}
              </p>
              <div className="flex items-center justify-between border-t pt-3 mt-2">
                <span className="text-sm font-medium text-black">
                  Saved on {new Date(material.createdAt).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEditInCanvas(material)}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit in Canvas"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDownload(material)}
                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                    title="Download PDF"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(material.content);
                      toast.success('Copied to clipboard');
                    }}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Copy content"
                  >
                    <ClipboardIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
} 