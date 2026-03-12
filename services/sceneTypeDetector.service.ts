import { SceneType } from '../schemas/sceneType';

export function detectSceneType(sceneDescription: string): SceneType {
  if (!sceneDescription) return "unknown";

  const text = sceneDescription.toLowerCase();

  if (text.includes("room") || text.includes("apartment") || text.includes("office") || text.includes("indoor") || text.includes("inside"))
    return "indoor";

  if (text.includes("studio") || text.includes("photoshoot backdrop") || text.includes("backdrop"))
    return "studio";

  if (text.includes("car") || text.includes("inside vehicle") || text.includes("bus") || text.includes("train") || text.includes("airplane"))
    return "vehicle";

  if (text.includes("ocean") || text.includes("underwater") || text.includes("pool") || text.includes("sea"))
    return "underwater";

  if (
    text.includes("mountain") ||
    text.includes("beach") ||
    text.includes("park") ||
    text.includes("street") ||
    text.includes("desert") ||
    text.includes("outdoor") ||
    text.includes("outside") ||
    text.includes("forest") ||
    text.includes("city")
  )
    return "outdoor";

  return "unknown";
}
