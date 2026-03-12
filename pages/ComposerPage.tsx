import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useReplicai } from '../context/ReplicaiContext';
import { extractFullAttributes, extractSingleAttribute } from '../services/attributeExtractor.service';
import { analyzeMirrorMode } from '../services/mirrorAnalyzer';
import { buildPromptContract } from '../services/promptContractBuilder.service';
import { renderPrompt } from '../services/promptTemplateRenderer.service';
import { formatPrompt } from '../services/promptFormatter.service';
import { fileToBase64 } from '../services/gemini';
import { AttributeKey, SelectionMode, RealismProfileKey, AttributeSelectionState, CameraMode, OutputResolution, SizeTier, MirrorShotPhonePresetId, LightingProfile, SceneDensity, GrainProfile, MirrorDetectionContext, GenerationModel } from '../types';
import { REALISM_PROFILES } from '../data/realismProfiles';
import { PRESETS, HAIR_COLORS } from '../data/presets';
import { MIRROR_SHOT_PHONE_OPTIONS } from '../constants/mirrorShotPhones';
import NeonArcLoader from '../components/NeonArcLoader';
import ImageActions from '../components/ImageActions';
import ImagePreviewModal from '../components/ImagePreviewModal';
import AttributeSelectionModal from '../components/AttributeSelectionModal';

// Strict Display Order
const DISPLAY_ORDER: AttributeKey[] = [
  'camera', 'pose', 'outfit', 'body', 'hair', 'expression', 'scene'
];

const ATTR_LABELS: Record<AttributeKey, string> = {
  camera: "CAMERA / ANGLE",
  pose: "POSE / ACTION",
  outfit: "OUTFIT",
  body: "BODY DETAILS",
  hair: "HAIR",
  expression: "FACIAL EXPRESSION",
  scene: "SCENE / LOCATION"
};

const SIZE_TIERS: SizeTier[] = ['auto', 'xs', 's', 'm', 'l', 'xl'];

const ComposerPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    // Identity
    identityBase, isFaceGatePassed, identityPacket, identityAttributes,
    // Composer State
    attributes, fullLockRef, realismProfile, mirrorAuto, cameraModeOverride, flags,
    lighting, sceneDensity, grain, sceneDNA, propInteraction,
    // Batch State
    batchSettings, batchProgress,
    // Body Overrides
    bodyOverrides,
    // UI State
    isExtractingSlot1, extractingAttribute,
    // Generation
    isGenerating, outputImageUrl,
    // Actions
    setRealismProfile, setAttributeMode, 
    setAttributePresetCategory, setAttributePresetOption, 
    setAttributeCustomText, setHairColor,
    updateAttributeState, updateFullLockRef, clearFullLockRef, 
    setMirrorDetection, setCameraModeOverride, setOutputResolution, setGenerationModel,
    setBodyOverride, setMirrorShotPhone,
    setBatchSize, setEnableMicroVariation,
    setIsExtractingSlot1, setExtractingAttribute, triggerBatchGeneration,
    resolveAndSetBodyDefaults, setLighting, setSceneDensity, setGrain,
    setSceneDNA, setPropInteraction,
    isLoaded
  } = useReplicai();

  const [showPromptPreview, setShowPromptPreview] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isDraggingSlot1, setIsDraggingSlot1] = useState(false);

  // Modal State for Slot 1 Confirmation
  const [selectionModal, setSelectionModal] = useState<{
    isOpen: boolean;
    attributes: Partial<Record<AttributeKey, string>> | null;
    sceneDNA: any | null;
    propInteraction: any | null;
    mirrorResult: MirrorDetectionContext | null;
    slot1File: File | null;
  }>({
    isOpen: false,
    attributes: null,
    sceneDNA: null,
    propInteraction: null,
    mirrorResult: null,
    slot1File: null
  });

  const [isProcessingSelection, setIsProcessingSelection] = useState(false);

  // Memoize enhanced preview
  const enhancedIdentityPreview = useMemo(() => {
    if (identityPacket?.anchor?.canonicalImage) {
      return URL.createObjectURL(identityPacket.anchor.canonicalImage);
    }
    return null;
  }, [identityPacket]);

  const processSlot1File = useCallback(async (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    try {
      setIsExtractingSlot1(true);
      const base64 = await fileToBase64(file);
      
      const [mirrorResult, extractedData] = await Promise.all([
        analyzeMirrorMode({ imageBase64: base64, mimeType: file.type }),
        extractFullAttributes(file, { gender: identityBase?.gender || 'female' })
      ]);

      // Instead of applying immediately, open confirmation modal
      setSelectionModal({
        isOpen: true,
        attributes: extractedData.attributes,
        sceneDNA: extractedData.sceneDNA,
        propInteraction: extractedData.propInteraction,
        mirrorResult: mirrorResult,
        slot1File: file
      });

    } catch (err) {
      console.error("Slot 1 Upload processing failed:", err);
    } finally {
      setIsExtractingSlot1(false);
    }
  }, [identityBase, setIsExtractingSlot1]);

  const handleSelectionConfirm = async (selectedKeys: AttributeKey[], includeDNA: boolean, includeProp: boolean) => {
    const { attributes: extracted, sceneDNA: extractedDNA, propInteraction: extractedProp, mirrorResult, slot1File } = selectionModal;
    if (!extracted || !mirrorResult) return;

    setIsProcessingSelection(true);
    try {
      // 1. Filter extracted attributes
      const filteredExtracted: Partial<Record<AttributeKey, string>> = {};
      selectedKeys.forEach(key => {
        if (extracted[key]) filteredExtracted[key] = extracted[key];
      });

      // 2. Update Full Lock Ref (Global Lock state)
      updateFullLockRef(null, filteredExtracted);

      // 3. Update DNA and Prop Interaction
      if (includeDNA && extractedDNA) {
        setSceneDNA(extractedDNA);
      }
      if (includeProp && extractedProp) {
        setPropInteraction(extractedProp);
      }

      // 4. Update Individual Attribute States
      selectedKeys.forEach(key => {
        if (extracted[key]) {
          updateAttributeState(key, {
            mode: 'custom',
            customText: extracted[key],
            isFromSlot1: true,
            refImage: undefined
          });
        }
      });

      // 5. Apply Mirror Detection
      setMirrorDetection(mirrorResult);

      // 6. Apply Body Defaults if 'body' was selected
      if (slot1File && selectedKeys.includes('body')) {
        if (identityBase?.files) {
          await resolveAndSetBodyDefaults(identityBase.files, slot1File);
        }
      }

      // Close Modal
      setSelectionModal({ isOpen: false, attributes: null, sceneDNA: null, propInteraction: null, mirrorResult: null, slot1File: null });
    } catch (error) {
      console.error("Failed to apply selection:", error);
    } finally {
      setIsProcessingSelection(false);
    }
  };

  const handleSelectionCancel = () => {
    setSelectionModal({ isOpen: false, attributes: null, mirrorResult: null, slot1File: null });
  };

  const processSingleAttributeFile = useCallback(async (key: AttributeKey, file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    try {
      setExtractingAttribute(key);
      const text = await extractSingleAttribute(file, key, { gender: identityBase?.gender || 'female' });
      
      // REPLICAI V2.5 Policy: Clear individual attribute reference images after extraction.
      setAttributeCustomText(key, text);
      setAttributeMode(key, 'custom');
      updateAttributeState(key, { isFromSlot1: false, refImage: undefined });
    } catch (err) {
      console.error(err);
    } finally {
      setExtractingAttribute(null);
    }
  }, [identityBase, setExtractingAttribute, updateAttributeState, setAttributeCustomText, setAttributeMode]);

  // Global Paste Handler for Slot 1
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isGenerating || isExtractingSlot1 || selectionModal.isOpen) return;
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) processSlot1File(file);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [processSlot1File, isGenerating, isExtractingSlot1, selectionModal.isOpen]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <NeonArcLoader size="md" />
      </div>
    );
  }

  if (!identityBase || !identityBase.files || identityBase.files.length === 0 || !isFaceGatePassed || !identityBase.anchor) {
    return <div className="p-10 text-center text-white">Identity Missing. Please restart setup.</div>;
  }

  // --- HANDLERS ---

  const handleSlot1Upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSlot1File(e.target.files[0]);
    }
  };

  const onDragOverSlot1 = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingSlot1(true);
  };
  const onDragLeaveSlot1 = () => setIsDraggingSlot1(false);
  const onDropSlot1 = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingSlot1(false);
    if (isExtractingSlot1) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSlot1File(e.dataTransfer.files[0]);
    }
  };

  const handleSingleAttributeUpload = (key: AttributeKey, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSingleAttributeFile(key, e.target.files[0]);
    }
  };

  const onDropSingleAttr = (key: AttributeKey, e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSingleAttributeFile(key, e.dataTransfer.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!identityBase.files || identityBase.files.length === 0) return;
    await triggerBatchGeneration();
  };

  const contractResult = buildPromptContract({
     identityAnchor: identityBase.anchor,
     identityPacket, 
     identityAttributes,
     realismProfile, 
     attributes, 
     lighting,
     sceneDensity, 
     grain,
     mirrorAuto, 
     cameraModeOverride,
     fullLockRef,
     generationSettings: flags.generationSettings,
     batchMicroVariation: (batchSettings.enableMicroVariation && batchSettings.batchSize > 1) ? "[Preview: Micro-Variations Active]" : undefined,
     bodyOverrides,
     mirrorShotPhone: flags.mirrorShotPhone
  });
  const renderedPrompt = renderPrompt(contractResult.contract);
  const finalPromptText = formatPrompt(renderedPrompt);

  const liveOrchestration = {
    finalPrompt: finalPromptText,
    negatives: contractResult.negatives,
    debugBlocks: {
      subject: contractResult.contract.subject.description,
      environment: contractResult.contract.environment.setting,
      lighting: contractResult.contract.lighting,
      camera: contractResult.contract.camera.model
    }
  };

  const hasInvalidPresets = (Object.values(attributes) as AttributeSelectionState[]).some(attr => 
    attr.mode === 'preset' && (!attr.presetCategoryId || !attr.presetOptionId)
  );

  const effectiveCameraMode = cameraModeOverride === 'AUTO' ? mirrorAuto.cameraMode : cameraModeOverride;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row font-sans overflow-hidden">
      <ImagePreviewModal isOpen={!!previewImage} imageSrc={previewImage} onClose={() => setPreviewImage(null)} />

      {/* Attribute Selection Confirmation Modal */}
      <AttributeSelectionModal 
        isOpen={selectionModal.isOpen} 
        attributes={selectionModal.attributes} 
        sceneDNA={selectionModal.sceneDNA}
        propInteraction={selectionModal.propInteraction}
        onConfirm={handleSelectionConfirm}
        onCancel={handleSelectionCancel}
        isProcessing={isProcessingSelection}
      />

      {/* LEFT COLUMN: Controls */}
      <div className="w-full md:w-[500px] flex-shrink-0 border-r border-gray-800 h-screen flex flex-col bg-[#080808] shadow-2xl">
        
        {/* HEADER / NAV */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-black/80 backdrop-blur-md z-30 sticky top-0">
          <h2 className="text-xl font-light tracking-wider flex items-center gap-4">
             <span className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_white]"></span> 
             <button onClick={() => navigate('/composer')} className="font-extrabold text-white hover:text-[var(--neon)] transition-all uppercase tracking-tighter">COMPOSER</button>
             <span className="text-gray-800">/</span>
             <button onClick={() => navigate('/media')} className="text-gray-600 hover:text-white transition-colors uppercase tracking-widest text-[10px] font-bold">MEDIA</button>
          </h2>
          <div className="flex gap-2">
             <div className="text-[10px] bg-gray-900 px-3 py-1 rounded-sm border border-gray-800 text-[var(--neon)] font-bold tracking-widest">
               {identityBase.gender?.toUpperCase()}
             </div>
          </div>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-10 pb-32">
          
          {/* 1. IDENTITY BASE */}
          <section className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-md bg-gray-900/40 border border-gray-800/80 group">
              <div 
                className="relative cursor-pointer group/id"
                onClick={() => setPreviewImage(enhancedIdentityPreview || identityBase.dataUrl || null)}
              >
                {enhancedIdentityPreview ? (
                   <img src={enhancedIdentityPreview} alt="Identity Enhanced" className="w-16 h-16 rounded-md object-cover border border-[var(--neon)] shadow-[0_0_10px_var(--neon-dim)]" />
                ) : (
                   <img src={identityBase.dataUrl} alt="Identity" className="w-16 h-16 rounded-md object-cover border border-gray-700" />
                )}
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[var(--neon)] rounded-full border-2 border-black"></div>
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/id:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                   <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                   </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                 <div className="flex justify-between items-center mb-1">
                    <div className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em]">Identity Base</div>
                    <button 
                      onClick={() => setPreviewImage(enhancedIdentityPreview || identityBase.dataUrl || null)}
                      className="text-[9px] text-[var(--neon)] font-bold uppercase tracking-widest hover:underline"
                    >
                      Preview
                    </button>
                 </div>
                 <div className="text-[9px] text-gray-400 font-mono leading-tight max-h-[4.5em] overflow-hidden">
                   <span className="text-[var(--neon)] font-bold">**IDENTITY SIGNATURE**</span> <br/>
                   {identityBase.anchor.immutableText}
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 block mb-2">Realism Profile</label>
                <select 
                  value={realismProfile}
                  onChange={(e) => setRealismProfile(e.target.value as RealismProfileKey)}
                  className="w-full bg-black border border-gray-800 text-[11px] font-bold text-white p-3 rounded-md focus:border-[var(--neon)] outline-none transition-all appearance-none cursor-pointer"
                >
                  {Object.keys(REALISM_PROFILES).map(k => (
                    <option key={k} value={k}>{REALISM_PROFILES[k as RealismProfileKey].label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 block mb-2">Camera Mode</label>
                <select
                  value={cameraModeOverride}
                  onChange={(e) => setCameraModeOverride(e.target.value as CameraMode | 'AUTO')}
                  className="w-full bg-black border border-gray-800 text-[11px] font-bold text-white p-3 rounded-md focus:border-[var(--neon)] outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="AUTO">Auto (Detected)</option>
                  <option value="SELFIE_POV">Selfie POV</option>
                  <option value="MIRROR_SHOT">Mirror Shot</option>
                  <option value="THIRD_PERSON">Third Person</option>
                </select>
              </div>

              {effectiveCameraMode === 'MIRROR_SHOT' && (
                <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 block mb-2">Mirror Selfie Phone</label>
                  <select 
                    value={flags.mirrorShotPhone || "iphone16_black"}
                    onChange={(e) => setMirrorShotPhone(e.target.value as MirrorShotPhonePresetId)}
                    className="w-full bg-black border border-gray-800 text-[11px] font-bold text-white p-3 rounded-md focus:border-[var(--neon)] outline-none appearance-none cursor-pointer"
                  >
                    {MIRROR_SHOT_PHONE_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="col-span-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 block mb-2">Generation Model</label>
                <select 
                  value={flags.generationSettings.model || 'gemini-2.5-flash-image'}
                  onChange={(e) => setGenerationModel(e.target.value as GenerationModel)}
                  className="w-full bg-black border border-gray-800 text-[11px] font-bold text-white p-3 rounded-md focus:border-[var(--neon)] outline-none appearance-none cursor-pointer"
                >
                  <option value="gemini-2.5-flash-image">Gemini 2.5 Flash Image (Fast)</option>
                  <option value="gemini-3.1-flash-image-preview">Gemini 3.1 Flash Image (High Quality)</option>
                  <option value="imagen-3.0-generate-001">Imagen 3 (Photorealistic)</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 block mb-2">Output Resolution</label>
                <select 
                  value={flags.generationSettings.outputResolution}
                  onChange={(e) => setOutputResolution(e.target.value === 'auto' ? 'auto' : Number(e.target.value) as OutputResolution)}
                  className="w-full bg-black border border-gray-800 text-[11px] font-bold text-white p-3 rounded-md focus:border-[var(--neon)] outline-none appearance-none cursor-pointer"
                >
                  <option value="auto">Auto (Balanced - ~1.5K)</option>
                  <option value="1024">1024x1024 (1K - Fast)</option>
                  <option value="1536">1536x1536 (1.5K)</option>
                  <option value="2048">2048x2048 (2K - High Res)</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 block mb-2">Batch Size</label>
                <select 
                  value={batchSettings.batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value))}
                  className="w-full bg-black border border-gray-800 text-[11px] font-bold text-white p-3 rounded-md focus:border-[var(--neon)] outline-none appearance-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'IMAGE' : 'IMAGES'}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* 2. LIGHTING ENGINE */}
          <section className="space-y-4 border-t border-gray-800 pt-8">
             <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-white">LIGHTING PROFILE</h3>
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest block mb-2">Time of Day</label>
                   <select 
                     value={lighting.timeOfDay}
                     onChange={(e) => setLighting({ timeOfDay: e.target.value as LightingProfile['timeOfDay'] })}
                     className="w-full bg-black border border-gray-800 text-[10px] font-bold text-white p-2.5 rounded-sm outline-none appearance-none cursor-pointer"
                   >
                     <option value="sunrise">Sunrise</option>
                     <option value="morning">Morning</option>
                     <option value="midday">Midday</option>
                     <option value="afternoon">Afternoon</option>
                     <option value="golden_hour">Golden Hour</option>
                     <option value="sunset">Sunset</option>
                     <option value="night">Night</option>
                   </select>
                </div>
                <div>
                   <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest block mb-2">Source Type</label>
                   <select 
                     value={lighting.lightSourceType}
                     onChange={(e) => setLighting({ lightSourceType: e.target.value as LightingProfile['lightSourceType'] })}
                     className="w-full bg-black border border-gray-800 text-[10px] font-bold text-white p-2.5 rounded-sm outline-none appearance-none cursor-pointer"
                   >
                     <option value="natural_sun">Natural Sun</option>
                     <option value="window_light">Window Light</option>
                     <option value="overhead_indoor">Overhead Indoor</option>
                     <option value="neon_practical">Neon Practical</option>
                     <option value="street_lights">Street Lights</option>
                     <option value="studio_key_fill">Studio Key/Fill</option>
                   </select>
                </div>
                <div>
                   <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest block mb-2">Mood</label>
                   <select 
                     value={lighting.lightingMood}
                     onChange={(e) => setLighting({ lightingMood: e.target.value as LightingProfile['lightingMood'] })}
                     className="w-full bg-black border border-gray-800 text-[10px] font-bold text-white p-2.5 rounded-sm outline-none appearance-none cursor-pointer"
                   >
                     <option value="bright">Bright</option>
                     <option value="neutral">Neutral</option>
                     <option value="moody">Moody</option>
                     <option value="dramatic">Dramatic</option>
                     <option value="soft">Soft</option>
                     <option value="high_contrast">High Contrast</option>
                   </select>
                </div>
                <div>
                   <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest block mb-2">Direction</label>
                   <select 
                     value={lighting.lightDirection}
                     onChange={(e) => setLighting({ lightDirection: e.target.value as LightingProfile['lightDirection'] })}
                     className="w-full bg-black border border-gray-800 text-[10px] font-bold text-white p-2.5 rounded-sm outline-none appearance-none cursor-pointer"
                   >
                     <option value="front">Front</option>
                     <option value="45_degree_side">45° Side</option>
                     <option value="side">Side</option>
                     <option value="backlight">Backlight</option>
                     <option value="rim_light">Rim Light</option>
                     <option value="top_down">Top Down</option>
                   </select>
                </div>
             </div>
          </section>

          {/* SCENE DENSITY ENGINE */}
          <section className="space-y-4 border-t border-gray-800 pt-8">
             <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-white">SCENE DENSITY</h3>
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest block mb-2">Background Depth</label>
                   <select 
                     value={sceneDensity.backgroundDepth}
                     onChange={(e) => setSceneDensity({ backgroundDepth: e.target.value as SceneDensity['backgroundDepth'] })}
                     className="w-full bg-black border border-gray-800 text-[10px] font-bold text-white p-2.5 rounded-sm outline-none appearance-none cursor-pointer"
                   >
                     <option value="shallow">Shallow (Bokeh)</option>
                     <option value="medium">Medium</option>
                     <option value="deep">Deep Focus</option>
                   </select>
                </div>
                <div>
                   <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest block mb-2">Ambient Activity</label>
                   <select 
                     value={sceneDensity.environmentalActivity}
                     onChange={(e) => setSceneDensity({ environmentalActivity: e.target.value as SceneDensity['environmentalActivity'] })}
                     className="w-full bg-black border border-gray-800 text-[10px] font-bold text-white p-2.5 rounded-sm outline-none appearance-none cursor-pointer"
                   >
                     <option value="static">Static</option>
                     <option value="light_activity">Light Activity</option>
                     <option value="moderate_activity">Moderate</option>
                   </select>
                </div>
             </div>
          </section>

          {/* GRAIN & NOISE ENGINE */}
          <section className="space-y-4 border-t border-gray-800 pt-8">
             <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-white">GRAIN & NOISE</h3>
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest block mb-2">Amount</label>
                   <select 
                     value={grain.amount}
                     onChange={(e) => setGrain({ amount: e.target.value as GrainProfile['amount'] })}
                     className="w-full bg-black border border-gray-800 text-[10px] font-bold text-white p-2.5 rounded-sm outline-none appearance-none cursor-pointer"
                   >
                     <option value="off">Off</option>
                     <option value="very_low">Very Low</option>
                     <option value="low">Low</option>
                     <option value="medium">Medium</option>
                     <option value="high">High</option>
                   </select>
                </div>
                <div>
                   <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest block mb-2">Type</label>
                   <select 
                     value={grain.type}
                     onChange={(e) => setGrain({ type: e.target.value as GrainProfile['type'] })}
                     className="w-full bg-black border border-gray-800 text-[10px] font-bold text-white p-2.5 rounded-sm outline-none appearance-none cursor-pointer"
                   >
                     <option value="digital_sensor">Digital Sensor</option>
                     <option value="fine_film">Fine Film</option>
                     <option value="cinematic_film">Cinematic Film</option>
                     <option value="mixed">Mixed Stock</option>
                   </select>
                </div>
                <div>
                   <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest block mb-2">Response</label>
                   <select 
                     value={grain.response}
                     onChange={(e) => setGrain({ response: e.target.value as GrainProfile['response'] })}
                     className="w-full bg-black border border-gray-800 text-[10px] font-bold text-white p-2.5 rounded-sm outline-none appearance-none cursor-pointer"
                   >
                     <option value="luminance_weighted">Luminance Weighted</option>
                     <option value="shadow_weighted">Shadow Weighted</option>
                     <option value="uniform">Uniform</option>
                   </select>
                </div>
                <div>
                   <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest block mb-2">Scale</label>
                   <select 
                     value={grain.scale}
                     onChange={(e) => setGrain({ scale: e.target.value as GrainProfile['scale'] })}
                     className="w-full bg-black border border-gray-800 text-[10px] font-bold text-white p-2.5 rounded-sm outline-none appearance-none cursor-pointer"
                   >
                     <option value="fine">Fine</option>
                     <option value="medium">Medium</option>
                     <option value="coarse">Coarse</option>
                   </select>
                </div>
             </div>
          </section>

          {/* 3. SLOT #1: FULL REF LOCK */}
          <section className="space-y-4 border-t border-gray-800 pt-8">
             <div className="flex justify-between items-center">
               <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Reference Slot (Global Lock)</h3>
               {fullLockRef.isLocked && <button onClick={clearFullLockRef} className="text-[9px] text-red-500 font-bold hover:text-red-400 tracking-widest uppercase">CLEAR</button>}
             </div>
             
             <div 
               onDragOver={onDragOverSlot1}
               onDragLeave={onDragLeaveSlot1}
               onDrop={onDropSlot1}
               className={`relative border-2 border-dashed rounded-md p-5 transition-all group ${fullLockRef.isLocked || isDraggingSlot1 ? 'border-[var(--neon)] bg-[var(--neon)]/5' : 'border-gray-800 hover:border-gray-700 bg-black'}`}
             >
                {fullLockRef.isLocked ? (
                   <div className="flex items-center gap-5">
                     <div className="w-14 h-14 flex items-center justify-center bg-[var(--neon-dim)] rounded-md border border-[var(--neon)] shadow-[0_0_10px_var(--neon-dim)]">
                        <span className="text-xl">🔒</span>
                     </div>
                     <div className="flex-1">
                        <div className="text-[10px] text-[var(--neon)] font-black mb-1 tracking-widest uppercase">BIOMETRIC ATTRIBUTE LOCK ACTIVE</div>
                        <div className="text-[8px] text-gray-500 font-bold uppercase tracking-tighter leading-tight">
                           REFERENCE IMAGE ANALYZED AND PURGED. LOCK APPLIED TO SELECTED PARAMETERS.
                        </div>
                     </div>
                   </div>
                ) : (
                  isExtractingSlot1 ? (
                    <div className="flex justify-center py-4">
                      <NeonArcLoader size="sm" />
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2 py-2">
                       <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest group-hover:text-gray-400 transition-colors">Load Reference Image</span>
                       <span className="text-[8px] opacity-40 uppercase tracking-widest">Paste or Drop</span>
                       <input type="file" className="hidden" accept="image/*" onChange={handleSlot1Upload} />
                    </label>
                  )
                )}
             </div>
          </section>

          {/* DNA STATUS PANEL */}
          {(sceneDNA || propInteraction) && (
            <section className="space-y-4 border-t border-gray-800 pt-8 animate-fade-in">
               <div className="flex justify-between items-center">
                 <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Active DNA Locks</h3>
                 <div className="flex gap-2">
                   <button 
                     onClick={() => { setSceneDNA(null); setPropInteraction(null); }}
                     className="text-[9px] text-red-500 font-bold hover:text-red-400 tracking-widest uppercase"
                   >
                     UNLINK ALL
                   </button>
                 </div>
               </div>

               <div className="space-y-2">
                 {sceneDNA && (
                   <div className="p-3 rounded-md bg-blue-500/5 border border-blue-500/30 flex items-center justify-between group">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-sm bg-blue-500/20 flex items-center justify-center text-blue-400">
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                         </svg>
                       </div>
                       <div>
                         <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">SCENE DNA ACTIVE</div>
                         <div className="text-[8px] text-gray-500 uppercase font-bold">Environment • Camera • Lighting • Pose</div>
                       </div>
                     </div>
                     <button 
                       onClick={() => setSceneDNA(null)}
                       className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-gray-500 hover:text-white"
                     >
                       ✕
                     </button>
                   </div>
                 )}

                 {propInteraction && (
                   <div className="p-3 rounded-md bg-purple-500/5 border border-purple-500/30 flex items-center justify-between group">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-sm bg-purple-500/20 flex items-center justify-center text-purple-400">
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0V12m-3-2.5l3-1.5m0 1.5l3-1.5m0 1.5V6a1.5 1.5 0 113 0V10m0 0V6a1.5 1.5 0 113 0V11a5 5 0 01-10 0v-2" />
                         </svg>
                       </div>
                       <div>
                         <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest">PROP DNA ACTIVE</div>
                         <div className="text-[8px] text-gray-500 uppercase font-bold">Hand-Object Interaction Lock</div>
                       </div>
                     </div>
                     <button 
                       onClick={() => setPropInteraction(null)}
                       className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-gray-500 hover:text-white"
                     >
                       ✕
                     </button>
                   </div>
                 )}
               </div>
            </section>
          )}

          {/* 4. ATTRIBUTES LIST (STRICT ORDER) */}
          <div className="space-y-12">
            {DISPLAY_ORDER.map((key) => {
               const attr = attributes[key];
               const categories = PRESETS[key] || [];
               const isProcessing = extractingAttribute === key;
               
               const currentCategory = categories.find(c => c.id === attr.presetCategoryId);
               
               // Check if we are using an inherited identity attribute
               const inheritedValue = (attr.mode === 'auto' && identityAttributes?.[key]) ? identityAttributes[key] : null;

               return (
                 <section key={key} className={`space-y-4 transition-opacity ${isProcessing ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                    <div className="flex justify-between items-end">
                       <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-white">
                         {ATTR_LABELS[key]}
                       </h3>
                       
                       <div className="flex items-center gap-2 bg-black border border-gray-800 p-1 rounded-sm">
                          {(['AUTO', 'PRESET', 'CUSTOM'] as string[]).map(m => (
                            <button
                                key={m}
                                onClick={() => setAttributeMode(key, m.toLowerCase() as SelectionMode)}
                                className={`
                                  text-[9px] font-black px-3 py-1.5 rounded-sm transition-all tracking-widest
                                  ${attr.mode === m.toLowerCase() ? 'bg-gray-800 text-white' : 'text-gray-600 hover:text-gray-400'}
                                `}
                            >
                              {m}
                            </button>
                          ))}
                       </div>
                    </div>

                    <div className="bg-black border border-gray-800/60 rounded-md p-4 group relative">
                       {attr.mode === 'auto' && (
                         <div className="py-4 text-center">
                            {inheritedValue ? (
                               <div className="flex flex-col gap-1">
                                  <span className="text-[10px] text-[var(--neon)] font-bold uppercase tracking-widest">Inherited from Identity Base</span>
                                  <span className="text-[9px] text-gray-400 font-mono line-clamp-2 px-4 italic">"{inheritedValue}"</span>
                               </div>
                            ) : (
                               <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                                  System Default Active
                               </div>
                            )}
                         </div>
                       )}

                       {attr.mode === 'preset' && (
                         <div className="grid grid-cols-2 gap-3">
                            <select 
                              className="bg-gray-900/50 border border-gray-800 text-[10px] font-bold text-white p-2.5 rounded-sm outline-none focus:border-[var(--neon)] appearance-none cursor-pointer"
                              onChange={(e) => setAttributePresetCategory(key, e.target.value)}
                              value={attr.presetCategoryId || ""}
                            >
                               <option value="" disabled>CATEGORY</option>
                               {categories.map(c => (
                                 <option key={c.id} value={c.id}>{c.label.toUpperCase()}</option>
                               ))}
                            </select>
                            
                            <select 
                              className="bg-gray-900/50 border border-gray-800 text-[10px] font-bold text-white p-2.5 rounded-sm outline-none focus:border-[var(--neon)] appearance-none cursor-pointer disabled:opacity-30"
                              onChange={(e) => setAttributePresetOption(key, e.target.value)}
                              value={attr.presetOptionId || ""}
                              disabled={!attr.presetCategoryId}
                            >
                               <option value="" disabled>OPTION</option>
                               {currentCategory?.options.map(o => (
                                 <option key={o.id} value={o.id}>{o.label.toUpperCase()}</option>
                               ))}
                            </select>
                         </div>
                       )}

                       {attr.mode === 'custom' && (
                         <textarea 
                           className="w-full bg-gray-900/30 border border-gray-800 text-[11px] font-medium text-gray-300 p-3 rounded-md h-24 focus:border-[var(--neon)] outline-none resize-none transition-colors"
                           placeholder={`Define ${ATTR_LABELS[key]} manually...`}
                           value={attr.customText}
                           onChange={(e) => setAttributeCustomText(key, e.target.value)}
                         />
                       )}

                       {key === 'body' && (
                         <div className="mt-4 pt-4 border-t border-gray-800/50 grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                             <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest">Bust</label>
                             <select
                               className="w-full bg-black border border-gray-800 text-[10px] font-bold text-white p-2 rounded-sm outline-none appearance-none cursor-pointer"
                               value={bodyOverrides.bust}
                               onChange={(e) => setBodyOverride('bust', e.target.value as SizeTier)}
                             >
                               {SIZE_TIERS.map(tier => (
                                 <option key={tier} value={tier}>{tier.toUpperCase()}</option>
                               ))}
                             </select>
                           </div>
                           <div className="space-y-2">
                             <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest">Glutes</label>
                             <select
                               className="w-full bg-black border border-gray-800 text-[10px] font-bold text-white p-2 rounded-sm outline-none appearance-none cursor-pointer"
                               value={bodyOverrides.glutes}
                               onChange={(e) => setBodyOverride('glutes', e.target.value as SizeTier)}
                             >
                               {SIZE_TIERS.map(tier => (
                                 <option key={tier} value={tier}>{tier.toUpperCase()}</option>
                               ))}
                             </select>
                           </div>
                         </div>
                       )}

                       <div className="absolute -right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <label 
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => onDropSingleAttr(key, e)}
                            className={`w-7 h-7 flex items-center justify-center bg-gray-900 border border-gray-800 rounded-full hover:border-[var(--neon)] hover:text-[var(--neon)] cursor-pointer text-gray-500 shadow-lg`}
                          >
                              <span className="text-[10px]">📷</span>
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleSingleAttributeUpload(key, e)} />
                          </label>
                       </div>
                    </div>
                 </section>
               );
            })}
          </div>

        </div>

        {/* FOOTER: GENERATE */}
        <div className="p-6 border-t border-gray-800 bg-[#050505] z-40 fixed bottom-0 md:relative w-full">
           {isGenerating ? (
              <div className="w-full py-5 bg-[var(--neon-dim)] border border-[var(--neon)] rounded-md flex items-center justify-center gap-4 shadow-[0_0_20px_var(--neon-dim)]">
                 <NeonArcLoader size="sm" />
                 <span className="text-[var(--neon)] text-[11px] font-black tracking-[0.3em] uppercase animate-pulse">
                    SYNTHESIZING {batchProgress ? `(${batchProgress.current}/${batchProgress.total})` : ""}
                 </span>
              </div>
           ) : (
              <button
                onClick={handleGenerate}
                disabled={isExtractingSlot1 || extractingAttribute !== null || hasInvalidPresets}
                className={`
                  w-full py-5 text-[13px] font-black uppercase tracking-[0.4em] rounded-md transition-all
                  ${(isExtractingSlot1 || extractingAttribute || hasInvalidPresets) ? 'bg-gray-900 text-gray-700 cursor-not-allowed border border-gray-800' : 'bg-[var(--neon)] text-black hover:brightness-110 shadow-[0_0_25px_var(--neon-dim)] active:scale-[0.98]'}
                `}
              >
                GENERATE IMAGE
              </button>
           )}
        </div>
      </div>

      {/* RIGHT COLUMN: Output & Preview */}
      <div className="flex-1 flex flex-col h-screen bg-black relative">
         
         {/* IMAGE OUTPUT */}
         <div className="flex-1 flex items-center justify-center p-8 bg-[radial-gradient(circle_at_center,_#0a0a0a_0%,_#000000_100%)] relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
            
            {outputImageUrl ? (
               <div className="relative group animate-fade-in">
                  <img src={outputImageUrl} alt="Output" className="max-w-full max-h-[85vh] object-contain shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-gray-800 rounded-sm" />
                  <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                     <ImageActions 
                        imageSrc={outputImageUrl} 
                        onPreview={() => setPreviewImage(outputImageUrl)} 
                        className="scale-125"
                     />
                  </div>
               </div>
            ) : (
               <div className="flex flex-col items-center gap-6 opacity-20">
                  <div className="w-24 h-24 border border-white rounded-full flex items-center justify-center animate-spin-slow">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div className="text-white text-[10px] tracking-[0.6em] font-black uppercase">STANDBY FOR COMPOSITION</div>
               </div>
            )}
         </div>

         {/* PROMPT PREVIEW PANEL */}
         <div className={`
             border-t border-gray-800 bg-[#050505]/95 backdrop-blur-xl transition-all duration-500 ease-in-out flex flex-col z-20
             ${showPromptPreview ? 'h-[320px]' : 'h-12'}
         `}>
            <button 
              onClick={() => setShowPromptPreview(!showPromptPreview)}
              className="w-full h-12 flex items-center justify-between px-8 bg-black/40 text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 hover:text-white transition-colors border-b border-gray-900"
            >
               <span>PROMPT PREVIEW & DEBUG</span>
               <span className="text-lg">{showPromptPreview ? "−" : "+"}</span>
            </button>
            
            {showPromptPreview && (
               <div className="flex-1 overflow-y-auto p-8 font-mono text-[10px] space-y-8 custom-scrollbar">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <div className="flex justify-between items-center">
                          <span className="text-[var(--neon)] font-black tracking-widest uppercase">CONSTRUCTED PROMPT</span>
                          <button 
                            onClick={() => navigator.clipboard.writeText(liveOrchestration.finalPrompt)}
                            className="text-[9px] text-gray-600 hover:text-white font-bold tracking-widest"
                          >COPY_BUFFER</button>
                       </div>
                       <div className="p-5 bg-black border border-gray-800/50 rounded-md text-gray-400 leading-relaxed whitespace-pre-wrap selection:bg-[var(--neon)] selection:text-black">
                          {liveOrchestration.finalPrompt || "AWAITING_PARAMETERS"}
                       </div>
                    </div>

                    <div className="space-y-6">
                       <div className="space-y-4">
                          <span className="text-red-900 font-black tracking-widest uppercase">STRICT_NEGATIVES</span>
                          <div className="p-4 bg-red-950/10 border border-red-900/20 rounded-md text-red-900/60 leading-tight">
                             {liveOrchestration.negatives.join(", ")}
                          </div>
                       </div>

                       <div className="space-y-4">
                          <span className="text-blue-900 font-black tracking-widest uppercase">LOGIC_SUBSYSTEMS</span>
                          <div className="grid grid-cols-2 gap-2">
                             {Object.entries(liveOrchestration.debugBlocks).map(([k, v]) => (
                                <details key={k} className="group overflow-hidden">
                                   <summary className="cursor-pointer text-[9px] font-bold text-gray-600 group-hover:text-gray-300 bg-gray-900/30 p-2 border border-gray-800/50 rounded-sm mb-1 uppercase tracking-widest transition-colors list-none flex justify-between">
                                       {k} <span className="text-[var(--neon-dim)]">&gt;&gt;</span>
                                   </summary>
                                   <div className="p-3 text-[9px] text-gray-500 border-l border-gray-800 bg-black/40 whitespace-pre-wrap leading-normal">
                                      {v}
                                   </div>
                                </details>
                             ))}
                          </div>
                       </div>
                    </div>
                  </div>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default ComposerPage;