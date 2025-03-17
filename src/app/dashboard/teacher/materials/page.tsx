'use client';

import { useEffect, useState, useRef } from 'react';
import { MATERIALS_STORAGE_KEY } from '@/lib/constants';
import type { SavedMaterial } from '@/services/chatService';
import { toast } from 'react-hot-toast';
import { downloadAsPDF } from '@/services/chatService';
import LessonCanvas from "@/components/LessonCanvas";
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  PencilSquareIcon,  // For Edit in Canvas
  ArrowDownTrayIcon, // For Download
  ClipboardIcon,    // For Copy
  TrashIcon  // Changed from Trash2 to TrashIcon
} from '@heroicons/react/24/outline';
import { Upload } from 'lucide-react';
import { FilePreview } from '@/components/FilePreview';
import mammoth from 'mammoth';

// Tooltips translations
const tooltips = {
  en: {
    editCanvas: "Edit in Canvas",
    downloadPDF: "Download as PDF",
    copyContent: "Copy content",
    savedOn: "Saved on",
    noMaterials: "No materials found",
    all: "All Materials",
    lesson: "Lesson Materials",
    quiz: "Quiz Materials",
    other: "Other Materials",
    materials: "Materials",
    uploadMaterial: "Upload Material",
    deleteMaterial: "Delete Material",
    deleteConfirm: "Are you sure you want to delete this material?",
    uploadingFile: "Uploading file..."
  },
  ar: {
    editCanvas: "تحرير في المحرر",
    downloadPDF: "تحميل كملف PDF",
    copyContent: "نسخ المحتوى",
    savedOn: "تم الحفظ في",
    noMaterials: "لم يتم العثور على مواد",
    all: "جميع المواد",
    lesson: "مواد الدروس",
    quiz: "مواد الاختبارات",
    other: "مواد أخرى",
    materials: "المواد",
    uploadMaterial: "رفع مادة",
    deleteMaterial: "حذف المادة",
    deleteConfirm: "هل أنت متأكد من حذف هذه المادة؟",
    uploadingFile: "جاري رفع الملف..."
  },
  he: {
    editCanvas: "ערוך בעורך",
    downloadPDF: "הורד כקובץ PDF",
    copyContent: "העתק תוכן",
    savedOn: "נשמר ב",
    noMaterials: "לא נמצאו חומרים",
    all: "כל החומרים",
    lesson: "חומרי שיעור",
    quiz: "חומרי מבחן",
    other: "חומרים אחרים",
    materials: "חומרים",
    uploadMaterial: "העלאת חומר",
    deleteMaterial: "מחק חומר",
    deleteConfirm: "האם אתה בטוח שברצונך למחוק חומר זה?",
    uploadingFile: "מעלה קובץ..."
  }
};

const DEMO_USER_ID = 'teacher123'; // We'll use this temporarily

