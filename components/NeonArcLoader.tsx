import React from 'react';

interface NeonArcLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const NeonArcLoader: React.FC<NeonArcLoaderProps & { progress?: number }> = ({ size = 'md', className = "", progress }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-20 h-20'
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className} flex items-center justify-center`}>
      <style>
        {`
          @keyframes spin-arc {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      
      {/* Static Dim Ring */}
      <div className="absolute inset-0 rounded-full border border-[var(--neon-dim)]" />

      {/* Moving Bright Arc */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          mask: 'radial-gradient(transparent 60%, black 61%)',
          WebkitMask: 'radial-gradient(transparent 60%, black 61%)',
        }}
      >
        <div 
          className="w-full h-full rounded-full"
          style={{
            background: 'conic-gradient(transparent 0deg, transparent 270deg, var(--neon) 360deg)',
            animation: 'spin-arc 1s linear infinite',
            boxShadow: '0 0 15px var(--neon)'
          }}
        />
      </div>

      {/* Progress Percentage */}
      {progress !== undefined && (
        <span className="text-[10px] font-mono text-[var(--neon)] font-bold">
          {Math.round(progress)}%
        </span>
      )}
    </div>
  );
};

export default NeonArcLoader;
