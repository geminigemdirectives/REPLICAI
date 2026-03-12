
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  ComposerState, AttributeKey, Gender, 
  SelectionMode, AttributeSelectionState, MirrorDetectionContext, RealismProfileKey, 
  IdentityBasePacket, CameraMode, OutputResolution, IdentityAnchor, MediaItem,
  SceneDNA, PropInteraction,
  HairColorSelection, SizeTier, MirrorShotPhonePresetId, LightingProfile, SceneDensity, GrainProfile, GenerationModel
} from '../types';
import { addMediaItem } from '../services/mediaStore';
import { generateWithIdentityLock } from '../services/composerGenerate.service';
import { resolveBodyDefaults } from '../services/bodyResolver.service';
import { saveState, loadState } from '../services/persistence.service';

const INITIAL_ATTRIBUTE_STATE: AttributeSelectionState = {
  mode: 'auto',
  customText: '',
  isFromSlot1: false
};

const INITIAL_LIGHTING: LightingProfile = {
  timeOfDay: 'midday',
  lightSourceType: 'natural_sun',
  lightingMood: 'neutral',
  lightDirection: '45_degree_side',
  lightHardness: 'medium',
  colorTemperature: 'neutral'
};

const INITIAL_SCENE_DENSITY: SceneDensity = {
  backgroundDepth: 'medium',
  environmentalActivity: 'light_activity',
  foregroundElements: 'none'
};

const INITIAL_GRAIN_PROFILE: GrainProfile = {
  amount: 'low',
  type: 'digital_sensor',
  response: 'luminance_weighted',
  scale: 'fine'
};

const INITIAL_COMPOSER_STATE: ComposerState = {
  identityBase: null,
  identityPacket: null,
  identityAttributes: undefined,
  isFaceGatePassed: false,
  fullLockRef: { isLocked: false },
  attributes: {
    camera: { ...INITIAL_ATTRIBUTE_STATE },
    pose: { ...INITIAL_ATTRIBUTE_STATE },
    outfit: { ...INITIAL_ATTRIBUTE_STATE },
    body: { ...INITIAL_ATTRIBUTE_STATE },
    hair: { ...INITIAL_ATTRIBUTE_STATE },
    expression: { ...INITIAL_ATTRIBUTE_STATE },
    scene: { ...INITIAL_ATTRIBUTE_STATE },
  },
  bodyOverrides: { bust: 'auto', glutes: 'auto' },
  lighting: INITIAL_LIGHTING,
  sceneDensity: INITIAL_SCENE_DENSITY,
  grain: INITIAL_GRAIN_PROFILE,
  flags: {
    nsfwEnabled: false,
    showPrompt: true,
    generationSettings: { outputResolution: 'auto', model: 'gemini-2.5-flash-image' },
    mirrorShotPhone: 'iphone16_black'
  },
  realismProfile: 'PH',
  mirrorAuto: { enabled: true, hasMirrorScene: false, isMirrorShot: false, cameraMode: 'THIRD_PERSON', confidence: 0, evidence: [] },
  cameraModeOverride: 'AUTO',
  sceneDNA: null,
  propInteraction: null,
  lastPrompt: null,
  lastNegatives: [],
  outputImageUrl: null,
  isGenerating: false,
  generationError: null,
  batchProgress: null,
  batchSettings: { batchSize: 1, enableMicroVariation: true },
  isExtractingSlot1: false,
  extractingAttribute: null
};

