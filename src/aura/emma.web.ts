// Emma, Aura's voice, made on the phone. This is the engine from Sandra's Health & Social Care app
// (public/tts: Kokoro with the bf_emma voice, espeak-ng phonemes, ONNX Runtime Web), run the same way:
//
// - A module worker downloads the voice once (about 115 MB, then kept in the browser's cache) and
//   turns each sentence into 24 kHz audio.
// - Fast mode uses the phone's graphics chip (WebGPU) when it has half precision. If that fails, or
//   the page restarts while it is working, fast mode is marked as not working on this phone and Emma
//   uses the processor instead.
// - If Emma cannot start at all, the caller falls back to the system voice and the text stays on screen.

import { diag } from './diag';
import { speechPieces, wavBytes } from './voicePick';

export type EmmaState = 'idle' | 'loading' | 'ready' | 'failed';
export type EmmaStatus = { state: EmmaState; pct: number; fast: boolean; making: boolean; err: string };

type Msg = { type: string; id?: number; audio?: Float32Array; ms?: number; message?: string; gpu?: unknown; init?: boolean; backend?: string; got?: number; total?: number; stage?: string; info?: { warmMs?: number; warmSec?: number } };
type Pending = { res: (a: Float32Array) => void; rej: (e: Error) => void; text: string };

const BASE = '/tts/';
const RATE = 24000;
const SPEED = 1;
const K = { busy: 'luminary:emma-busy', gpuBusy: 'luminary:emma-busy-gpu', off: 'luminary:emma-off', gpuBad: 'luminary:emma-gpu-bad', gpuErr: 'luminary:emma-gpu-err' };

const ls = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
  del: (k: string) => { try { localStorage.removeItem(k); } catch { /* private mode */ } },
};

const E = {
  state: 'idle' as EmmaState,
  pct: 0,
  backend: null as null | 'gpu' | 'wasm',
  trying: false,
  w: null as Worker | null,
  p: null as Promise<void> | null,
  pend: new Map<number, Pending>(),
  nid: 0,
  rtf: null as number | null,
  skipGpu: false,
  stageAt: 0,
  making: false,
  err: '',
};
const listeners = new Set<(s: EmmaStatus) => void>();
const status = (): EmmaStatus => ({ state: E.state, pct: E.pct, fast: E.backend === 'gpu' || E.trying, making: E.making, err: E.err });
const emit = () => listeners.forEach((f) => f(status()));

// If the page restarted while Emma was loading or speaking, the phone ran out of memory. Pause fast
// mode (if it was on) or Emma's voice (if not) until asked to try again, as the Health app does.
(() => {
  const b = Number(ls.get(K.busy));
  if (b && Date.now() - b < 15 * 60000) {
    if (ls.get(K.gpuBusy)) ls.set(K.gpuBad, 'page restarted');
    else ls.set(K.off, '1');
  }
  ls.del(K.busy);
  ls.del(K.gpuBusy);
  if (ls.get(K.off)) E.state = 'failed';
})();

let speaking = 0;
function busy(on: boolean) {
  if (on) {
    ls.set(K.busy, String(Date.now()));
    if (E.backend === 'gpu' || E.trying) ls.set(K.gpuBusy, '1');
    else ls.del(K.gpuBusy);
  } else {
    ls.del(K.busy);
    ls.del(K.gpuBusy);
  }
}
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') busy(false);
    else if (E.state === 'loading' || speaking > 0) busy(true);
  });
  window.addEventListener('pagehide', () => busy(false));
}

export const emmaSupported = () => typeof Worker !== 'undefined' && typeof WebAssembly !== 'undefined' && !ls.get(K.off);
export const emmaStatus = status;
export function onEmmaStatus(f: (s: EmmaStatus) => void) {
  listeners.add(f);
  return () => { listeners.delete(f); };
}

const gpuWanted = () => typeof navigator !== 'undefined' && !!(navigator as { gpu?: unknown }).gpu && !ls.get(K.gpuBad) && !E.skipGpu;

