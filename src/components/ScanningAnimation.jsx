import React, { useEffect, useRef } from 'react';
import lottie from 'lottie-web';

export const ScanningAnimation = React.memo(({ isDarkMode, language, className = '' }) => {
  const containerRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    animRef.current = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: '/assets/scanning-animation.json',
    });

    return () => {
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }
    };
  }, []);

  return (
    <div className={`flex flex-col items-center gap-0 ${className}`}>
      <div
        ref={containerRef}
        className="w-[280px] h-[280px]"
      />
      <span
        className={`text-xs font-bold tracking-[0.15em] -mt-6 ${
          isDarkMode ? 'text-gray-500' : 'text-gray-400'
        }`}
      >
        {language === 'cn' ? '智能分析中...' : 'Analyzing...'}
      </span>
    </div>
  );
});

ScanningAnimation.displayName = 'ScanningAnimation';
