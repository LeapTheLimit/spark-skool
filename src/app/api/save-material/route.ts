import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(request: Request) {
  try {
    const { content, userId, category, title } = await request.json();
    
    // Validate required fields
    if (!content || !userId || !category || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const materialId = `material:${Date.now()}`;
    const material = {
      id: materialId,
      content,
      category,
      title,
      createdAt: new Date().toISOString(),
      userId
    };

    // Save to Redis
    await redis.hset(`materials:${userId}`, {
      [materialId]: JSON.stringify(material)
    });

    return NextResponse.json(material);
  } catch (error) {
    console.error('Save material error:', error);
    return NextResponse.json(
      { error: 'Failed to save material' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json(
      { error: 'User ID required' },
      { status: 400 }
    );
  }

  try {
    const materials = await redis.hgetall(`materials:${userId}`);
    return NextResponse.json({ 
      materials: materials ? Object.values(materials).map(m => JSON.parse(m as string)) : [] 
    });
  } catch (error) {
    console.error('Get materials error:', error);
    return NextResponse.json(
      { error: 'Failed to get materials' },
      { status: 500 }
    );
  }
} 