import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

/** Keyboard shortcuts for games on the web. Does nothing on phones. */
export function useKeys(map: Record<string, () => void>) {
  const ref = useRef(map);
  ref.current = map;
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      const fn = ref.current[e.key];
      if (fn && !e.repeat) {
        e.preventDefault();
        fn();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
