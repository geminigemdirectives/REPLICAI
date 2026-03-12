
import { extractBiometrics } from './biometric.service';
import { FaceMetrics } from '../types';

export const computeFaceMetrics = async (file: File | Blob): Promise<FaceMetrics | null> => {
  console.log("Starting Optimized Biometric Pipeline (MediaPipe)...");
  const start = performance.now();
  
  try {
    const metrics = await extractBiometrics(file);
    
    if (metrics) {
      console.log(`Biometric extraction complete in ${Math.round(performance.now() - start)}ms`);
      return metrics;
    }
    
    console.warn("MediaPipe extraction failed, falling back to legacy or returning null.");
    return null;

  } catch (e) {
    console.error("Biometric Pipeline Failed", e);
    return null;
  }
};