function onMsg(m: Msg) {
  if (m.type === 'progress' && m.total) {
    E.pct = Math.min(99, Math.round(((m.got ?? 0) / m.total) * 100));
    emit();
    return;
  }
  if (m.type === 'stage') {
    E.stageAt = Date.now();
    return;
  }
  if (m.type !== 'audio' && m.type !== 'error') return;
  const p = m.id != null ? E.pend.get(m.id) : undefined;
  if (!p) return;
  if (m.type === 'error' && m.gpu && E.backend === 'gpu') {
    fallback(String(m.message));
    return;
  }
  E.pend.delete(m.id!);
  if (m.type === 'audio' && m.audio) {
    const sec = m.audio.length / RATE;
    if (sec > 0.5 && m.ms) {
      const r = m.ms / 1000 / sec;
      E.rtf = E.rtf ? E.rtf * 0.6 + r * 0.4 : r;
    }
    p.res(m.audio);
  } else p.rej(new Error(m.message || 'voice error'));
}

function makeWorker() {
  const w = new Worker(`${BASE}aura-worker2.mjs`, { type: 'module' });
  w.addEventListener('message', (e) => onMsg((e.data || {}) as Msg));
  return w;
}
function drop(w: Worker | null) {
  if (!w) return;
  try { w.postMessage({ type: 'dispose' }); } catch { /* gone */ }
  setTimeout(() => { try { w.terminate(); } catch { /* gone */ } }, 50);
}
function ask(w: Worker, msg: object, type: string, ms?: number): Promise<Msg> {
  return new Promise((res, rej) => {
    let tm: ReturnType<typeof setTimeout> | undefined;
    const off = () => { clearTimeout(tm); w.removeEventListener('message', on); w.removeEventListener('error', onErr); };
    const on = (e: MessageEvent) => {
      const m = (e.data || {}) as Msg;
      if (m.type === type) { off(); res(m); } else if (m.type === 'error' && (m.init || m.id == null)) { off(); rej(new Error(m.message)); }
    };
    const onErr = (ev: ErrorEvent) => { off(); rej(new Error(ev?.message || 'worker failed')); };
    w.addEventListener('message', on);
    w.addEventListener('error', onErr);
    if (ms) tm = setTimeout(() => { off(); rej(new Error('no answer')); }, ms);
    w.postMessage(msg);
  });
}

function init(): Promise<void> {
  if (E.p) return E.p;
  if (!emmaSupported()) {
    E.state = 'failed';
    emit();
    return Promise.reject(new Error('unavailable'));
  }
  E.state = 'loading';
  E.pct = 0;
  busy(true);
  emit();
  E.p = (async () => {
    let w: Worker | null = null;
    if (gpuWanted()) {
      w = makeWorker();
      let ok = false;
      try { ok = !!((await ask(w, { type: 'probe' }, 'probe', 10000)).gpu as { ok?: boolean })?.ok; } catch { ok = false; }
      if (ok) {
        E.trying = true;
        busy(true);
        emit();
        try {
          E.stageAt = 0;
          const r = await Promise.race([
            ask(w, { type: 'init', opts: { gpu: true, speed: SPEED } }, 'ready'),
            // If fast mode sits on setting up for more than 90 seconds, use the processor instead.
            new Promise<Msg>((_, rej) => {
              const t = setInterval(() => {
                if (E.stageAt && Date.now() - E.stageAt > 90000) { clearInterval(t); rej(new Error('fast mode took too long')); }
                if (!E.trying) clearInterval(t);
              }, 3000);
            }),
          ]);
          if (r.backend !== 'gpu') throw new Error('fast mode did not start');
          if (r.info?.warmSec && r.info.warmSec > 0.3 && r.info.warmMs) E.rtf = r.info.warmMs / 1000 / r.info.warmSec;
          ls.del(K.gpuErr);
          return ready(w, 'gpu');
        } catch (e) {
          ls.set(K.gpuBad, `setting up: ${String((e as Error)?.message).slice(0, 120)}`);
          E.trying = false;
          E.pct = 0;
        }
      }
      drop(w);
      w = null;
    }
    w = makeWorker();
    await ask(w, { type: 'init', opts: { gpu: false } }, 'ready');
    return ready(w, 'wasm');
  })();
  E.p.catch((e) => {
    diag(`emma failed to start: ${String((e as Error)?.message || e).slice(0, 80)}`);
    E.err = String((e as Error)?.message || e).slice(0, 140);
    E.state = 'failed';
    E.trying = false;
    E.p = null;
    busy(false);
    emit();
  });
  return E.p;
}

