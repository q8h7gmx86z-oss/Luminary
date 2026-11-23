import assert from 'node:assert/strict';
import { test } from 'node:test';

import { helpLinesFor, regionFromCode, smsUrl, telUrl } from '../src/lib/crisis.ts';
import { dayKey, daysShownUp, formatClock, formatDuration, lastNDays, parseTime, secondsLeft, sleepMinutes } from '../src/lib/logic.ts';

test('region codes map to supported regions', () => {
  assert.equal(regionFromCode('GB'), 'GB');
  assert.equal(regionFromCode('uk'), 'GB');
  assert.equal(regionFromCode('FR'), 'OTHER');
  assert.equal(regionFromCode(null), 'OTHER');
});

test('every region lists an emergency option first', () => {
  for (const r of ['GB', 'IE', 'US', 'CA', 'AU', 'NZ', 'OTHER'] as const) {
    const lines = helpLinesFor(r);
    assert.ok(lines.length >= 2, r);
    assert.equal(lines[0].emergency, true, r);
  }
});

test('UK lines include Samaritans, NHS 111 and Childline', () => {
  const calls = helpLinesFor('GB').map((l) => l.call);
  assert.ok(calls.includes('116123'));
  assert.ok(calls.includes('111'));
  assert.ok(calls.includes('999'));
  assert.ok(calls.includes('08001111'));
});

test('tel and sms links', () => {
  assert.equal(telUrl('116123'), 'tel:116123');
  assert.equal(smsUrl('85258', 'SHOUT', 'ios'), 'sms:85258&body=SHOUT');
  assert.equal(smsUrl('85258', 'SHOUT', 'android'), 'sms:85258?body=SHOUT');
  assert.equal(smsUrl('988', '', 'ios'), 'sms:988');
});

test('time parsing and sleep duration across midnight', () => {
  assert.equal(parseTime('07:15'), 435);
  assert.equal(parseTime('24:00'), null);
  assert.equal(parseTime('7.15'), null);
  assert.equal(sleepMinutes('23:00', '07:00'), 480);
  assert.equal(sleepMinutes('01:30', '09:00'), 450);
  assert.equal(formatDuration(450), '7h 30m');
  assert.equal(formatDuration(480), '8h');
});

test('days shown up counts the last 7 days without streak resets', () => {
  const today = new Date(2026, 10, 23);
  const days = lastNDays(7, today);
  assert.equal(days.length, 7);
  assert.equal(days[6], dayKey(today));
  assert.equal(daysShownUp([days[0], days[3], days[6], '2020-01-01'], today), 3);
});

test('timer helpers', () => {
  assert.equal(secondsLeft(10_500, 10_000), 1);
  assert.equal(secondsLeft(5_000, 10_000), 0);
  assert.equal(formatClock(605), '10:05');
});
