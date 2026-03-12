
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import IdentityLoadButton from '../components/IdentityLoadButton';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore - window.aistudio is provided by the execution context
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasKey(selected);
    };
    checkKey();
  }, []);

  const handleStart = async () => {
    if (hasKey) {
      navigate('/setup');
    } else {
      // @ts-ignore - window.aistudio is provided by the execution context
      await window.aistudio.openSelectKey();
      navigate('/setup');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient background effect */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-[var(--neon)] rounded-full blur-[150px] opacity-10 pointer-events-none" />
      
      <div className="z-10 text-center space-y-16 animate-fade-in max-w-4xl px-6">
        {/* Title and Supporting Line */}
        <div className="flex flex-col items-center">
          <h1 className="text-7xl md:text-[10rem] font-extrabold tracking-tighter text-white leading-[0.85]">
            REPLICAI
          </h1>
          <p className="text-lg md:text-2xl tracking-tight text-white/90 font-medium mt-4 md:mt-6 max-w-2xl text-center">
            Professional photorealism. Perfect identity consistency.
          </p>
        </div>

        {/* Primary CTA and System Contract */}
        <div className="flex flex-col items-center space-y-6">
          <IdentityLoadButton 
            onClick={handleStart} 
            className="px-20 py-8 text-xl"
          >
            LOAD IDENTITY
          </IdentityLoadButton>
          
          <p className="text-[11px] text-white/80 font-light tracking-[0.05em] max-w-xs leading-relaxed opacity-90">
            Every generation is constrained by a locked biometric signature. 
            Portraying subjects with high structural fidelity and photorealistic accuracy.
          </p>

          {!hasKey && (
            <p className="text-[10px] text-white/90 uppercase tracking-widest animate-pulse mt-12 pt-8">
              Paid API Key Recommended for High-Fidelity Generation
            </p>
          )}
        </div>
      </div>
      
      {/* Bottom Legal/Version Footer */}
      <div className="absolute bottom-8 flex flex-col items-center gap-2">
        <a 
          href="https://ai.google.dev/gemini-api/docs/billing" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[10px] text-gray-700 hover:text-[var(--neon)] transition-colors tracking-widest uppercase"
        >
          Billing Documentation
        </a>
        <div className="text-[10px] text-gray-800 tracking-widest uppercase">
          V1.0 • IDENTITY COMPOSER
        </div>
      </div>
    </div>
  );
};

export default HomePage;
