
export type Gender = 'female' | 'male' | null;

export type SelectionMode = "auto" | "preset" | "custom";
export type AttributeKey = "camera" | "pose" | "outfit" | "body" | "hair" | "expression" | "scene";
export type RealismProfileKey = 'PH' | 'JP' | 'KR' | 'US';

export type CameraMode = 'SELFIE_POV' | 'MIRROR_SHOT' | 'THIRD_PERSON';

export type OutputResolution = 'auto' | 1024 | 1536 | 2048;

export type GenerationModel = 'gemini-2.5-flash-image' | 'gemini-3.1-flash-image-preview' | 'imagen-3.0-generate-001';

export interface GenerationSettings {
  outputResolution: OutputResolution;
  model: GenerationModel;
}

export type SizeTier = 'auto' | 'xs' | 's' | 'm' | 'l' | 'xl';

export interface BodyOverrides {
  bust: SizeTier;
  glutes: SizeTier;
}

export interface LightingProfile {
  timeOfDay: "sunrise" | "morning" | "midday" | "afternoon" | "golden_hour" | "sunset" | "night";
  lightSourceType: "natural_sun" | "window_light" | "overhead_indoor" | "neon_practical" | "street_lights" | "studio_key_fill" | "mixed_sources";
  lightingMood: "bright" | "neutral" | "moody" | "dramatic" | "soft" | "low_contrast" | "high_contrast";
  lightDirection: "front" | "45_degree_side" | "side" | "backlight" | "rim_light" | "top_down";
  lightHardness: "soft_diffused" | "medium" | "hard_specular";
  colorTemperature: "warm" | "neutral" | "cool";
}

export interface SceneDensity {
  backgroundDepth: "shallow" | "medium" | "deep";
  environmentalActivity: "static" | "light_activity" | "moderate_activity";
  foregroundElements: "none" | "light" | "moderate";
}

export interface GrainProfile {
  amount: "off" | "very_low" | "low" | "medium" | "high";
  type: "digital_sensor" | "fine_film" | "cinematic_film" | "mixed";
  response: "luminance_weighted" | "shadow_weighted" | "uniform";
  scale: "fine" | "medium" | "coarse";
}

export type AttributeLocks = Partial<Record<AttributeKey, string>>;
export type AttributeLocksRaw = AttributeLocks;
export type AttributeLocksExpanded = Partial<Record<AttributeKey, string>>;

export interface AttributeExpansionResult {
  raw: AttributeLocksRaw;
  expanded: AttributeLocksExpanded;
  meta: {
    model: string;
    createdAt: string;
  };
}

export interface HairColorSelection {
  category: "natural" | "dyed";
  value: string;
}

export interface AttributeSelectionState {
  mode: SelectionMode;
  presetCategoryId?: string;
  presetOptionId?: string;
  customText: string;
  refImage?: { file?: File; dataUrl?: string; };
  isFromSlot1?: boolean;
  hairColor?: HairColorSelection | null;
}

export interface FullLockRefState {
  file?: File;
  dataUrl?: string;
  expanded?: Partial<Record<AttributeKey, string>>;
  isLocked?: boolean;
}

export interface MirrorDetectionContext {
  enabled: boolean;
  hasMirrorScene: boolean;
  isMirrorShot: boolean;
  cameraMode: CameraMode;
  confidence: number;
  evidence: string[];
}

export interface MirrorShotPhoneOption {
  id: string;
  label: string;
  prompt: string;
}

export type MirrorShotPhonePresetId = string;

// --- BIOMETRIC IDENTITY TYPES ---

export interface HairDescriptor {
  silhouette: string;
  volume: 'thin' | 'average' | 'voluminous';
  density: string;
  partingLine: 'none' | 'left' | 'center' | 'right' | 'irregular';
  lengthCategory: 'short' | 'medium' | 'long' | 'extreme';
}

export interface FaceBiometricRatios {
  interocularDistance: number;
  eyeToNoseRatio: number;
  noseBridgeLength: number;
  noseWidth: number;
  mouthWidth: number;
  jawWidth: number;
  faceHeight: number;
  faceHeightToWidth: number;
  eyeAspectRatioL: number;
  eyeAspectRatioR: number;
}

export interface AsymmetryProfile {
  eyeOpennessDelta: number;
  browHeightDelta: number;
  nostrilFlareDelta: number;
  jawlineDeviation: number;
  mouthCornerDelta: number;
}

export interface CurvatureSignatures {
  jawline: number[];
  browRidge: number[];
  nasolabialCurve: number[];
  eyelidFold: number[];
}

