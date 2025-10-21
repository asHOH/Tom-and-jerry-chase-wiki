import { useEffect, useRef, useCallback } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance for a swipe
  velocityThreshold?: number; // Minimum velocity for a swipe
  preventDefaultTouchmove?: boolean;
  disabled?: boolean;
  directionLockThreshold?: number; // Minimum axis difference before locking direction
}

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

export const useSwipeGesture = (options: SwipeGestureOptions = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    velocityThreshold = 0.3,
    preventDefaultTouchmove = false,
    disabled = false,
    directionLockThreshold = 16,
  } = options;

  const touchStart = useRef<TouchPoint | null>(null);
  const touchEnd = useRef<TouchPoint | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);
  const lockedAxisRef = useRef<'x' | 'y' | null>(null);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled) return;

      const touch = e.touches[0];
      if (!touch) return;

      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      touchEnd.current = null;
      lockedAxisRef.current = null;
    },
    [disabled]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (disabled) return;

      if (preventDefaultTouchmove) {
        e.preventDefault();
      }

      const touch = e.touches[0];
      if (!touch) return;

      touchEnd.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };

      if (touchStart.current && lockedAxisRef.current === null) {
        const deltaX = touchEnd.current.x - touchStart.current.x;
        const deltaY = touchEnd.current.y - touchStart.current.y;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        if (absDeltaX > absDeltaY + directionLockThreshold) {
          lockedAxisRef.current = 'x';
        } else if (absDeltaY > absDeltaX + directionLockThreshold) {
          lockedAxisRef.current = 'y';
        }
      }
    },
    [disabled, preventDefaultTouchmove, directionLockThreshold]
  );

  const handleTouchEnd = useCallback(() => {
    if (disabled || !touchStart.current || !touchEnd.current) return;

    const deltaX = touchEnd.current.x - touchStart.current.x;
    const deltaY = touchEnd.current.y - touchStart.current.y;
    const deltaTime = touchEnd.current.time - touchStart.current.time;

    if (deltaTime === 0) {
      touchStart.current = null;
      touchEnd.current = null;
      lockedAxisRef.current = null;
      return;
    }

    // Calculate distance and velocity
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / deltaTime;

    // Check if swipe meets threshold requirements
    if (distance < threshold || velocity < velocityThreshold) {
      return;
    }

    // Determine swipe direction based on the larger delta
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    let primaryAxis = lockedAxisRef.current;

    if (!primaryAxis) {
      if (absDeltaX > absDeltaY + directionLockThreshold) {
        primaryAxis = 'x';
      } else if (absDeltaY > absDeltaX + directionLockThreshold) {
        primaryAxis = 'y';
      }
    }

    if (!primaryAxis) {
      touchStart.current = null;
      touchEnd.current = null;
      lockedAxisRef.current = null;
      return;
    }

    if (primaryAxis === 'x') {
      // Horizontal swipe
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }

    // Reset touch points
    touchStart.current = null;
    touchEnd.current = null;
    lockedAxisRef.current = null;
  }, [
    disabled,
    threshold,
    velocityThreshold,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    directionLockThreshold,
  ]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Add touch event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefaultTouchmove });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, preventDefaultTouchmove]);

  return elementRef;
};
