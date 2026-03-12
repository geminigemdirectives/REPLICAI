
import { fileToBase64, callGeminiWithRetry } from './gemini';
import { IdentityBasePacket, IdentityAnchor, Gender, IdentityFrame, PoseCoverageProfile } from '../types';
import { computeFaceMetrics } from './faceMetrics.service';
import { extractFullAttributes } from './attributeExtractor.service';
import { generateIdentityAnchor } from './identityAnchor.service';

const PROCESSING_MODEL = "gemini-3-flash-preview";

export type EnhancementStage = 
  | 'INITIALIZING'
  | 'IDENTITY_FORENSICS'
  | 'LOCKING_STRUCTURE'
  | 'EXTRACTING_TRAITS'
  | 'IDENTITY_SYNTHESIS'
  | 'FINALIZING';

const FORENSICS_PROMPT_SYSTEM = `
You are a Lead Forensic Biometric Analyst. Extract a COMPACT STRUCTURAL BLUEPRINT of the subject.
Focus on immutable structural features that define their unique identity.

STRUCTURAL IDENTITY:
- Define the core skeletal morphology: jawline taper, cheekbone height, and forehead height.
- Identify the 3 most unique biometric features (e.g., specific nose bridge curve, eye tilt, or chin projection).
- Note the exact hair silhouette and volume density.

STYLE: Objective, technical, and concise. Avoid describing clothes or background.
`.trim();

