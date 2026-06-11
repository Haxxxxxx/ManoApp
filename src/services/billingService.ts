/**
 * Billing service — thin client over the Stripe Cloud Functions.
 *
 * Works in mock mode with no Stripe keys (the functions synthesize a checkout
 * URL that returns to the app and grants the plan). In live mode the same
 * callables create real Stripe Checkout / Billing Portal sessions.
 */
import { httpsCallable, Functions } from 'firebase/functions';
import { functions } from '../firebase/config';
import { PlanId } from '../config/plans';

export type BillingInterval = 'monthly' | 'yearly';

interface CheckoutResponse {
  url: string;
}

interface PortalResponse {
  url: string;
}

const requireFunctions = (): Functions => {
  if (!functions) {
    throw new Error('Billing is unavailable: Cloud Functions not initialized.');
  }
  return functions;
};

/**
 * Start a checkout for the given plan. Resolves to a URL the caller should
 * redirect the browser to (Stripe Checkout in live mode; an immediate
 * success-return in mock mode).
 */
export const startCheckout = async (
  planId: Exclude<PlanId, 'free'>,
  interval: BillingInterval = 'monthly'
): Promise<string> => {
  const fn = httpsCallable<
    { planId: PlanId; interval: BillingInterval; successUrl: string; cancelUrl: string },
    CheckoutResponse
  >(requireFunctions(), 'createCheckoutSession');

  const origin = window.location.origin;
  const { data } = await fn({
    planId,
    interval,
    successUrl: `${origin}/billing?checkout=success`,
    cancelUrl: `${origin}/pricing?checkout=cancel`,
  });
  return data.url;
};

/** Open the Stripe billing portal (manage/cancel). */
export const openBillingPortal = async (): Promise<string> => {
  const fn = httpsCallable<{ returnUrl: string }, PortalResponse>(
    requireFunctions(),
    'createBillingPortalSession'
  );
  const { data } = await fn({ returnUrl: `${window.location.origin}/billing` });
  return data.url;
};
