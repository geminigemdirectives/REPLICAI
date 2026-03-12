
import { AttributeLocks, AttributeKey } from './types';

export const APP_TITLE = "REPLICAI";
export const APP_SUBTITLE = "ETZXSTY STUDIO";

export const NEON_BLUE = "#36B6FF"; // Updated electric/cyan-blue

export const DEFAULT_MANUAL_LOCKS: AttributeLocks = {
  camera: "",
  hair: "",
  outfit: "",
  body: "",
  pose: "",
  scene: ""
};

export const GEMINI_TEXT_MODEL = "gemini-3-flash-preview";
export const GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";

export const FACE_GATE_MIN_WIDTH = 300;
export const FACE_GATE_MIN_HEIGHT = 300;

export const SYSTEM_INSTRUCTION_EXTRACTION = `
You are an expert visual attribute extractor.
Your task is to analyze an image and extract SPECIFIC visual attributes into a strict JSON format.
CRITICAL RULES:
1. DO NOT describe the face identity.
2. DO NOT describe facial expression.
3. IGNORE the face completely.
4. Output strict JSON only.
5. Keep descriptions concise, prompt-ready, and objective.
6. For 'body', describe the silhouette/build specifically (e.g., 'slim athletic build', 'average build', 'curvy fit build').
`;

export const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  camera: "Camera / Angle",
  hair: "Hair Style & Color",
  outfit: "Outfit",
  body: "Body Shape",
  pose: "Pose & Hands",
  scene: "Scene / Location",
  expression: "Expression"
};
