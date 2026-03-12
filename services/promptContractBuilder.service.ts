import { FinalPromptContract } from '../schemas/finalPromptContract';
import { OrchestratorParams } from '../types';
import { 
  expandComposerAttributes,
  expandHairDescription, 
  expandEnvironment, 
  expandLighting, 
  expandBody, 
  expandOutfit, 
  expandMakeup, 
  expandSkin, 
  expandHands, 
  expandAccessories, 
  expandConcept, 
  expandColorGrading 
} from './promptExpansion.service';
import { resolveSection, resolveSky, resolveAtmosphere } from './promptSectionValidator.service';
import { detectSceneType } from './sceneTypeDetector.service';
import { REALISM_PROFILES, DEFAULT_REALISM_PROFILE } from '../data/realismProfiles';
import { classifyCameraIntent } from './povIntent.service';
import { 
  MASTER_IDENTITY_IMMUTABILITY, 
  MASTER_PHOTOGRAPHIC_REALISM,
  MASTER_GLOBAL_NEGATIVES
} from '../constants/masterPrompts';

const buildGazeBlock = (strength: 'normal' | 'strong' | 'maximum' = 'normal'): string => {
  const baseConstraints = `
[GAZE CONSTRAINTS]
- Both pupils must align toward the same focal point with natural binocular convergence.
- No cross-eye effect.
- No outward drifting eye.
- No divergence between left and right gaze vectors.
- Iris centers symmetrically positioned within the eyelid aperture.
- Equal sclera exposure relative to gaze direction.
- Natural eyelid compression consistent with gaze angle.
- Catchlights must be consistent in direction, position, and intensity across both eyes.
- No misaligned iris rotation.
- No abnormal pupil offset.
`.trim();

  if (strength === 'strong' || strength === 'maximum') {
    return baseConstraints + `\n- STRICT ENFORCEMENT: Eyes must be perfectly synchronized.\n- If gaze direction is specified, both pupils must rotate equally.\n- If direct gaze, pupils must be centered horizontally and vertically.`;
  }

  return baseConstraints;
};