function ready(w: Worker, backend: 'gpu' | 'wasm') {
  diag(`emma ready (${backend})`);
  E.w = w;
  E.backend = backend;
  E.trying = false;
  E.state = 'ready';
  E.pct = 100;
  busy(speaking > 0);
  emit();
}

// Fast mode stumbled part way: hand everything still waiting to the normal engine.
function fallback(why: string) {
  const n = Number(ls.get(K.gpuErr) || 0) + 1;
  ls.set(K.gpuErr, String(n));
  if (n >= 2) ls.set(K.gpuBad, `while speaking: ${why.slice(0, 120)}`);
  E.skipGpu = true;
  const pend = [...E.pend.values()];
  E.pend.clear();
  drop(E.w);
  Object.assign(E, { w: null, p: null, backend: null, rtf: null, state: 'idle' as EmmaState });
  pend.forEach((p) => post(p.text).then(p.res, p.rej));
}

function post(text: string): Promise<Float32Array> {
  return init().then(
    () =>
      new Promise<Float32Array>((res, rej) => {
        const id = ++E.nid;
        E.pend.set(id, { res, rej, text });
        E.w!.postMessage({ type: 'speak', id, text, speed: SPEED });
      }),
  );
}

// ---- Playback --------------------------------------------------------------------------------

let audio: HTMLAudioElement | null = null;
let gen = 0;
let urls: string[] = [];
let wake: (() => void) | null = null;
let silent = '';
// True while the silent unlock clip is the one loaded, so its late success never pauses Emma.
let primed = false;
const el = () => {
  if (!audio) {
    audio = document.createElement('audio');
    audio.preload = 'auto';
    audio.setAttribute('playsinline', '');
    document.body.appendChild(audio);
  }
  return audio;
};
const toUrl = (a: Float32Array) => {
  const u = URL.createObjectURL(new Blob([wavBytes(a, RATE) as BlobPart], { type: 'audio/wav' }));
  urls.push(u);
  return u;
};

/** Unlocks audio on iPhone during the tap, so Emma can speak when the answer arrives. */
export function primeEmma() {
  if (typeof document === 'undefined') return;
  const a = el();
  if (a.dataset.ok) return;
  // A silent clip kept for the page's life: emmaStop() must not revoke it while it is unlocking.
  if (!silent) silent = URL.createObjectURL(new Blob([wavBytes(new Float32Array(2400), RATE) as BlobPart], { type: 'audio/wav' }));
  a.src = silent;
  a.muted = true;
  primed = true;
  a.play().then(
    () => { a.dataset.ok = '1'; diag('audio unlocked'); if (primed) { a.pause(); a.muted = false; } },
    (e: Error) => { diag(`unlock failed: ${e?.name}`); a.muted = false; },
  );
}

export function emmaStop() {
  gen++;
  if (E.w && E.pend.size) {
    try { E.w.postMessage({ type: 'cancel', ids: [...E.pend.keys()] }); } catch { /* gone */ }
  }
  try { audio?.pause(); } catch { /* none */ }
  wake?.();
  wake = null;
  urls.forEach((u) => URL.revokeObjectURL(u));
  urls = [];
}

/** Starts getting Emma ready in the background (download once, then from the cache). */
export function emmaWarm() {
  if (E.state === 'ready' || E.p || !emmaSupported()) return;
  init().catch(() => { /* status shows why */ });
}

