import React, { useState, useRef, useEffect } from 'react';
import { CropRect } from '../utils/imageProcessing';
import { Check, X, Crop as CropIcon, MousePointerClick, Maximize2 } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  onConfirm: (crop: CropRect) => void;
  onCancel: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onConfirm, onCancel }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, width: 1, height: 1 });
  const [dragHandle, setDragHandle] = useState<'tl' | 'br' | null>(null);

  useEffect(() => {
    setCrop({ x: 0, y: 0, width: 1, height: 1 });
  }, [imageSrc]);

  const handleMouseDown = (e: React.MouseEvent, handle: 'tl' | 'br') => {
    e.stopPropagation();
    e.preventDefault();
    setDragHandle(handle);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragHandle || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = Math.max(0, Math.min(1, mouseX / rect.width));
    const yPct = Math.max(0, Math.min(1, mouseY / rect.height));

    setCrop(prev => {
      let newCrop = { ...prev };

      if (dragHandle === 'tl') {
        const maxX = prev.x + prev.width - 0.05;
        const maxY = prev.y + prev.height - 0.05;
        const newX = Math.min(xPct, maxX);
        const newY = Math.min(yPct, maxY);
        newCrop.width = (prev.x + prev.width) - newX;
        newCrop.height = (prev.y + prev.height) - newY;
        newCrop.x = newX;
        newCrop.y = newY;
      } else if (dragHandle === 'br') {
        const minX = prev.x + 0.05;
        const minY = prev.y + 0.05;
        const safeX = Math.max(xPct, minX);
        const safeY = Math.max(yPct, minY);
        newCrop.width = safeX - prev.x;
        newCrop.height = safeY - prev.y;
      }

      return newCrop;
    });
  };

  const handleMouseUp = () => {
    setDragHandle(null);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 backdrop-blur-sm p-6 animate-in fade-in duration-200"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      <div className="relative w-full max-w-6xl h-full flex flex-col pointer-events-auto bg-[#fffefc] rounded-3xl shadow-float overflow-hidden border border-white/60">
        
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-6 bg-surface border-b border-border">
          <div className="flex items-center gap-4">
             <div className="p-2.5 bg-[#f3efdc] rounded-xl text-primary shadow-sm border border-border">
                <Maximize2 className="w-5 h-5" />
             </div>
             <div>
                <h2 className="text-lg font-bold text-ink">裁剪识别区域</h2>
                <div className="text-xs font-medium text-inkLight flex items-center gap-2 mt-1">
                   <MousePointerClick className="w-3.5 h-3.5" />
                   <span>请框选包含所有卡片的区域</span>
                </div>
             </div>
          </div>
          
          <div className="flex gap-3">
             <button 
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl bg-white border border-border text-inkLight hover:text-ink hover:border-ink/20 font-bold transition-all flex items-center gap-2 text-xs"
              >
                <X className="w-3.5 h-3.5" /> 取消
              </button>
              <button 
                onClick={() => onConfirm(crop)}
                className="px-6 py-2.5 rounded-xl bg-primary text-white hover:bg-primaryHover font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all flex items-center gap-2 text-xs tracking-wide"
              >
                <Check className="w-3.5 h-3.5" /> 确认裁剪
              </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative flex items-center justify-center bg-[#f3efdc]/50 select-none overflow-hidden">
          <div className="w-full h-full p-12 flex items-center justify-center">
              <div className="relative shadow-xl rounded-lg overflow-hidden bg-white ring-[12px] ring-white" ref={containerRef}>
                <img 
                  ref={imgRef}
                  src={imageSrc} 
                  alt="Crop Source" 
                  className="max-w-full max-h-[calc(100vh-280px)] object-contain block opacity-50 grayscale-[0.2]"
                  draggable={false}
                />
                
                {/* Crop Overlay Window */}
                <div 
                  className="absolute border-2 border-primary box-border shadow-[0_0_0_9999px_rgba(243,239,220,0.7)]" 
                  style={{
                    left: `${crop.x * 100}%`,
                    top: `${crop.y * 100}%`,
                    width: `${crop.width * 100}%`,
                    height: `${crop.height * 100}%`,
                  }}
                >
                    <div className="absolute inset-0 overflow-hidden bg-white">
                      <img 
                        src={imageSrc}
                        className="absolute max-w-none"
                        style={{
                            left: `-${crop.x * 100 / crop.width}%`,
                            top: `-${crop.y * 100 / crop.height}%`,
                            width: `${100 / crop.width}%`,
                            height: `${100 / crop.height}%`
                        }}
                      />
                    </div>

                    {/* Handles */}
                    <div 
                      className="absolute -top-2.5 -left-2.5 w-5 h-5 bg-white border-2 border-primary rounded-full cursor-nwse-resize hover:scale-110 transition-transform z-10 shadow-sm"
                      onMouseDown={(e) => handleMouseDown(e, 'tl')}
                    />
                    
                    <div 
                      className="absolute -bottom-2.5 -right-2.5 w-5 h-5 bg-white border-2 border-primary rounded-full cursor-nwse-resize hover:scale-110 transition-transform z-10 shadow-sm"
                      onMouseDown={(e) => handleMouseDown(e, 'br')}
                    />
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};