export function buildPromptContract(params: OrchestratorParams): { contract: FinalPromptContract, negatives: string[], variantPlan: any } {
  const expandedAttrs = expandComposerAttributes(params);
  
  // Priority Resolution: User Selected > Reference Slot Extracted > System Defaults
  // expandedAttrs already handles User vs Default. 
  // We need to integrate Reference Slot (SceneDNA) if available.

  const dna = params.sceneDNA;
  const prop = params.propInteraction;

  // 1. IMAGE DIRECTIVE
  const imageDirective = `Ultra-realistic cinematic DSLR photograph, high-fidelity scene reconstruction.`;

  // 2. IDENTITY LOCK
  const multiViewContext = params.identityAnchor.multiViewRefs 
    ? "MULTI-VIEW REFERENCE ACTIVE: Use Front, 45-degree, and Profile views for 3D consistency." 
    : "";
    
  const identityBlock = `
[IDENTITY LOCK]
Identity Anchor: ${params.identityAnchor.immutableText || 'Preserve input face'}
Rule: ${MASTER_IDENTITY_IMMUTABILITY}
${multiViewContext}
`.trim();

  // 3. SUBJECT DESCRIPTION
  const subjectDesc = `A highly detailed portrait of a ${params.identityAnchor.gender || 'person'}. 
Body: ${expandedAttrs.body}
Hair: ${expandedAttrs.hair}
Outfit: ${expandedAttrs.outfit}
Expression: ${expandedAttrs.expression}`;

  // 4. POSE DNA
  const poseStrength = params.poseStrength || 'normal';
  const poseDNA = dna?.pose ? `
[POSE DNA]
Skeleton: ${dna.pose.skeleton}
Semantic: ${dna.pose.semantic}
Orientation: Head ${dna.pose.orientation.head}, Torso ${dna.pose.orientation.torso}, Shoulders ${dna.pose.orientation.shoulders}, Hips ${dna.pose.orientation.hips}
Articulation: Elbows ${dna.pose.articulation.elbows}, Wrists ${dna.pose.articulation.wrists}, Knees ${dna.pose.articulation.knees}
Balance: ${dna.pose.balance}
Confidence: ${dna.pose.confidence}
${poseStrength === 'strong' ? 'CRITICAL: Enforce exact joint angles and limb placement. No anatomical deviation.' : ''}
${poseStrength === 'absolute' ? 'MANDATORY: Absolute pose replication. Subject must match the described skeleton geometry exactly. Zero tolerance for pose drift.' : ''}
`.trim() : `[POSE DNA]\nPose: ${expandedAttrs.pose}${poseStrength !== 'normal' ? '\nSTRICT POSE ENFORCEMENT ACTIVE.' : ''}`;

  // 5. PROP INTERACTION
  const propBlock = prop ? `
[PROP INTERACTION]
Grip: ${prop.gripType}
Finger Placement: ${prop.fingerPlacement}
Contact Surfaces: ${prop.contactSurfaces}
Orientation: Hand-to-Object ${prop.objectOrientation.toHand}, Camera-to-Object ${prop.objectOrientation.toCamera}
`.trim() : "";

  // 6. CAMERA DNA
  const cameraDNA = dna?.camera ? `
[CAMERA DNA]
Shot Type: ${dna.camera.shotType}
Distance: ${dna.camera.distance}
Height: ${dna.camera.height}
Geometry: Yaw ${dna.camera.yaw}, Pitch ${dna.camera.pitch}, Roll ${dna.camera.roll}
Lens: ${dna.camera.lens.type}, ${dna.camera.lens.focalLength}, ${dna.camera.lens.compression} compression, ${dna.camera.lens.dof} depth of field, Focus on ${dna.camera.lens.focusTarget}
`.trim() : `[CAMERA DNA]\nCamera: ${expandedAttrs.camera}`;

  // 7. LIGHTING DNA
  const lightingDNA = dna?.lighting ? `
[LIGHTING DNA]
Primary: ${dna.lighting.primaryDirection}
Secondary: ${dna.lighting.secondaryFill}
Softness: ${dna.lighting.softness}
Intensity: ${dna.lighting.intensity}
Shadows: ${dna.lighting.shadowBehavior}
Highlights: ${dna.lighting.highlightDistribution}
Temp: ${dna.lighting.colorTemperature}
Bounce: ${dna.lighting.environmentalBounce}
`.trim() : `[LIGHTING DNA]\nLighting: ${params.lighting?.lightingMood} from ${params.lighting?.lightDirection}`;

  // 8. ENVIRONMENT DNA
  const envDNA = dna?.environment ? `
[ENVIRONMENT DNA]
Category: ${dna.environment.category}
Structure: ${dna.environment.backgroundStructure}
Layers: ${dna.environment.foregroundLayers}
Depth: ${dna.environment.depth}
Layout: ${dna.environment.layout}
Terrain: ${dna.environment.terrain}
Density: ${dna.environment.density}
`.trim() : `[ENVIRONMENT DNA]\nEnvironment: ${expandedAttrs.scene}`;

  // 9. REALISM RULES
  const profile = REALISM_PROFILES[params.realismProfile || DEFAULT_REALISM_PROFILE];
  const constraintLevel = params.anatomicalConstraintLevel || 'standard';
  const realismBlock = `
[REALISM RULES]
Profile: ${params.realismProfile || DEFAULT_REALISM_PROFILE}
Rules: ${profile.rules}
${MASTER_PHOTOGRAPHIC_REALISM}
${constraintLevel === 'high' ? 'STRICT ANATOMY: Ensure perfect finger count, joint articulation, and muscle tension.' : ''}
${constraintLevel === 'strict' ? 'ABSOLUTE ANATOMICAL INTEGRITY: Zero tolerance for AI artifacts. Fingers, limbs, and joints must be anatomically perfect. High-fidelity skeletal rendering.' : ''}
`.trim();

  // 10. NEGATIVE PROMPT
  const orchestratorNegatives = [
    ...MASTER_GLOBAL_NEGATIVES,
    ...profile.negatives,
    "text", "labels", "watermark", "airbrushed skin"
  ];

  const contract: FinalPromptContract = {
    aspectRatio: "4:5 vertical portrait",
    imageDirective: `${imageDirective}\n\n${identityBlock}\n\n${subjectDesc}\n\n${poseDNA}\n\n${propBlock}\n\n${cameraDNA}\n\n${lightingDNA}\n\n${envDNA}\n\n${realismBlock}`.trim(),
    concept: "Consolidated Scene DNA Reconstruction",
    subject: {
      description: subjectDesc,
      body: expandedAttrs.body,
      hair: expandedAttrs.hair,
      outfit: expandedAttrs.outfit,
      makeup: "Natural cinematic makeup",
      accessories: "Minimal accessories",
      skin: "High-fidelity skin texture",
      hands: "Anatomically correct hands"
    },
    environment: {
      setting: envDNA,
      foreground: dna?.environment.foregroundLayers || "Natural foreground",
      midground: "Clear midground",
      background: dna?.environment.backgroundStructure || "Atmospheric background",
      sky: "Cinematic sky",
      atmosphere: dna?.atmosphere || "Natural atmosphere"
    },
    lighting: lightingDNA,
    camera: {
      model: "Professional Cinema Camera",
      lens: dna?.camera.lens.type || "Portrait lens",
      aperture: "f/1.8",
      shutter: "1/200s",
      iso: "ISO 100"
    },
    colorGrading: "Cinematic film emulation",
    negativePrompt: orchestratorNegatives.join(", ")
  };

  return {
    contract,
    negatives: orchestratorNegatives,
    variantPlan: { id: crypto.randomUUID(), seed: (params.seed || 0) + (params.variantIndex || 0) }
  };
}
