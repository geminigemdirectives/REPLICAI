
import React from 'react';
import ImageActions from './ImageActions';

interface ImagePreviewModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ isOpen, imageSrc, onClose }) => {
  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="relative max-w-[95vw] max-h-[95vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        
        {/* Main Image */}
        <img 
          src={imageSrc} 
          alt="Preview" 
          className="max-w-full max-h-[85vh] object-contain border border-gray-800 shadow-2xl rounded"
        />

        {/* Floating Actions Bar */}
        <div className="mt-6 flex items-center gap-6">
           <ImageActions 
              imageSrc={imageSrc} 
              onPreview={() => {}} // No-op as we are already previewing
              className="scale-110" 
           />
           <button 
             onClick={onClose}
             className="px-6 py-2 rounded-full border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 text-xs uppercase tracking-widest transition-all"
           >
             Close
           </button>
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;
