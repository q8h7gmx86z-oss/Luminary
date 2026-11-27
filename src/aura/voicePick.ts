// Choosing Aura's voice. In Sandra's apps Aura speaks with the phone's own speech engine
// using the voice called Emma. Pure, so it can be tested.

export type VoiceInfo = { identifier: string; name: string; language: string; quality?: string };

/** Fallback British voices, in order, if Emma is not installed on this device. */
const BRITISH_FALLBACKS = ['serena', 'kate', 'stephanie', 'martha', 'female'];

const qualityRank = (q?: string) => (q === 'Enhanced' || q === 'Premium' || q === 'enhanced' ? 0 : 1);

export function pickAuraVoice(voices: VoiceInfo[]): VoiceInfo | undefined {
  const byQuality = (a: VoiceInfo, b: VoiceInfo) => qualityRank(a.quality) - qualityRank(b.quality);
  const lower = (v: VoiceInfo) => `${v.name} ${v.identifier}`.toLowerCase();
  const emma = voices.filter((v) => /\bemma\b/.test(lower(v))).sort((a, b) => {
    const gb = (v: VoiceInfo) => (v.language.toLowerCase().replace('_', '-').startsWith('en-gb') ? 0 : 1);
    return gb(a) - gb(b) || byQuality(a, b);
  });
  if (emma[0]) return emma[0];
  const british = voices.filter((v) => v.language.toLowerCase().replace('_', '-').startsWith('en-gb'));
  for (const name of BRITISH_FALLBACKS) {
    const m = british.filter((v) => lower(v).includes(name)).sort(byQuality);
    if (m[0]) return m[0];
  }
  return british.sort(byQuality)[0];
}

/** Text as it should be spoken: no markdown symbols, no emoji, acronyms said as words where sensible. */
export function cleanForSpeech(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/[*_#]/g, '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/(\p{L})\/(\p{L})/gu, '$1 or $2')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Aura's answer split the way Emma reads it: sentence by sentence, with long sentences broken at
 * commas so each piece is quick to make on the phone. Same rules as Sandra's Health app.
 */
export function speechPieces(text: string): string[] {
  const clean = cleanForSpeech(text);
  const sentences = clean.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? (clean ? [clean] : []);
  const out: string[] = [];
  for (const s of sentences) {
    if (s.length <= 110) {
      out.push(s);
      continue;
    }
    let cur = '';
    for (const p of s.split(/(?<=[,;:])\s+/)) {
      if (cur && `${cur} ${p}`.length > 100) {
        out.push(cur);
        cur = p;
      } else cur = cur ? `${cur} ${p}` : p;
    }
    if (cur) out.push(cur);
  }
  return out;
}

/** 16-bit mono WAV bytes from Emma's 24 kHz samples, so the browser can play them. */
export function wavBytes(samples: Float32Array, rate = 24000): Uint8Array {
  const n = samples.length;
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); ws(8, 'WAVE'); ws(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  ws(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Uint8Array(buf);
}
