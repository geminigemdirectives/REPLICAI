import React from 'react';

interface IdentityLoadButtonProps {
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

const IdentityLoadButton: React.FC<IdentityLoadButtonProps> = ({ onClick, className = "", children }) => {
  return (
    <button
      onClick={onClick}
      className={`
        group relative inline-flex items-center justify-center
        px-16 py-6 overflow-hidden
        bg-transparent
        border border-[var(--neon)]/30
        hover:border-[var(--neon)]
        transition-all duration-500
        active:scale-95
        ${className}
      `}
    >
      {/* Animated Background Fill */}
      <div className="absolute inset-0 bg-[var(--neon)] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]" />
      
      {/* Scanline Effect */}
      <div className="absolute left-0 w-full h-[1px] bg-white/50 top-0 opacity-0 group-hover:opacity-100 group-hover:top-full transition-all duration-700 ease-linear delay-100" />

      {/* Text */}
      <span className="relative z-10 font-mono text-lg tracking-[0.3em] uppercase text-[var(--neon)] group-hover:text-black transition-colors duration-500 font-bold flex items-center gap-3">
        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 -ml-4">
          [
        </span>
        {children}
        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 -mr-4">
          ]
        </span>
      </span>
      
      {/* Decorative Tech Marks - Corners */}
      <div className="absolute top-0 left-0 w-[1px] h-3 bg-[var(--neon)] transition-all duration-300 group-hover:h-full opacity-50" />
      <div className="absolute top-0 right-0 w-[1px] h-3 bg-[var(--neon)] transition-all duration-300 group-hover:h-full opacity-50" />
      
      {/* Decorative Tech Marks - Squares */}
      <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-[var(--neon)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-[var(--neon)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
};

export default IdentityLoadButton;
