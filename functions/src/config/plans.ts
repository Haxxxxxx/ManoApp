/**
 * Plan contract mirror for Cloud Functions (server-side entitlements).
 *
 * The repo-root `src/config/plans.ts` is ESM (root package.json has
 * "type": "module") while functions compile as CommonJS (NodeNext), so
 * importing it here — even type-only — raises TS1479. This file mirrors the
 * server-relevant subset of that contract: the PlanId union, the
 * feature/limit entitlement map, and the planId -> Stripe price env-var
 * mapping.
 *
 * KEEP IN SYNC with src/config/plans.ts. If you change pricing, features, or
 * limits there, mirror the change here. Only the fields the backend enforces
 * are duplicated (no display strings / bullets).
 *
 * (Same TS1479 boundary pattern as functions/src/types/export.ts.)
 */

export type PlanId = 'free' | 'indie' | 'pro' | 'label';

export type FeatureKey =
  | 'distribution'
  | 'splitSheets'
  | 'advancedAnalytics'
  | 'collaborators'
  | 'aiMetadata'
  | 'bulkOperations'
  | 'prioritySupport'
  | 'teamSeats'
  | 'apiAccess';

export type LimitKey =
  | 'maxProjects'
  | 'maxSongs'
  | 'maxCollaboratorsPerProject'
  | 'monthlyDistributions';

export interface PlanLimits {
  /** -1 = unlimited */
  maxProjects: number;
  maxSongs: number;
  maxCollaboratorsPerProject: number;
  /** distribution submissions per month; -1 = unlimited */
  monthlyDistributions: number;
}

export interface PlanEntitlements {
  id: PlanId;
  features: Record<FeatureKey, boolean>;
  limits: PlanLimits;
}

const noFeatures: Record<FeatureKey, boolean> = {
  distribution: false,
  splitSheets: false,
  advancedAnalytics: false,
  collaborators: false,
  aiMetadata: false,
  bulkOperations: false,
  prioritySupport: false,
  teamSeats: false,
  apiAccess: false,
};

/**
 * Server-side entitlement map. Mirrors PLANS in src/config/plans.ts
 * (features + limits only).
 */
export const PLAN_ENTITLEMENTS: Record<PlanId, PlanEntitlements> = {
  free: {
    id: 'free',
    features: { ...noFeatures },
    limits: {
      maxProjects: 1,
      maxSongs: 10,
      maxCollaboratorsPerProject: 0,
      monthlyDistributions: 0,
    },
  },
  indie: {
    id: 'indie',
    features: {
      ...noFeatures,
      distribution: true,
      splitSheets: true,
      bulkOperations: true,
    },
    limits: {
      maxProjects: 5,
      maxSongs: 100,
      maxCollaboratorsPerProject: 2,
      monthlyDistributions: 10,
    },
  },
  pro: {
    id: 'pro',
    features: {
      ...noFeatures,
      distribution: true,
      splitSheets: true,
      advancedAnalytics: true,
      collaborators: true,
      aiMetadata: true,
      bulkOperations: true,
      prioritySupport: true,
    },
    limits: {
      maxProjects: -1,
      maxSongs: -1,
      maxCollaboratorsPerProject: 10,
      monthlyDistributions: -1,
    },
  },
  label: {
    id: 'label',
    features: {
      distribution: true,
      splitSheets: true,
      advancedAnalytics: true,
      collaborators: true,
      aiMetadata: true,
      bulkOperations: true,
      prioritySupport: true,
      teamSeats: true,
      apiAccess: true,
    },
    limits: {
      maxProjects: -1,
      maxSongs: -1,
      maxCollaboratorsPerProject: -1,
      monthlyDistributions: -1,
    },
  },
};

export const DEFAULT_PLAN: PlanId = 'free';

export const PLAN_ORDER: PlanId[] = ['free', 'indie', 'pro', 'label'];

/** Paid plans only — 'free' is never a valid checkout target. */
export const PAID_PLAN_IDS: PlanId[] = ['indie', 'pro', 'label'];

export function isPlanId(value: unknown): value is PlanId {
  return value === 'free' || value === 'indie' || value === 'pro' || value === 'label';
}

export function getEntitlements(planId: PlanId | undefined): PlanEntitlements {
  return PLAN_ENTITLEMENTS[planId ?? DEFAULT_PLAN] ?? PLAN_ENTITLEMENTS[DEFAULT_PLAN];
}

/**
 * Billing intervals supported by checkout.
 */
export type BillingInterval = 'monthly' | 'yearly';

/**
 * Map a planId + interval to the Stripe Price ID via env vars.
 * Returns undefined for 'free' (no price) or when the env var is unset.
 *
 * Env var convention (see functions/.env.example):
 *   STRIPE_PRICE_INDIE_MONTHLY / STRIPE_PRICE_INDIE_YEARLY
 *   STRIPE_PRICE_PRO_MONTHLY   / STRIPE_PRICE_PRO_YEARLY
 *   STRIPE_PRICE_LABEL_MONTHLY / STRIPE_PRICE_LABEL_YEARLY
 */
export function getStripePriceId(
  planId: PlanId,
  interval: BillingInterval = 'monthly'
): string | undefined {
  if (planId === 'free') return undefined;
  const key = `STRIPE_PRICE_${planId.toUpperCase()}_${interval.toUpperCase()}`;
  return process.env[key];
}
