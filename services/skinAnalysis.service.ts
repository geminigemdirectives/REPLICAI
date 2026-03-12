import { SkinSurfaceSignature, PoreProfile, TextureProfile, ToneIrregularity, BlemishProfile, FineLineProfile, MicroHairProfile, SkinConfidence } from "../types";

// Landmark Indices for Regions
const REGIONS = {
  FOREHEAD: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109], 
  // Specifics:
  NOSE: [168, 6, 197, 195, 5, 4, 1, 19, 94, 2],
  LEFT_CHEEK: [116, 117, 118, 100, 126, 209, 49, 50, 123, 137, 177, 215], 
  RIGHT_CHEEK: [345, 346, 347, 329, 355, 429, 279, 280, 352, 366, 406, 435], 
  CHIN: [175, 199, 208, 32, 57, 186, 43, 106, 182, 83, 18, 313, 406, 335, 421, 428, 262, 431, 410],
  UNDER_EYE_LEFT: [33, 7, 163, 144, 145, 153, 154, 155, 133], 
  UNDER_EYE_RIGHT: [362, 382, 381, 380, 374, 373, 390, 249, 263],
  JAWLINE: [234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323, 454]
};

// Helper: Get bounding box of landmarks
const getBoundingBox = (landmarks: number[][], indices: number[]) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  indices.forEach(idx => {
    const p = landmarks[idx];
    if (p) {
      minX = Math.min(minX, p[0]);
      minY = Math.min(minY, p[1]);
      maxX = Math.max(maxX, p[0]);
      maxY = Math.max(maxY, p[1]);
    }
  });
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
};

// Helper: Extract masked region data
const extractRegionData = (
  sourceCanvas: HTMLCanvasElement, 
  landmarks: number[][], 
  indices: number[]
): ImageData | null => {
  const bbox = getBoundingBox(landmarks, indices);
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  const x = Math.floor(bbox.minX * width);
  const y = Math.floor(bbox.minY * height);
  const w = Math.ceil(bbox.width * width);
  const h = Math.ceil(bbox.height * height);

  if (w <= 0 || h <= 0) return null;

  // Create a temporary canvas for the mask
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const ctx = tempCanvas.getContext('2d');
  if (!ctx) return null;

  // Draw mask
  ctx.beginPath();
  const firstPoint = landmarks[indices[0]];
  ctx.moveTo(firstPoint[0] * width, firstPoint[1] * height);
  for (let i = 1; i < indices.length; i++) {
    const p = landmarks[indices[i]];
    ctx.lineTo(p[0] * width, p[1] * height);
  }
  ctx.closePath();
  ctx.clip();

  // Draw source image into masked region
  ctx.drawImage(sourceCanvas, 0, 0);

  // Extract the bounding box
  try {
    return ctx.getImageData(x, y, w, h);
  } catch (e) {
    return null;
  }
};

// Analysis Functions

const getLuminance = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

const analyzeHighFreq = (imageData: ImageData): number => {
  const { data, width, height } = imageData;
  let energy = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      if (data[idx + 3] === 0) continue; // Skip transparent pixels

      const gray = getLuminance(data[idx], data[idx+1], data[idx+2]);
      
      // Laplacian kernel
      const idxUp = ((y - 1) * width + x) * 4;
      const idxDown = ((y + 1) * width + x) * 4;
      const idxLeft = (y * width + (x - 1)) * 4;
      const idxRight = (y * width + (x + 1)) * 4;

      const grayUp = getLuminance(data[idxUp], data[idxUp+1], data[idxUp+2]);
      const grayDown = getLuminance(data[idxDown], data[idxDown+1], data[idxDown+2]);
      const grayLeft = getLuminance(data[idxLeft], data[idxLeft+1], data[idxLeft+2]);
      const grayRight = getLuminance(data[idxRight], data[idxRight+1], data[idxRight+2]);

      const laplacian = Math.abs(4 * gray - grayUp - grayDown - grayLeft - grayRight);
      
      if (laplacian > 10) { 
        energy += laplacian;
      }
      count++;
    }
  }
  return count > 0 ? (energy / count) / 50 : 0; // Normalize approx
};

const analyzeColorVariance = (imageData: ImageData): { redness: number, variance: number } => {
  const { data } = imageData;
  let rSum = 0, gSum = 0, bSum = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i+3] === 0) continue;
    rSum += data[i];
    gSum += data[i+1];
    bSum += data[i+2];
    count++;
  }

  if (count === 0) return { redness: 0, variance: 0 };

  const rAvg = rSum / count;
  const gAvg = gSum / count;
  const bAvg = bSum / count;
  const lAvg = getLuminance(rAvg, gAvg, bAvg);

  const redness = Math.max(0, rAvg - (gAvg + bAvg) / 2) / 255;

  let varSum = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i+3] === 0) continue;
    const l = getLuminance(data[i], data[i+1], data[i+2]);
    varSum += Math.pow(l - lAvg, 2);
  }
  
  const variance = Math.sqrt(varSum / count) / 128; // Normalize
  return { redness, variance };
};

