import { NextResponse } from 'next/server';

export const runtime = 'edge';

// Helper function to create better search terms
function createOptimizedSearchQuery(query: string): string {
  // Remove common presentation-related terms that don't help image search
  const cleanedQuery = query
    .replace(/presentation|about|create|make|please|the|and|for|with|a|an|in|on|at|by|of/gi, ' ')
    .replace(/[^\w\s]/gi, ' ') // Remove special characters
    .replace(/\s+/g, ' ')      // Replace multiple spaces with single space
    .trim();
  
  // Extract key terms - focus on nouns which work better for image search
  const words = cleanedQuery.split(' ');
  let keyTerms = words.filter(word => word.length > 3).slice(0, 3);
  
  // If we have too few terms, use the original cleaned query
  if (keyTerms.length < 1) {
    keyTerms = cleanedQuery.split(' ').slice(0, 3);
  }
  
  // Add some image-friendly terms to improve results
  const imageFriendlyTerms = [
    'professional', 'high quality', 'clear', 'illustration',
    'concept', 'visual', 'colorful', 'detailed'
  ];
  
  // Add a random image-friendly term to improve search results
  const randomTerm = imageFriendlyTerms[Math.floor(Math.random() * imageFriendlyTerms.length)];
  
  return `${keyTerms.join(' ')} ${randomTerm}`;
}

// List of fallback queries for when the search returns no results
const fallbackQueries = [
  'abstract background',
  'business concept',
  'education concept',
  'technology background',
  'nature background',
  'geometric pattern',
  'professional background',
  'creative design'
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const originalQuery = searchParams.get('query') || 'presentation background';
    const perPage = parseInt(searchParams.get('per_page') || '8', 10);
    
    // Get Pexels API key from environment variable
    const apiKey = process.env.PEXELS_API_KEY;
    
    if (!apiKey) {
      console.error('PEXELS_API_KEY is not defined in environment variables');
      return NextResponse.json({ 
        error: 'API key not configured',
        photos: [] 
      });
    }
    
    // Create an optimized search query
    const optimizedQuery = createOptimizedSearchQuery(originalQuery);
    console.log(`Original query: "${originalQuery}" → Optimized: "${optimizedQuery}"`);
    
    // Make request to Pexels API
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(optimizedQuery)}&per_page=${perPage}`, 
      {
        headers: {
          'Authorization': apiKey
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Pexels API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // If no photos returned, try a fallback query
    if (!data.photos || data.photos.length === 0) {
      console.log('No photos found with optimized query, trying fallback...');
      
      // Select a random fallback query
      const fallbackQuery = fallbackQueries[Math.floor(Math.random() * fallbackQueries.length)];
      
      // Make a second request with the fallback query
      const fallbackResponse = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(fallbackQuery)}&per_page=${perPage}`,
        {
          headers: {
            'Authorization': apiKey
          }
        }
      );
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        return NextResponse.json({
          ...fallbackData,
          fallbackUsed: true,
          originalQuery,
          fallbackQuery
        });
      }
    }
    
    return NextResponse.json({
      ...data,
      optimizedQuery
    });
    
  } catch (error) {
    console.error('Error fetching images from Pexels:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch images',
      photos: [] 
    });
  }
} 