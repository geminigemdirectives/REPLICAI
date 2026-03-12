import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { FaceMetrics, BiometricGeometry, BiometricAsymmetry, BiometricRatios, BiometricAngles, BiometricDepth, FaceBiometricRatios, AsymmetryProfile } from "../types";
import { extractSkinSignature } from './skinAnalysis.service';
import { withSilencedTFLite } from '../utils/silenceTFLite';

// Standard MediaPipe Face Mesh Indices
const LANDMARKS = {
  LEFT_EYE: [33, 133], // Inner, Outer
  RIGHT_EYE: [362, 263], // Inner, Outer
  NOSE_TIP: 1,
  NOSE_BOTTOM: 2,
  NOSE_TOP: 168,
  MOUTH_LEFT: 61,
  MOUTH_RIGHT: 291,
  UPPER_LIP_TOP: 0,
  LOWER_LIP_BOTTOM: 17,
  CHIN: 152,
  LEFT_BROW: [70, 107], // Inner, Outer
  RIGHT_BROW: [336, 300], // Inner, Outer
  LEFT_CHEEK: 234,
  RIGHT_CHEEK: 454,
  FOREHEAD: 10
};

let faceLandmarker: FaceLandmarker | null = null;

const initializeFaceLandmarker = async () => {
  if (faceLandmarker) return faceLandmarker;
  
  const vision = await withSilencedTFLite(async () => {
    return await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm"
    );
  });
  
  faceLandmarker = await withSilencedTFLite(async () => {
    return await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
        delegate: "CPU"
      },
      outputFaceBlendshapes: true,
      runningMode: "IMAGE",
      numFaces: 1
    });
  });
  
  return faceLandmarker;
};

const distance = (p1: any, p2: any) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2));
};

