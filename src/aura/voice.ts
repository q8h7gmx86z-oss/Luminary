import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

import { emmaSpeak, emmaStop, emmaSupported, emmaWait, primeEmma } from './emma';
import { cleanForSpeech, pickAuraVoice, speechPieces } from './voicePick';

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
  if (Platform.OS === 'web') return speakWeb(text, on);
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

// ---- The browser's own voice ------------------------------------------------------------------
// Used directly rather than through expo-speech, because on iPhone expo-speech can wait forever for
// the voice list (Safari and Chrome on iPhone often never send "voiceschanged"), so Aura never spoke.

let webGen = 0;
let cancelledAt = 0;
let held: SpeechSynthesisUtterance[] = [];
const synth = () => (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null);

/** The voice list, waiting at most a second for it to load. Never hangs. */
async function webVoices(): Promise<SpeechSynthesisVoice[]> {
  const s = synth();
  if (!s) return [];
  let v = s.getVoices();
  for (let i = 0; i < 10 && !v.length; i++) {
    await new Promise((r) => setTimeout(r, 100));
    v = s.getVoices();
  }
  return v;
}

let webChosen: SpeechSynthesisVoice | null | undefined;
async function webVoice(): Promise<SpeechSynthesisVoice | null> {
  if (webChosen) return webChosen;
  const all = await webVoices();
  const quality = (v: SpeechSynthesisVoice) => (/enhanced|premium|natural/i.test(v.name) ? 'Enhanced' : 'Default');
  const pick = pickAuraVoice(all.map((v) => ({ identifier: v.voiceURI, name: v.name, language: v.lang, quality: quality(v) })));
  const v = pick ? all.find((x) => x.voiceURI === pick.identifier) ?? null : null;
  if (all.length) webChosen = v;
  return v;
}

async function speakWeb(text: string, on: { start?: () => void; done?: () => void }) {
  const s = synth();
  const pieces = speechPieces(text);
  if (!s || !pieces.length) { on.done?.(); return; }
  const my = ++webGen;
  const voice = await webVoice();
  if (my !== webGen) return;
  // Safari drops speech that is queued straight after cancel(), so leave a short gap.
  if (s.speaking || s.pending) { s.cancel(); cancelledAt = Date.now(); }
  const gap = 150 - (Date.now() - cancelledAt);
  if (gap > 0) await new Promise((r) => setTimeout(r, gap));
  if (my !== webGen) return;
  let started = false;
  let left = pieces.length;
  const finish = () => { if (my === webGen) { held = []; on.done?.(); } };
  held = pieces.map((t) => {
    const u = new SpeechSynthesisUtterance(t);
    if (voice) u.voice = voice;
    u.lang = voice?.lang || 'en-GB';
    u.rate = 0.98;
    u.onstart = () => { if (!started && my === webGen) { started = true; on.start?.(); } };
    u.onend = u.onerror = () => { if (--left === 0) finish(); };
    return u;
  });
  // Keeping the utterances referenced stops some browsers from dropping their events.
  held.forEach((u) => s.speak(u));
  // iPhones sometimes leave speech paused after the page was in the background.
  try { s.resume(); } catch { /* not supported */ }
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
  // Emma reads if she is ready, or gets ready within a few seconds (she was set loading when the
  // screen opened). While she is still downloading the first time, the standard voice reads this
  // answer so Aura is never silent, and Emma takes over once she is ready.
  if (emmaSupported() && (await emmaWait(8000))) {
    try {
      await emmaSpeak(text, on);
      return;
    } catch {
      // Emma couldn't read this one; the system voice reads it instead.
    }
  }
  await speakSystem(text, on);
}

export function stopAura() {
  emmaStop();
  if (Platform.OS === 'web') {
    webGen++;
    held = [];
    const s = synth();
    try { if (s && (s.speaking || s.pending)) { s.cancel(); cancelledAt = Date.now(); } } catch { /* none */ }
  } else Speech.stop();
}
