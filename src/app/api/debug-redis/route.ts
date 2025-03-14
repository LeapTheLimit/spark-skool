import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET() {
  try {
    const key = 'materials:teacher-id';
    const keyType = await redis.type(key);
    const items = await redis.lrange(key, 0, -1);
    
    return NextResponse.json({
      keyType,
      itemCount: items.length,
      items: items.map(item => {
        try {
          return JSON.parse(item);
        } catch (e) {
          return item;
        }
      })
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
} 