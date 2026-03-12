import { BatchGenerationParams } from '../types';

/**
 * Generates a list of micro-variation directives for batch generation.
 * These are designed to be subtle enough not to break identity or locks,
 * but distinct enough to avoid duplicate image detection and provide variety.
 */

const CAMERA_VARIATIONS = [
  "Use a slightly tighter framing (5% crop) while maintaining the same angle.",
  "Shift camera angle micro-degree to the left (barely perceptible).",
  "Shift camera angle micro-degree to the right.",
  "Use a slightly wider framing (5% zoom out) while maintaining subject center.",
  "Lower camera height by 2 inches for a subtle perspective shift.",
  "Raise camera height by 2 inches for a subtle perspective shift."
];

const LIGHT_VARIATIONS = [
  "Introduce a subtle 5% increase in key light intensity.",
  "Shift the light source slightly to create softer shadow falloff.",
  "Enhance the catchlights in the eyes slightly.",
  "Introduce a very subtle cool tint to the fill light.",
  "Introduce a very subtle warm tint to the fill light."
];

const POSE_MICRO_VARIATIONS = [
  "Subject tilts head 3 degrees to the left.",
  "Subject tilts head 3 degrees to the right.",
  "Subject shifts shoulder alignment slightly.",
  "Subject's chin is lifted 2 degrees higher.",
  "Subject's chin is lowered 2 degrees lower."
];

export const createVariantPlans = (
  count: number,
  enabled: boolean
): string[] => {
  const variations: string[] = [];

  for (let i = 0; i < count; i++) {
    if (!enabled || count === 1) {
      variations.push(""); // No variation for single image or disabled
      continue;
    }

    // Round-robin selection strategy to ensure diversity
    const camIdx = i % CAMERA_VARIATIONS.length;
    const lightIdx = (i + 1) % LIGHT_VARIATIONS.length;
    const poseIdx = (i + 2) % POSE_MICRO_VARIATIONS.length;

    // Combine 1-2 directives maximum to keep it "micro"
    // We rotate which category gets included to avoid overloading
    const directives: string[] = [];
    
    // Directive A (Primary)
    if (i % 3 === 0) directives.push(CAMERA_VARIATIONS[camIdx]);
    else if (i % 3 === 1) directives.push(LIGHT_VARIATIONS[lightIdx]);
    else directives.push(POSE_MICRO_VARIATIONS[poseIdx]);

    // Directive B (Secondary - optional, added every other item)
    if (i % 2 === 0) {
      const secondaryIdx = (i * 7) % LIGHT_VARIATIONS.length; // Pseudo-random hop
      directives.push(LIGHT_VARIATIONS[secondaryIdx]);
    }

    const block = `[BATCH MICRO-VARIATION]\n${directives.join(" ")}`;
    variations.push(block);
  }

  return variations;
};