const loadImage = (file: File | Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export const extractBiometrics = async (file: File | Blob): Promise<FaceMetrics | null> => {
  try {
    const imageElement = await loadImage(file);
    const landmarker = await initializeFaceLandmarker();
    if (!landmarker) return null;

    const result = landmarker.detect(imageElement);
    
    if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
      console.warn("No face detected by MediaPipe");
      return null;
    }

    const landmarks = result.faceLandmarks[0]; // 478 points (468 mesh + 10 iris)
    const blendshapes = result.faceBlendshapes?.[0];

    // --- 1. Compute Structural Metrics ---

    // Points
    const leftEyeInner = landmarks[LANDMARKS.LEFT_EYE[0]];
    const leftEyeOuter = landmarks[LANDMARKS.LEFT_EYE[1]];
    const rightEyeInner = landmarks[LANDMARKS.RIGHT_EYE[0]];
    const rightEyeOuter = landmarks[LANDMARKS.RIGHT_EYE[1]];
    const noseTip = landmarks[LANDMARKS.NOSE_TIP];
    const noseTop = landmarks[LANDMARKS.NOSE_TOP];
    const mouthLeft = landmarks[LANDMARKS.MOUTH_LEFT];
    const mouthRight = landmarks[LANDMARKS.MOUTH_RIGHT];
    const chin = landmarks[LANDMARKS.CHIN];
    const leftCheek = landmarks[LANDMARKS.LEFT_CHEEK];
    const rightCheek = landmarks[LANDMARKS.RIGHT_CHEEK];
    const forehead = landmarks[LANDMARKS.FOREHEAD];

    // Horizontal Ratios
    const interEyeDist = distance(leftEyeInner, rightEyeInner);
    const faceWidth = distance(leftCheek, rightCheek);
    const noseWidth = distance(landmarks[LANDMARKS.NOSE_BOTTOM], landmarks[LANDMARKS.NOSE_TOP]); // Approximate vertical for now, need horizontal
    // Better nose width: alar base (approx 49, 279)
    const noseWidthReal = distance(landmarks[49], landmarks[279]);
    const mouthWidth = distance(mouthLeft, mouthRight);

    // Vertical Ratios
    const browToNose = distance(landmarks[107], noseTip); // Approx
    const noseToChin = distance(noseTip, chin);
    const lipThickness = distance(landmarks[LANDMARKS.UPPER_LIP_TOP], landmarks[LANDMARKS.LOWER_LIP_BOTTOM]);
    const faceHeight = distance(forehead, chin);

    const ratios: BiometricRatios = {
      interEyeDistance: interEyeDist / faceWidth,
      faceWidth: faceWidth, // Normalized later? Keep raw for now or ratio to height
      noseWidth: noseWidthReal / faceWidth,
      mouthWidth: mouthWidth / faceWidth,
      browToNose: browToNose / faceHeight,
      noseToChin: noseToChin / faceHeight,
      lipThickness: lipThickness / mouthWidth
    };

    // Angles
    const eyeTilt = Math.atan2(rightEyeOuter.y - leftEyeOuter.y, rightEyeOuter.x - leftEyeOuter.x) * (180 / Math.PI);
    const jawAngle = 0; // Complex to calc from single points, placeholder
    const nasolabialAngle = 0; // Placeholder

    const angles: BiometricAngles = {
      eyeTilt,
      jawAngle,
      nasolabialAngle
    };

    // Depth (Z-axis relative to face plane)
    // MediaPipe Z is relative to the face center of mass, scaled by width
    const noseTipProtrusion = -noseTip.z; // Negative Z is closer to camera in MediaPipe
    const chinProtrusion = -chin.z;
    const browRidgeDepth = -(landmarks[107].z + landmarks[336].z) / 2;

    const depth: BiometricDepth = {
      noseTipProtrusion,
      chinProtrusion,
      browRidgeDepth
    };

    const geometry: BiometricGeometry = {
      ratios,
      angles,
      depth
    };

    // --- 2. Asymmetry ---
    const eyeHeightDelta = Math.abs((leftEyeOuter.y - leftEyeInner.y) - (rightEyeOuter.y - rightEyeInner.y));
    const nostrilSizeDelta = 0; // Hard to get from mesh without segmentation
    const lipCornerAngleDelta = Math.abs(mouthLeft.y - mouthRight.y); // Simple skew
    const jawSkew = Math.abs(leftCheek.x - rightCheek.x); // Very rough proxy

    const asymmetry: BiometricAsymmetry = {
      eyeHeightDelta,
      nostrilSizeDelta,
      lipCornerAngleDelta,
      jawSkew
    };

    // --- 3. Skin Surface Analysis (New Layer) ---
    // Convert landmarks to simple array for skin analysis
    const simpleLandmarks = landmarks.map(l => [l.x, l.y, l.z]);
    const skinSignature = await extractSkinSignature(imageElement, simpleLandmarks);

    // --- 4. Legacy Support ---
    const legacyRatios: FaceBiometricRatios = {
      interocularDistance: interEyeDist,
      eyeToNoseRatio: distance(leftEyeInner, noseTip) / interEyeDist,
      noseBridgeLength: distance(noseTop, noseTip),
      noseWidth: noseWidthReal,
      mouthWidth: mouthWidth,
      jawWidth: faceWidth, // Approx
      faceHeight: faceHeight,
      faceHeightToWidth: faceHeight / faceWidth,
      eyeAspectRatioL: 0.3, // Placeholder
      eyeAspectRatioR: 0.3
    };

    const legacyAsymmetry: AsymmetryProfile = {
      eyeOpennessDelta: 0,
      browHeightDelta: 0,
      nostrilFlareDelta: 0,
      jawlineDeviation: 0,
      mouthCornerDelta: 0
    };

    // Pose
    const matrix = result.facialTransformationMatrixes?.[0];
    // Extract yaw/pitch/roll from matrix if available, or estimate from landmarks
    // MediaPipe matrix is 4x4
    let yaw = 0, pitch = 0, roll = 0;
    // Simple estimation
    yaw = (noseTip.x - (leftCheek.x + rightCheek.x) / 2) * 100; // Rough
    pitch = (noseTip.y - (forehead.y + chin.y) / 2) * 100;
    roll = eyeTilt;

    return {
      version: "v2.0-optimized",
      confidence: result.faceBlendshapes?.[0]?.categories?.[0]?.score || 0.9,
      landmarks: simpleLandmarks,
      ratios: legacyRatios,
      asymmetryProfile: legacyAsymmetry,
      geometry,
      asymmetry,
      skinSurfaceSignature: skinSignature || undefined,
      curvatureSignatures: {
        jawline: [],
        browRidge: [],
        nasolabialCurve: [],
        eyelidFold: []
      },
      facialPlaneAngles: { yaw, pitch, roll },
      pose: {
        yawDeg: yaw,
        pitchDeg: pitch,
        rollDeg: roll,
        confidence: 0.9
      },
      faceCoverageRatio: 0.5, // Placeholder
      quality: {
        warnings: []
      },
      createdAtIso: new Date().toISOString()
    };

  } catch (e) {
    console.error("MediaPipe Extraction Failed:", e);
    return null;
  }
};
