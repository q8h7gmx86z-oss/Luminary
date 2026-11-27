import assert from 'node:assert/strict';
import { test } from 'node:test';

import { annualPerMonth, annualSaving, daysLeft, FEATURES, FREE_FEATURES, hasAccess, PLUS_ENABLED, PLUS_FEATURES, PRICES, trialReminderAt } from '../src/plus/plan.ts';

test('prices are the ones Sandra set', () => {
  assert.equal(PRICES.monthly, 12.99);
  assert.equal(PRICES.annual, 89.99);
  assert.equal(PRICES.trialDays, 7);
  assert.equal(annualPerMonth(), 7.49);
  assert.equal(annualSaving(), 42);
});

test('the master switch stays off until billing is connected', () => {
  assert.equal(PLUS_ENABLED, false);
  for (const f of PLUS_FEATURES) assert.equal(hasAccess(f, { status: 'free' }), true);
});

test('with Plus switched on, only Plus features lock, and a trial opens them', () => {
  assert.equal(hasAccess('lab', { status: 'free' }, true), false);
  assert.equal(hasAccess('lab', { status: 'lapsed' }, true), false);
  assert.equal(hasAccess('lab', { status: 'trial' }, true), true);
  assert.equal(hasAccess('lab', { status: 'active', cancelled: true }, true), true);
  for (const f of FREE_FEATURES) assert.equal(hasAccess(f, { status: 'free' }, true), true);
});

test('health and safety features are always free', () => {
  for (const f of ['rafi', 'focus', 'wellbeing', 'research', 'benchmark', 'workout'] as const) assert.equal(FEATURES[f].plus, false);
});

test('trial reminder two days ahead; days left never negative', () => {
  const end = Date.UTC(2026, 11, 10);
  assert.equal(end - trialReminderAt(end), 2 * 86_400_000);
  assert.equal(daysLeft({ status: 'trial', periodEndsAt: end }, end - 1.5 * 86_400_000), 2);
  assert.equal(daysLeft({ status: 'trial', periodEndsAt: end }, end + 5), 0);
});
