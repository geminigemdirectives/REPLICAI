
import { GoogleGenAI, Type } from "@google/genai";
import { MirrorDetectionContext, CameraMode } from '../types';

const MIRROR_ANALYZER_SYSTEM_PROMPT = `
You are an expert computer vision classifier specializing in camera perspective and environment analysis.
Your task is to analyze an image to detect "Mirror Scene" vs "Mirror Shot".

DEFINITIONS:
1. **Mirror Scene**: A mirror is visible in the background/environment (e.g., hanging on wall), but the camera is NOT capturing a reflection of itself.
2. **Mirror Shot**: The image is a selfie taken by pointing a phone/camera at a mirror. The subject is a reflection.
3. **Selfie POV**: The subject is holding an imaginary camera (arm extended) looking at the lens. No mirror reflection involved.
4. **Third Person**: Standard portrait/photo taken by someone else.

RUBRIC FOR "Mirror Shot" (High Bar):
- Visible smartphone/camera in hand.
- Camera lens aimed at mirror.
- Reflection physics (subject appears reversed).

RUBRIC FOR "Selfie POV" (Medium Bar):
- Arm extended towards viewer.
- Subject looking directly at lens.
- NO visible phone (imaginary camera).

OUTPUT: Strict JSON.
- hasMirrorScene: boolean (Is a mirror object visible anywhere?)
- cameraMode: 'MIRROR_SHOT' | 'SELFIE_POV' | 'THIRD_PERSON'
- confidence: 0.0 to 1.0 (Confidence in the cameraMode)
- evidence: List of visual cues (e.g. "Phone visible in hand", "Arm extended", "Mirror frame visible").
`;

export const analyzeMirrorMode = async (input: { 
  imageBase64: string; 
  mimeType: string 
}): Promise<MirrorDetectionContext> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: MIRROR_ANALYZER_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasMirrorScene: { type: Type.BOOLEAN },
            cameraMode: { type: Type.STRING, enum: ['MIRROR_SHOT', 'SELFIE_POV', 'THIRD_PERSON'] },
            confidence: { type: Type.NUMBER },
            evidence: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["hasMirrorScene", "cameraMode", "confidence", "evidence"]
        }
      },
      contents: {
        parts: [
          { inlineData: { mimeType: input.mimeType, data: input.imageBase64 } },
          { text: "Analyze the camera perspective and mirror presence." }
        ]
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text");
    
    const result = JSON.parse(text);
    
    // Confidence Gating
    let finalMode: CameraMode = result.cameraMode as CameraMode;
    if (result.confidence < 0.70) {
      // Default to THIRD_PERSON if uncertain, unless it was flagged as Mirror Shot with decent confidence
      if (finalMode !== 'THIRD_PERSON') {
         finalMode = 'THIRD_PERSON';
         result.evidence.push("Low confidence, defaulting to Third Person.");
      }
    }

    return {
      enabled: true,
      hasMirrorScene: result.hasMirrorScene || false,
      isMirrorShot: finalMode === 'MIRROR_SHOT',
      cameraMode: finalMode,
      confidence: result.confidence || 0,
      evidence: result.evidence || []
    };

  } catch (error) {
    console.warn("Mirror analysis failed:", error);
    return {
      enabled: true,
      hasMirrorScene: false,
      isMirrorShot: false,
      cameraMode: 'THIRD_PERSON',
      confidence: 0,
      evidence: ["Analysis failed, defaulting to Third Person."]
    };
  }
};
