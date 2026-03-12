import { OrchestratorParams, AttributeKey, AttributeSelectionState } from '../types';
import { PRESETS } from '../data/presets';

const AUTO_DEFAULTS = {
  camera: "Cinematic medium shot, professional photography, 50mm lens.",
  pose: "Natural, confident posture.",
  outfit: "Contemporary casual fashion.",
  body: "Average build.",
  hair: "Natural hairstyle.",
  scene: "Clean, atmospheric background.",
  expression: "Neutral expression."
};

export function resolveAttribute(
  key: AttributeKey,
  lockValue: string | undefined,
  uiField: AttributeSelectionState,
  identityDefaults: Partial<Record<AttributeKey, string>> | undefined
): string {
  if (lockValue && lockValue.trim().length > 0) {
    if (uiField.isFromSlot1 || uiField.mode === 'auto') {
      return lockValue.trim();
    }
  }

  if (uiField.mode === 'custom' && uiField.customText.trim().length > 0) {
    return uiField.customText.trim();
  }
  
  if (uiField.mode === 'preset' && uiField.presetCategoryId && uiField.presetOptionId) {
     const category = PRESETS[key]?.find(c => c.id === uiField.presetCategoryId);
     const option = category?.options.find(o => o.id === uiField.presetOptionId);
     if (option) return option.prompt;
  }

  if (identityDefaults && identityDefaults[key] && identityDefaults[key]!.trim().length > 0) {
    return identityDefaults[key]!;
  }

  return AUTO_DEFAULTS[key as keyof typeof AUTO_DEFAULTS] || "";
}

export function expandComposerAttributes(params: OrchestratorParams): Record<AttributeKey, string> {
  const lockedAttributes = params.fullLockRef?.expanded || {};
  return {
    camera: resolveAttribute('camera', lockedAttributes.camera, params.attributes.camera, params.identityAttributes),
    pose: resolveAttribute('pose', lockedAttributes.pose, params.attributes.pose, params.identityAttributes),
    outfit: resolveAttribute('outfit', lockedAttributes.outfit, params.attributes.outfit, params.identityAttributes),
    body: resolveAttribute('body', lockedAttributes.body, params.attributes.body, params.identityAttributes),
    hair: resolveAttribute('hair', lockedAttributes.hair, params.attributes.hair, params.identityAttributes),
    scene: resolveAttribute('scene', lockedAttributes.scene, params.attributes.scene, params.identityAttributes),
    expression: resolveAttribute('expression', lockedAttributes.expression, params.attributes.expression, params.identityAttributes)
  };
}

export function expandHairDescription(hair?: string): string {
  if (!hair || hair.trim().length === 0) return "N/A";
  return `Her hair is styled in ${hair}. The strands appear natural and softly textured, catching surrounding light with subtle highlights and depth.`;
}

export function expandEnvironment(setting?: string): string {
  if (!setting || setting.trim().length === 0) return "N/A";
  return `The scene takes place at ${setting}, surrounded by natural environmental detail that extends into the distance with clear spatial depth and natural terrain features.`;
}

export function expandLighting(type?: string): string {
  if (!type || type.trim().length === 0) return "N/A";
  return `Natural ${type} illumination creates directional lighting across the scene, producing realistic highlights, soft shadows, and natural tonal contrast.`;
}

export function expandBody(body?: string): string {
  if (!body || body.trim().length === 0) return "N/A";
  return `Her body features ${body}, appearing anatomically correct and naturally proportioned within the scene.`;
}

export function expandOutfit(outfit?: string): string {
  if (!outfit || outfit.trim().length === 0) return "N/A";
  return `She is wearing ${outfit}. The fabric shows realistic texture, folds, and natural draping that interacts with the scene's lighting.`;
}

export function expandMakeup(makeup?: string): string {
  if (!makeup || makeup.trim().length === 0) return "N/A";
  return `Her makeup is styled as ${makeup}, applied naturally to complement her facial features and skin tone.`;
}

export function expandSkin(skin?: string): string {
  if (!skin || skin.trim().length === 0) return "N/A";
  return `Her skin exhibits ${skin}, showing realistic pores, subtle imperfections, and natural subsurface scattering under the lighting.`;
}

export function expandHands(hands?: string): string {
  if (!hands || hands.trim().length === 0) return "N/A";
  return `Her hands are ${hands}, with anatomically correct joints, natural skin folding, and realistic proportions.`;
}

export function expandAccessories(accessories?: string): string {
  if (!accessories || accessories.trim().length === 0) return "N/A";
  return `She is accessorized with ${accessories}, which catch the light naturally and add realistic detail to her appearance.`;
}

export function expandConcept(concept?: string): string {
  if (!concept || concept.trim().length === 0) return "N/A";
  return `The overarching concept is ${concept}, establishing a strong narrative and visual direction for the photograph.`;
}

export function expandColorGrading(colorGrading?: string): string {
  if (!colorGrading || colorGrading.trim().length === 0) return "N/A";
  return `The image is color graded with ${colorGrading}, enhancing the mood and cinematic quality of the final capture.`;
}
