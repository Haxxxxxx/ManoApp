/**
 * Billing: Create Billing Portal Session
 *
 * onCall `createBillingPortalSession` — returns a URL where the customer can
 * manage / cancel their subscription. Mock mode simply bounces back to
 * returnUrl (no Stripe portal exists).
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import * as admin from 'firebase-admin';
import { StripeClient } from '../../integrations/stripe/client';

if (!admin.apps.length) {
  admin.initializeApp();
}

interface PortalRequest {
  returnUrl?: unknown;
}

export const createBillingPortalSession = onCall(
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
      const { returnUrl } = (request.data ?? {}) as PortalRequest;

      if (typeof returnUrl !== 'string') {
        throw new HttpsError('invalid-argument', 'returnUrl is required and must be a string');
      }

      const db = admin.firestore();
      const customerSnap = await db.collection('customers').doc(uid).get();
      const stripeCustomerId = customerSnap.data()?.stripeCustomerId as string | undefined;

      if (!stripeCustomerId) {
        throw new HttpsError(
          'failed-precondition',
          'No billing customer on file. Start a subscription first.'
        );
      }

      const client = new StripeClient();
      const { url } = await client.createBillingPortalSession({
        customerId: stripeCustomerId,
        returnUrl,
      });

      return { url };
    } catch (error) {
      logger.error('createBillingPortalSession failed', error);
      if (error instanceof HttpsError) throw error;
      throw new HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to create billing portal session'
      );
    }
  }
);
