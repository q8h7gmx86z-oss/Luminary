// The connection to App Store and Google Play billing.
//
// Not connected yet. The plan is RevenueCat (react-native-purchases), the usual choice for Expo apps: it handles
// both stores, trials, renewals and receipts, and reports a single "plus" entitlement. It needs a development
// build, the two store products (monthly and annual, each with a 7-day free trial) and a RevenueCat API key.
// Until then every call reports that billing is unavailable, and PLUS_ENABLED stays false.

import type { Membership } from './plan';

export type BillingResult = { ok: true; membership: Membership } | { ok: false; reason: string };

export const BILLING_AVAILABLE = false;
export const UNAVAILABLE = 'Membership opens when Luminary launches on the App Store and Google Play.';

export async function currentMembership(): Promise<Membership> {
  return { status: 'free' };
}

export async function startTrial(_plan: 'monthly' | 'annual'): Promise<BillingResult> {
  return { ok: false, reason: UNAVAILABLE };
}

export async function restorePurchases(): Promise<BillingResult> {
  return { ok: false, reason: UNAVAILABLE };
}
