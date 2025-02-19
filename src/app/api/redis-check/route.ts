import { NextResponse } from 'next/server';
import { redis } from '@/services/redis';

export async function GET() {
  try {
    const key = 'materials:teacher-id';
    
    // Check key exists
    const exists = await redis.exists(key);
    console.log('Key exists:', exists);

    // Get key type
    const type = await redis.type(key);
    console.log('Key type:', type);

    // Get raw data
    const rawData = await redis.lrange(key, 0, -1);
    console.log('Raw data:', rawData);

    return NextResponse.json({
      exists,
      type,
      rawData,
      parsedData: rawData.map(item => {
        try {
          return JSON.parse(item);
        } catch (e) {
          return item;
        }
      })
    });
  } catch (error) {
    console.error('Redis check error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
} 