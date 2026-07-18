import { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ImageViewer({ isOpen, photos, currentIndex, onClose, onPrev, onNext, resolveImageUrl }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Disable body scroll when viewer is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, onPrev, onNext]);

  if (!isOpen || currentIndex === null || !photos || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];
  const imageUrl = resolveImageUrl(currentPhoto.obrazek, currentIndex);

  return (
    <div className="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-stone-950/95 backdrop-blur-md animate-in fade-in duration-200">
      {/* Floating Header details */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent z-10">
        <span className="text-stone-300 text-sm font-semibold tracking-wider px-2">
          Fotka {currentIndex + 1} z {photos.length}
        </span>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          title="Zavřít (Esc)"
        >
          <X className="w-7 h-7" />
        </button>
      </div>

      {/* Main Image Slider Area */}
      <div className="relative w-full flex-1 flex items-center justify-center px-4 md:px-16 select-none">
        
        {/* Navigation - Left Arrow */}
        {photos.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-4 p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all hover:scale-105 active:scale-95 cursor-pointer z-10 shadow-md"
            title="Předchozí (šipka vlevo)"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}

        {/* Polaroid Style Image container inside viewer */}
        <div className="max-w-4xl max-h-[85vh] flex flex-col items-center animate-in zoom-in-95 duration-200">
          <img
            src={imageUrl}
            alt={currentPhoto.popisek || `Obrázek ${currentIndex + 1}`}
            className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl border border-white/10"
          />
          {currentPhoto.popisek && (
            <p className="mt-4 text-center text-sm md:text-base text-stone-200 bg-stone-900/60 border border-white/5 px-5 py-2 rounded-full max-w-lg shadow-lg backdrop-blur-sm">
              {currentPhoto.popisek}
            </p>
          )}
        </div>

        {/* Navigation - Right Arrow */}
        {photos.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-4 p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all hover:scale-105 active:scale-95 cursor-pointer z-10 shadow-md"
            title="Další (šipka vpravo)"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}
      </div>
    </div>
  );
}
