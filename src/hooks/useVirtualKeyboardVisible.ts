'use client';

import { useState, useEffect } from 'react';

// When the virtual keyboard is shown, the visual viewport is resized.
// We can detect this by checking if the visual viewport height is significantly
// smaller than the layout viewport (window.innerHeight).
const KEYBOARD_DETECTION_THRESHOLD_PX = 150;

export function useVirtualKeyboardVisible(): boolean {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) {
      return;
    }

    const visualViewport = window.visualViewport;

    const handleResize = () => {
      const isLikelyKeyboard =
        window.innerHeight - visualViewport.height > KEYBOARD_DETECTION_THRESHOLD_PX;
      setKeyboardVisible(isLikelyKeyboard);
    };

    visualViewport.addEventListener('resize', handleResize);

    // Initial check in case it's already open
    handleResize();

    return () => {
      visualViewport.removeEventListener('resize', handleResize);
    };
  }, []);

  return isKeyboardVisible;
}
