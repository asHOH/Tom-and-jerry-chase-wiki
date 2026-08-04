'use client';

import { useEffect } from 'react';

/**
 * Discourages casual saving of displayed images. This is intentionally only a
 * client-side deterrent and is not a security boundary for the image files.
 */
export default function ImageProtection() {
  useEffect(() => {
    const preventImageContextMenu = (event: MouseEvent) => {
      if (event.target instanceof HTMLImageElement) {
        event.preventDefault();
      }
    };

    const preventImageDrag = (event: DragEvent) => {
      if (event.target instanceof HTMLImageElement) {
        event.preventDefault();
      }
    };

    document.addEventListener('contextmenu', preventImageContextMenu);
    document.addEventListener('dragstart', preventImageDrag);

    return () => {
      document.removeEventListener('contextmenu', preventImageContextMenu);
      document.removeEventListener('dragstart', preventImageDrag);
    };
  }, []);

  return null;
}
