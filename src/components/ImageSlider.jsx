import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, Image as ImageIcon } from 'lucide-react';
import { getImageUrl, getImageCaption } from '../services/api';

export default function ImageSlider({ images = [], title = '', aspectRatio = 'aspect-square' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  // Parse images into normalized array of { url, caption }
  const rawList = Array.isArray(images) 
    ? images 
    : (typeof images === 'string' ? (() => { try { return JSON.parse(images); } catch { return [images]; } })() : []);

  const normalizedList = rawList
    .map((item, idx) => {
      const url = getImageUrl(item);
      const caption = getImageCaption(item);
      return { url, caption, id: idx };
    })
    .filter(item => Boolean(item.url));

  const slides = normalizedList.length > 0 
    ? normalizedList 
    : [{ url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=70', caption: title, id: 0 }];

  const activeSlide = slides[currentIndex] || slides[0];

  const handlePrev = (e) => {
    e?.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setCurrentIndex(prev => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-3 select-none">
      {/* Main Slide Stage */}
      <div className={`relative ${aspectRatio} rounded-2xl overflow-hidden bg-brand-soft border border-brand-border group shadow-sm`}>
        <img
          src={activeSlide.url}
          alt={activeSlide.caption || title}
          className="w-full h-full object-cover transition-transform duration-500 cursor-pointer"
          onClick={() => setFullscreen(true)}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=70';
          }}
        />

        {/* Counter Badge */}
        {slides.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow">
            {currentIndex + 1} / {slides.length}
          </div>
        )}

        {/* Fullscreen Trigger */}
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          className="absolute top-3 left-3 bg-black/50 hover:bg-black/80 backdrop-blur-md text-white p-2 rounded-xl opacity-0 group-hover:opacity-100 transition shadow"
          title="View Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Previous / Next Arrow Controls */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-brand-dark p-2 rounded-full shadow-lg opacity-80 group-hover:opacity-100 transition hover:scale-110"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-brand-dark p-2 rounded-full shadow-lg opacity-80 group-hover:opacity-100 transition hover:scale-110"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Description / Caption Text Bar (Always visible while viewing image) */}
        {activeSlide.caption && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-4 pt-8 text-white transition-opacity">
            <div className="flex items-start gap-2">
              <ImageIcon className="w-4 h-4 text-brand-yellow flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm font-bold text-white drop-shadow leading-snug line-clamp-2">
                {activeSlide.caption}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Thumbnails Row */}
      {slides.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
          {slides.map((slide, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition ${
                idx === currentIndex
                  ? 'border-brand-yellow ring-2 ring-brand-yellow/50 scale-105 shadow-md'
                  : 'border-gray-200 opacity-60 hover:opacity-100 hover:border-gray-400'
              }`}
            >
              <img
                src={slide.url}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=150&q=60';
                }}
              />
              {slide.caption && (
                <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white truncate px-1 text-center font-semibold">
                  {slide.caption}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {fullscreen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md animate-fade-in"
          onClick={() => setFullscreen(false)}
        >
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="absolute top-6 right-6 text-white hover:text-brand-yellow bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>

          <div 
            className="relative max-w-5xl max-h-[85vh] w-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeSlide.url}
              alt={activeSlide.caption || title}
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
            />

            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white text-white hover:text-brand-dark p-3 rounded-full transition shadow-xl"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white text-white hover:text-brand-dark p-3 rounded-full transition shadow-xl"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Fullscreen Caption Display */}
            {activeSlide.caption && (
              <div className="mt-4 bg-white/10 backdrop-blur-md px-6 py-2.5 rounded-2xl border border-white/20 max-w-xl text-center">
                <p className="text-white text-sm font-semibold">
                  {activeSlide.caption}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
