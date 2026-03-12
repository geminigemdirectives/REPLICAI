import React, { useState, useEffect } from 'react';
import { AttributeKey, SceneDNA, PropInteraction } from '../types';

const ATTR_LABELS: Record<AttributeKey, string> = {
  camera: "CAMERA / ANGLE",
  pose: "POSE / ACTION",
  outfit: "OUTFIT",
  body: "BODY DETAILS",
  hair: "HAIR",
  expression: "FACIAL EXPRESSION",
  scene: "SCENE / LOCATION"
};

interface AttributeSelectionModalProps {
  isOpen: boolean;
  attributes: Partial<Record<AttributeKey, string>> | null;
  sceneDNA: SceneDNA | null;
  propInteraction: PropInteraction | null;
  onConfirm: (selectedAttrs: AttributeKey[], includeDNA: boolean, includeProp: boolean) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

const AttributeSelectionModal: React.FC<AttributeSelectionModalProps> = ({ 
  isOpen, 
  attributes, 
  sceneDNA,
  propInteraction,
  onConfirm, 
  onCancel,
  isProcessing = false
}) => {
  const [selected, setSelected] = useState<Set<AttributeKey>>(new Set());
  const [includeDNA, setIncludeDNA] = useState(true);
  const [includeProp, setIncludeProp] = useState(true);

  // Initialize selection when attributes change or modal opens
  useEffect(() => {
    if (isOpen) {
      if (attributes) {
        const keys = Object.keys(attributes) as AttributeKey[];
        setSelected(new Set(keys));
      }
      setIncludeDNA(!!sceneDNA);
      setIncludeProp(!!propInteraction);
    }
  }, [isOpen, attributes, sceneDNA, propInteraction]);

  if (!isOpen || (!attributes && !sceneDNA && !propInteraction)) return null;

  const toggle = (key: AttributeKey) => {
    if (isProcessing) return;
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelected(next);
  };

  const handleConfirm = () => {
    if (isProcessing) return;
    onConfirm(Array.from(selected), includeDNA, includeProp);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in p-6 font-sans">
      <div className="bg-[#080808] border border-gray-800 rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-2xl w-full flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#050505]">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-widest">
              Review Attributes
            </h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">
              Select extracted visual attributes to lock.
            </p>
          </div>
          <div className="w-2 h-2 bg-[var(--neon)] rounded-full animate-pulse shadow-[0_0_10px_var(--neon)]"></div>
        </div>

        {/* List */}
        <div className={`flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
          
          {/* Global DNA Section */}
          {(sceneDNA || propInteraction) && (
            <div className="mb-6 space-y-3">
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 px-1">
                Global Scene Locks (DNA)
              </div>
              
              {sceneDNA && (
                <div 
                  onClick={() => !isProcessing && setIncludeDNA(!includeDNA)}
                  className={`
                    p-4 rounded-md border cursor-pointer transition-all duration-200 group relative overflow-hidden select-none
                    ${includeDNA ? 'bg-blue-500/5 border-blue-500/50' : 'bg-gray-900/30 border-gray-800 hover:border-gray-700'}
                  `}
                >
                  <div className="flex items-start gap-4 relative z-10">
                    <div className={`
                      w-5 h-5 mt-0.5 rounded-sm border flex items-center justify-center transition-all
                      ${includeDNA ? 'bg-blue-500 border-blue-500' : 'bg-transparent border-gray-600 group-hover:border-gray-500'}
                    `}>
                      {includeDNA && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${includeDNA ? 'text-blue-400' : 'text-gray-500'}`}>
                        SCENE DNA COMPILER
                      </div>
                      <div className={`text-[11px] leading-relaxed font-mono mt-1 ${includeDNA ? 'text-gray-300' : 'text-gray-600'}`}>
                        Extracts and locks environment, camera, lighting, and pose geometry for deterministic reconstruction.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {propInteraction && (
                <div 
                  onClick={() => !isProcessing && setIncludeProp(!includeProp)}
                  className={`
                    p-4 rounded-md border cursor-pointer transition-all duration-200 group relative overflow-hidden select-none
                    ${includeProp ? 'bg-purple-500/5 border-purple-500/50' : 'bg-gray-900/30 border-gray-800 hover:border-gray-700'}
                  `}
                >
                  <div className="flex items-start gap-4 relative z-10">
                    <div className={`
                      w-5 h-5 mt-0.5 rounded-sm border flex items-center justify-center transition-all
                      ${includeProp ? 'bg-purple-500 border-purple-500' : 'bg-transparent border-gray-600 group-hover:border-gray-500'}
                    `}>
                      {includeProp && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${includeProp ? 'text-purple-400' : 'text-gray-500'}`}>
                        PROP INTERACTION DNA
                      </div>
                      <div className={`text-[11px] leading-relaxed font-mono mt-1 ${includeProp ? 'text-gray-300' : 'text-gray-600'}`}>
                        Locks hand-object interaction, grip type, and finger placement.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="h-px bg-gray-800 my-4"></div>
            </div>
          )}

          <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 px-1">
            Visual Attributes
          </div>

          {attributes && (Object.entries(attributes) as [AttributeKey, string][]).map(([key, value]) => {
            if (!value) return null;
            const isSelected = selected.has(key);
            
            return (
              <div 
                key={key}
                onClick={() => toggle(key)}
                className={`
                  p-4 rounded-md border cursor-pointer transition-all duration-200 group relative overflow-hidden select-none
                  ${isSelected ? 'bg-[var(--neon)]/5 border-[var(--neon)]' : 'bg-gray-900/30 border-gray-800 hover:border-gray-700'}
                `}
              >
                <div className="flex items-start gap-4 relative z-10">
                  {/* Checkbox */}
                  <div className={`
                    w-5 h-5 mt-0.5 rounded-sm border flex items-center justify-center transition-all
                    ${isSelected ? 'bg-[var(--neon)] border-[var(--neon)]' : 'bg-transparent border-gray-600 group-hover:border-gray-500'}
                  `}>
                    {isSelected && (
                      <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <div className={`
                        text-[10px] font-black uppercase tracking-[0.2em] transition-colors
                        ${isSelected ? 'text-[var(--neon)]' : 'text-gray-500'}
                      `}>
                        {ATTR_LABELS[key]}
                      </div>
                    </div>
                    <div className={`
                       text-[11px] leading-relaxed font-mono transition-opacity
                       ${isSelected ? 'text-gray-300' : 'text-gray-600'}
                    `}>
                      {value}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 bg-[#050505] flex gap-4 rounded-b-lg">
           <button 
             onClick={onCancel}
             disabled={isProcessing}
             className="flex-1 py-4 rounded-sm border border-gray-800 text-gray-500 font-bold uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed"
           >
             Discard
           </button>
           <button 
             onClick={handleConfirm}
             disabled={isProcessing}
             className={`
               flex-[2] py-4 rounded-sm font-black uppercase tracking-widest transition-all text-xs
               ${isProcessing 
                 ? 'bg-gray-800 text-gray-500 cursor-wait' 
                 : 'bg-[var(--neon)] text-black hover:brightness-110 shadow-[0_0_20px_var(--neon-dim)] active:scale-[0.99]'}
             `}
           >
             {isProcessing ? 'Processing...' : `Apply Selected (${selected.size})`}
           </button>
        </div>

      </div>
    </div>
  );
};

export default AttributeSelectionModal;