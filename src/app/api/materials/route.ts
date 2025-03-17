import { NextResponse } from 'next/server';

const TEACHER_ID = 'teacher123';

// Helper function to get materials from localStorage
const getStoredMaterials = () => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(`materials:${TEACHER_ID}`);
  try {
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to parse stored materials:', e);
    return [];
  }
};

// Helper function to save materials to localStorage
const saveMaterials = (materials: any[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`materials:${TEACHER_ID}`, JSON.stringify(materials));
};

// Add proper type for the material object
interface Material {
  id: string;
  content: string;
  category: string;
  title: string;
  createdAt: string;
  userId: string;
}

export async function POST(request: Request) {
  try {
    const { content, category, title } = await request.json();
    console.log('Saving material:', { content, category, title });

    if (!content) {
      return NextResponse.json({ error: 'Missing content' }, { status: 400 });
    }

    const material: Material = {
      id: `material:${Date.now()}`,
      content,
      category: category || 'other',
      title: title || content.split('\n')[0].slice(0, 50),
      createdAt: new Date().toISOString(),
      userId: TEACHER_ID
    };

    // Get existing materials and add new one
    const materials = getStoredMaterials();
    materials.unshift(material); // Add to beginning
    
    // Keep only last 100 items
    const trimmedMaterials = materials.slice(0, 100);
    
    // Save back to localStorage
    saveMaterials(trimmedMaterials);

    return NextResponse.json({ success: true, material });

  } catch (error) {
    console.error('Error saving material:', error);
    return NextResponse.json({ error: 'Failed to save material' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const materials = getStoredMaterials();
    console.log(`Found ${materials.length} materials`);
    return NextResponse.json({ materials });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 });
  }
} 