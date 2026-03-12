
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReplicai } from '../context/ReplicaiContext';
import { enhanceIdentityBase, EnhancementStage } from '../services/identityBaseEnhancer.service';
import NeonArcLoader from '../components/NeonArcLoader';
import IdentityLoadButton from '../components/IdentityLoadButton';

import { IdentityBasePacket } from '../types';

const STAGE_MESSAGES: Record<EnhancementStage, string> = {
  INITIALIZING: "Initializing Biometric Engine...",
  IDENTITY_FORENSICS: "Extracting Forensic Signature...",
  LOCKING_STRUCTURE: "Locking Structural Metrics...",
  EXTRACTING_TRAITS: "Analyzing Inherent Traits...",
  IDENTITY_SYNTHESIS: "Synthesizing Digital Twin Candidates...",
  FINALIZING: "Securing Biometric Anchor..."
};

const IdentitySetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { identityBase, addIdentityBaseFiles, removeIdentityBaseFile, setIdentityPacket, setGender } = useReplicai();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState<EnhancementStage>('INITIALIZING');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Staging state for candidate selection
  const [candidatePacket, setCandidatePacket] = useState<IdentityBasePacket | null>(null);

  // Simulated progress effect removed in favor of real progress tracking
  useEffect(() => {
    if (!isProcessing) {
      setProgress(0);
    }
  }, [isProcessing]);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length > 0) {
      addIdentityBaseFiles(validFiles);
    }
  }, [addIdentityBaseFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  // Drag & Drop Handlers
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isProcessing) return;
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Paste Handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isProcessing) return;
      const items = e.clipboardData?.items;
      if (items) {
        const files: File[] = [];
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) files.push(file);
          }
        }
        if (files.length > 0) handleFiles(files);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleFiles, isProcessing]);

  const handleInitialize = async () => {
    if (!identityBase?.files || identityBase.files.length === 0 || !identityBase.gender) return;
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    try {
      // Step 1: Analyze Uploads & Generate Candidates
      const packet = await enhanceIdentityBase(identityBase.files, identityBase.gender, (stage, prog) => {
        setCurrentStage(stage);
        if (prog !== undefined) {
          setProgress(prog);
        }
      });
      
      // Step 2: Navigate directly to Composer (Skipping manual selection for speed)
      setIdentityPacket(packet);
      setIsProcessing(false);
      navigate('/composer');
      
    } catch (err: any) {
      setError(err.message || "Failed to initialize identity lock.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-12 flex flex-col items-center justify-center max-w-5xl mx-auto">
      <h1 className="text-4xl font-extrabold tracking-tighter mb-8 text-center uppercase">Identity Lock v2.5</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full">
        {/* Upload Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Identity Reference Images (2-10)</h3>
            <span className="text-[10px] text-gray-600 font-mono">{(identityBase?.files?.length || 0)}/10</span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {identityBase?.dataUrls.map((url, idx) => (
              <div key={idx} className="aspect-square bg-gray-900 rounded-xl overflow-hidden relative group border border-gray-800 hover:border-[var(--neon)] transition-all">
                <img src={url} className="w-full h-full object-cover grayscale contrast-125" alt={`Ref ${idx}`} />
                <button 
                  onClick={() => removeIdentityBaseFile(idx)}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/80 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity border border-white/10"
                >✕</button>
                {idx === 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-[var(--neon)]/80 text-black text-[8px] font-bold py-1 text-center uppercase tracking-widest">
                    Primary
                  </div>
                )}
              </div>
            ))}
            
            {(identityBase?.files?.length || 0) < 10 && (
              <label 
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`aspect-square bg-gray-900 border-2 border-dashed transition-all rounded-xl flex flex-col items-center justify-center cursor-pointer relative group ${isDragging ? 'border-[var(--neon)] bg-gray-800' : 'border-gray-800 hover:border-[var(--neon)]'}`}
              >
                <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" multiple />
                <span className="text-2xl mb-1 text-gray-700 group-hover:text-[var(--neon)] transition-colors">+</span>
                <span className="text-[8px] uppercase tracking-widest text-gray-600 group-hover:text-gray-400">Add Image</span>
              </label>
            )}
          </div>

          {isProcessing && (
            <div className="bg-gray-900/80 p-8 rounded-xl border border-[var(--neon)]/20 flex flex-col items-center justify-center gap-6 text-center">
              <NeonArcLoader size="md" progress={progress} />
              <div className="space-y-2">
                <span className="block text-[10px] text-[var(--neon)] font-bold tracking-[0.3em] uppercase animate-pulse">
                  {STAGE_MESSAGES[currentStage]}
                </span>
                <p className="text-[9px] text-gray-500 uppercase tracking-tighter leading-tight max-w-[180px] mx-auto">
                  Executing professional product-grade biometric extraction across multiple frames.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Config Section */}
        <div className="flex-col justify-center gap-8 flex">
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Biological Profile</h3>
            <div className="flex gap-4">
              <button 
                onClick={() => setGender('female')}
                disabled={isProcessing}
                className={`flex-1 py-4 border rounded-sm font-bold text-[10px] uppercase tracking-widest transition-all ${identityBase?.gender === 'female' ? 'border-[var(--neon)] bg-[var(--neon)]/10 text-[var(--neon)]' : 'border-gray-800 text-gray-600'}`}
              >Female</button>
              <button 
                onClick={() => setGender('male')}
                disabled={isProcessing}
                className={`flex-1 py-4 border rounded-sm font-bold text-[10px] uppercase tracking-widest transition-all ${identityBase?.gender === 'male' ? 'border-[var(--neon)] bg-[var(--neon)]/10 text-[var(--neon)]' : 'border-gray-800 text-gray-600'}`}
              >Male</button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Identity Robustness</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900/50 p-4 rounded-sm border border-gray-800">
                <span className="block text-[8px] text-gray-600 uppercase tracking-widest mb-1">Pose Coverage</span>
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[var(--neon)] transition-all duration-1000" 
                    style={{ width: `${Math.min(100, ((identityBase?.files?.length || 0) / 5) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-sm border border-gray-800">
                <span className="block text-[8px] text-gray-600 uppercase tracking-widest mb-1">Confidence Score</span>
                <span className="text-xs font-mono text-[var(--neon)]">
                  {identityBase?.files?.length ? (identityBase.files.length > 2 ? 'HIGH' : 'MEDIUM') : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 p-6 rounded-sm border border-gray-800">
            <p className="text-[10px] text-gray-500 leading-relaxed uppercase tracking-tighter mb-4">
              Revision 2.5: Multi-Image Biometric Lock. By providing multiple angles, the system builds a 3D structural map of the subject's identity. This significantly improves consistency across diverse poses and lighting conditions.
            </p>
            
            {/* Multi-View Status Indicators */}
            <div className="grid grid-cols-3 gap-2">
              <div className={`p-2 rounded border text-center ${identityBase?.anchor?.multiViewRefs?.front ? 'border-green-900/50 bg-green-900/10 text-green-500' : 'border-gray-800 bg-gray-900/50 text-gray-600'}`}>
                <span className="block text-[8px] uppercase tracking-widest font-bold">Front</span>
                <span className="text-[10px]">{identityBase?.anchor?.multiViewRefs?.front ? 'LOCKED' : 'MISSING'}</span>
              </div>
              <div className={`p-2 rounded border text-center ${identityBase?.anchor?.multiViewRefs?.angle45 ? 'border-green-900/50 bg-green-900/10 text-green-500' : 'border-gray-800 bg-gray-900/50 text-gray-600'}`}>
                <span className="block text-[8px] uppercase tracking-widest font-bold">45° Angle</span>
                <span className="text-[10px]">{identityBase?.anchor?.multiViewRefs?.angle45 ? 'LOCKED' : 'MISSING'}</span>
              </div>
              <div className={`p-2 rounded border text-center ${identityBase?.anchor?.multiViewRefs?.profile ? 'border-green-900/50 bg-green-900/10 text-green-500' : 'border-gray-800 bg-gray-900/50 text-gray-600'}`}>
                <span className="block text-[8px] uppercase tracking-widest font-bold">Profile</span>
                <span className="text-[10px]">{identityBase?.anchor?.multiViewRefs?.profile ? 'LOCKED' : 'MISSING'}</span>
              </div>
            </div>
          </div>

          <IdentityLoadButton 
            onClick={handleInitialize}
            className={(!identityBase?.files?.length || !identityBase?.gender || isProcessing) ? 'opacity-50 pointer-events-none grayscale' : ''}
          >
            EXTRACT & LOCK IDENTITY
          </IdentityLoadButton>

          {error && <p className="text-red-500 text-[10px] uppercase font-bold text-center border border-red-900/30 p-2 bg-red-900/10">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default IdentitySetupPage;