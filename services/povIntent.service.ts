
import { SELFIE_POV_NEGATIVES, MIRROR_SHOT_NEGATIVES } from '../constants/povNegatives';

export type CameraIntent = "SELFIE_POV" | "MIRROR_SHOT" | "THIRD_PERSON";

export const classifyCameraIntent = (cameraText: string, poseText: string): CameraIntent => {
  const combined = (cameraText + " " + poseText).toLowerCase();

  // 1. Check Mirror (Highest Priority for classification separation)
  // Heuristics: "mirror", "reflection", "bathroom selfie"
  if (
    combined.includes("mirror") ||
    combined.includes("reflection")
  ) {
    return "MIRROR_SHOT";
  }

  // 2. Check Selfie POV
  // Heuristics: "selfie", "pov", "front camera", "arm extended", "holding camera", "viewer is the camera"
  const selfieKeywords = [
    "selfie", "pov", "front camera", "arm extended", "holding camera",
    "viewer is the camera", "holding phone", "smartphone"
  ];
  
  if (selfieKeywords.some(kw => combined.includes(kw))) {
    return "SELFIE_POV";
  }

  // Default
  return "THIRD_PERSON";
};

export const getPovNegatives = (intent: CameraIntent): string[] => {
  if (intent === "SELFIE_POV") return SELFIE_POV_NEGATIVES;
  if (intent === "MIRROR_SHOT") return MIRROR_SHOT_NEGATIVES;
  return [];
};

export const buildPovContractBlock = (intent: CameraIntent): string => {
  if (intent === "SELFIE_POV") {
    return `
[SELFIE POV HAND CONTRACT — STRICT]
This is a true selfie POV. The viewer IS the camera.
The subject must be actively holding an imaginary phone/camera in the shooting hand.
Do NOT render any phone/device. The device must be invisible.
The shooting arm must be realistically extended toward the camera, with natural shoulder rotation and elbow bend.
The shooting hand must form a believable selfie grip: fingers wrapped as if holding a phone, thumb positioned naturally.
The wrist angle must look correct for a selfie (slight inward tilt).
The subject’s gaze must be directed toward the camera lens (viewer).
The framing must look like a selfie: mild perspective, close distance, natural arm/shoulder foreshortening.

HARD PROHIBITION:
Do NOT generate a third-person camera viewpoint.
Do NOT generate a photographer perspective.
Do NOT show the subject fully “posed for someone else’s camera” unless explicitly intended.
`.trim();
  }

  if (intent === "MIRROR_SHOT") {
    return `
[MIRROR SHOT CONTRACT — STRICT]
This is a mirror-shot. The subject is photographed via a mirror reflection.
A phone must be visible in the subject’s hand.
The phone camera must point directly at the mirror.
The reflection must obey mirror physics (correct left-right, consistent angles, no floating reflections).
The camera viewpoint must match the reflected camera position, not a third-person viewpoint.
`.trim();
  }

  return "";
};