export interface BiometricRatios {
  // Horizontal
  interEyeDistance: number;
  faceWidth: number;
  noseWidth: number;
  mouthWidth: number;
  // Vertical
  browToNose: number;
  noseToChin: number;
  lipThickness: number;
}

export interface BiometricAngles {
  eyeTilt: number;
  jawAngle: number;
  nasolabialAngle: number;
}

export interface BiometricDepth {
  noseTipProtrusion: number;
  chinProtrusion: number;
  browRidgeDepth: number;
}

export interface BiometricAsymmetry {
  eyeHeightDelta: number;
  nostrilSizeDelta: number;
  lipCornerAngleDelta: number;
  jawSkew: number;
}

export interface BiometricGeometry {
  ratios: BiometricRatios;
  angles: BiometricAngles;
  depth: BiometricDepth;
}

export interface PoreProfile {
  densityTZone: number;
  densityCheeks: number;
  sizeVariance: number;
  visibilityStrength: number;
  highlightBreakupFactor: number;
}

export interface TextureProfile {
  microBumpIntensity: number;
  surfaceMicroRoughness: number;
  microShadowFrequency: number;
}

export interface ToneIrregularity {
  rednessNasalArea: number;
  underEyeDarknessRatio: number;
  cheekPinknessDelta: number;
  jawYellowShift: number;
  mouthCornerShadowStrength: number;
  overallToneVariance: number;
}

export interface BlemishProfile {
  minorBlemishCountEstimate: number; // Normalized 0-1 (0 = 0, 1 = 20+)
  blemishSizeAverage: number;
  hyperpigmentationSpotRatio: number;
}

export interface FineLineProfile {
  underEyeLineVisibility: number;
  foreheadMicroCreaseIntensity: number;
  lipVerticalLineStrength: number;
  nasolabialSoftFoldDepth: number;
}

export interface MicroHairProfile {
  facialFuzzDensity: number;
  strayHairFrequencyNearHairline: number;
  eyebrowDensityVariance: number;
}

export interface SkinConfidence {
  surfaceStability: number;
  extractionConfidence: number;
}

export interface SkinSurfaceSignature {
  poreProfile: PoreProfile;
  textureProfile: TextureProfile;
  toneIrregularity: ToneIrregularity;
  blemishProfile: BlemishProfile;
  fineLineProfile: FineLineProfile;
  microHairProfile: MicroHairProfile;
  confidence: SkinConfidence;
}

export interface FaceMetrics {
  version: "v2.0-optimized";
  confidence: number;
  landmarks: number[][]; 
  // Legacy support
  ratios: FaceBiometricRatios;
  asymmetryProfile: AsymmetryProfile;
  
  // New Optimized Structure
  geometry: BiometricGeometry;
  asymmetry: BiometricAsymmetry;
  skinSurfaceSignature?: SkinSurfaceSignature;
  
  curvatureSignatures: CurvatureSignatures;
  facialPlaneAngles: { yaw: number; pitch: number; roll: number };
  pose: {
    yawDeg: number;
    pitchDeg: number;
    rollDeg: number;
    confidence: number;
  };
  faceCoverageRatio: number;
  quality: {
    warnings: string[];
  };
  createdAtIso: string;
  hairDescriptor?: HairDescriptor;
}

export interface IdentityFrame {
  id: string;
  originalImage: File;
  enhancedImage: Blob;
  faceMetrics: FaceMetrics;
  embeddingVector?: number[];
}

export interface PoseCoverageProfile {
  yawRange: [number, number];
  pitchRange: [number, number];
  rollRange: [number, number];
  coverageScore: number;
}

export interface IdentityAnchor {
  id: string;
  metrics: FaceMetrics; // Aggregated/Mean metrics
  gender: Gender;
  immutableText: string;
  canonicalImage: Blob;
  frames: IdentityFrame[];
  poseCoverageProfile: PoseCoverageProfile;
  confidenceScore: number;
  masterEmbedding?: number[];
  multiViewRefs?: {
    front?: Blob;
    angle45?: Blob;
    profile?: Blob;
  };
}

export interface IdentityBasePacket {
  anchor: IdentityAnchor;
  extractedAttributes?: Partial<Record<AttributeKey, string>>;
  meta: {
    faceDetected: boolean;
    warnings: string[];
    poseCoverage: number;
  };
}

export interface MediaItem {
  id: string;
  createdAtISO: string;
  src: string;
  prompt?: string;
  negatives?: string[];
  meta?: {
    seed?: number;
    consistencyScore?: ConsistencyScore;
    status?: "success" | "error" | "pending";
    errorMessage?: string;
    variantPlan?: any;
    batchId?: string;
    variantIndex?: number;
    gazeMetrics?: GazeMetrics;
    renderContract?: RenderContract;
  };
}

