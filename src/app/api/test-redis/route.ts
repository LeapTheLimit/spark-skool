import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET() {
  try {
    // Test basic set/get
    const testKey = 'test:connection';
    await redis.set(testKey, 'test-value');
    const testValue = await redis.get(testKey);
    
    // Get all keys
    const allKeys = await redis.keys('*');
    
    // Get all materials
    const materialsData: Record<string, any> = {};
    for (const key of allKeys) {
      if (key.startsWith('materials:')) {
        materialsData[key] = await redis.get(key);
      }
    }

    return NextResponse.json({
      status: 'connected',
      test: {
        key: testKey,
        value: testValue
      },
      keys: allKeys,
      materials: materialsData
    });
  } catch (error) {
    console.error('Redis test error:', error);
    return NextResponse.json(
      { error: 'Redis test failed', details: String(error) },
      { status: 500 }
    );
  }
}

// Add cleanup endpoint
export async function DELETE() {
  try {
    const keys = await redis.keys('materials:*');
    for (const key of keys) {
      await redis.del(key);
    }
    return NextResponse.json({ message: 'All materials cleared' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Cleanup failed', details: String(error) },
      { status: 500 }
    );
  }
} 