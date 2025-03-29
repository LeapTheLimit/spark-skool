export async function preprocessImage(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    img.onload = () => {
      try {
        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Apply preprocessing
        for (let i = 0; i < data.length; i += 4) {
          // Convert to grayscale
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          
          // Increase contrast
          const contrast = 1.2; // Contrast factor
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
          const newValue = factor * (avg - 128) + 128;
          
          // Apply threshold for better text detection
          const threshold = 128;
          const final = newValue > threshold ? 255 : 0;

          // Set RGB channels
          data[i] = final;     // R
          data[i + 1] = final; // G
          data[i + 2] = final; // B
          // Keep alpha channel as is
        }

        // Put processed image data back
        ctx.putImageData(imageData, 0, 0);

        resolve(canvas);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Create object URL from File
    img.src = URL.createObjectURL(file);
  });
} 