export default function TeacherMaterialsPage() {
  const { language } = useLanguage();
  const t = (key: keyof typeof tooltips.en) => tooltips[language]?.[key] || tooltips.en[key];
  
  const [materials, setMaterials] = useState<SavedMaterial[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showCanvas, setShowCanvas] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<SavedMaterial | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleEditInCanvas = async (material: SavedMaterial) => {
    try {
      let editableContent = material.content;

      // If it's a DOCX file, convert it to HTML before editing
      if (material.fileType?.includes('document')) {
        // Convert base64 to ArrayBuffer
        const base64Content = material.content.split(',')[1];
        const binaryString = window.atob(base64Content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Convert DOCX to HTML
        const result = await mammoth.convertToHtml({ arrayBuffer: bytes.buffer });
        editableContent = result.value;
      }

      // Update the material with converted content
      setSelectedMaterial({
        ...material,
        content: editableContent
      });
      setShowEditor(true);
    } catch (error) {
      console.error('Error preparing document for editing:', error);
      toast.error('Failed to open document for editing');
    }
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

  const handleEdit = (content: string) => {
    setSelectedMaterial({ id: 'new', content, title: 'New Material', createdAt: new Date().toISOString(), userId: DEMO_USER_ID, category: 'lesson' });
    setIsEditing(true);
  };

  const handleSave = (content: string) => {
    // Save logic here
    setIsEditing(false);
    setSelectedMaterial(null);
  };

  const handleDelete = (material: SavedMaterial) => {
    if (window.confirm(t('deleteConfirm'))) {
      try {
        const updatedMaterials = materials.filter(m => m.id !== material.id);
        setMaterials(updatedMaterials);
        localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(updatedMaterials));
        toast.success('Material deleted');
      } catch (error) {
        console.error('Delete failed:', error);
        toast.error('Failed to delete material');
      }
    }
  };

  // Update the handleFileUpload function
const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = event.target.files;
  if (!files?.length) return;

  setIsUploading(true);
  
  try {
    for (const file of Array.from(files)) {
      // Read the file as base64
      const fileContent = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => resolve(reader.result);
      });

      const newMaterial: SavedMaterial = {
        id: Date.now().toString(),
        title: file.name,
        content: fileContent as string,
        category: 'other',
        createdAt: new Date().toISOString(),
        userId: DEMO_USER_ID,
        fileType: file.type
      };

      setMaterials(prev => {
        const updated = [...prev, newMaterial];
        localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
      
      toast.success(`Uploaded ${file.name}`);
    }
  } catch (error) {
    console.error('Upload failed:', error);
    toast.error('Failed to upload file(s)');
  } finally {
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
    <div className={`container mx-auto p-4 max-w-7xl ${language === 'ar' || language === 'he' ? 'rtl' : 'ltr'}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-black">{t('materials')}</h1>
        <div className="flex items-center gap-4">
          {/* File Upload Button */}
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              multiple
              accept=".pdf,.doc,.docx,.ppt,.pptx"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Upload size={20} />
              {isUploading ? 'Uploading...' : t('uploadMaterial')}
            </button>
          </div>
          
          {/* Existing category filters */}
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
                title={t(category as keyof typeof tooltips.en)}
              >
                {t(category as keyof typeof tooltips.en)}
          </button>
            ))}
          </div>
        </div>
      </div>

      {showEditor && selectedMaterial && (
        <LessonCanvas
          content={selectedMaterial.content}
          onClose={() => {
            setShowEditor(false);
            setSelectedMaterial(null);
          }}
          onSave={(newContent) => {
            const updatedMaterials = materials.map(m => 
              m.id === selectedMaterial.id 
                ? { 
                    ...m, 
                    content: newContent,
                    fileType: m.fileType 
                  }
                : m
            );
            localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(updatedMaterials));
            setMaterials(updatedMaterials);
            setShowEditor(false);
            toast.success('Material updated');
          }}
        />
      )}

      {isEditing && selectedMaterial && (
        <LessonCanvas
          content={selectedMaterial.content}
          onClose={() => {
            setIsEditing(false);
            setSelectedMaterial(null);
          }}
          onSave={handleSave}
        />
      )}

      {filteredMaterials.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-black font-medium">{t('noMaterials')}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMaterials.map((material) => (
            <div
              key={material.id}
              className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-black">{material.title}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditInCanvas(material)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors group relative"
                    title={t('editCanvas')}
                  >
                    <PencilSquareIcon className="w-5 h-5 text-blue-600" />
                    <span className="invisible group-hover:visible absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                      {t('editCanvas')}
                    </span>
                  </button>
                  <button 
                    onClick={() => handleDownload(material)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors group relative"
                    title={t('downloadPDF')}
                  >
                    <ArrowDownTrayIcon className="w-5 h-5 text-green-600" />
                    <span className="invisible group-hover:visible absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                      {t('downloadPDF')}
                    </span>
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(material.content);
                      toast.success('Copied to clipboard');
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors group relative"
                    title={t('copyContent')}
                  >
                    <ClipboardIcon className="w-5 h-5 text-blue-600" />
                    <span className="invisible group-hover:visible absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                      {t('copyContent')}
                    </span>
                  </button>
                  <button
                    onClick={() => handleDelete(material)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors group relative"
                    title={t('deleteMaterial')}
                  >
                    <TrashIcon className="w-5 h-5 text-red-600" />
                    <span className="invisible group-hover:visible absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                      {t('deleteMaterial')}
                    </span>
                  </button>
                </div>
                </div>
              {material.fileType ? (
                <FilePreview content={material.content} type={material.fileType} />
              ) : (
                <p className="text-black text-base mb-4 line-clamp-5 min-h-[5rem]">
                  {material.content}
                </p>
              )}
              <div className="flex items-center justify-between border-t pt-3 mt-2">
                <span className="text-sm font-medium text-black">
                  {t('savedOn')} {new Date(material.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : language === 'he' ? 'he-IL' : 'en-US')}
                </span>
              </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
} 