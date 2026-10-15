import { useRef, useCallback } from 'react';

interface UseLongPressOptions {
  threshold?: number; // ms to trigger long press, default 500ms
  onLongPress: (e: React.TouchEvent | React.MouseEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
}

export function useLongPress({
  threshold = 500,
  onLongPress,
  onClick,
}: UseLongPressOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressedRef = useRef(false);
  const startCoordsRef = useRef<{ x: number; y: number } | null>(null);

  const start = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      isLongPressedRef.current = false;

      if ('touches' in e && e.touches.length > 0) {
        startCoordsRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      } else if ('clientX' in e) {
        startCoordsRef.current = {
          x: e.clientX,
          y: e.clientY,
        };
      }

      timerRef.current = setTimeout(() => {
        isLongPressedRef.current = true;
        try {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(50);
          }
        } catch {
          // Ignore vibration errors
        }
        onLongPress(e);
      }, threshold);
    },
    [onLongPress, threshold]
  );

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const move = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!startCoordsRef.current) return;
      let currentX = 0;
      let currentY = 0;

      if ('touches' in e && e.touches.length > 0) {
        currentX = e.touches[0].clientX;
        currentY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        currentX = e.clientX;
        currentY = e.clientY;
      }

      const diffX = Math.abs(currentX - startCoordsRef.current.x);
      const diffY = Math.abs(currentY - startCoordsRef.current.y);

      // If user moved finger more than 10px, they are likely scrolling
      if (diffX > 10 || diffY > 10) {
        clear();
      }
    },
    [clear]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isLongPressedRef.current) {
        e.preventDefault();
        e.stopPropagation();
        isLongPressedRef.current = false;
        return;
      }
      if (onClick) {
        onClick(e);
      }
    },
    [onClick]
  );

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: move,
    onClick: handleClick,
  };
}
