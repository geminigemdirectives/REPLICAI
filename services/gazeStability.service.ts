import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { GazeStabilityResult, GazeMetrics, GazeVector } from "../types";
import { withSilencedTFLite } from '../utils/silenceTFLite';

// Singleton instance
let faceLandmarker: FaceLandmarker | null = null;

const BLENDSHAPE_THRESHOLD = 0.15; // Max allowed difference in blendshape values
const CATCHLIGHT_ANGLE_THRESHOLD = 30; // degrees
const CATCHLIGHT_DISTANCE_THRESHOLD = 0.15; // relative to eye width

export const initializeGazeModel = async () => {
  if (faceLandmarker) return;
  
  try {
    const filesetResolver = await withSilencedTFLite(async () => {
      return await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm"
      );
    });
    faceLandmarker = await withSilencedTFLite(async () => {
      return await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "CPU"
        },
        outputFaceBlendshapes: true,
        runningMode: "IMAGE",
        numFaces: 1
      });
    });
    console.log("Gaze Stability Model Initialized");
  } catch (error) {
    console.error("Failed to initialize Gaze Stability Model:", error);
  }
};

const getBrightestPoint = (imageData: ImageData, x: number, y: number, radius: number): { x: number, y: number } | null => {
  let maxBrightness = -1;
  let bestX = x;
  let bestY = y;
  
  const startX = Math.max(0, Math.floor(x - radius));
  const endX = Math.min(imageData.width, Math.ceil(x + radius));
  const startY = Math.max(0, Math.floor(y - radius));
  const endY = Math.min(imageData.height, Math.ceil(y + radius));

  for (let i = startX; i < endX; i++) {
    for (let j = startY; j < endY; j++) {
      const idx = (j * imageData.width + i) * 4;
      // Perceived brightness
      const brightness = 0.299 * imageData.data[idx] + 0.587 * imageData.data[idx + 1] + 0.114 * imageData.data[idx + 2];
      if (brightness > maxBrightness) {
        maxBrightness = brightness;
        bestX = i;
        bestY = j;
      }
    }
  }
  
  return maxBrightness > 200 ? { x: bestX, y: bestY } : null; // Threshold for catchlight
};

const calculateVectorAngle = (v1: {x: number, y: number}, v2: {x: number, y: number}): number => {
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  if (mag1 === 0 || mag2 === 0) return 0;
  // Clamp for floating point errors
  const cosTheta = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return Math.acos(cosTheta) * (180 / Math.PI);
};

