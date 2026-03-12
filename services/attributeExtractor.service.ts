
import { Type } from "@google/genai";
import { fileToBase64, callGeminiWithRetry } from './gemini';
import { AttributeKey, Gender, SceneDNA, PropInteraction } from '../types';
import { SYSTEM_INSTRUCTION_EXTRACTION, GEMINI_TEXT_MODEL } from '../constants';

const EXTRACT_MODEL = GEMINI_TEXT_MODEL;

const SYSTEM_SINGLE_EXTRACT = `
You are an expert film director and stylist. Extract a SINGLE visual attribute into a detailed, descriptive prompt.
Focus on identifying high-quality structural and stylistic details.
IGNORE FACE IDENTITY. PLAIN TEXT ONLY. NO JSON.
`;

const UPDATED_EXTRACTION_SYSTEM = `
${SYSTEM_INSTRUCTION_EXTRACTION}
Your task is to extract details that define the subject's style and setting.
When describing outfits, focus on fabrics and fit.
When describing poses, identify objective body language.
When describing scenes, look for atmospheric elements that support the location mood.
`.trim();

export interface ExtractedSceneData {
  attributes: Partial<Record<AttributeKey, string>>;
  sceneDNA: SceneDNA;
  propInteraction: PropInteraction;
}

export const extractFullAttributes = async (
  file: File | Blob, 
  context: { gender: Gender }
): Promise<ExtractedSceneData> => {
  const base64 = await fileToBase64(file);
  
  try {
    return await callGeminiWithRetry(async (ai) => {
      const response = await ai.models.generateContent({
        model: EXTRACT_MODEL,
        config: {
          systemInstruction: UPDATED_EXTRACTION_SYSTEM + "\nEnsure you describe the 'expression' as well, focusing on mood and lip/eye posture. For 'body', provide a HIGHLY DETAILED, STRUCTURAL description (torso structure, muscle tone, posture, shading/volume) in a single paragraph. Also extract full Scene DNA and Prop Interaction data.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              attributes: {
                type: Type.OBJECT,
                properties: {
                  camera: { type: Type.STRING, description: "Lens, angle, and framing" },
                  outfit: { type: Type.STRING, description: "Detailed clothing and accessories with focus on texture/fit" },
                  body: { type: Type.STRING, description: "Physique and silhouette. Focus on structure, volume, and lighting interaction." },
                  pose: { type: Type.STRING, description: "Body stance and hand position" },
                  hair: { type: Type.STRING, description: "Hairstyle, texture, and color" },
                  scene: { type: Type.STRING, description: "Environment and lighting mood" },
                  expression: { type: Type.STRING, description: "Facial mood and muscle tension (ignore identity)" }
                },
                required: ["camera", "outfit", "body", "pose", "hair", "scene", "expression"]
              },
              sceneDNA: {
                type: Type.OBJECT,
                properties: {
                  environment: {
                    type: Type.OBJECT,
                    properties: {
                      category: { type: Type.STRING },
                      backgroundStructure: { type: Type.STRING },
                      foregroundLayers: { type: Type.STRING },
                      depth: { type: Type.STRING },
                      layout: { type: Type.STRING },
                      terrain: { type: Type.STRING },
                      density: { type: Type.STRING }
                    },
                    required: ["category", "backgroundStructure", "foregroundLayers", "depth", "layout", "terrain", "density"]
                  },
                  camera: {
                    type: Type.OBJECT,
                    properties: {
                      shotType: { type: Type.STRING },
                      distance: { type: Type.STRING },
                      height: { type: Type.STRING },
                      yaw: { type: Type.STRING },
                      pitch: { type: Type.STRING },
                      roll: { type: Type.STRING },
                      lens: {
                        type: Type.OBJECT,
                        properties: {
                          type: { type: Type.STRING },
                          focalLength: { type: Type.STRING },
                          compression: { type: Type.STRING },
                          dof: { type: Type.STRING },
                          focusTarget: { type: Type.STRING }
                        },
                        required: ["type", "focalLength", "compression", "dof", "focusTarget"]
                      }
                    },
                    required: ["shotType", "distance", "height", "yaw", "pitch", "roll", "lens"]
                  },
                  lighting: {
                    type: Type.OBJECT,
                    properties: {
                      primaryDirection: { type: Type.STRING },
                      secondaryFill: { type: Type.STRING },
                      softness: { type: Type.STRING },
                      intensity: { type: Type.STRING },
                      shadowBehavior: { type: Type.STRING },
                      highlightDistribution: { type: Type.STRING },
                      colorTemperature: { type: Type.STRING },
                      environmentalBounce: { type: Type.STRING }
                    },
                    required: ["primaryDirection", "secondaryFill", "softness", "intensity", "shadowBehavior", "highlightDistribution", "colorTemperature", "environmentalBounce"]
                  },
                  pose: {
                    type: Type.OBJECT,
                    properties: {
                      skeleton: { type: Type.STRING },
                      semantic: { type: Type.STRING },
                      confidence: { type: Type.NUMBER },
                      orientation: {
                        type: Type.OBJECT,
                        properties: {
                          head: { type: Type.STRING },
                          torso: { type: Type.STRING },
                          shoulders: { type: Type.STRING },
                          hips: { type: Type.STRING }
                        },
                        required: ["head", "torso", "shoulders", "hips"]
                      },
                      articulation: {
                        type: Type.OBJECT,
                        properties: {
                          elbows: { type: Type.STRING },
                          wrists: { type: Type.STRING },
                          knees: { type: Type.STRING }
                        },
                        required: ["elbows", "wrists", "knees"]
                      },
                      balance: { type: Type.STRING }
                    },
                    required: ["skeleton", "semantic", "confidence", "orientation", "articulation", "balance"]
                  },
                  composition: { type: Type.STRING },
                  spatialDepth: { type: Type.STRING },
                  atmosphere: { type: Type.STRING }
                },
                required: ["environment", "camera", "lighting", "pose", "composition", "spatialDepth", "atmosphere"]
              },
              propInteraction: {
                type: Type.OBJECT,
                properties: {
                  gripType: { type: Type.STRING },
                  fingerPlacement: { type: Type.STRING },
                  contactSurfaces: { type: Type.STRING },
                  objectOrientation: {
                    type: Type.OBJECT,
                    properties: {
                      toHand: { type: Type.STRING },
                      toCamera: { type: Type.STRING }
                    },
                    required: ["toHand", "toCamera"]
                  }
                },
                required: ["gripType", "fingerPlacement", "contactSurfaces", "objectOrientation"]
              }
            },
            required: ["attributes", "sceneDNA", "propInteraction"]
          }
        },
        contents: {
          parts: [
            { inlineData: { mimeType: file.type, data: base64 } },
            { text: `Analyze this image for a ${context.gender || 'person'}. Extract all visual attributes, Scene DNA, and Prop Interaction into the required JSON format.` }
          ]
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from extraction engine.");
      
      const result = JSON.parse(text) as ExtractedSceneData;
      
      return result;
    });
  } catch (e: any) {
    console.error("Full attribute extraction failed:", e);
    // Fallback with empty DNA
    return {
      attributes: {
        camera: "Medium shot, natural lighting.",
        outfit: "Casual attire.",
        body: "Standard physique.",
        pose: "Neutral stance.",
        hair: "Natural well-groomed hair.",
        scene: "Atmospheric setting.",
        expression: "Neutral expression."
      },
      sceneDNA: {} as any,
      propInteraction: {} as any
    };
  }
};

export const extractSingleAttribute = async (
  file: File,
  key: AttributeKey,
  context: { gender: Gender }
): Promise<string> => {
  const base64 = await fileToBase64(file);
  
  try {
    return await callGeminiWithRetry(async (ai) => {
      const response = await ai.models.generateContent({
        model: EXTRACT_MODEL,
        config: { systemInstruction: SYSTEM_SINGLE_EXTRACT },
        contents: {
          parts: [
            { inlineData: { mimeType: file.type, data: base64 } },
            { text: `Extract ONLY the ${key.toUpperCase()}. Keep it descriptive and technical.` }
          ]
        }
      });
      return response.text?.trim() || "";
    });
  } catch (e: any) {
    console.error(`Single extraction for ${key} failed:`, e);
    return "";
  }
};