export interface ConsistencyScore {
  faceSimilarity: number;
  biometricDrift: number;
  overall: number;
  flags: {
    drift: boolean;
    identityViolation: boolean;
    eyesIssue?: boolean;
    teethIssue?: boolean;
    hairDrift?: boolean;
  };
  reasons: string[];
}

export interface PoseDNA {
  skeleton: string;
  semantic: string;
  confidence: number;
  orientation: {
    head: string;
    torso: string;
    shoulders: string;
    hips: string;
  };
  articulation: {
    elbows: string;
    wrists: string;
    knees: string;
  };
  balance: string;
}

export interface CameraDNA {
  shotType: string;
  distance: string;
  height: string;
  yaw: string;
  pitch: string;
  roll: string;
  lens: {
    type: string;
    focalLength: string;
    compression: string;
    dof: string;
    focusTarget: string;
  };
}

export interface LightingDNA {
  primaryDirection: string;
  secondaryFill: string;
  softness: string;
  intensity: string;
  shadowBehavior: string;
  highlightDistribution: string;
  colorTemperature: string;
  environmentalBounce: string;
}

export interface EnvironmentDNA {
  category: string;
  backgroundStructure: string;
  foregroundLayers: string;
  depth: string;
  layout: string;
  terrain: string;
  density: string;
}

export interface SceneDNA {
  environment: EnvironmentDNA;
  camera: CameraDNA;
  lighting: LightingDNA;
  pose: PoseDNA;
  composition: string;
  spatialDepth: string;
  atmosphere: string;
}

export interface PropInteraction {
  gripType: string;
  fingerPlacement: string;
  contactSurfaces: string;
  objectOrientation: {
    toHand: string;
    toCamera: string;
  };
}

export interface ComposerState {
  identityBase: { 
    files: File[]; 
    dataUrls: string[]; 
    gender?: Gender; 
    anchor?: IdentityAnchor;
  } | null;
  identityPacket: IdentityBasePacket | null;
  identityAttributes?: Partial<Record<AttributeKey, string>>;
  isFaceGatePassed: boolean;
  fullLockRef: FullLockRefState;
  attributes: Record<AttributeKey, AttributeSelectionState>;
  bodyOverrides: BodyOverrides;
  lighting: LightingProfile;
  sceneDensity: SceneDensity;
  grain: GrainProfile;
  flags: {
    nsfwEnabled: boolean;
    showPrompt: boolean;
    generationSettings: GenerationSettings;
    mirrorShotPhone?: string;
  };
  realismProfile: RealismProfileKey;
  mirrorAuto: MirrorDetectionContext;
  cameraModeOverride: CameraMode | 'AUTO';
  sceneDNA: SceneDNA | null;
  propInteraction: PropInteraction | null;
  lastPrompt: string | null;
  lastNegatives: string[];
  outputImageUrl: string | null;
  isGenerating: boolean;
  generationError: string | null;
  batchProgress: { current: number; total: number } | null;
  batchSettings: BatchGenerationParams;
  isExtractingSlot1: boolean;
  extractingAttribute: null | AttributeKey;
}

export interface OrchestratorParams {
  identityAnchor: IdentityAnchor;
  identityPacket?: IdentityBasePacket | null;
  identityAttributes?: Partial<Record<AttributeKey, string>>;
  realismProfile: RealismProfileKey;
  attributes: Record<AttributeKey, AttributeSelectionState>;
  lighting: LightingProfile;
  sceneDensity: SceneDensity;
  grain: GrainProfile;
  mirrorAuto: MirrorDetectionContext;
  cameraModeOverride: CameraMode | 'AUTO';
  fullLockRef?: FullLockRefState;
  sceneDNA?: SceneDNA | null;
  propInteraction?: PropInteraction | null;
  seed?: number;
  variantIndex?: number;
  generationSettings: GenerationSettings;
  bodyOverrides?: BodyOverrides;
  mirrorShotPhone?: string;
  batchMicroVariation?: string;
  gazeStrength?: 'normal' | 'strong' | 'maximum';
  poseStrength?: 'normal' | 'strong' | 'absolute';
  anatomicalConstraintLevel?: 'standard' | 'high' | 'strict';
}

export interface OrchestratorResult {
  finalPrompt: string;
  negatives: string[];
  debugBlocks: Record<string, string>;
  variantPlan: any;
}

export interface BatchGenerationParams {
  batchSize: number;
  enableMicroVariation: boolean;
}

// --- MISSING TYPES ADDED ---

