import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(request: Request) {
  try {
    // Get all keys
    const keys = await redis.keys('*');
    console.log('Found keys:', keys);

    const result: Record<string, any> = {};

    // For each key, get its type and value
    for (const key of keys) {
      const type = await redis.type(key);
      console.log(`Key: ${key}, Type: ${type}`);

      if (type === 'list') {
        result[key] = await redis.lrange(key, 0, -1);
      } else if (type === 'string') {
        result[key] = await redis.get(key);
      } else if (type === 'hash') {
        result[key] = await redis.hgetall(key);
      }
    }

    return NextResponse.json({
      keys,
      data: result
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// Add a cleanup endpoint if needed
export async function DELETE() {
  try {
    const keys = await redis.keys('*');
    for (const key of keys) {
      await redis.del(key);
    }
    return NextResponse.json({ message: 'All keys deleted' });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
} 