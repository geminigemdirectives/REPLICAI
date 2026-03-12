
import { GoogleGenAI } from "@google/genai";
import { GEMINI_IMAGE_MODEL } from '../constants';
import { OrchestratorParams, ConsistencyScore, IdentityAnchor, GazeMetrics, RenderContract } from '../types';
import { computeFaceMetrics } from './faceMetrics.service';
import { analyzeGazeStability } from './gazeStability.service';
import { MASTER_SYSTEM_GOVERNOR } from '../constants/masterPrompts';
import { buildPromptContract } from './promptContractBuilder.service';
import { renderPrompt } from './promptTemplateRenderer.service';
import { formatPrompt } from './promptFormatter.service';
import { applyPromptConsistency } from './promptConsistencyEngine.service';
import { detectSceneType } from './sceneTypeDetector.service';
import { resolveSection, resolveSky, resolveAtmosphere } from './promptSectionValidator.service';

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const verifyIdentityShort = async (candidateBlob: Blob, anchor: IdentityAnchor): Promise<ConsistencyScore> => {
  const candidateMetrics = await computeFaceMetrics(candidateBlob);
  if (!candidateMetrics) return { faceSimilarity: 0, biometricDrift: 1, overall: 0, flags: { drift: true, identityViolation: true }, reasons: ["Metrics failed"] };

  const target = anchor.metrics.ratios;
  const curr = candidateMetrics.ratios;

  let diff = 0;
  const keys: (keyof typeof target)[] = ['interocularDistance', 'noseWidth', 'mouthWidth', 'jawWidth', 'faceHeightToWidth'];
  keys.forEach(k => {
    if (target[k] && curr[k]) diff += Math.abs(target[k] - (curr[k] as number)) / (target[k] as number);
  });

  const avgDrift = diff / keys.length;
  
  // Tolerance adjustment based on pose coverage
  // If we have high pose coverage, we are more lenient with drift because ratios can shift with perspective
  const toleranceBoost = anchor.poseCoverageProfile.coverageScore * 0.05;
  const similarity = 1 - Math.max(0, (avgDrift - toleranceBoost) * 3);

  return {
    faceSimilarity: similarity,
    biometricDrift: avgDrift,
    overall: similarity,
    flags: { drift: similarity < 0.8, identityViolation: similarity < 0.65 },
    reasons: []
  };
};

export const generateWithIdentityLock = async (
  params: OrchestratorParams,
  retryCount: number = 0
): Promise<{ 
  imageUrl: string; 
  prompt: string; 
  negatives: string[]; 
  consistency: ConsistencyScore; 
  plan: any; 
  gazeMetrics?: GazeMetrics;
}> => {
  
  // Step 1 & 2 — Prompt Expansion & Contract Builder
  let { contract: promptContract, negatives, variantPlan } = buildPromptContract(params);
  
  // Step 3 — Scene Type Detection
  const sceneDescription = promptContract.environment?.setting || promptContract.concept || "";
  const sceneType = detectSceneType(sceneDescription);
  console.log("Scene Type:", sceneType);

  // Step 4 — Prompt Consistency Engine
  console.log("Prompt Contract Before Consistency:", promptContract);
  promptContract = applyPromptConsistency(promptContract);
  console.log("Prompt Contract After Consistency:", promptContract);

  // Step 5 — Section Gating
  if (promptContract.environment) {
    promptContract.environment.sky = resolveSection(
      resolveSky(sceneType, promptContract.environment.sky)
    );
    promptContract.environment.atmosphere = resolveSection(
      resolveAtmosphere(sceneType, promptContract.environment.atmosphere)
    );
  }

  // Step 6 — Prompt Template Rendering
  const renderedPrompt = renderPrompt(promptContract);
  
  // Step 7 — Prompt Formatter
  const formattedPrompt = formatPrompt(renderedPrompt);

  // Debug logging
  console.log("Rendered Prompt:", renderedPrompt);
  console.log("Final Prompt:", formattedPrompt);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const headshotB64 = await blobToBase64(params.identityAnchor.canonicalImage);
  
  try {
    const response = await ai.models.generateContent({
      model: params.generationSettings.model || GEMINI_IMAGE_MODEL,
      config: { 
        systemInstruction: MASTER_SYSTEM_GOVERNOR,
        imageConfig: { aspectRatio: "1:1" } 
      },
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: headshotB64 } },
          { text: formattedPrompt + "\n\nAvoid: " + negatives.join(", ") }
        ]
      }
    });

    const imgPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    
    if (!imgPart?.inlineData?.data) {
      if (response.candidates?.[0]?.finishReason === 'SAFETY') {
        throw new Error("Generation blocked by safety filters. Try a different outfit or scene.");
      }
      throw new Error("The image model did not return a valid result. Please try again.");
    }

    const b64 = imgPart.inlineData.data;
    const blob = await fetch(`data:image/jpeg;base64,${b64}`).then(r => r.blob());
    const score = await verifyIdentityShort(blob, params.identityAnchor);

    // Gaze Stability Verification
    const gazeResult = await analyzeGazeStability(blob);
    
    // Retry Strategy Ladder
    if (retryCount < 2) {
      let shouldRetry = false;
      let newParams = { ...params };

      // Case 1: Gaze Stability Failure
      if (!gazeResult.passed) {
        console.warn(`Gaze stability failed (Attempt ${retryCount + 1}):`, gazeResult.metrics.reasons);
        newParams.gazeStrength = retryCount === 0 ? 'strong' : 'maximum';
        shouldRetry = true;
      }

      // Case 2: Identity Violation (if score is very low)
      if (score.faceSimilarity < 0.6) {
        console.warn(`Identity similarity too low (Attempt ${retryCount + 1}):`, score.faceSimilarity);
        // We can't really "strengthen" identity lock beyond what it is, 
        // but we can try to reduce scene complexity or increase anatomical focus to help the model
        newParams.anatomicalConstraintLevel = 'high';
        shouldRetry = true;
      }

      // Case 3: Progressively strengthen pose and anatomy on any retry
      if (shouldRetry) {
        if (retryCount === 0) {
          newParams.poseStrength = 'strong';
          newParams.anatomicalConstraintLevel = 'high';
        } else {
          newParams.poseStrength = 'absolute';
          newParams.anatomicalConstraintLevel = 'strict';
        }
        
        console.log(`Triggering Retry Ladder (Attempt ${retryCount + 1}) with strengthened constraints.`);
        return generateWithIdentityLock(newParams, retryCount + 1);
      }
    }

    return {
      imageUrl: `data:image/jpeg;base64,${b64}`,
      prompt: formattedPrompt, // Return formatted prompt
      negatives: negatives,
      consistency: score,
      plan: variantPlan,
      gazeMetrics: gazeResult.metrics
    };
  } catch (e: any) {
    throw e;
  }
};
