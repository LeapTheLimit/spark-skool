import { NextResponse } from 'next/server';
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
  }
} 