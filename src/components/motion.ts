import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import { useStore } from '@/lib/store';

/** True when the person or their device asks for less motion, or the person chose calmer visuals. */
export function useReducedMotion(): boolean {
  const { state } = useStore();
  const [system, setSystem] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setSystem)
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setSystem);
    return () => sub.remove();
  }, []);
  return system || state.settings.calmMode || state.settings.visuals === 'minimal';
}

/** Counts a number up smoothly once, then holds it. Jumps straight to the value under reduced motion. */
export function useCountUp(value: number, ms = 900): number {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? value : 0);
  const from = useRef(0);
  useEffect(() => {
    if (reduced) {
      setShown(value);
      return;
    }
    const start = Date.now();
    const a = from.current;
    let raf = 0;
    const step = () => {
      const k = Math.min(1, (Date.now() - start) / ms);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(a + (value - a) * eased));
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, ms, reduced]);
  return shown;
}
