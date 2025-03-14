import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client if credentials are available
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

/**
 * Cache an image URL with Upstash Redis
 * @param key - Cache key (usually query + timestamp)
 * @param imageUrl - The image URL to cache
 * @param ttl - Time to live in seconds (default: 24 hours)
 */
export async function cacheImageUrl(key: string, imageUrl: string, ttl = 86400): Promise<boolean> {
  try {
    if (!redis) {
      console.warn('Upstash Redis not configured, skipping image caching');
      return false;
    }
    
    await redis.set(`img:${key}`, imageUrl, { ex: ttl });
    return true;
  } catch (error) {
    console.error('Error caching image URL:', error);
    return false;
  }
}

/**
 * Get a cached image URL from Upstash Redis
 * @param key - Cache key to retrieve
 */
export async function getCachedImageUrl(key: string): Promise<string | null> {
  try {
    if (!redis) {
      return null;
    }
    
    const imageUrl = await redis.get<string>(`img:${key}`);
    return imageUrl;
  } catch (error) {
    console.error('Error retrieving cached image URL:', error);
    return null;
  }
}

/**
 * Cache slide generation results
 * @param query - The user's prompt/query
 * @param slides - The generated slides
 * @param ttl - Time to live in seconds (default: 1 hour)
 */
export async function cacheSlides(query: string, slides: any[], ttl = 3600): Promise<boolean> {
  try {
    if (!redis) {
      return false;
    }
    
    const key = `slides:${query.toLowerCase().trim()}`;
    await redis.set(key, JSON.stringify(slides), { ex: ttl });
    return true;
  } catch (error) {
    console.error('Error caching slides:', error);
    return false;
  }
}

/**
 * Get cached slides for a query
 * @param query - The user's prompt/query
 */
export async function getCachedSlides(query: string): Promise<any[] | null> {
  try {
    if (!redis) {
      return null;
    }
    
    const key = `slides:${query.toLowerCase().trim()}`;
    const cachedData = await redis.get<string>(key);
    
    if (!cachedData) {
      return null;
    }
    
    return JSON.parse(cachedData);
  } catch (error) {
    console.error('Error retrieving cached slides:', error);
    return null;
  }
}

/**
 * Get or fetch an image URL, with caching
 * @param query - Search query for image
 * @param fallback - Fallback URL if fetch fails
 */
export async function getImageWithCache(query: string, fallback?: string): Promise<string> {
  try {
    if (!redis) {
      return fetchUnsplashImage(query);
    }
    
    const cacheKey = `img:${query.toLowerCase().trim()}`;
    const cachedUrl = await redis.get<string>(cacheKey);
    
    if (cachedUrl) {
      return cachedUrl;
    }
    
    const imageUrl = await fetchUnsplashImage(query);
    await redis.set(cacheKey, imageUrl, { ex: 86400 }); // Cache for 24 hours
    return imageUrl;
  } catch (error) {
    console.error('Error getting image with cache:', error);
    return fallback || fetchUnsplashImage('presentation');
  }
}

/**
 * Fetch a random image from Unsplash based on query
 * @param query - Search query for Unsplash
 */
export async function fetchUnsplashImage(query: string): Promise<string> {
  const encodedQuery = encodeURIComponent(query.trim());
  const timestamp = new Date().getTime();
  return `https://source.unsplash.com/random/800x600?${encodedQuery}&t=${timestamp}`;
} 