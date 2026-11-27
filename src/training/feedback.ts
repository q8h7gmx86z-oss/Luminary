import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';

import { useAuraReact } from '@/aura/Aura';
import { useStore } from '@/lib/store';

// Original sounds, synthesised by scripts/sounds/make.py.
const SOURCES = {
  right: require('../../assets/sounds/right.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
  complete: require('../../assets/sounds/complete.wav'),
  'breathe-in': require('../../assets/sounds/breathe-in.wav'),
  'breathe-out': require('../../assets/sounds/breathe-out.wav'),
};
export type Cue = keyof typeof SOURCES;

const players: Partial<Record<Cue, AudioPlayer>> = {};
let modeSet = false;

function player(cue: Cue): AudioPlayer | undefined {
  try {
    if (!modeSet) {
      modeSet = true;
      // Respect the silent switch, and never stop the music someone is already listening to.
      setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
    }
    if (!players[cue]) players[cue] = createAudioPlayer(SOURCES[cue]);
    return players[cue];
  } catch {
    return undefined;
  }
}

/** Load the sounds ahead of time so the first one is not late. */
export function preloadCues() {
  (Object.keys(SOURCES) as Cue[]).forEach(player);
}

function playCue(cue: Cue, volume: number) {
  const p = player(cue);
  if (!p) return;
  try {
    p.volume = volume;
    Promise.resolve(p.seekTo(0))
      .catch(() => {})
      .finally(() => p.play());
  } catch {
    // Sound is a nice extra; never let it break a game.
  }
}

/** Sound and vibration for a moment in a game, following the person's settings. */
export function useCue() {
  const { state } = useStore();
  const { sound, vibration, volume } = state.settings;
  return useCallback(
    (cue: Cue) => {
      if (sound) playCue(cue, volume === 'standard' ? 1 : 0.45);
      if (vibration && Platform.OS !== 'web' && (cue === 'right' || cue === 'wrong')) {
        (cue === 'right' ? Haptics.selectionAsync() : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)).catch(() => {});
      }
    },
    [sound, vibration, volume],
  );
}

/** Plays the right or wrong cue whenever a game's feedback state changes. */
export function useAnswerFeedback(fb: string | null, good: string[]) {
  const cue = useCue();
  const aura = useAuraReact();
  useEffect(() => {
    if (!fb) return;
    const right = good.includes(fb);
    cue(right ? 'right' : 'wrong');
    aura(right);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fb]);
}
