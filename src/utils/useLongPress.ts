import { useRef, useCallback, useEffect } from 'react';

interface UseLongPressOptions {
  threshold?: number; // ms to trigger long press, default 800ms
  onLongPress: (e: React.TouchEvent | React.MouseEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
}

export function useLongPress({
  threshold = 800,
  onLongPress,
  onClick,
}: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressedRef = useRef(false);
  const startStateRef = useRef<{
    x: number;
    y: number;
    scrollX: number;
    scrollY: number;
    cancelled: boolean;
  } | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (startStateRef.current) {
      startStateRef.current.cancelled = true;
    }
    startStateRef.current = null;
  }, []);

  // Cancel any active long-press timer immediately if any ancestor or window scrolls
  useEffect(() => {
    const handleScroll = () => {
      if (timerRef.current || startStateRef.current) {
        clear();
      }
    };
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
      clear();
    };
  }, [clear]);

  const start = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      clear();
      isLongPressedRef.current = false;

      let x = 0;
      let y = 0;
      if ('touches' in e) {
        if (e.touches.length !== 1) return;
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
      } else if ('clientX' in e) {
        if ('button' in e && e.button !== 0) return;
        x = e.clientX;
        y = e.clientY;
      } else {
        return;
      }

      const initialState = {
        x,
        y,
        scrollX: typeof window !== 'undefined' ? window.scrollX : 0,
        scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
        cancelled: false,
      };
      startStateRef.current = initialState;

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (initialState.cancelled || startStateRef.current !== initialState) {
          return;
        }
        const scrollDiffX =
          typeof window !== 'undefined' ? Math.abs(window.scrollX - initialState.scrollX) : 0;
        const scrollDiffY =
          typeof window !== 'undefined' ? Math.abs(window.scrollY - initialState.scrollY) : 0;
        if (scrollDiffX > 2 || scrollDiffY > 2) {
          clear();
          return;
        }

        isLongPressedRef.current = true;
        try {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(40);
          }
        } catch {
          // Ignore vibration errors
        }
        onLongPress(e);
      }, threshold);
    },
    [clear, onLongPress, threshold]
  );

  const move = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!startStateRef.current) return;
      let currentX = 0;
      let currentY = 0;

      if ('touches' in e) {
        if (e.touches.length !== 1) {
          clear();
          return;
        }
        currentX = e.touches[0].clientX;
        currentY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        currentX = e.clientX;
        currentY = e.clientY;
      }

      const diffX = Math.abs(currentX - startStateRef.current.x);
      const diffY = Math.abs(currentY - startStateRef.current.y);
      const scrollDiffX =
        typeof window !== 'undefined' ? Math.abs(window.scrollX - startStateRef.current.scrollX) : 0;
      const scrollDiffY =
        typeof window !== 'undefined' ? Math.abs(window.scrollY - startStateRef.current.scrollY) : 0;

      // Cancel immediately if user starts dragging or scrolling (>= 6px or any page scroll)
      if (diffX > 6 || diffY > 6 || scrollDiffX > 2 || scrollDiffY > 2) {
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
    onMouseMove: move,
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchCancel: clear,
    onTouchMove: move,
    onClick: handleClick,
  };
}
