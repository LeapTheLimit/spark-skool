import { NextResponse } from 'next/server';
import { setTeacherData } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    await setTeacherData(data);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Signup failed' },
      { status: 500 }
    );
  }
} 