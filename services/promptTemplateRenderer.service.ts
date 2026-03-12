import { FinalPromptContract } from '../schemas/finalPromptContract';

export function renderPrompt(contract: FinalPromptContract): string {
  return `
ASPECT RATIO
${contract.aspectRatio}

IMAGE DIRECTIVE
${contract.imageDirective}

CONCEPT
${contract.concept}

SUBJECT
${contract.subject.description}

Body
${contract.subject.body ?? "N/A"}

Hair
${contract.subject.hair ?? "N/A"}

Outfit
${contract.subject.outfit ?? "N/A"}

Makeup
${contract.subject.makeup ?? "N/A"}

Skin
${contract.subject.skin ?? "N/A"}

Hands
${contract.subject.hands ?? "N/A"}

ENVIRONMENT

Setting
${contract.environment.setting ?? "N/A"}

Foreground
${contract.environment.foreground ?? "N/A"}

Midground
${contract.environment.midground ?? "N/A"}

Background
${contract.environment.background ?? "N/A"}

Sky
${contract.environment.sky ?? "N/A"}

Atmosphere
${contract.environment.atmosphere ?? "N/A"}

LIGHTING
${contract.lighting ?? "N/A"}

CAMERA
Model: ${contract.camera?.model ?? "N/A"}
Lens: ${contract.camera?.lens ?? "N/A"}
Aperture: ${contract.camera?.aperture ?? "N/A"}
Shutter: ${contract.camera?.shutter ?? "N/A"}
ISO: ${contract.camera?.iso ?? "N/A"}

COLOR GRADING
${contract.colorGrading ?? "N/A"}

NEGATIVE PROMPT
${contract.negativePrompt ?? "N/A"}
`.trim();
}
