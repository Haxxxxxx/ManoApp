/**
 * Server-side entitlements
 *
 * Single source of truth for "what plan is this user on, and what may they
 * do" — enforced inside privileged Cloud Functions (distribution, etc.) so
 * the client is never trusted for feature access or limits.
 *
 * Reads `subscriptions/{uid}` (written only by the Stripe webhook / mock
 * checkout). Absent or non-active subscription => 'free'.
 */

import { HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import {
  DEFAULT_PLAN,
  FeatureKey,
  LimitKey,
  PlanId,
  getEntitlements,
  isPlanId,
} from '../config/plans';

interface SubscriptionDoc {
  planId?: PlanId;
  status?: 'active' | 'canceled' | 'past_due' | 'incomplete';
}

/**
 * Resolve the user's effective plan. Only an `active` (or `past_due`, kept in
 * grace) subscription grants the paid plan; canceled/incomplete fall back to
 * free.
 */
export async function getUserPlan(uid: string): Promise<PlanId> {
  const snap = await admin.firestore().collection('subscriptions').doc(uid).get();
  if (!snap.exists) return DEFAULT_PLAN;

  const data = (snap.data() ?? {}) as SubscriptionDoc;
  if (!isPlanId(data.planId)) return DEFAULT_PLAN;

  // past_due keeps access during the dunning grace window; canceled/incomplete do not.
  if (data.status === 'active' || data.status === 'past_due') {
    return data.planId;
  }
  return DEFAULT_PLAN;
}

/** True if the user's plan enables the given feature. */
export async function hasFeature(uid: string, featureKey: FeatureKey): Promise<boolean> {
  const plan = await getUserPlan(uid);
  return getEntitlements(plan).features[featureKey] === true;
}

/**
 * Throw permission-denied unless the user's plan enables `featureKey`.
 * Use at the top of privileged Functions.
 */
export async function assertEntitlement(uid: string, featureKey: FeatureKey): Promise<void> {
  const plan = await getUserPlan(uid);
  if (getEntitlements(plan).features[featureKey] !== true) {
    throw new HttpsError(
      'permission-denied',
      `Your plan (${plan}) does not include "${featureKey}". Upgrade to unlock it.`
    );
  }
}

/**
 * Throw permission-denied if adding one more would exceed the plan's limit
 * for `limitKey`. `currentCount` is the count BEFORE the new item. A limit of
 * -1 means unlimited.
 */
export async function assertWithinLimit(
  uid: string,
  limitKey: LimitKey,
  currentCount: number
): Promise<void> {
  const plan = await getUserPlan(uid);
  const limit = getEntitlements(plan).limits[limitKey];
  if (limit === -1) return; // unlimited
  if (currentCount >= limit) {
    throw new HttpsError(
      'permission-denied',
      `Your plan (${plan}) allows up to ${limit} for "${limitKey}". Upgrade for more.`
    );
  }
}
