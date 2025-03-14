import { NextResponse } from 'next/server';
import { generateLessonPlan } from '@/services/lessonService';

const parseLessonData = (content: string) => {
  const getValue = (regex: RegExp) => (content.match(regex)?.[1] || '').trim();
  
  return {
    topic: getValue(/Lesson Plan: (.+)/),
    gradeLevel: getValue(/Grade Level: (.+)/),
    duration: getValue(/Duration: (\d+) minutes/),
    objectives: (content.match(/Lesson Overview:\n([\s\S]+?)\n\nMaterials Needed:/)?.[1] || '')
      .split('\n').map(obj => obj.replace(/^\d+\.\s*/, ''))
  };
};

export async function POST(request: Request) {
  try {
    const { instruction, currentContent } = await request.json();
    console.log('AI Edit Request:', { instruction, currentContent });

    let revisedContent = currentContent;
    const lessonData = parseLessonData(currentContent);
    console.log('Parsed Lesson Data:', lessonData);

    // Force regeneration for all requests
    const generated = await generateLessonPlan({
      ...lessonData,
      revisionRequest: instruction
    });
    
    revisedContent = generated?.plan || currentContent;
    console.log('Final Revised Content:', revisedContent);

    return NextResponse.json({ revisedContent, status: "success" });
  } catch (error) {
    console.error('AI Edit Error:', error);
    return NextResponse.json(
      { error: "Edit failed: " + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
} 