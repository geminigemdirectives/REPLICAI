
/**
 * Loads an image from a source (URL/Base64) into an HTMLImageElement.
 */
export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error(`Failed to load image: ${err}`));
    img.src = src;
  });
};

/**
 * Creates an ImageData object from an HTMLImageElement or Canvas.
 */
export const getImageData = (imgOrCanvas: HTMLImageElement | HTMLCanvasElement): ImageData => {
  const canvas = document.createElement('canvas');
  canvas.width = imgOrCanvas.width;
  canvas.height = imgOrCanvas.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Failed to get 2D context");
  
  if (imgOrCanvas instanceof HTMLImageElement) {
    ctx.drawImage(imgOrCanvas, 0, 0);
  } else {
    ctx.drawImage(imgOrCanvas, 0, 0);
  }
  
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
};

/**
 * Converts ImageData back to a Blob.
 */
export const imageDataToBlob = (imageData: ImageData, mimeType = 'image/jpeg', quality = 0.95): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error("Failed to get 2D context"));
    
    ctx.putImageData(imageData, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas to Blob conversion failed"));
    }, mimeType, quality);
  });
};

/**
 * Helper to convert Blob to Data URL.
 */
export const blobToDataURL = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
