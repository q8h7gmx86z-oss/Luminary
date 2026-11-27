import assert from 'node:assert/strict';
import { test } from 'node:test';

import { askAura, researchLibrary, trainingContext, trimTurns } from '../src/aura/chat.ts';
import { cleanForSpeech, pickAuraVoice } from '../src/aura/voicePick.ts';

test('Emma is chosen when installed, preferring the British, enhanced one', () => {
  const v = pickAuraVoice([
    { identifier: 'kate', name: 'Kate', language: 'en-GB', quality: 'Enhanced' },
    { identifier: 'emma-us', name: 'Emma', language: 'en-US', quality: 'Default' },
    { identifier: 'emma-gb', name: 'Emma', language: 'en-GB', quality: 'Default' },
    { identifier: 'emma-gb-e', name: 'Emma (Enhanced)', language: 'en-GB', quality: 'Enhanced' },
  ]);
  assert.equal(v?.identifier, 'emma-gb-e');
});

test('Without Emma, a British female voice is used, then any British voice', () => {
  assert.equal(pickAuraVoice([{ identifier: 'd', name: 'Daniel', language: 'en-GB' }, { identifier: 's', name: 'Serena', language: 'en_GB' }])?.identifier, 's');
  assert.equal(pickAuraVoice([{ identifier: 'd', name: 'Daniel', language: 'en-GB' }])?.identifier, 'd');
  assert.equal(pickAuraVoice([{ identifier: 'x', name: 'Alex', language: 'en-US' }]), undefined);
});

test('Speech text has no markdown or emoji', () => {
  assert.equal(cleanForSpeech('**Sleep** matters 😴\n- first\n1. second'), 'Sleep matters first second');
  assert.equal(cleanForSpeech('speed/accuracy'), 'speed or accuracy');
});

test('Research library covers every card with its honest part', () => {
  const lib = researchLibrary();
  assert.match(lib, /The honest part:/);
  assert.match(lib, /Speed Match/);
  assert.ok(lib.length > 2000 && lib.length < 120000, `library is ${lib.length} chars`);
});

test('Training context is factual and handles a new person', () => {
  assert.match(trainingContext({ sessionMinutes: 10, goal: 'Mixed', score: null, baselineGain: null, skills: [], games: [], sessionsThisWeek: 0, streakDays: 0, untimed: false }), /No training yet/);
  const c = trainingContext({
    sessionMinutes: 10, goal: 'Mixed', score: 420, baselineGain: 35,
    skills: [{ name: 'Working memory', points: 80, max: 250 }],
    games: [{ name: 'Memory Grid', level: 3, lastAccuracy: 0.72 }],
    sessionsThisWeek: 2, streakDays: 4, untimed: true,
  });
  assert.match(c, /420 of 1000 \(\+35 since baseline\)/);
  assert.match(c, /Memory Grid level 3 \(last 72%\)/);
  assert.match(c, /untimed mode/);
});

test('Turns start with the person and are capped', () => {
  const t = trimTurns([{ role: 'assistant', content: 'hi' }, { role: 'user', content: 'q' }, { role: 'assistant', content: '' }]);
  assert.deepEqual(t, [{ role: 'user', content: 'q' }]);
  assert.equal(trimTurns(Array.from({ length: 40 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `m${i}` }) as const), 16).length, 16);
});

test('askAura reports each failure plainly', async () => {
  const body = { messages: [{ role: 'user' as const, content: 'q' }], context: '', library: '', ageGroup: null };
  assert.deepEqual(await askAura(undefined, undefined, body), { ok: false, reason: 'not-configured' });
  const ok = async () => new Response(JSON.stringify({ answer_text: ' Sleep consolidates skill. ' }));
  assert.deepEqual(await askAura('https://x', 'k', body, ok as typeof fetch), { ok: true, text: 'Sleep consolidates skill.' });
  const busy = async () => new Response('{}', { status: 429 });
  assert.deepEqual(await askAura('https://x', 'k', body, busy as typeof fetch), { ok: false, reason: 'busy' });
  const down = async () => { throw new Error('net'); };
  assert.deepEqual(await askAura('https://x', 'k', body, down as typeof fetch), { ok: false, reason: 'offline' });
});

import { speechPieces, wavBytes } from '../src/aura/voicePick.ts';

test('Emma reads sentence by sentence, splitting long ones at commas', () => {
  assert.deepEqual(speechPieces('Level four. **Target** 70 to 85%! Ready?'), ['Level four.', 'Target 70 to 85%!', 'Ready?']);
  const long = 'Sleep consolidates what you practised, so the gain from today shows tomorrow, which is why spacing sessions across the week works better than one long block, according to several trials.';
  const parts = speechPieces(long);
  assert.ok(parts.length > 1);
  assert.ok(parts.every((p) => p.length <= 110));
  assert.equal(parts.join(' '), long);
  assert.deepEqual(speechPieces('   '), []);
});

test('WAV header matches 24 kHz 16-bit mono', () => {
  const b = wavBytes(new Float32Array([0, 1, -1, 2]));
  const v = new DataView(b.buffer);
  assert.equal(b.length, 44 + 8);
  assert.equal(String.fromCharCode(...b.slice(0, 4)), 'RIFF');
  assert.equal(v.getUint32(24, true), 24000);
  assert.equal(v.getInt16(46, true), 32767);
  assert.equal(v.getInt16(48, true), -32768);
  assert.equal(v.getInt16(50, true), 32767);
});
