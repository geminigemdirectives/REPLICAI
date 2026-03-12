
export interface RGBMeans {
  r: number;
  g: number;
  b: number;
  gray: number;
}

/**
 * Calculates the luminance histogram (0-255) of the image data.
 * Luminance formula: 0.299R + 0.587G + 0.114B
 */
export const calculateHistogram = (data: Uint8ClampedArray): Uint32Array => {
  const histogram = new Uint32Array(256);
  for (let i = 0; i < data.length; i += 4) {
    const l = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    histogram[Math.max(0, Math.min(255, l))]++;
  }
  return histogram;
};

/**
 * Finds the intensity levels at specified low and high percentiles.
 */
export const getPercentiles = (
  histogram: Uint32Array, 
  totalPixels: number, 
  lowP: number, // e.g., 0.02 for 2%
  highP: number // e.g., 0.98 for 98%
): { low: number; high: number } => {
  const lowCount = totalPixels * lowP;
  const highCount = totalPixels * highP;
  
  let currentCount = 0;
  let low = 0;
  let high = 255;
  
  // Find Low
  for (let i = 0; i < 256; i++) {
    currentCount += histogram[i];
    if (currentCount > lowCount) {
      low = i;
      break;
    }
  }
  
  // Find High
  currentCount = 0; // Reset or calculate from top down
  for (let i = 255; i >= 0; i--) {
    currentCount += histogram[i];
    if (currentCount > (totalPixels - highCount)) { // Total - HighCount gives count from top
      high = i;
      break;
    }
  }
  
  return { low, high };
};

/**
 * Calculates the mean R, G, B values.
 * Can accept an ROI (Region of Interest) but defaults to full image if not provided.
 * Simple sampling (step=4) for performance on large images.
 */
export const calculateRGBMeans = (data: Uint8ClampedArray, width: number, height: number): RGBMeans => {
  let sumR = 0, sumG = 0, sumB = 0;
  let count = 0;
  const step = 4 * 4; // Sample every 4th pixel to speed up
  
  for (let i = 0; i < data.length; i += step) {
    sumR += data[i];
    sumG += data[i + 1];
    sumB += data[i + 2];
    count++;
  }
  
  if (count === 0) return { r: 0, g: 0, b: 0, gray: 0 };
  
  const r = sumR / count;
  const g = sumG / count;
  const b = sumB / count;
  
  return {
    r, g, b,
    gray: (r + g + b) / 3
  };
};

/**
 * Computes color deviation ratio to determine if White Balance is needed.
 * Ratio = MaxDiff(Ch, Ch) / MeanGray
 */
export const calculateColorDeviation = (means: RGBMeans): number => {
  if (means.gray === 0) return 0;
  
  const diffRG = Math.abs(means.r - means.g);
  const diffGB = Math.abs(means.g - means.b);
  const diffRB = Math.abs(means.r - means.b);
  
  const maxDiff = Math.max(diffRG, diffGB, diffRB);
  return maxDiff / means.gray;
};
