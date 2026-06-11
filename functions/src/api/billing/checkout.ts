/**
 * Billing: Create Checkout Session
 *
 * onCall `createCheckoutSession` — starts a Stripe Checkout for a paid plan.
 *
 * Flow:
 *   1. require auth, validate planId (reject 'free')
 *   2. find-or-create the user's Stripe customer (customers/{uid})
 *   3. ask the StripeClient for a checkout session URL
 *   4. MOCK ONLY: since there is no real webhook, write subscriptions/{uid}
 *      immediately so the plan is granted as soon as checkout "completes".
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import * as admin from 'firebase-admin';
import { isPlanId, type BillingInterval } from '../../config/plans';
import { StripeClient } from '../../integrations/stripe/client';

if (!admin.apps.length) {
  admin.initializeApp();
}

interface CheckoutRequest {
  planId?: unknown;
  interval?: unknown;
  successUrl?: unknown;
  cancelUrl?: unknown;
}

export const createCheckoutSession = onCall(
  {
    cors: true,
    maxInstances: 10,
  },
  async (request) => {
    try {
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const uid = request.auth.uid;
      const { planId, interval, successUrl, cancelUrl } = (request.data ??
        {}) as CheckoutRequest;

      if (!isPlanId(planId)) {
        throw new HttpsError('invalid-argument', 'planId must be one of free|indie|pro|label');
      }
      if (planId === 'free') {
        throw new HttpsError('invalid-argument', 'Cannot checkout the free plan');
      }
      if (typeof successUrl !== 'string' || typeof cancelUrl !== 'string') {
        throw new HttpsError('invalid-argument', 'successUrl and cancelUrl are required strings');
      }

      const billingInterval: BillingInterval = interval === 'yearly' ? 'yearly' : 'monthly';

      const db = admin.firestore();
      const client = new StripeClient();

      // 1) find-or-create Stripe customer, persisted at customers/{uid}
      const customerRef = db.collection('customers').doc(uid);
      const customerSnap = await customerRef.get();
      const existingCustomerId = customerSnap.data()?.stripeCustomerId as string | undefined;

      const customerId = await client.ensureCustomer({
        userId: uid,
        existingCustomerId,
        email: request.auth.token.email,
      });

      if (!existingCustomerId) {
        await customerRef.set({ stripeCustomerId: customerId }, { merge: true });
      }

      // 2) checkout session
      const { url, sessionId } = await client.createCheckoutSession({
        userId: uid,
        planId,
        interval: billingInterval,
        customerId,
        successUrl,
        cancelUrl,
      });

      // 3) MOCK ONLY — grant the plan immediately (no real webhook will fire).
      if (client.mode === 'mock') {
        const now = new Date();
        const periodEnd = new Date(now.getTime() + 30 * 86_400_000);
        await db
          .collection('subscriptions')
          .doc(uid)
          .set({
            planId,
            status: 'active',
            stripeCustomerId: customerId,
            stripeSubscriptionId: `sub_mock_${planId}_${now.getTime()}`,
            currentPeriodEnd: periodEnd.toISOString(),
            updatedAt: now.toISOString(),
          });
        logger.info(`[stripe:mock] granted plan=${planId} to user=${uid} via checkout`);
      }

      return { url, sessionId };
    } catch (error) {
      logger.error('createCheckoutSession failed', error);
      if (error instanceof HttpsError) throw error;
      throw new HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to create checkout session'
      );
    }
  }
);
