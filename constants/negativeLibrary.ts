
export const BASE_QUALITY_NEGATIVES = [
  "text", "watermark", "logo", "copyright", 
  "bad anatomy", "extra limbs", "extra fingers", "deformed hands", "missing fingers",
  "blurry", "low quality", "lowres", "pixelated",
  "cartoon", "anime", "illustration", "painting", "3d render", "clay", "doll"
];

export const FACE_DRIFT_NEGATIVES = [
  "face distortion", "identity drift", "different person", "wrong face",
  "changed facial features", "reshaped nose", "different eyes",
  "plastic surgery look", "makeup mismatch"
];

export const EYE_ARTIFACT_NEGATIVES = [
  "asymmetrical eyes", "crossed eyes", "strabismus", 
  "deformed iris", "pupil issues", "empty eyes", "zombie eyes"
];

export const TEETH_ARTIFACT_NEGATIVES = [
  "bad teeth", "extra teeth", "duplicated teeth", "deformed teeth",
  "melted teeth", "fused teeth", "rotten teeth", "braces", 
  "gum issues", "exposed gums", "large gums"
];

export const HAIR_DRIFT_NEGATIVES = [
  "hair color change", "different hairstyle", "dyed hair", "wig", 
  "unnatural hair texture", "floating hair", "cut off hair"
];

export const PHONE_ARTIFACT_NEGATIVES = [
  "invisible phone", "floating phone", "phone inside hand", 
  "missing camera lens", "old phone", "broken phone", "curved phone"
];

export const TEXT_WATERMARK_NEGATIVES = [
  "watermark", "username", "signature", "date stamp"
];
