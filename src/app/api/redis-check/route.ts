import { NextResponse } from 'next/server';
<<<<<<< HEAD
import { Redis } from '@upstash/redis';

export async function GET() {
  try {
    const redis = new Redis({
      url: process.env.REDIS_URL || '',
      token: process.env.REDIS_TOKEN || '',
    });

    const isConnected = await redis.ping();
    
    return NextResponse.json({ 
      status: 'success',
      connected: isConnected === 'PONG' 
    });
  } catch (error) {
    console.error('Redis connection error:', error);
    return NextResponse.json({ 
      status: 'error',
      message: 'Failed to connect to Redis'
    }, { status: 500 });
=======
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
>>>>>>> 90ba128b77a37239696f731a4cbfd4c1385d90f6
  }
} 