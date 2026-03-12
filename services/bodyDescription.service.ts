

import { BodyMetrics } from '../types';

interface BodyDescriptionOptions {
  boundedOverride?: string | null; // e.g., "slightly curvier"
}

export const buildDetailedBodyPrompt = (metrics: BodyMetrics, opts?: BodyDescriptionOptions): string => {
  const { ratios, flags, confidence } = metrics;
  
  // 1. Build Category
  let buildCategory = "average build";
  if (confidence > 0.6) {
    if (ratios.shoulderToHip !== undefined && ratios.shoulderToHip > 1.3) buildCategory = "athletic build with broad shoulders";
    else if (ratios.shoulderToHip !== undefined && ratios.shoulderToHip < 0.85) buildCategory = "curvy build with wider hips";
    else if (ratios.shoulderToHip !== undefined && ratios.shoulderToHip >= 0.85 && ratios.shoulderToHip <= 1.1) buildCategory = "balanced average build";
    
    // Slenderness proxy (Torso Length vs Width)
    // Not directly available in ratios but inferred
  }

  // 2. Proportions Logic
  const proportionLines: string[] = [];
  
  // Shoulders
  if (ratios.shoulderToHip !== undefined) {
    if (ratios.shoulderToHip > 1.4) proportionLines.push("Prominent, broad shoulder line.");
    else if (ratios.shoulderToHip < 0.8) proportionLines.push("Narrower, naturally sloped shoulders.");
    else proportionLines.push("Naturally balanced shoulder width.");
  }

  // Torso / Hips
  if (ratios.shoulderToHip !== undefined) {
    if (ratios.shoulderToHip < 0.9) proportionLines.push("Defined waist-to-hip ratio, fuller hips.");
    else if (ratios.shoulderToHip > 1.2) proportionLines.push("Tapered athletic waist, leaner hips.");
    else proportionLines.push("Subtle waist definition, straight silhouette.");
  }

  // Limb Lengths
  if (ratios.armToTorso !== undefined) {
    if (ratios.armToTorso > 1.2) proportionLines.push("Long, slender limbs.");
    else proportionLines.push("Proportional limb length.");
  }

  // 3. Visibility Caveats
  let caveat = "";
  if (flags.upperBodyOnly || !flags.fullBodyVisible) {
    caveat = "Lower-body proportions are not fully visible; keep lower body realistic and consistent with visible cues.";
  }

  // 4. Overrides
  let overrideText = "";
  if (opts?.boundedOverride) {
    overrideText = `Adjustment: Make the physique ${opts.boundedOverride}, but keep it realistic.`;
  }

  // 5. Safety & Style
  const safety = "Maintain a realistic, attainable physique with balanced proportions. Do not exaggerate features. Do not change skin tone (skin tone matches face).";

  // Construct Final
  return `
BODY DETAILS [${metrics.source}]:
- Build: ${buildCategory}.
- Structure: ${proportionLines.join(" ")}
- ${safety}
- ${caveat}
${overrideText ? `- ${overrideText}` : ""}
  `.trim();
};

export const getFallbackBodyPrompt = () => {
  return `
BODY DETAILS [SYSTEM_FALLBACK]:
- Build: Average build, realistic proportions.
- Structure: Naturally balanced shoulder width, proportional limb length.
- Maintain a realistic, attainable physique. Do not exaggerate features.
  `.trim();
};