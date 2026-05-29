'use client';

import { useState, useEffect } from 'react';

export function useMobileDetect() {
  const [isMobile, setIsMobile] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Check if installed as PWA (`standalone` is a non-standard iOS Safari flag)
    const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
      navigatorWithStandalone.standalone === true
    );

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return { isMobile, isStandalone };
}
