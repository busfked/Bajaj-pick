import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Check, X, Camera, RefreshCcw } from 'lucide-react';
import { AppLanguage } from '../types';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onCropComplete: (croppedDataUrl: string) => void;
  onClose: () => void;
  title?: string;
  lang?: AppLanguage;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  onCropComplete,
  onClose,
  title,
  lang = 'en',
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const defaultTitle = lang === 'am' ? 'የሾፌር ፎቶ ከመታወቂያው ላይ ቆርጠህ አውጣ' : 'Crop Profile Picture from ID';

  // Load image when imageSrc changes
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
      drawCanvas();
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Redraw canvas whenever zoom, rotation, offset change
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 320; // preview canvas dimensions
    canvas.width = size;
    canvas.height = size;

    // Clear
    ctx.clearRect(0, 0, size, size);

    // Save context
    ctx.save();

    // Center pivot
    ctx.translate(size / 2, size / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.translate(offset.x, offset.y);

    // Calculate drawing dimensions preserving aspect ratio
    const imgRatio = img.width / img.height;
    let drawW = size;
    let drawH = size;
    if (imgRatio > 1) {
      drawH = size / imgRatio;
    } else {
      drawW = size * imgRatio;
    }

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }, [zoom, rotation, offset]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Handle Drag / Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle Touch
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Generate high-res 400x400 final crop
  const handleApplyCrop = () => {
    const img = imageRef.current;
    if (!img) return;

    const exportCanvas = document.createElement('canvas');
    const exportSize = 400;
    exportCanvas.width = exportSize;
    exportCanvas.height = exportSize;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Scale factor from preview (320px) to export (400px)
    const scaleFactor = exportSize / 320;

    ctx.save();
    ctx.translate(exportSize / 2, exportSize / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.translate(offset.x * scaleFactor, offset.y * scaleFactor);

    const imgRatio = img.width / img.height;
    let drawW = exportSize;
    let drawH = exportSize;
    if (imgRatio > 1) {
      drawH = exportSize / imgRatio;
    } else {
      drawW = exportSize * imgRatio;
    }

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    const dataUrl = exportCanvas.toDataURL('image/jpeg', 0.92);
    onCropComplete(dataUrl);
    onClose();
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Camera className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit']">
              {title || defaultTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cropping Canvas Viewport */}
        <div className="relative flex justify-center items-center bg-slate-950 rounded-2xl overflow-hidden p-4 select-none touch-none border border-slate-800">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="cursor-move rounded-xl shadow-md"
            style={{ width: 280, height: 280 }}
          />

          {/* Circular avatar crop guide overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[230px] h-[230px] rounded-full border-2 border-emerald-400 shadow-[0_0_0_9999px_rgba(15,23,42,0.7)] ring-2 ring-emerald-500/30"></div>
          </div>

          <div className="absolute bottom-2 text-[11px] text-slate-300 font-medium bg-slate-900/90 px-3 py-1 rounded-full pointer-events-none border border-slate-700">
            {lang === 'am' ? 'ለመጎተት ይጫኑ • ለማጉላት ተንሸራታች ይጠቀሙ' : 'Drag to center face • Use slider to zoom'}
          </div>
        </div>

        {/* Controls: Zoom & Rotate */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <ZoomOut className="w-4 h-4 text-slate-400" />
            <input
              type="range"
              min="0.8"
              max="3.5"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
            />
            <ZoomIn className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 min-w-[36px]">
              {zoom.toFixed(1)}x
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center space-x-1.5 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{lang === 'am' ? '90° አሽከርክር' : 'Rotate 90°'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setRotation(0);
                setOffset({ x: 0, y: 0 });
              }}
              className="px-3 py-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-xs font-medium flex items-center space-x-1 transition-colors"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>{lang === 'am' ? 'ወደ መጀመሪያው መልስ' : 'Reset'}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {lang === 'am' ? 'ሰርዝ' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-98 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{lang === 'am' ? 'ፎቶውን አጽድቅ' : 'Apply Cropped Photo'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
