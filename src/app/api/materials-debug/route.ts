import { NextResponse } from 'next/server';
import { redis } from '@/services/redis';

// Use same userId constant
const TEACHER_ID = 'teacher123';

export async function GET() {
  if (!redis) {
    return NextResponse.json({ error: 'Redis not initialized' }, { status: 500 });
  }

  try {
    // Test Redis connection
    const ping = await redis.ping();
    console.log('Redis connection test:', ping);

    // Check materials using consistent userId
    const key = `materials:${TEACHER_ID}`;
    const exists = await redis.exists(key);
    const length = await redis.llen(key);
    const items = await redis.lrange(key, 0, -1);

    console.log('Key exists:', exists);
    console.log('List length:', length);
    console.log('Items:', items);

    return NextResponse.json({
      redis: ping === 'PONG',
      key,
      exists,
      length,
      items: items.map(item => {
        try {
          return JSON.parse(item);
        } catch (e) {
          return item;
        }
      })
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// Add cleanup endpoint
export async function DELETE() {
  if (!redis) {
    return NextResponse.json({ error: 'Redis not initialized' }, { status: 500 });
  }

  try {
    const key = `materials:${TEACHER_ID}`;
    await redis.del(key);
    return NextResponse.json({ message: 'Materials cleared' });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
} 