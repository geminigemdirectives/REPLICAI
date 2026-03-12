import { Type } from "@google/genai";
import { IdentityAnchorV2Result, FaceMetrics } from '../types';
import { callGeminiWithRetry } from './gemini';

const ANCHOR_MODEL = "gemini-3-flash-preview";

const STAGE_2_EXTRACTION_SYSTEM = `
You are a forensic biometric analyst. 
Your task is to analyze a face crop and extract BOTH structural facial features AND hair details into a strict JSON schema.

CRITICAL SKULL & BONE STRUCTURE RULES:
1. Focus on SKULL MORPHOLOGY and BONE STRUCTURE above all else.
2. Describe jawline curvature, cheekbone height, and chin roundness in anatomical skeletal terms.
3. Identify the underlying cranial vault shape and brow ridge depth.
4. Ignore makeup, expression, or temporary styling.
`;

const STAGE_4_VERIFICATION_SYSTEM = `
You are a strict Identity Security Compliance Officer.
Your task is to review extracted facial features and compile a Final Identity Anchor.
Ensure skull structure and bone morphology descriptions are immutable and highly detailed.
`;

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const generateIdentityAnchor = async (
  images: (File | Blob)[], 
  gender: string, 
  aggregatedMetrics?: FaceMetrics
): Promise<IdentityAnchorV2Result> => {
  try {
    const primaryImage = images[0];
    const base64Data = await blobToBase64(primaryImage);
    const mimeType = primaryImage.type || 'image/jpeg';
    
    // If multiple images, we can provide more context to Gemini
    const additionalContext = images.length > 1 
      ? `Subject is analyzed across ${images.length} reference frames for structural stability.`
      : "";

    // Parallelize Gemini calls: Anchor Text Generation AND Biometric Signature Extraction
    const anchorResult = await callGeminiWithRetry(async (ai) => {
      // ... (existing Gemini call logic for anchor text)
      const extractionPrompt = `
        Analyze these face crops. Gender context: ${gender}.
        ${additionalContext}
        Biometric Metrics (Aggregated Ref): ${aggregatedMetrics ? JSON.stringify(aggregatedMetrics.ratios) : "None"}
        Extract skull structure and facial features with high structural fidelity. 
        Focus on features that remain consistent across all provided reference frames.
      `;

      // Pass up to 3 images for analysis to stay within reasonable token limits
      const imageParts = await Promise.all(images.slice(0, 3).map(async (img) => {
        const b64 = await blobToBase64(img);
        return { inlineData: { mimeType: img.type || 'image/jpeg', data: b64 } };
      }));

      const extractionResponse = await ai.models.generateContent({
        model: ANCHOR_MODEL,
        config: {
          systemInstruction: STAGE_2_EXTRACTION_SYSTEM + "\n" + STAGE_4_VERIFICATION_SYSTEM + "\nOUTPUT MUST BE A SINGLE JSON OBJECT containing both the raw features and the final compiled anchor text.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              face_shape: { type: Type.STRING },
              skull_structure: { type: Type.STRING },
              eyes: { type: Type.STRING },
              nose: { type: Type.STRING },
              mouth: { type: Type.STRING },
              skin_tone: { type: Type.STRING },
              hair_style: { type: Type.STRING },
              hair_color: { type: Type.STRING },
              hair_texture: { type: Type.STRING },
              hair_length: { type: Type.STRING },
              hair_confidence: { type: Type.NUMBER },
              face_shape_confidence: { type: Type.NUMBER },
              anchor_text: { type: Type.STRING, description: "The Final Identity Anchor (FACE & SKULL ONLY). Include a dedicated section for 'SKULL MORPHOLOGY'. Append mandatory footer." },
              hair_summary: { type: Type.STRING, description: "A natural language summary of the hair." }
            }
          }
        },
        contents: {
          parts: [
            ...imageParts,
            { text: extractionPrompt + "\nAlso compile the 'anchor_text' and 'hair_summary' based on the extracted features." }
          ]
        }
      });

      const rawFeatures = JSON.parse(extractionResponse.text || "{}");
      
      const finalAnchorText = rawFeatures.anchor_text?.trim() || "Standard facial structure.";
      let defaultHair = rawFeatures.hair_summary || "Natural hair.";
      
      if (!rawFeatures.hair_summary && rawFeatures.hair_confidence > 0.4) {
         defaultHair = `${rawFeatures.hair_length || ''} ${rawFeatures.hair_texture || ''} ${rawFeatures.hair_color || ''} hair, ${rawFeatures.hair_style || ''} style.`;
      }

      return {
        anchorText: finalAnchorText,
        defaultHairPrompt: defaultHair,
        confidenceSummary: {
          faceCoverage: 1.0, 
          featureConfidence: rawFeatures.face_shape_confidence || 0.8
        },
        faceCropImage: primaryImage instanceof Blob ? primaryImage : undefined
      };
    });

    return anchorResult;

  } catch (error: any) {
    console.warn("Identity Anchor V2 generation failed after retries:", error);
    return {
      anchorText: "Standard facial structure (Fallback).",
      defaultHairPrompt: "Natural hair.",
      confidenceSummary: { faceCoverage: 0, featureConfidence: 0 }
    };
  }
};
