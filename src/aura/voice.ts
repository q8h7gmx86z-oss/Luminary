import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

import { cleanForSpeech, pickAuraVoice } from './voicePick';

let chosen: string | null | undefined;

async function auraVoice(): Promise<string | undefined> {
  if (chosen !== undefined) return chosen ?? undefined;
  try {
    let voices = await Speech.getAvailableVoicesAsync();
    // Web browsers load their voice list a moment after the page starts.
    if (Platform.OS === 'web' && voices.length === 0) {
      await new Promise((r) => setTimeout(r, 400));
      voices = await Speech.getAvailableVoicesAsync();
    }
    chosen = pickAuraVoice(voices.map((v) => ({ identifier: v.identifier, name: v.name, language: v.language, quality: String(v.quality) })))?.identifier ?? null;
  } catch {
    chosen = null;
  }
  return chosen ?? undefined;
}

/** Speaks Aura's answer on the device, with the Emma voice when it is installed. */
export async function speakAura(text: string, on: { start?: () => void; done?: () => void } = {}) {
  Speech.stop();
  const voice = await auraVoice();
  Speech.speak(cleanForSpeech(text), {
    voice,
    language: 'en-GB',
    rate: 0.98,
    onStart: on.start,
    onDone: on.done,
    onStopped: on.done,
    onError: on.done,
  });
}

export function stopAura() {
  Speech.stop();
}
