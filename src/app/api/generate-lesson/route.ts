import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Generate structured lesson content
    const lessonContent = `
Lesson Plan: ${body.topic || "Engaging Lesson"}

Grade Level: ${body.gradeLevel || "9-12"}
Duration: ${body.duration || 60} minutes

Lesson Overview:
${(body.objectives || []).map((obj: string, i: number) => `${i+1}. ${obj}`).join('\n')}

Materials Needed:
• Whiteboard and markers
• Student worksheets
• Multimedia presentation
• Hands-on activity materials

Lesson Structure:

Introduction (5-7 minutes)
- Warm-up discussion question
- Share learning objectives
- Quick pre-assessment

Direct Instruction (12-15 minutes)
- Interactive mini-lecture
- Visual demonstrations
- Think-pair-share activities

Guided Practice (20-25 minutes)
- Collaborative group work
- Scaffolded exercises
- Teacher-led feedback session

Independent Practice (10-12 minutes)
- Skill application task
- Differentiated support
- Progress check-ins

Conclusion (5 minutes)
- Key takeaways discussion
- Exit ticket assessment
- Preview of next lesson

Differentiation Strategies:
- Tiered activities for varied levels
- Optional challenge tasks
- Multisensory approaches

${body.revisionRequest ? `\nRevision Notes:\n${body.revisionRequest}` : ''}
`.trim();

    return NextResponse.json({
      plan: lessonContent,
      status: "success"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate lesson plan" },
      { status: 500 }
    );
  }
} 