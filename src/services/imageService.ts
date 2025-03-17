import { getCachedImageUrl, cacheImageUrl } from './upstashService';

/**
 * Get an image from Unsplash based on a query
 * @param query The search term for the image
 * @returns URL to an image from Unsplash
 */
export async function getUnsplashImage(query: string): Promise<string> {
  try {
    // Clean and normalize the query
    const normalizedQuery = query.trim().toLowerCase();
    
    // Create a cache key
    const cacheKey = `unsplash:${normalizedQuery}`;
    
    // Try to get from cache first
    const cachedUrl = await getCachedImageUrl(cacheKey);
    if (cachedUrl) {
      return cachedUrl;
    }
    
    // If not in cache, generate a new Unsplash URL
    const encodedQuery = encodeURIComponent(normalizedQuery);
    const timestamp = Date.now();
    const imageUrl = `https://source.unsplash.com/random/800x600?${encodedQuery}&t=${timestamp}`;
    
    // Cache the URL for future use
    await cacheImageUrl(cacheKey, imageUrl);
    
    return imageUrl;
  } catch (error) {
    console.error('Error getting Unsplash image:', error);
    // Return a fallback image if there's an error
    return 'https://source.unsplash.com/random/800x600?presentation';
  }
}

/**
 * Get multiple Unsplash images for a presentation
 * @param queries Array of search terms
 * @returns Array of image URLs
 */
export async function getMultipleUnsplashImages(queries: string[]): Promise<string[]> {
  try {
    // Process all queries in parallel
    const imagePromises = queries.map(query => getUnsplashImage(query));
    return await Promise.all(imagePromises);
  } catch (error) {
    console.error('Error getting multiple Unsplash images:', error);
    // Return generic images as fallback
    return queries.map(() => 'https://source.unsplash.com/random/800x600?presentation');
  }
}

/**
 * Generate an image URL based on slide content
 * @param title Slide title
 * @param content Slide content
 * @returns URL to a relevant image
 */
export async function getSlideImage(title: string, content: string = ''): Promise<string> {
  // Extract meaningful keywords from the title and content
  const combinedText = `${title} ${content}`.toLowerCase();
  
  // Look for key topics that might make good image subjects
  let imageQuery = title;
  
  const educationKeywords = ['education', 'learning', 'teaching', 'school', 'classroom'];
  const businessKeywords = ['business', 'strategy', 'marketing', 'finance', 'management'];
  const techKeywords = ['technology', 'digital', 'computer', 'software', 'data'];
  
  if (educationKeywords.some(keyword => combinedText.includes(keyword))) {
    imageQuery = `${title} education`;
  } else if (businessKeywords.some(keyword => combinedText.includes(keyword))) {
    imageQuery = `${title} business`;
  } else if (techKeywords.some(keyword => combinedText.includes(keyword))) {
    imageQuery = `${title} technology`;
  }
  
  return getUnsplashImage(imageQuery);
} 