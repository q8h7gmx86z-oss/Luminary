import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Platform } from 'react-native';

/** A light tick for a right answer and a short buzz for a wrong one. Phones only. */
export function useAnswerHaptics(fb: string | null, good: string[]) {
  useEffect(() => {
    if (!fb || Platform.OS === 'web') return;
    const p = good.includes(fb)
      ? Haptics.selectionAsync()
      : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    p.catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fb]);
}
