'use client';

import { useEffect, useRef, useState } from 'react';

const BASE_ICON = '/icon.png';

export function DynamicFaviconEditBadge() {
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const linkId = 'dynamic-favicon-edit';
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem('isEditMode');
        setIsEditMode(stored ? JSON.parse(stored) : false);
      } catch {}

      const onStorage = (e: StorageEvent) => {
        if (e.key === 'isEditMode' && e.newValue !== e.oldValue) {
          try {
            setIsEditMode(e.newValue ? JSON.parse(e.newValue) : false);
          } catch {}
        }
      };

      const onCustom = (e: Event) => {
        try {
          const detail = (e as CustomEvent).detail;
          if (typeof detail?.isEditMode === 'boolean') setIsEditMode(detail.isEditMode);
        } catch {}
      };

      window.addEventListener('storage', onStorage);
      window.addEventListener('editmode:changed', onCustom as EventListener);

      return () => {
        mountedRef.current = false;
        window.removeEventListener('storage', onStorage);
        window.removeEventListener('editmode:changed', onCustom as EventListener);
      };
    }
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const ensureLink = () => {
      let link = document.getElementById(linkId) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.id = linkId;
        link.rel = 'icon';
        link.type = 'image/png';
        document.head.appendChild(link);
      }
      return link;
    };

    const removeLink = () => {
      const link = document.getElementById(linkId);
      if (link && link.parentNode) link.parentNode.removeChild(link);
    };

    const drawBadge = async () => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = BASE_ICON;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load base icon'));
      });

      const size = 64; // high-res for better clarity
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);

      // Draw tiny edit badge (amber circle with pencil)
      const r = 13; // badge radius
      const cx = size - r - 4;
      const cy = size - r - 4;

      // Outer circle
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#F59E0B'; // amber-500
      ctx.fill();

      // Pencil: a small white rectangle with a triangular tip, rotated
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-Math.PI / 6); // slight tilt

      // Pencil body
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-6, -2, 12, 4);

      // Pencil tip
      ctx.beginPath();
      ctx.moveTo(6, -2);
      ctx.lineTo(9, 0);
      ctx.lineTo(6, 2);
      ctx.closePath();
      ctx.fill();

      // Eraser
      ctx.fillStyle = '#E5E7EB'; // gray-200
      ctx.fillRect(-8, -2, 2, 4);
      ctx.restore();

      return canvas.toDataURL('image/png');
    };

    let cancelled = false;
    (async () => {
      if (isEditMode) {
        try {
          const dataUrl = await drawBadge();
          if (!dataUrl || cancelled || !mountedRef.current) return;
          const link = ensureLink();
          link.href = dataUrl;
        } catch {
          // If drawing fails, fail silently and keep default favicon
        }
      } else {
        removeLink();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isEditMode]);

  return null;
}