interface ReplicaiContextType extends ComposerState {
  setIdentityBaseFiles: (files: File[]) => void;
  addIdentityBaseFiles: (files: File[]) => void;
  removeIdentityBaseFile: (index: number) => void;
  setIdentityPacket: (packet: IdentityBasePacket) => void;
  setGender: (gender: Gender) => void;
  setRealismProfile: (profile: RealismProfileKey) => void;
  setAttributeMode: (key: AttributeKey, mode: SelectionMode) => void;
  setAttributePresetCategory: (key: AttributeKey, catId: string) => void;
  setAttributePresetOption: (key: AttributeKey, optId: string) => void;
  setAttributeCustomText: (key: AttributeKey, text: string) => void;
  setHairColor: (color: HairColorSelection | null) => void;
  updateAttributeState: (key: AttributeKey, update: Partial<AttributeSelectionState>) => void;
  updateFullLockRef: (file: File | null, expanded: Partial<Record<AttributeKey, string>>) => void;
  clearFullLockRef: () => void;
  setMirrorDetection: (ctx: Partial<MirrorDetectionContext>) => void;
  setCameraModeOverride: (mode: CameraMode | 'AUTO') => void;
  setOutputResolution: (res: OutputResolution) => void;
  setGenerationModel: (model: GenerationModel) => void;
  setBodyOverride: (key: 'bust' | 'glutes', size: SizeTier) => void;
  setMirrorShotPhone: (phoneId: MirrorShotPhonePresetId) => void;
  setBatchSize: (size: number) => void;
  setEnableMicroVariation: (enabled: boolean) => void;
  setIsExtractingSlot1: (val: boolean) => void;
  setExtractingAttribute: (val: AttributeKey | null) => void;
  setLighting: (lighting: Partial<LightingProfile>) => void;
  setSceneDensity: (density: Partial<SceneDensity>) => void;
  setGrain: (grain: Partial<GrainProfile>) => void;
  setSceneDNA: (dna: SceneDNA | null) => void;
  setPropInteraction: (interaction: PropInteraction | null) => void;
  triggerBatchGeneration: () => Promise<void>;
  resolveAndSetBodyDefaults: (idFiles: File[], slot1File?: File) => Promise<void>;
  isLoaded: boolean;
}

const ReplicaiContext = createContext<ReplicaiContextType | undefined>(undefined);

