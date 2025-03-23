import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Create Redis client 
// Use environment variables for Redis configuration
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export async function GET() {
  try {
    // Use a safer way to check Redis connectivity
    try {
      // Check if Redis is available
      await redis.ping();
    } catch (redisPingError) {
      console.error('Redis connection error:', redisPingError);
      return NextResponse.json({
        status: 'error',
        message: 'Could not connect to Redis',
        error: redisPingError instanceof Error ? redisPingError.message : String(redisPingError)
      }, { status: 500 });
    }

    // Check if "debug" key exists and what type it is
    const debugKeyType = await redis.type('debug');
    
    let debugData;
    // Handle different data types appropriately
    if (debugKeyType === 'string') {
      debugData = await redis.get('debug');
    } else if (debugKeyType === 'hash') {
      debugData = await redis.hgetall('debug');
    } else if (debugKeyType === 'list') {
      debugData = await redis.lrange('debug', 0, -1);
    } else if (debugKeyType === 'none') {
      // Key doesn't exist yet, initialize it as a string
      await redis.set('debug', JSON.stringify({ initialized: true, timestamp: new Date().toISOString() }));
      debugData = { initialized: true, timestamp: new Date().toISOString() };
    } else {
      throw new Error(`Unexpected Redis key type: ${debugKeyType}`);
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Debug endpoint is running',
      data: debugData,
      keyType: debugKeyType
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Error in debug endpoint',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 