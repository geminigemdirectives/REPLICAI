

import { BodyMetrics, BodyResolutionResult } from '../types';
import { computeBodyMetrics } from './bodyMetrics.service';
import { buildDetailedBodyPrompt, getFallbackBodyPrompt } from './bodyDescription.service';

/**
 * Resolves the Body Default prompt and metrics by cascading through:
 * 1. Identity Base (if full body or strong upper body)
 * 2. Slot 1 Reference (if available)
 * 3. System Fallback
 */
export const resolveBodyDefaults = async (params: {
  identityBaseFile: File;
  slot1File?: File;
}): Promise<BodyResolutionResult> => {
  
  // 1. Try Identity Base
  const idMetrics = await computeBodyMetrics(params.identityBaseFile);
  
  if (idMetrics) {
    // Acceptance Criteria: Full Body OR (Upper Body Only with High Confidence)
    const isGoodEnough = idMetrics.flags.fullBodyVisible || (idMetrics.flags.upperBodyOnly && idMetrics.confidence >= 0.65);
    
    if (isGoodEnough) {
      return {
        source: "BODY_BASE",
        metrics: idMetrics,
        bodyPrompt: buildDetailedBodyPrompt(idMetrics)
      };
    }
  }

  // 2. Try Slot 1 (if Identity Base failed or wasn't good enough)
  if (params.slot1File) {
    const slot1Metrics = await computeBodyMetrics(params.slot1File);
    
    if (slot1Metrics && slot1Metrics.confidence >= 0.55) {
      return {
        source: "SLOT1_ATTRIBUTE_REF",
        metrics: slot1Metrics,
        bodyPrompt: buildDetailedBodyPrompt(slot1Metrics)
      };
    }
  }

  // 3. Fallback
  // If we have "bad" metrics from ID Base, we might still want to keep them for info, but use fallback prompt
  return {
    source: "FALLBACK",
    metrics: idMetrics || undefined, // Keep the poor metrics just for UI display if they exist
    bodyPrompt: getFallbackBodyPrompt()
  };
};