const analyzeEdges = (imageData: ImageData): number => {
  // Simple Sobel-like edge density
  const { data, width, height } = imageData;
  let edgePixels = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      if (data[idx+3] === 0) continue;

      const gx = -1 * getLuminance(data[idx-4], data[idx-3], data[idx-2]) + 1 * getLuminance(data[idx+4], data[idx+5], data[idx+6]);
      const gy = -1 * getLuminance(data[idx-width*4], data[idx-width*4+1], data[idx-width*4+2]) + 1 * getLuminance(data[idx+width*4], data[idx+width*4+1], data[idx+width*4+2]);
      
      const mag = Math.sqrt(gx*gx + gy*gy);
      if (mag > 30) edgePixels++;
      count++;
    }
  }
  return count > 0 ? edgePixels / count : 0;
};

export const extractSkinSignature = async (imageElement: HTMLImageElement, landmarks: number[][]): Promise<SkinSurfaceSignature | null> => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(imageElement, 0, 0);

    // 1. Extract Regions
    const noseData = extractRegionData(canvas, landmarks, REGIONS.NOSE);
    const lCheekData = extractRegionData(canvas, landmarks, REGIONS.LEFT_CHEEK);
    const rCheekData = extractRegionData(canvas, landmarks, REGIONS.RIGHT_CHEEK);
    const foreheadData = extractRegionData(canvas, landmarks, REGIONS.FOREHEAD); // Note: Simplified forehead
    const chinData = extractRegionData(canvas, landmarks, REGIONS.CHIN);
    const underEyeL = extractRegionData(canvas, landmarks, REGIONS.UNDER_EYE_LEFT);
    const underEyeR = extractRegionData(canvas, landmarks, REGIONS.UNDER_EYE_RIGHT);

    // 2. Analyze Pores (High Freq in T-Zone vs Cheeks)
    const noseHF = noseData ? analyzeHighFreq(noseData) : 0;
    const cheekHF = ((lCheekData ? analyzeHighFreq(lCheekData) : 0) + (rCheekData ? analyzeHighFreq(rCheekData) : 0)) / 2;
    
    const poreProfile: PoreProfile = {
      densityTZone: Math.min(1, noseHF * 2),
      densityCheeks: Math.min(1, cheekHF * 2),
      sizeVariance: 0.3, 
      visibilityStrength: Math.min(1, (noseHF + cheekHF) * 1.5),
      highlightBreakupFactor: 0.2
    };

    // 3. Analyze Tone
    const noseTone = noseData ? analyzeColorVariance(noseData) : { redness: 0, variance: 0 };
    const cheekTone = lCheekData ? analyzeColorVariance(lCheekData) : { redness: 0, variance: 0 };
    const chinTone = chinData ? analyzeColorVariance(chinData) : { redness: 0, variance: 0 };
    const underEyeTone = underEyeL ? analyzeColorVariance(underEyeL) : { redness: 0, variance: 0 };

    const toneIrregularity: ToneIrregularity = {
      rednessNasalArea: noseTone.redness,
      underEyeDarknessRatio: underEyeTone.variance * 2,
      cheekPinknessDelta: cheekTone.redness,
      jawYellowShift: chinTone.redness * 0.5, // Proxy
      mouthCornerShadowStrength: 0.3,
      overallToneVariance: (noseTone.variance + cheekTone.variance + chinTone.variance) / 3
    };

    // 4. Texture
    const textureProfile: TextureProfile = {
      microBumpIntensity: cheekHF,
      surfaceMicroRoughness: cheekTone.variance,
      microShadowFrequency: 0.4
    };

    // 5. Blemishes (Variance based proxy)
    const blemishProfile: BlemishProfile = {
      minorBlemishCountEstimate: Math.min(1, cheekTone.variance * 5),
      blemishSizeAverage: 0.2,
      hyperpigmentationSpotRatio: 0.1
    };

    // 6. Fine Lines (Edge detection)
    const foreheadEdges = foreheadData ? analyzeEdges(foreheadData) : 0;
    const underEyeEdges = ((underEyeL ? analyzeEdges(underEyeL) : 0) + (underEyeR ? analyzeEdges(underEyeR) : 0)) / 2;

    const fineLineProfile: FineLineProfile = {
      underEyeLineVisibility: Math.min(1, underEyeEdges * 3),
      foreheadMicroCreaseIntensity: Math.min(1, foreheadEdges * 3),
      lipVerticalLineStrength: 0.1,
      nasolabialSoftFoldDepth: 0.2
    };

    // 7. Micro Hair
    const microHairProfile: MicroHairProfile = {
      facialFuzzDensity: 0.3,
      strayHairFrequencyNearHairline: 0.2,
      eyebrowDensityVariance: 0.4
    };

    return {
      poreProfile,
      textureProfile,
      toneIrregularity,
      blemishProfile,
      fineLineProfile,
      microHairProfile,
      confidence: {
        surfaceStability: 0.8,
        extractionConfidence: 0.85
      }
    };

  } catch (e) {
    console.error("Skin Analysis Failed:", e);
    return null;
  }
};
