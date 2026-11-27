// Emma, Aura's voice, made on the device. The real engine is web only (emma.web.ts), the same
// on-device Kokoro bf_emma engine as Sandra's other apps. Native builds use the system voice for now.

export type EmmaState = 'idle' | 'loading' | 'ready' | 'failed';
export type EmmaStatus = { state: EmmaState; pct: number; fast: boolean; making: boolean; err: string };

export const emmaSupported = () => false;
export const emmaStatus = (): EmmaStatus => ({ state: 'failed', pct: 0, fast: false, making: false, err: '' });
export const onEmmaStatus = (_f: (s: EmmaStatus) => void) => () => {};
export const primeEmma = () => {};
export function emmaSpeak(_text: string, _on: { start?: () => void; done?: () => void }): Promise<void> {
  return Promise.reject(new Error('unavailable'));
}
export const emmaStop = () => {};
export const emmaRetry = () => {};
