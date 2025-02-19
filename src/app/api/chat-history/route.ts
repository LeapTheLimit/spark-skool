import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: Request) {
  try {
    const { messages, userId, title } = await req.json();
    
    const id = Date.now().toString();
    await redis.hset(`chat-history:${userId}`, {
      [id]: {
        messages,
        title,
        createdAt: new Date().toISOString()
      }
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Save chat error:', error);
    return NextResponse.json(
      { error: 'Failed to save chat history' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const history = await redis.hgetall(`chat-history:${userId}`);
    return NextResponse.json({ history });
  } catch (error) {
    console.error('Get chat history error:', error);
    return NextResponse.json(
      { error: 'Failed to get chat history' },
      { status: 500 }
    );
  }
} 