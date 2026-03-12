
import { RealismProfileKey } from '../types';

interface RealismProfileDef {
  label: string;
  rules: string;
  negatives: string[];
  lightingBias?: string;
  environmentBias?: string;
}

export const REALISM_PROFILES: Record<RealismProfileKey, RealismProfileDef> = {
  PH: {
    label: 'Philippines (PH)',
    rules: `
[REALISM ENGINE: PHILIPPINES]
- Environment: Emphasize tropical daylight character (harsh sun, warm humid air) or authentic local settings.
- Skin: Allow humidity sheen, natural pores, and realistic texture.
- Shading: Preserve natural ambient occlusion and realistic shadowing to maintain physical volume.
- Tone: Warm, vibrant, high-contrast but grounded.
    `.trim(),
    negatives: [
      "overly cinematic hollywood grading",
      "plastic skin",
      "flat shading",
      "airbrushed chest"
    ]
  },
  JP: {
    label: 'Japan (JP)',
    rules: `
[REALISM ENGINE: JAPAN]
- Environment: Clean urban geometry, soft signage bokeh, narrow streets.
- Tone: Cooler neutral tones, controlled highlights, film-like color discipline.
- Shading: Soft-diffused depth shadowing; ensure the physique retains natural contours to define form.
- Atmosphere: Soft, diffused lighting, often overcast or neon-lit.
    `.trim(),
    negatives: [
      "tropical haze",
      "oversaturated warm cast",
      "washed out contours",
      "flat anatomical rendering"
    ]
  },
  KR: {
    label: 'Korea (KR)',
    rules: `
[REALISM ENGINE: KOREA]
- Aesthetics: High-key beauty editorial realism. Clean modern street fashion vibes.
- Skin: Glass skin aesthetic allowed but must remain photorealistic with visible micro-shadows.
- Lighting: Soft, flattering studio-quality light; maintain contrast in shadowed regions of the body.
- Palette: Muted, pastel, or monochrome chic.
    `.trim(),
    negatives: [
      "uncanny doll look",
      "flat lighting",
      "removed anatomical depth",
      "excessive smoothing",
      "airbrushed torso"
    ]
  },
  US: {
    label: 'United States (US)',
    rules: `
[REALISM ENGINE: UNITED STATES]
- Style: Natural lifestyle photography, authentic suburban or urban settings.
- Lighting: Balanced exposure, realistic lens choices (35mm/50mm).
- Shading: High dynamic range realism; preserve natural occlusion in areas of the body.
- Vibe: Casual, confident, candid snapshot realism.
    `.trim(),
    negatives: [
      "ai glam filter",
      "overly perfect studio look",
      "flat washed out shadows",
      "unnatural skin smoothing"
    ]
  }
};

export const DEFAULT_REALISM_PROFILE: RealismProfileKey = 'PH';
