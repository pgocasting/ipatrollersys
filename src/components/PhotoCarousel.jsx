import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const PhotoCarousel = ({ photos, timestamps, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
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
        <div className="border rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
          <img
            src={currentPhoto}
            alt={`${title} ${currentIndex + 1}`}
            className="w-full h-auto max-h-[500px] object-contain"
          />
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
    </div>
  );
};

export default PhotoCarousel;
