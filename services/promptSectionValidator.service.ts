import { SceneType } from '../schemas/sceneType';

export function resolveSection(value?: string): string {
  if (!value || value.trim().length === 0) {
    return "N/A";
  }
  return value;
}

export function resolveSky(sceneType: SceneType, sky?: string, ceilingVisible?: boolean): string {
  if (sceneType === "indoor" || sceneType === "studio" || sceneType === "vehicle" || sceneType === "underwater" || ceilingVisible) {
    return "N/A";
  }
  if (!sky || sky.trim().length === 0) {
    return "N/A";
  }
  return sky;
}

export function resolveAtmosphere(sceneType: SceneType, atmosphere?: string): string {
  if (sceneType === "indoor" || sceneType === "studio") {
    return "N/A";
  }
  if (!atmosphere || atmosphere.trim().length === 0) {
    return "N/A";
  }
  return atmosphere;
}
