import { useCallback, useEffect, useRef } from 'react';

/**
 * Возвращает "задебаунсенную" версию callback-а: реальный вызов
 * произойдёт только через `delay` мс после последнего вызова.
 * Полезно для событий карты (moveend/zoomend), которые иначе
 * дёргаются десятки раз за секунду перетаскивания.
 */
export function useDebouncedCallback(callback, delay = 250) {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return useCallback(
    (...args) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}