export interface IdentityAnchorV2Result {
  anchorText: string;
  defaultHairPrompt: string;
  confidenceSummary: {
    faceCoverage: number;
    featureConfidence: number;
  };
  faceCropImage?: Blob;
}

export interface IdentityBaseAnalysis {
  faceGate: { passed: boolean; reasons: string[]; faceCount: number };
  genderSuggestion: { suggested: Gender; confidence: number; method: string };
  identityAnchor: string;
  bodyDefaults?: { bodyShape: string; skinTone: string; notes: string };
  meta: { model: string; createdAtISO: string; version: string };
}

export interface PromptIntegrityReport {
  ok: boolean;
  missingHeaders: string[];
  violations: string[];
}

export interface BodyMetrics {
  version: string;
  source: string;
  confidence: number;
  fullBodyVisible: boolean;
  upperBodyOnly: boolean;
  occlusionLevel: string;
  ratios: {
    shoulderToHip?: number;
    torsoToLeg?: number;
    armToTorso?: number;
    shoulderToHeightProxy?: number;
  };
  flags: {
    fullBodyVisible: boolean;
    upperBodyOnly: boolean;
    lowerBodyMissing: boolean;
    heavyOcclusion: boolean;
  };
  warnings: string[];
  createdAtIso: string;
}

export interface BodyResolutionResult {
  source: string;
  metrics?: BodyMetrics;
  bodyPrompt: string;
}

export interface ExpandBodyDetailsInput {
  rawText: string;
  source: string;
  gender: Gender;
}

export interface ExpandedBodyDetailsResult {
  expandedText: string;
  debug: {
    source: string;
    confidenceNotes: string;
  };
}

export interface FaceIdentityLock {
  id: string;
  landmark_ratios: Record<string, number>;
  angular_constraints: Record<string, any>;
  curvature_signatures: {
    jaw: number[];
    cheek: number[];
    chin: number[];
  };
  symmetry_bounds: {
    eyeOpenness: number;
    mouthCorner: number;
  };
  tolerance: number;
}

export interface IdentityFixReport {
  faceMetrics: {
    aligned: boolean;
    poseValid: boolean;
    confidence: number;
  };
  bodyMetrics: {
    croppedCorrectly: boolean;
    proportionsValid: boolean;
  };
  hairMetrics: {
    colorMatch: boolean;
    styleConsistent: boolean;
  };
  attributeFixesApplied: string[];
  lightingAdjusted: boolean;
  artifactsRemoved: boolean;
  explanation: string;
}

export interface IdentityEnhanceReport {
  faceAligned: boolean;
  hairPreserved: boolean;
  bodyRemoved: boolean;
  backgroundNeutral: boolean;
  lightingAdjusted: boolean;
  artifactsRemoved: boolean;
}

export interface IdentityFixResult {
  fixedBlob: Blob;
  report: IdentityFixReport;
  enhanceReport?: IdentityEnhanceReport;
}

// --- GAZE STABILITY TYPES ---

export interface GazeVector {
  x: number;
  y: number;
  z: number;
}

export interface GazeMetrics {
  leftGaze: GazeVector;
  rightGaze: GazeVector;
  gazeDeltaAngle: number; // Angular difference in degrees
  irisVerticalOffsetDiff: number; // Difference in vertical position relative to eye height
  scleraExposureDiff: number; // Difference in visible sclera area
  catchlightPositionDelta: number; // Distance between catchlight relative positions
  catchlightAngleDelta?: number; // Angular difference in catchlight direction
  isStable: boolean;
  reasons: string[];
}

export interface GazeStabilityResult {
  passed: boolean;
  metrics: GazeMetrics;
  score: number; // 0-1 stability score
}

// --- PROMPT NORMALIZATION TYPES ---

export interface StructuredPrompt {
  subject: string;
  identity: string;
  pose: string;
  camera: string;
  lighting: string;
  environment: string;
  realism: string;
  style: string;
  constraints: string;
  negatives: string;
}

export interface Conflict {
  type: 'lighting' | 'camera' | 'pose' | 'realism' | 'style';
  description: string;
  detectedTerms: string[];
  severity: 'warning' | 'critical';
}

export interface Resolution {
  conflictType: string;
  action: 'remove' | 'replace' | 'prioritize' | 'merge';
  original: string;
  resolved: string;
  reason: string;
}

export interface RenderContract {
  rawPrompt: string;
  normalizedPrompt: string;
  structuredPrompt: StructuredPrompt;
  detectedConflicts: Conflict[];
  appliedResolutions: Resolution[];
  compressionRatio: number;
  version: string;
  modelOptimizedFor?: string;
}