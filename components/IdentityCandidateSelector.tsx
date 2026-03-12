import React, { useState } from 'react';
import { IdentityBasePacket } from '../types';

interface IdentityCandidateSelectorProps {
  packet: IdentityBasePacket;
  onConfirm: (selectedRefs: { front: string; angle45: string; profile: string }) => void;
  onCancel: () => void;
}

const IdentityCandidateSelector: React.FC<IdentityCandidateSelectorProps> = ({ packet, onConfirm, onCancel }) => {
  const [selectedFront, setSelectedFront] = useState<number>(0);
  const [selectedAngle, setSelectedAngle] = useState<number>(0);
  const [selectedProfile, setSelectedProfile] = useState<number>(0);

  const handleConfirm = () => {
    if (!packet.generatedCandidates) return;
    
    onConfirm({
      front: packet.generatedCandidates.front[selectedFront],
      angle45: packet.generatedCandidates.angle45[selectedAngle],
      profile: packet.generatedCandidates.profile[selectedProfile]
    });
  };

  if (!packet.generatedCandidates) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-8 overflow-y-auto">
      <div className="max-w-6xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold uppercase tracking-tighter text-white">Select Identity Anchors</h2>
          <p className="text-gray-400 text-sm uppercase tracking-widest">Choose the most accurate representation for each angle to lock the Digital Twin.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Front Column */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-[var(--neon)] uppercase tracking-[0.2em] text-center border-b border-[var(--neon)]/30 pb-2">Frontal View</h3>
            <div className="space-y-3">
              {packet.generatedCandidates.front.map((b64, idx) => (
                <div 
                  key={`front-${idx}`}
                  onClick={() => setSelectedFront(idx)}
                  className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${selectedFront === idx ? 'border-[var(--neon)] ring-4 ring-[var(--neon)]/20 scale-[1.02]' : 'border-gray-800 hover:border-gray-600 opacity-60 hover:opacity-100'}`}
                >
                  <img src={`data:image/jpeg;base64,${b64}`} className="w-full h-full object-cover" alt={`Front Candidate ${idx}`} />
                  {selectedFront === idx && (
                    <div className="absolute top-2 right-2 bg-[var(--neon)] text-black text-[10px] font-bold px-2 py-1 rounded-full">SELECTED</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 45 Degree Column */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-[var(--neon)] uppercase tracking-[0.2em] text-center border-b border-[var(--neon)]/30 pb-2">45° Side View</h3>
            <div className="space-y-3">
              {packet.generatedCandidates.angle45.map((b64, idx) => (
                <div 
                  key={`angle-${idx}`}
                  onClick={() => setSelectedAngle(idx)}
                  className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${selectedAngle === idx ? 'border-[var(--neon)] ring-4 ring-[var(--neon)]/20 scale-[1.02]' : 'border-gray-800 hover:border-gray-600 opacity-60 hover:opacity-100'}`}
                >
                  <img src={`data:image/jpeg;base64,${b64}`} className="w-full h-full object-cover" alt={`Angle Candidate ${idx}`} />
                  {selectedAngle === idx && (
                    <div className="absolute top-2 right-2 bg-[var(--neon)] text-black text-[10px] font-bold px-2 py-1 rounded-full">SELECTED</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Profile Column */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-[var(--neon)] uppercase tracking-[0.2em] text-center border-b border-[var(--neon)]/30 pb-2">Profile View</h3>
            <div className="space-y-3">
              {packet.generatedCandidates.profile.map((b64, idx) => (
                <div 
                  key={`profile-${idx}`}
                  onClick={() => setSelectedProfile(idx)}
                  className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${selectedProfile === idx ? 'border-[var(--neon)] ring-4 ring-[var(--neon)]/20 scale-[1.02]' : 'border-gray-800 hover:border-gray-600 opacity-60 hover:opacity-100'}`}
                >
                  <img src={`data:image/jpeg;base64,${b64}`} className="w-full h-full object-cover" alt={`Profile Candidate ${idx}`} />
                  {selectedProfile === idx && (
                    <div className="absolute top-2 right-2 bg-[var(--neon)] text-black text-[10px] font-bold px-2 py-1 rounded-full">SELECTED</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4 pt-8 border-t border-gray-800">
          <button 
            onClick={onCancel}
            className="px-8 py-4 rounded-sm border border-gray-700 text-gray-400 text-xs font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors"
          >
            Cancel & Retry
          </button>
          <button 
            onClick={handleConfirm}
            className="px-12 py-4 rounded-sm bg-[var(--neon)] text-black text-xs font-bold uppercase tracking-widest hover:bg-[var(--neon)]/90 transition-colors shadow-[0_0_20px_rgba(0,255,0,0.3)]"
          >
            Confirm Identity Lock
          </button>
        </div>
      </div>
    </div>
  );
};

export default IdentityCandidateSelector;