export const ReplicaiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ComposerState>(INITIAL_COMPOSER_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state on mount
  useEffect(() => {
    const load = async () => {
      try {
        const persistedState = await loadState();
        if (persistedState) {
          setState(persistedState);
        }
      } catch (e) {
        console.error("Failed to load persisted state", e);
      } finally {
        setIsLoaded(true);
      }
    };
    load();
  }, []);

  // Save state on change (debounced)
  useEffect(() => {
    if (!isLoaded) return;
    const timer = setTimeout(() => {
      saveState(state);
    }, 1000);
    return () => clearTimeout(timer);
  }, [state, isLoaded]);

  const setIdentityBaseFiles = (files: File[]) => {
    setState(prev => ({
      ...prev,
      identityBase: { 
        files, 
        dataUrls: files.map(f => URL.createObjectURL(f)),
        gender: prev.identityBase?.gender
      },
      identityPacket: null, 
      identityAttributes: undefined,
      isFaceGatePassed: false
    }));
  };

  const addIdentityBaseFiles = (files: File[]) => {
    setState(prev => {
      const newFiles = [...(prev.identityBase?.files || []), ...files].slice(0, 10);
      return {
        ...prev,
        identityBase: {
          files: newFiles,
          dataUrls: newFiles.map(f => URL.createObjectURL(f)),
          gender: prev.identityBase?.gender
        },
        identityPacket: null,
        identityAttributes: undefined,
        isFaceGatePassed: false
      };
    });
  };

  const removeIdentityBaseFile = (index: number) => {
    setState(prev => {
      if (!prev.identityBase) return prev;
      const newFiles = prev.identityBase.files.filter((_, i) => i !== index);
      return {
        ...prev,
        identityBase: {
          files: newFiles,
          dataUrls: newFiles.map(f => URL.createObjectURL(f)),
          gender: prev.identityBase.gender
        },
        identityPacket: null,
        identityAttributes: undefined,
        isFaceGatePassed: false
      };
    });
  };

  const setIdentityPacket = (packet: IdentityBasePacket) => {
    setState(prev => ({ 
      ...prev, 
      identityPacket: packet,
      identityAttributes: packet.extractedAttributes, 
      isFaceGatePassed: packet.meta.faceDetected,
      identityBase: prev.identityBase ? { ...prev.identityBase, anchor: packet.anchor } : null
    }));
  };

  const setGender = (gender: Gender) => {
    setState(prev => ({
      ...prev,
      identityBase: prev.identityBase ? { ...prev.identityBase, gender } : null
    }));
  };

  const setRealismProfile = (realismProfile: RealismProfileKey) => {
    setState(prev => ({ ...prev, realismProfile }));
  };

  const setAttributeMode = (key: AttributeKey, mode: SelectionMode) => {
    setState(prev => ({
      ...prev,
      attributes: { ...prev.attributes, [key]: { ...prev.attributes[key], mode } }
    }));
  };

  const setAttributePresetCategory = (key: AttributeKey, presetCategoryId: string) => {
    setState(prev => ({
      ...prev,
      attributes: { ...prev.attributes, [key]: { ...prev.attributes[key], presetCategoryId } }
    }));
  };

  const setAttributePresetOption = (key: AttributeKey, presetOptionId: string) => {
    setState(prev => ({
      ...prev,
      attributes: { ...prev.attributes, [key]: { ...prev.attributes[key], presetOptionId } }
    }));
  };

  const setAttributeCustomText = (key: AttributeKey, customText: string) => {
    setState(prev => ({
      ...prev,
      attributes: { ...prev.attributes, [key]: { ...prev.attributes[key], customText } }
    }));
  };

  const setHairColor = (hairColor: HairColorSelection | null) => {
    setState(prev => ({
      ...prev,
      attributes: { ...prev.attributes, hair: { ...prev.attributes.hair, hairColor } }
    }));
  };

  const updateAttributeState = (key: AttributeKey, update: Partial<AttributeSelectionState>) => {
    setState(prev => ({
      ...prev,
      attributes: { ...prev.attributes, [key]: { ...prev.attributes[key], ...update } }
    }));
  };

  const updateFullLockRef = (file: File | null, expanded: Partial<Record<AttributeKey, string>>) => {
    setState(prev => ({
      ...prev,
      fullLockRef: { 
        file: file || undefined, 
        dataUrl: file ? URL.createObjectURL(file) : undefined, 
        expanded,
        isLocked: true
      }
    }));
  };

  const clearFullLockRef = () => {
    setState(prev => ({ ...prev, fullLockRef: { isLocked: false } }));
  };

  const setMirrorDetection = (ctx: Partial<MirrorDetectionContext>) => {
    setState(prev => ({ ...prev, mirrorAuto: { ...prev.mirrorAuto, ...ctx } }));
  };

  const setCameraModeOverride = (cameraModeOverride: CameraMode | 'AUTO') => {
    setState(prev => ({ ...prev, cameraModeOverride }));
  };

  const setOutputResolution = (outputResolution: OutputResolution) => {
    setState(prev => ({
      ...prev,
      flags: { ...prev.flags, generationSettings: { ...prev.flags.generationSettings, outputResolution } }
    }));
  };

  const setGenerationModel = (model: GenerationModel) => {
    setState(prev => ({
      ...prev,
      flags: { ...prev.flags, generationSettings: { ...prev.flags.generationSettings, model } }
    }));
  };

  const setBodyOverride = (key: 'bust' | 'glutes', size: SizeTier) => {
    setState(prev => ({
      ...prev,
      bodyOverrides: { ...prev.bodyOverrides, [key]: size }
    }));
  };

  const setMirrorShotPhone = (mirrorShotPhone: MirrorShotPhonePresetId) => {
    setState(prev => ({
      ...prev,
      flags: { ...prev.flags, mirrorShotPhone }
    }));
  };

  const setBatchSize = (batchSize: number) => {
    setState(prev => ({
      ...prev,
      batchSettings: { ...prev.batchSettings, batchSize }
    }));
  };

  const setEnableMicroVariation = (enableMicroVariation: boolean) => {
    setState(prev => ({
      ...prev,
      batchSettings: { ...prev.batchSettings, enableMicroVariation }
    }));
  };

  const setIsExtractingSlot1 = (isExtractingSlot1: boolean) => {
    setState(prev => ({ ...prev, isExtractingSlot1 }));
  };

  const setExtractingAttribute = (extractingAttribute: AttributeKey | null) => {
    setState(prev => ({ ...prev, extractingAttribute }));
  };

  const setLighting = (lighting: Partial<LightingProfile>) => {
    setState(prev => ({ ...prev, lighting: { ...prev.lighting, ...lighting } }));
  };

  const setSceneDensity = (sceneDensity: Partial<SceneDensity>) => {
    setState(prev => ({ ...prev, sceneDensity: { ...prev.sceneDensity, ...sceneDensity } }));
  };

  const setGrain = (grain: Partial<GrainProfile>) => {
    setState(prev => ({ ...prev, grain: { ...prev.grain, ...grain } }));
  };

  const setSceneDNA = (sceneDNA: SceneDNA | null) => {
    setState(prev => ({ ...prev, sceneDNA }));
  };

  const setPropInteraction = (propInteraction: PropInteraction | null) => {
    setState(prev => ({ ...prev, propInteraction }));
  };

  const resolveAndSetBodyDefaults = async (idFiles: File[], slot1File?: File) => {
    try {
      const primaryFile = idFiles[0];
      const result = await resolveBodyDefaults({ identityBaseFile: primaryFile, slot1File });
      setState(prev => ({
        ...prev,
        identityBase: prev.identityBase ? {
          ...prev.identityBase,
          bodyBase: {
            file: slot1File || primaryFile,
            dataUrl: URL.createObjectURL(slot1File || primaryFile),
            rawText: result.source,
            expandedText: result.bodyPrompt,
            createdAtISO: new Date().toISOString()
          }
        } : null
      }));
    } catch (e) {
      console.error("Failed to resolve body defaults", e);
    }
  };

  const triggerBatchGeneration = async () => {
    if (!state.identityBase?.anchor || !state.identityPacket) return;
    
    setState(prev => ({ ...prev, isGenerating: true, generationError: null, batchProgress: { current: 0, total: state.batchSettings.batchSize } }));

    try {
      for (let i = 0; i < state.batchSettings.batchSize; i++) {
        setState(prev => ({ ...prev, batchProgress: { current: i + 1, total: state.batchSettings.batchSize } }));
        
        const result = await generateWithIdentityLock({
          identityAnchor: state.identityBase.anchor!,
          identityPacket: state.identityPacket,
          identityAttributes: state.identityAttributes,
          realismProfile: state.realismProfile,
          attributes: state.attributes,
          lighting: state.lighting,
          sceneDensity: state.sceneDensity,
          grain: state.grain,
          mirrorAuto: state.mirrorAuto,
          cameraModeOverride: state.cameraModeOverride,
          fullLockRef: state.fullLockRef,
          seed: Date.now() + i,
          variantIndex: i,
          generationSettings: state.flags.generationSettings,
          bodyOverrides: state.bodyOverrides,
          mirrorShotPhone: state.flags.mirrorShotPhone,
          sceneDNA: state.sceneDNA,
          propInteraction: state.propInteraction
        });

        const item: MediaItem = {
          id: crypto.randomUUID(),
          createdAtISO: new Date().toISOString(),
          src: result.imageUrl,
          prompt: result.prompt,
          negatives: result.negatives,
          meta: { consistencyScore: result.consistency, status: 'success' }
        };

        await addMediaItem(item);
        setState(prev => ({ ...prev, outputImageUrl: item.src, lastPrompt: item.prompt || "", lastNegatives: item.negatives || [] }));
      }
      setState(prev => ({ ...prev, isGenerating: false, batchProgress: null }));
    } catch (e: any) {
      setState(prev => ({ ...prev, isGenerating: false, batchProgress: null, generationError: e.message }));
    }
  };

  return (
    <ReplicaiContext.Provider value={{
      ...state,
      setIdentityBaseFiles,
      addIdentityBaseFiles,
      removeIdentityBaseFile,
      setIdentityPacket,
      setGender,
      setRealismProfile,
      setAttributeMode,
      setAttributePresetCategory,
      setAttributePresetOption,
      setAttributeCustomText,
      setHairColor,
      updateAttributeState,
      updateFullLockRef,
      clearFullLockRef,
      setMirrorDetection,
      setCameraModeOverride,
      setOutputResolution,
      setGenerationModel,
      setBodyOverride,
      setMirrorShotPhone,
      setBatchSize,
      setEnableMicroVariation,
      setIsExtractingSlot1,
      setExtractingAttribute,
      setLighting,
      setSceneDensity,
      setGrain,
      setSceneDNA,
      setPropInteraction,
      triggerBatchGeneration,
      resolveAndSetBodyDefaults,
      isLoaded
    }}>
      {children}
    </ReplicaiContext.Provider>
  );
};

export const useReplicai = () => {
  const context = useContext(ReplicaiContext);
  if (!context) throw new Error("useReplicai must be used within ReplicaiProvider");
  return context;
};