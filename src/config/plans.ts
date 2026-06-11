/**
 * Subscription plans — the monetization contract.
 *
 * This is the single source of truth for pricing tiers and per-plan feature
 * entitlements, shared by the pricing page, the feature-gating hooks, and the
 * billing flow. The Cloud Functions Stripe layer maps each planId to a Stripe
 * Price via STRIPE_PRICE_* env vars (see functions/.env.example).
 *
 * Gating is enforced in two places:
 *   - UI: usePlan()/useFeature() hide or lock features (good UX)
 *   - Server: Cloud Functions re-check entitlements before privileged actions
 *     (distribution, etc.) — never trust the client for limits.
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

export interface PlanLimits {
  /** -1 = unlimited */
  maxProjects: number;
  maxSongs: number;
  maxCollaboratorsPerProject: number;
  /** distribution submissions per month; -1 = unlimited */
  monthlyDistributions: number;
}

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  /** monthly price in the smallest currency unit is on Stripe; this is display */
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  highlighted?: boolean;
  features: Record<FeatureKey, boolean>;
  limits: PlanLimits;
  /** human-readable bullets for the pricing card */
  bullets: string[];
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

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Starter',
    tagline: 'For getting your first releases organized.',
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'USD',
    features: { ...noFeatures },
    limits: {
      maxProjects: 1,
      maxSongs: 10,
      maxCollaboratorsPerProject: 0,
      monthlyDistributions: 0,
    },
    bullets: [
      '1 project',
      'Up to 10 songs',
      'Catalog & metadata management',
      'ZIP export',
      'Basic analytics',
    ],
  },
  indie: {
    id: 'indie',
    name: 'Indie',
    tagline: 'For independent artists shipping real releases.',
    priceMonthly: 9,
    priceYearly: 90,
    currency: 'USD',
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
    bullets: [
      '5 projects',
      'Up to 100 songs',
      'Distribute to all providers',
      'Split sheets & rights',
      'Bulk operations',
      '10 distributions / month',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'For working musicians and small studios.',
    priceMonthly: 29,
    priceYearly: 290,
    currency: 'USD',
    highlighted: true,
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
    bullets: [
      'Unlimited projects & songs',
      'Priority distribution',
      'Advanced analytics',
      'Collaborators',
      'AI metadata assist',
      'Priority support',
    ],
  },
  label: {
    id: 'label',
    name: 'Label',
    tagline: 'For labels managing multiple artists.',
    priceMonthly: 99,
    priceYearly: 990,
    currency: 'USD',
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
    bullets: [
      'Everything in Pro',
      'Multiple artists',
      'Team seats',
      'API access',
      'White-glove onboarding',
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ['free', 'indie', 'pro', 'label'];

/** Plan rank for upgrade/downgrade comparisons */
export const planRank = (id: PlanId): number => PLAN_ORDER.indexOf(id);

export const DEFAULT_PLAN: PlanId = 'free';

export const getPlan = (id: PlanId | undefined): Plan =>
  PLANS[id ?? DEFAULT_PLAN] ?? PLANS[DEFAULT_PLAN];
