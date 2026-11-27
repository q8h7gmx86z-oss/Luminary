import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

import { emmaSpeak, emmaStop, emmaSupported, primeEmma } from './emma';
import { cleanForSpeech, pickAuraVoice } from './voicePick';

// Aura speaks with Emma, the Kokoro bf_emma voice made on the phone, as in Sandra's other apps.
// Where Emma can't run (native builds for now, or a phone where she failed to start), the system's
// own British voice reads instead.

let chosen: string | null | undefined;

async function systemVoice(): Promise<string | undefined> {
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

async function speakSystem(text: string, on: { start?: () => void; done?: () => void }) {
  Speech.stop();
  const voice = await systemVoice();
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

/** Call during the tap that will lead to speech, so phones allow the audio to play later. */
export function primeAura() {
  primeEmma();
  // iPhones only let a page speak with the system voice after it has spoken during a tap, so say
  // nothing, silently, now. Then the fallback voice works if Emma can't start.
  if (Platform.OS === 'web') {
    try {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      window.speechSynthesis.speak(u);
    } catch {
      // no speech engine on this browser
    }
  }
}

/** Reads Aura's answer aloud: Emma where she can run, the system voice otherwise. */
export async function speakAura(text: string, on: { start?: () => void; done?: () => void } = {}) {
  stopAura();
  if (emmaSupported()) {
    try {
      await emmaSpeak(text, on);
      return;
    } catch {
      // Emma couldn't start on this phone; the system voice reads this answer instead.
    }
  }
  await speakSystem(text, on);
}

export function stopAura() {
  emmaStop();
  Speech.stop();
}
