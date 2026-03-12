
import { Type } from "@google/genai";
import { fileToBase64, callGeminiWithRetry } from './gemini';
import { BodyMetrics } from '../types';
import { loadImage } from '../utils/imageCanvas';

const METRICS_MODEL = "gemini-3-flash-preview";

export const computeBodyMetrics = async (file: File): Promise<BodyMetrics | null> => {
  try {
    const base64 = await fileToBase64(file);
    const imgUrl = URL.createObjectURL(file);
    const img = await loadImage(imgUrl);
    URL.revokeObjectURL(imgUrl);

    return await callGeminiWithRetry(async (ai) => {
      const response = await ai.models.generateContent({
        model: METRICS_MODEL,
        config: {
          systemInstruction: "You are a biometric engine. Return normalized coordinates for body keypoints.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              pose_confidence: { type: Type.NUMBER },
              bbox: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              keypoints: { type: Type.OBJECT, additionalProperties: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, v: { type: Type.NUMBER } } } }
            }
          }
        },
        contents: {
          parts: [
            { inlineData: { mimeType: file.type, data: base64 } },
            { text: "Extract body keypoints." }
          ]
        }
      });

      const raw = JSON.parse(response.text || "{}");
      const k = raw.keypoints;
      if (!k) return null;

      const fullBodyVisible = k.left_shoulder?.v > 0.5 && k.right_shoulder?.v > 0.5 && k.left_hip?.v > 0.5 && k.right_hip?.v > 0.5;

      return {
        version: "v1",
        source: "BODY_BASE",
        confidence: raw.pose_confidence || 0,
        fullBodyVisible,
        upperBodyOnly: !fullBodyVisible,
        occlusionLevel: "LOW",
        ratios: { shoulderToHip: 1.0 },
        flags: { fullBodyVisible, upperBodyOnly: !fullBodyVisible, lowerBodyMissing: false, heavyOcclusion: false },
        warnings: [],
        createdAtIso: new Date().toISOString()
      };
    });
  } catch (e) {
    console.warn("Body Metrics failed after retries:", e);
    return null;
  }
};
