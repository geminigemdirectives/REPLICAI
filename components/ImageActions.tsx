
import React from 'react';
import { downloadImage } from '../utils/downloadImage';

interface ImageActionsProps {
  imageSrc: string;
  filename?: string;
  onPreview: () => void;
  className?: string;
}

const ImageActions: React.FC<ImageActionsProps> = ({ imageSrc, filename, onPreview, className = "" }) => {
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadImage(imageSrc, filename);
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPreview();
  };

  return (
    <div className={`flex gap-3 ${className}`}>
      {/* Preview Button */}
      <button 
        onClick={handlePreview}
        className="w-10 h-10 rounded-full bg-black/60 border border-gray-700 hover:border-[var(--neon)] hover:bg-black text-white flex items-center justify-center transition-all backdrop-blur-sm group"
        title="Preview Full Size"
      >
        <svg className="w-5 h-5 group-hover:text-[var(--neon)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </button>

      {/* Download Button */}
      <button 
        onClick={handleDownload}
        className="w-10 h-10 rounded-full bg-black/60 border border-gray-700 hover:border-[var(--neon)] hover:bg-black text-white flex items-center justify-center transition-all backdrop-blur-sm group"
        title="Download"
      >
        <svg className="w-5 h-5 group-hover:text-[var(--neon)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
           <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </button>
    </div>
  );
};

export default ImageActions;
