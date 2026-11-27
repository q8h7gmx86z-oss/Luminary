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
