import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, settings } = body;
    
    if (!userId || !settings) {
      return NextResponse.json(
        { success: false, message: 'User ID and settings are required' },
        { status: 400 }
      );
    }
    
    // Save to Redis
    const redisKey = `user:${userId}:settings`;
    await redis.set(redisKey, JSON.stringify(settings));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving user settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save settings' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Get from Redis
    const redisKey = `user:${userId}:settings`;
    const settings = await redis.get(redisKey);
    
    return NextResponse.json({ 
      success: true, 
      settings: settings || null 
    });
  } catch (error) {
    console.error('Error getting user settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get settings' },
      { status: 500 }
    );
  }
} 