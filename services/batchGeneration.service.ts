
import { OrchestratorParams, BatchGenerationParams, MediaItem, IdentityBasePacket } from '../types';
import { generateWithIdentityLock } from './composerGenerate.service';
import { createVariantPlans } from './variantPlan.service';

export const generateBatchImages = async (
  params: {
    identityBaseFile: File;
    identityPacket: IdentityBasePacket | null;
    orchestratorParams: OrchestratorParams;
    batchSettings: BatchGenerationParams;
  },
  callbacks: {
    onProgress: (current: number, total: number) => void;
    onItemComplete: (item: MediaItem) => void;
    onFailure: (error: string) => void;
  }
): Promise<void> => {
  const { identityPacket, orchestratorParams, batchSettings } = params;
  const { batchSize, enableMicroVariation } = batchSettings;

  // 1. Create Variant Plans
  const variations = createVariantPlans(batchSize, enableMicroVariation);
  const batchId = crypto.randomUUID();
  const baseSeed = orchestratorParams.seed || Date.now();

  // 2. Execution Loop
  for (let i = 0; i < batchSize; i++) {
    callbacks.onProgress(i + 1, batchSize);

    // Update params for this variant
    const variantParams: OrchestratorParams = {
      ...orchestratorParams,
      seed: baseSeed + i, // Deterministic seed shift
      variantIndex: i,
      batchMicroVariation: variations[i]
    };

    try {
      // Execute Generation
      const result = await generateWithIdentityLock(variantParams);

      // Construct Result Item
      const item: MediaItem = {
        id: crypto.randomUUID(),
        createdAtISO: new Date().toISOString(),
        src: result.imageUrl,
        prompt: result.prompt,
        negatives: result.negatives,
        meta: {
          seed: variantParams.seed,
          variantPlan: result.plan,
          consistencyScore: result.consistency,
          batchId,
          variantIndex: i,
          status: 'success',
          gazeMetrics: result.gazeMetrics
        }
      };

      // Notify Completion
      callbacks.onItemComplete(item);

    } catch (err: any) {
      console.error(`Batch item ${i} failed:`, err);
      callbacks.onFailure(`Item ${i + 1} failed: ${err.message}`);
    }
  }
};
