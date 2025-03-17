import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function generateImage(prompt: string): Promise<string> {
  try {
    // Use Gemini Pro to enhance the image prompt
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const promptText = `
      Create a detailed visual description for the following image prompt:
      "${prompt}"
      
      Focus on:
      - Key visual elements
      - Colors and composition
      - Style and mood
      - Important details
      
      Make it suitable for presentation slides.
    `;

    const result = await model.generateContent(promptText);
    const response = await result.response;
    const enhancedPrompt = response.text();
    
    // For now, return a placeholder image with the enhanced description
    // In the future, this can be replaced with actual image generation API
    return `https://placehold.co/800x450/1a73e8/ffffff?text=${encodeURIComponent(prompt)}`;
    
  } catch (error) {
    console.error('Error generating image with Gemini:', error);
    // Return a basic placeholder image in case of error
    return `https://placehold.co/800x450/666666/ffffff?text=${encodeURIComponent('Image placeholder')}`;
  }
} 