/** True once Emma is ready to speak, waiting at most `ms` for her. Starts getting her ready if nothing has yet. */
export function emmaWait(ms: number): Promise<boolean> {
  if (E.state === 'ready') return Promise.resolve(true);
  if (!E.p) emmaWarm();
  if (!E.p) return Promise.resolve(false);
  return new Promise((res) => {
    const t = setTimeout(() => res(E.state === 'ready'), ms);
    E.p!.then(() => { clearTimeout(t); res(true); }, () => { clearTimeout(t); res(false); });
  });
}

/** Lets Emma try again after she was paused on this phone. */
export function emmaRetry() {
  E.err = '';
  ls.del(K.off);
  ls.del(K.gpuBad);
  ls.del(K.gpuErr);
  if (E.state === 'failed') E.state = 'idle';
  E.skipGpu = false;
  emit();
}

/**
 * Reads Aura's answer with Emma's voice. Every sentence is queued at once and arrives in order.
 * Emma is made a little slower than she speaks on most phones, so she starts once enough is ready
 * to read to the end without stopping. Rejects if Emma cannot start, so the caller can fall back.
 */
export async function emmaSpeak(text: string, on: { start?: () => void; done?: () => void } = {}): Promise<void> {
  emmaStop();
  const my = ++gen;
  const pieces = speechPieces(text);
  if (!pieces.length) { on.done?.(); return; }
  if (++speaking === 1) busy(true);
  let failed = false;
  try {
    E.making = true;
    emit();
    await init();
    if (my !== gen) return;
    const clips = pieces.map((t) => post(t));
    const ready: (Float32Array | null)[] = pieces.map(() => null);
    clips.forEach((p, k) => p.then((a) => { ready[k] = a; }, () => {}));
    const est = (t: string) => Math.max(0.6, t.length * 0.066);
    const rtf = () => E.rtf ?? (E.backend === 'gpu' ? 0.6 : 1.8);
    const enough = (i: number) => {
      let remain = 0;
      let ahead = 0;
      let all = true;
      for (let k = i; k < pieces.length; k++) {
        const c = ready[k];
        if (!c) { all = false; remain += est(pieces[k]); } else remain += c.length / RATE;
      }
      if (all) return true;
      for (let k = i; k < pieces.length && ready[k]; k++) ahead += ready[k]!.length / RATE;
      const r = rtf();
      return !!ready[i] && ahead >= remain * (1 - 1 / Math.max(1, r)) + (r < 0.9 ? 0.5 : 1.5);
    };
    const a = el();
    let started = false;
    for (let i = 0; i < pieces.length; i++) {
      if (!ready[i] || i === 0) {
        while (!enough(i)) {
          if (my !== gen) return;
          const k = ready.findIndex((c, j) => j >= i && !c);
          await clips[k];
        }
      }
      if (my !== gen) return;
      if (!started) { started = true; on.start?.(); }
      primed = false;
      a.src = toUrl(ready[i]!);
      a.muted = false;
      a.volume = 1;
      E.making = false;
      emit();
      await new Promise<void>((res, rej) => {
        wake = res;
        a.onended = () => { if (i === 0 || i === pieces.length - 1) diag(`emma piece ${i + 1} ended at ${a.currentTime.toFixed(1)}s`); res(); };
        a.onerror = () => { diag(`emma audio error ${a.error?.code}`); rej(new Error('playback failed')); };
        a.play().then(
          () => { if (i === 0) diag(`emma playing (${E.backend}, muted=${a.muted}, vol=${a.volume})`); },
          (e: Error) => { diag(`emma play refused: ${e?.name}`); rej(new Error(e?.name === 'NotAllowedError' ? 'blocked' : `playback: ${e?.message}`)); },
        );
      });
      if (my !== gen) return;
      await new Promise((r) => setTimeout(r, 160));
    }
  } catch (e) {
    failed = true;
    E.err = String((e as Error)?.message || e).slice(0, 140);
    throw e;
  } finally {
    E.making = false;
    emit();
    if (--speaking === 0) busy(false);
    if (my === gen && !failed) on.done?.();
  }
}
