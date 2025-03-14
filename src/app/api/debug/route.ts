import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET() {
  try {
    // Get all keys
    const keys = await redis.keys('*');
    console.log('All Redis keys:', keys);

    // Get data for each key
    const data: Record<string, any> = {};
    for (const key of keys) {
      const value = await redis.get(key);
      data[key] = value;
    }

    return NextResponse.json({
      keys,
      data
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to get debug info' },
      { status: 500 }
    );
  }
} 