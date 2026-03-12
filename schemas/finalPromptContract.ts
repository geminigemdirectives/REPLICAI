export interface FinalPromptContract {
  aspectRatio: string;
  imageDirective: string;
  concept: string;
  subject: {
    description: string;
    body?: string;
    hair?: string;
    outfit?: string;
    makeup?: string;
    accessories?: string;
    skin?: string;
    hands?: string;
  };
  environment: {
    setting?: string;
    foreground?: string;
    midground?: string;
    background?: string;
    sky?: string;
    atmosphere?: string;
  };
  lighting?: string;
  camera?: {
    model?: string;
    lens?: string;
    aperture?: string;
    shutter?: string;
    iso?: string;
  };
  colorGrading?: string;
  negativePrompt?: string;
}
