import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';

export const PhotoCarousel = ({ photos, timestamps, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Close fullscreen on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);
  
  // Ensure photos is an array
  const photoArray = Array.isArray(photos) ? photos : [photos];
  const timestampArray = Array.isArray(timestamps) ? timestamps : [timestamps];
  
  if (!photoArray || photoArray.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? photoArray.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === photoArray.length - 1 ? 0 : prevIndex + 1
    );
  };

  const currentPhoto = photoArray[currentIndex];
  const currentTimestamp = timestampArray[currentIndex];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between sticky top-0 bg-white z-10 pb-2 pt-2 border-b border-gray-200 mb-2">
        <label className="text-sm font-medium text-gray-700">
          {title} ({photoArray.length})
        </label>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Main Image */}
        <div 
          className="border rounded-md overflow-hidden bg-gray-100 flex items-center justify-center h-[280px] cursor-pointer group relative"
          onClick={() => setIsFullscreen(true)}
        >
          <img
            src={currentPhoto}
            alt={`${title} ${currentIndex + 1}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
          </div>
        </div>

        {/* Navigation Arrows - Only show if multiple photos */}
        {photoArray.length > 1 && (
          <>
            {/* Previous Button */}
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all z-10"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Next Button */}
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all z-10"
              aria-label="Next photo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Photo Counter */}
            <div className="absolute bottom-2 right-2 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium">
              {currentIndex + 1} / {photoArray.length}
            </div>

            {/* Dot Indicators */}
            <div className="flex justify-center gap-2 mt-3">
              {photoArray.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-gray-800 w-6'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to photo ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Timestamp */}
      {currentTimestamp && (
        <span className="text-xs text-gray-500 block">
          {new Date(currentTimestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })}
        </span>
      )}

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 flex mx-auto flex-col items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setIsFullscreen(false)}
        >
          <button 
            className="absolute top-6 right-6 text-white hover:text-red-400 p-2 bg-black/50 hover:bg-black/80 rounded-full transition-all"
            onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}
            title="Close (Esc)"
          >
            <X className="w-6 h-6" />
          </button>
          
          <img
            src={currentPhoto}
            alt="Fullscreen view"
            className="max-w-full max-h-[90vh] object-contain rounded-md shadow-2xl"
            onClick={(e) => e.stopPropagation()} // Prevent click from bubbling to backdrop
          />
          
          {/* Navigation while in fullscreen */}
          {photoArray.length > 1 && (
            <>
              <button
                className="absolute left-6 top-1/2 -translate-y-1/2 text-white hover:text-white p-3 bg-black/50 hover:bg-black/80 rounded-full transition-all"
                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                className="absolute right-6 top-1/2 -translate-y-1/2 text-white hover:text-white p-3 bg-black/50 hover:bg-black/80 rounded-full transition-all"
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
              >
                <ChevronRight className="w-8 h-8" />
              </button>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white bg-black/60 px-5 py-2 rounded-full text-sm font-medium tracking-wide">
                {title} — {currentIndex + 1} of {photoArray.length}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PhotoCarousel;
