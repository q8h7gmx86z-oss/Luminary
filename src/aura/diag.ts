// A short log of what Aura's voice did, shown in the sound check so a problem on a phone can be
// seen without a computer. Kept in memory only.

const lines: string[] = [];
const t0 = Date.now();
const listeners = new Set<() => void>();

export function diag(msg: string) {
  lines.push(`${((Date.now() - t0) / 1000).toFixed(1)}s ${msg}`);
  if (lines.length > 40) lines.shift();
  listeners.forEach((f) => f());
}
export const diagLines = () => [...lines];
export function onDiag(f: () => void) {
  listeners.add(f);
  return () => { listeners.delete(f); };
}

/** Asks the phone to treat Aura's speech as playback, so the silent switch doesn't mute her (Safari 17+). */
export function playbackSession() {
  try {
    const s = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
    if (s && s.type !== 'playback') { s.type = 'playback'; diag('audio session set to playback'); }
  } catch { /* not supported */ }
}
