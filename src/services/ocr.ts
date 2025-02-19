import Tesseract from 'tesseract.js';

export const extractTextFromImage = async (imageFile: File): Promise<string> => {
  try {
    const imageUrl = URL.createObjectURL(imageFile);
    
    const result = await Tesseract.recognize(
      imageUrl,
      'eng',
      {
        logger: m => console.log(m),
        errorHandler: err => console.error('Tesseract Error:', err)
      }
    );
    
    URL.revokeObjectURL(imageUrl);
    
    if (!result || !result.data || !result.data.text) {
      throw new Error('No text could be extracted from the image');
    }
    
    return result.data.text;
  } catch (error) {
    console.error('Error extracting text:', error);
    throw error;
  }
}; 