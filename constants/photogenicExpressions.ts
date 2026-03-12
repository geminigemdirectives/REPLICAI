
export const PHOTOGENIC_EXPRESSIONS = [
  "neutral relaxed expression",
  "soft closed-lip smile",
  "gentle natural smile",
  "confident subtle smirk",
  "slight lip press with relaxed eyes",
  "playful flirty gaze with soft smile",
  "fierce confident gaze with relaxed mouth",
  "slight closed-eye smile",
];

export const BANNED_EXPRESSION_KEYWORDS: Record<string, string> = {
  "surprised": "soft neutral expression",
  "shocked": "calm composed face",
  "screaming": "intense confident gaze",
  "gasping": "parted lips subtle expression",
  "jaw drop": "relaxed mouth",
  "open mouth": "slight relaxed smile",
  "wide grin": "gentle natural smile",
  "big smile": "soft natural smile",
  "cartoon": "photorealistic expression",
  "scared": "neutral expression"
};

export const SMILE_TRIGGERS = [
  "smile", "grin", "smirk", "laugh", "happy", "joy", "teeth"
];