export const analyzeGazeStability = async (imageBlob: Blob): Promise<GazeStabilityResult> => {
  if (!faceLandmarker) {
    await initializeGazeModel();
    if (!faceLandmarker) {
       return {
         passed: true,
         metrics: {
           leftGaze: { x: 0, y: 0, z: 0 },
           rightGaze: { x: 0, y: 0, z: 0 },
           gazeDeltaAngle: 0,
           irisVerticalOffsetDiff: 0,
           scleraExposureDiff: 0,
           catchlightPositionDelta: 0,
           isStable: true,
           reasons: ["Model not initialized"]
         },
         score: 1
       };
    }
  }

  const imageBitmap = await createImageBitmap(imageBlob);
  const canvas = document.createElement('canvas');
  canvas.width = imageBitmap.width;
  canvas.height = imageBitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Canvas context failed");
  ctx.drawImage(imageBitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const result = faceLandmarker.detect(canvas);
  
  if (!result.faceLandmarks || result.faceLandmarks.length === 0 || !result.faceBlendshapes || result.faceBlendshapes.length === 0) {
    return {
      passed: false,
      metrics: {
        leftGaze: { x: 0, y: 0, z: 0 },
        rightGaze: { x: 0, y: 0, z: 0 },
        gazeDeltaAngle: 0,
        irisVerticalOffsetDiff: 0,
        scleraExposureDiff: 0,
        catchlightPositionDelta: 0,
        isStable: false,
        reasons: ["No face detected"]
      },
      score: 0
    };
  }

  const landmarks = result.faceLandmarks[0];
  const blendshapes = result.faceBlendshapes[0].categories;
  
  const getScore = (name: string) => blendshapes.find(b => b.categoryName === name)?.score || 0;

  // --- 1. HEAD-RELATIVE GAZE (Using Blendshapes) ---
  // Positive = Look Left (screen left, subject right), Negative = Look Right
  const leftEyeHorizontal = getScore('eyeLookOutLeft') - getScore('eyeLookInLeft'); 
  const rightEyeHorizontal = getScore('eyeLookInRight') - getScore('eyeLookOutRight');
  
  // Positive = Look Up, Negative = Look Down
  const leftEyeVertical = getScore('eyeLookUpLeft') - getScore('eyeLookDownLeft');
  const rightEyeVertical = getScore('eyeLookUpRight') - getScore('eyeLookDownRight');

  // Delta calculation (Difference in gaze direction)
  const horizontalDelta = Math.abs(leftEyeHorizontal - rightEyeHorizontal);
  const verticalDelta = Math.abs(leftEyeVertical - rightEyeVertical);
  
  // Map blendshape delta to approximate degrees (heuristic: 1.0 blendshape ~= 45 degrees)
  const gazeDeltaAngle = Math.sqrt(horizontalDelta**2 + verticalDelta**2) * 45;

  // --- 2. IRIS VERTICAL OFFSET (Redundant check with landmarks for robustness) ---
  const LEFT_IRIS_CENTER = 468;
  const RIGHT_IRIS_CENTER = 473;
  const LEFT_EYE_TOP = 159;
  const LEFT_EYE_BOTTOM = 145;
  const RIGHT_EYE_TOP = 386;
  const RIGHT_EYE_BOTTOM = 374;

  const leftIris = landmarks[LEFT_IRIS_CENTER];
  const rightIris = landmarks[RIGHT_IRIS_CENTER];
  
  const leftEyeHeight = Math.abs(landmarks[LEFT_EYE_TOP].y - landmarks[LEFT_EYE_BOTTOM].y);
  const rightEyeHeight = Math.abs(landmarks[RIGHT_EYE_TOP].y - landmarks[RIGHT_EYE_BOTTOM].y);
  
  const leftIrisRelY = (leftIris.y - landmarks[LEFT_EYE_TOP].y) / leftEyeHeight;
  const rightIrisRelY = (rightIris.y - landmarks[RIGHT_EYE_TOP].y) / rightEyeHeight;
  
  const irisVerticalOffsetDiff = Math.abs(leftIrisRelY - rightIrisRelY);

  // --- 3. CATCHLIGHT CONSISTENCY ---
  const LEFT_EYE_CORNERS = [33, 133];
  const leftEyeWidth = Math.abs(landmarks[LEFT_EYE_CORNERS[1]].x - landmarks[LEFT_EYE_CORNERS[0]].x);
  
  const leftIrisPx = { x: leftIris.x * canvas.width, y: leftIris.y * canvas.height };
  const rightIrisPx = { x: rightIris.x * canvas.width, y: rightIris.y * canvas.height };
  
  const searchRadius = (leftEyeWidth * canvas.width) * 0.25; // Increased radius
  
  const leftCatchlight = getBrightestPoint(imageData, leftIrisPx.x, leftIrisPx.y, searchRadius);
  const rightCatchlight = getBrightestPoint(imageData, rightIrisPx.x, rightIrisPx.y, searchRadius);
  
  let catchlightPositionDelta = 0;
  let catchlightAngleDelta = 0;
  let catchlightReasons: string[] = [];

  if (leftCatchlight && rightCatchlight) {
    const leftRel = { x: leftCatchlight.x - leftIrisPx.x, y: leftCatchlight.y - leftIrisPx.y };
    const rightRel = { x: rightCatchlight.x - rightIrisPx.x, y: rightCatchlight.y - rightIrisPx.y };
    
    // Check 1: Relative Position Distance
    const dist = Math.sqrt(Math.pow(leftRel.x - rightRel.x, 2) + Math.pow(leftRel.y - rightRel.y, 2));
    catchlightPositionDelta = dist / (leftEyeWidth * canvas.width);
    
    // Check 2: Angular Quadrant Consistency
    // Only check angle if catchlight is far enough from center to have a distinct direction
    const minOffset = 2; // pixels
    if (Math.hypot(leftRel.x, leftRel.y) > minOffset && Math.hypot(rightRel.x, rightRel.y) > minOffset) {
        catchlightAngleDelta = calculateVectorAngle(leftRel, rightRel);
    }
  }

  // --- 4. STABILITY EVALUATION ---
  const reasons: string[] = [];
  
  // Blendshape-based Gaze Check
  if (horizontalDelta > BLENDSHAPE_THRESHOLD) {
      reasons.push(`Horizontal gaze mismatch: ${(horizontalDelta * 100).toFixed(0)}%`);
  }
  if (verticalDelta > BLENDSHAPE_THRESHOLD) {
      reasons.push(`Vertical gaze mismatch: ${(verticalDelta * 100).toFixed(0)}%`);
  }
  
  // Landmark-based Vertical Check (Backup)
  if (irisVerticalOffsetDiff > 0.1) {
      reasons.push(`Iris vertical misalignment: ${(irisVerticalOffsetDiff * 100).toFixed(0)}%`);
  }
  
  // Catchlight Check
  if (catchlightPositionDelta > CATCHLIGHT_DISTANCE_THRESHOLD) {
      reasons.push(`Catchlight position mismatch: ${(catchlightPositionDelta * 100).toFixed(0)}%`);
  }
  if (catchlightAngleDelta > CATCHLIGHT_ANGLE_THRESHOLD) {
      reasons.push(`Catchlight angle mismatch: ${catchlightAngleDelta.toFixed(0)}°`);
  }

  const passed = reasons.length === 0;
  const score = Math.max(0, 1 - (reasons.length * 0.2));

  return {
    passed,
    metrics: {
      leftGaze: { x: leftEyeHorizontal, y: leftEyeVertical, z: 0 }, // Using blendshape values as proxy vector
      rightGaze: { x: rightEyeHorizontal, y: rightEyeVertical, z: 0 },
      gazeDeltaAngle, // Estimated degrees
      irisVerticalOffsetDiff,
      scleraExposureDiff: horizontalDelta, // Reusing horizontal delta as proxy for sclera asymmetry
      catchlightPositionDelta,
      catchlightAngleDelta,
      isStable: passed,
      reasons
    },
    score
  };
};
