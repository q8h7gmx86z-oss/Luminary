// Crisis and urgent-help resources, chosen by the user's region.
// Every number here must be checked by a person before a public release.
// Keep this file free of React so it can be unit tested with plain Node.

export type HelpLine = {
  name: string;
  detail: string;
  /** Digits to dial, or null if it is text-only. */
  call?: string;
  /** How the number is written locally, for display. */
  callLabel?: string;
  /** SMS number and the word to send, for text services. */
  text?: { to: string; body: string };
  url?: string;
  /** Shown first and styled as the emergency option. */
  emergency?: boolean;
  /** Mainly for under-18s. */
  young?: boolean;
};

export type Region = 'GB' | 'IE' | 'US' | 'CA' | 'AU' | 'NZ' | 'OTHER';

export const REGION_NAMES: Record<Region, string> = {
  GB: 'United Kingdom',
  IE: 'Ireland',
  US: 'United States',
  CA: 'Canada',
  AU: 'Australia',
  NZ: 'New Zealand',
  OTHER: 'Somewhere else',
};

const LINES: Record<Region, HelpLine[]> = {
  GB: [
    { name: 'Emergency: 999', detail: 'If you or someone else is in immediate danger.', call: '999', emergency: true },
    { name: 'Samaritans', detail: 'Free, any time, day or night. You can talk about anything.', call: '116123', callLabel: '116 123', url: 'https://www.samaritans.org' },
    { name: 'Shout', detail: 'Free 24/7 text support. Text SHOUT to 85258.', text: { to: '85258', body: 'SHOUT' }, url: 'https://giveusashout.org' },
    { name: 'NHS 111', detail: 'Urgent help that is not an emergency. In England, choose the mental health option.', call: '111', url: 'https://111.nhs.uk' },
    { name: 'Childline', detail: 'For anyone under 19. Free and confidential.', call: '08001111', callLabel: '0800 1111', url: 'https://www.childline.org.uk', young: true },
  ],
  IE: [
    { name: 'Emergency: 112 or 999', detail: 'If you or someone else is in immediate danger.', call: '112', emergency: true },
    { name: 'Samaritans', detail: 'Free, any time, day or night.', call: '116123', callLabel: '116 123', url: 'https://www.samaritans.org' },
    { name: '50808', detail: 'Free 24/7 text support. Text HELLO to 50808.', text: { to: '50808', body: 'HELLO' }, url: 'https://text50808.ie' },
    { name: 'Childline', detail: 'For anyone under 18.', call: '1800666666', callLabel: '1800 66 66 66', url: 'https://www.childline.ie', young: true },
  ],
  US: [
    { name: 'Emergency: 911', detail: 'If you or someone else is in immediate danger.', call: '911', emergency: true },
    { name: '988 Suicide & Crisis Lifeline', detail: 'Call or text 988, any time.', call: '988', text: { to: '988', body: '' }, url: 'https://988lifeline.org' },
    { name: 'Crisis Text Line', detail: 'Text HOME to 741741.', text: { to: '741741', body: 'HOME' }, url: 'https://www.crisistextline.org' },
  ],
  CA: [
    { name: 'Emergency: 911', detail: 'If you or someone else is in immediate danger.', call: '911', emergency: true },
    { name: '988 Suicide Crisis Helpline', detail: 'Call or text 988, any time.', call: '988', text: { to: '988', body: '' }, url: 'https://988.ca' },
    { name: 'Kids Help Phone', detail: 'For young people. Call or text 686868.', call: '18006686868', callLabel: '1-800-668-6868', url: 'https://kidshelpphone.ca', young: true },
  ],
  AU: [
    { name: 'Emergency: 000', detail: 'If you or someone else is in immediate danger.', call: '000', emergency: true },
    { name: 'Lifeline', detail: 'Free, 24/7 crisis support.', call: '131114', callLabel: '13 11 14', url: 'https://www.lifeline.org.au' },
    { name: 'Kids Helpline', detail: 'For ages 5 to 25.', call: '1800551800', callLabel: '1800 55 1800', url: 'https://kidshelpline.com.au', young: true },
  ],
  NZ: [
    { name: 'Emergency: 111', detail: 'If you or someone else is in immediate danger.', call: '111', emergency: true },
    { name: 'Need to talk? 1737', detail: 'Call or text 1737, free, any time.', call: '1737', text: { to: '1737', body: '' }, url: 'https://1737.org.nz' },
  ],
  OTHER: [
    { name: 'Your local emergency number', detail: 'If you or someone else is in immediate danger, call your local emergency number now.', emergency: true },
    { name: 'Find a Helpline', detail: 'Free, confidential helplines in over 130 countries.', url: 'https://findahelpline.com' },
  ],
};

const KNOWN = new Set<string>(Object.keys(LINES));

/** Map a device region code (like "GB" or "UK") to a supported region. */
export function regionFromCode(code: string | null | undefined): Region {
  if (!code) return 'OTHER';
  const c = code.toUpperCase();
  if (c === 'UK') return 'GB';
  return KNOWN.has(c) ? (c as Region) : 'OTHER';
}

export function helpLinesFor(region: Region): HelpLine[] {
  return LINES[region];
}

export function telUrl(digits: string): string {
  return `tel:${digits}`;
}

export function smsUrl(to: string, body: string, platform: string): string {
  if (!body) return `sms:${to}`;
  // iOS uses "&" before body, Android and web use "?".
  const sep = platform === 'ios' ? '&' : '?';
  return `sms:${to}${sep}body=${encodeURIComponent(body)}`;
}
