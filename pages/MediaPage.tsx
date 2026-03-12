
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listMediaItems, deleteMediaItem } from '../services/mediaStore';
import { MediaItem } from '../types';
import ImageActions from '../components/ImageActions';
import ImagePreviewModal from '../components/ImagePreviewModal';

const MediaPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    setLoading(true);
    const data = await listMediaItems();
    setItems(data);
    setLoading(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this image?")) {
      await deleteMediaItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <ImagePreviewModal isOpen={!!previewImage} imageSrc={previewImage} onClose={() => setPreviewImage(null)} />

      {/* HEADER */}
      <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-black sticky top-0 z-20">
        <h2 className="text-xl font-light tracking-wider flex items-center gap-4">
           <span className="w-2 h-2 bg-white rounded-full"></span> 
           <button onClick={() => navigate('/composer')} className="text-gray-500 hover:text-white transition-colors">COMPOSER</button>
           <span className="text-gray-700">/</span>
           <button onClick={() => navigate('/media')} className="font-bold text-white hover:text-[var(--neon)] transition-colors">MEDIA</button>
        </h2>
        <div className="text-xs text-gray-500 tracking-widest uppercase">
           {items.length} {items.length === 1 ? 'ITEM' : 'ITEMS'}
        </div>
      </div>

      {/* GRID */}
      <div className="flex-1 p-6 md:p-8">
        {loading ? (
           <div className="flex items-center justify-center h-64 text-gray-500 text-xs tracking-widest">LOADING GALLERY...</div>
        ) : items.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-64 text-gray-600 gap-4">
              <span className="text-sm tracking-widest">NO MEDIA GENERATED YET</span>
              <button onClick={() => navigate('/composer')} className="px-6 py-2 border border-gray-800 rounded hover:border-[var(--neon)] hover:text-[var(--neon)] text-xs uppercase transition-colors">
                 Go to Composer
              </button>
           </div>
        ) : (
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {items.map(item => (
                <div key={item.id} className="group relative aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden border border-gray-800 transition-transform hover:scale-[1.01] hover:shadow-2xl">
                   <img src={item.src} alt="Generated" className="w-full h-full object-cover" />
                   
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                      <div className="flex justify-between items-end">
                         <div className="text-[10px] text-gray-400 font-mono">
                            {new Date(item.createdAtISO).toLocaleDateString()}
                         </div>
                         <div className="flex gap-2">
                            <ImageActions 
                              imageSrc={item.src} 
                              filename={`replicai_${new Date(item.createdAtISO).getTime()}.png`}
                              onPreview={() => setPreviewImage(item.src)} 
                            />
                            {/* Delete Button */}
                            <button 
                              onClick={(e) => handleDelete(item.id, e)}
                              className="w-10 h-10 rounded-full bg-red-900/50 border border-red-800/50 hover:bg-red-900 hover:border-red-500 text-red-200 flex items-center justify-center backdrop-blur-sm transition-all"
                              title="Delete"
                            >
                               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        )}
      </div>
    </div>
  );
};

export default MediaPage;