export const enhanceIdentityBase = async (
  files: File[], 
  gender: Gender,
  onStageChange?: (stage: EnhancementStage, progress?: number) => void
): Promise<IdentityBasePacket> => {
  onStageChange?.('INITIALIZING', 0);
  
  const frames: IdentityFrame[] = [];
  const warnings: string[] = [];

  onStageChange?.('LOCKING_STRUCTURE', 10);
  
  // Parallelize metrics computation
  const metricsPromises = files.map(async (file, index) => {
    const metrics = await computeFaceMetrics(file);
    // Report progress: 10% to 60% range
    const progress = 10 + Math.round(((index + 1) / files.length) * 50);
    onStageChange?.('LOCKING_STRUCTURE', progress);
    return { file, metrics };
  });

  const results = await Promise.all(metricsPromises);

  results.forEach(({ file, metrics }) => {
    if (metrics) {
      frames.push({
        id: crypto.randomUUID(),
        originalImage: file,
        enhancedImage: file, 
        faceMetrics: metrics
      });
    } else {
      warnings.push(`Failed to extract metrics from one of the images.`);
    }
  });

  if (frames.length === 0) {
    throw new Error("Could not extract biometric metrics from any of the source images.");
  }

  // Select canonical image (most frontal, highest confidence)
  const canonicalFrame = frames.reduce((best, current) => {
    const currentScore = (1 - Math.abs(current.faceMetrics.pose.yawDeg) / 90) * current.faceMetrics.confidence;
    const bestScore = (1 - Math.abs(best.faceMetrics.pose.yawDeg) / 90) * best.faceMetrics.confidence;
    return currentScore > bestScore ? current : best;
  }, frames[0]);

  // Aggregate metrics - Deep clone ratios to avoid modifying the original frame metrics
  const aggregatedMetrics = { 
    ...canonicalFrame.faceMetrics,
    ratios: { ...canonicalFrame.faceMetrics.ratios },
    skinSurfaceSignature: canonicalFrame.faceMetrics.skinSurfaceSignature ? JSON.parse(JSON.stringify(canonicalFrame.faceMetrics.skinSurfaceSignature)) : undefined
  };
  
  if (frames.length > 1) {
    // 1. Aggregate Ratios
    const ratioKeys = Object.keys(canonicalFrame.faceMetrics.ratios) as (keyof typeof canonicalFrame.faceMetrics.ratios)[];
    for (const key of ratioKeys) {
      const sum = frames.reduce((s, f) => s + (f.faceMetrics.ratios[key] || 0), 0);
      aggregatedMetrics.ratios[key] = sum / frames.length;
    }

    // 2. Aggregate Skin Signature (if available)
    if (aggregatedMetrics.skinSurfaceSignature) {
      const skinKeys = ['poreProfile', 'textureProfile', 'toneIrregularity', 'blemishProfile', 'fineLineProfile', 'microHairProfile'] as const;
      
      // Initialize stability tracking
      let totalVariance = 0;
      let metricCount = 0;

      for (const profileKey of skinKeys) {
        const profile = aggregatedMetrics.skinSurfaceSignature[profileKey];
        if (!profile) continue;
        
        const propKeys = Object.keys(profile) as string[];
        
        for (const prop of propKeys) {
          // Collect values from all valid frames
          const values = frames
            .map(f => (f.faceMetrics.skinSurfaceSignature as any)?.[profileKey]?.[prop])
            .filter(v => typeof v === 'number');
          
          if (values.length > 0) {
            // Compute Mean
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            (aggregatedMetrics.skinSurfaceSignature as any)[profileKey][prop] = mean;

            // Compute Variance for Stability Score
            if (values.length > 1) {
              const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
              totalVariance += variance;
              metricCount++;
            }
          }
        }
      }

      // Update Confidence based on stability
      if (metricCount > 0) {
        const avgVariance = totalVariance / metricCount;
        // Lower variance = Higher stability. 
        // If avgVariance is 0.01 (very stable), score is ~0.9. If 0.1 (unstable), score is ~0.
        const stabilityScore = Math.max(0, 1 - Math.sqrt(avgVariance) * 3);
        aggregatedMetrics.skinSurfaceSignature.confidence.surfaceStability = stabilityScore;
      }
    }
  }

  onStageChange?.('IDENTITY_FORENSICS', 65);

  const [anchorResult, extractionResult] = await Promise.all([
    generateIdentityAnchor(files, gender || 'female', aggregatedMetrics),
    extractFullAttributes(canonicalFrame.enhancedImage, { gender: gender || 'female' })
  ]);

  const forensicsReport = anchorResult.anchorText;
  const inherentAttributes = extractionResult.attributes;

  if (anchorResult.defaultHairPrompt) {
    inherentAttributes.hair = anchorResult.defaultHairPrompt;
  }

  onStageChange?.('FINALIZING', 95);
  
  // Compute pose coverage
  const yaws = frames.map(f => f.faceMetrics.pose.yawDeg);
  const pitches = frames.map(f => f.faceMetrics.pose.pitchDeg);
  const rolls = frames.map(f => f.faceMetrics.pose.rollDeg);
  
  const poseCoverageProfile: PoseCoverageProfile = {
    yawRange: [Math.min(...yaws), Math.max(...yaws)],
    pitchRange: [Math.min(...pitches), Math.max(...pitches)],
    rollRange: [Math.min(...rolls), Math.max(...rolls)],
    coverageScore: Math.min(1, frames.length / 5)
  };

  // Select best frames for multi-view references
  const getBestFrameForYaw = (targetYaw: number, tolerance: number) => {
    return frames
      .filter(f => Math.abs(Math.abs(f.faceMetrics.pose.yawDeg) - targetYaw) < tolerance)
      .sort((a, b) => b.faceMetrics.confidence - a.faceMetrics.confidence)[0]?.originalImage;
  };

  // Convert File to Blob if needed (originalImage is File which extends Blob)
  const frontRef = getBestFrameForYaw(0, 20);
  const angleRef = getBestFrameForYaw(45, 25);
  const profileRef = getBestFrameForYaw(90, 40);

  const anchor: IdentityAnchor = {
    id: crypto.randomUUID(),
    metrics: aggregatedMetrics,
    gender: gender || null, 
    immutableText: forensicsReport,
    canonicalImage: canonicalFrame.enhancedImage,
    frames,
    poseCoverageProfile,
    confidenceScore: frames.reduce((s, f) => s + f.faceMetrics.confidence, 0) / frames.length,
    multiViewRefs: {
      front: frontRef,
      angle45: angleRef,
      profile: profileRef
    }
  };

  onStageChange?.('FINALIZING', 100);

  return {
    anchor,
    extractedAttributes: inherentAttributes,
    meta: {
      faceDetected: true,
      warnings,
      poseCoverage: poseCoverageProfile.coverageScore
    }
  };
};
