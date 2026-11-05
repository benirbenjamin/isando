import React, { useState, useEffect, useRef } from 'react';

/**
 * LazyViewport
 * Defers mounting and rendering of children until the element is within or near the browser viewport.
 * Substantially improves initial page load speed, decreases initial DOM node count, and eliminates lag.
 */
export default function LazyViewport({
  children,
  minHeight = '320px',
  rootMargin = '250px 0px',
  className = '',
  placeholder = null,
}) {
  const [inView, setInView] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    // Immediate fallback if IntersectionObserver is unsupported
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    const targetEl = containerRef.current;
    if (targetEl) {
      observer.observe(targetEl);
    }

    return () => {
      if (targetEl) observer.unobserve(targetEl);
      observer.disconnect();
    };
  }, [rootMargin]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={!inView ? { minHeight } : undefined}
    >
      {inView ? (
        children
      ) : (
        placeholder || (
          <div className="w-full h-full min-h-[140px] flex items-center justify-center py-10">
            <div className="flex flex-col items-center gap-2 text-gray-300">
              <div className="w-6 h-6 border-2 border-brand-yellow/30 border-t-brand-yellow rounded-full animate-spin" />
              <span className="text-[11px] font-semibold text-gray-400">Loading section...</span>
            </div>
          </div>
        )
      )}
    </div>
  );
}
