/**
 * Billing: Stripe Webhook
 *
 * onRequest `stripeWebhook` — receives Stripe events and reconciles
 * `subscriptions/{uid}`.
 *
 * Handled events:
 *   - checkout.session.completed        -> upsert subscription (active)
 *   - customer.subscription.updated     -> upsert subscription (status/period)
 *   - customer.subscription.deleted     -> downgrade to free
 *
 * Signature verification runs in live mode against STRIPE_WEBHOOK_SECRET. In
 * mock mode the body is parsed directly (the mock checkout already grants the
 * plan, so this endpoint is mainly here for completeness / manual testing).
 *
 * IMPORTANT (live): set this function's body parsing to use the raw body.
 * firebase-functions v2 onRequest exposes the unparsed payload on
 * `req.rawBody`, which is what Stripe's signature check requires.
 */

import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import * as admin from 'firebase-admin';
import { DEFAULT_PLAN, type PlanId } from '../../config/plans';
import { StripeClient, type WebhookEvent } from '../../integrations/stripe/client';

if (!admin.apps.length) {
  admin.initializeApp();
}

/** Resolve the ManoApp uid for an event, preferring stamped metadata. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveUid(object: Record<string, any>): string | undefined {
  return (
    object.metadata?.userId ||
    object.client_reference_id ||
    object.subscription_details?.metadata?.userId ||
    undefined
  );
}

async function upsertSubscription(
  uid: string,
  data: {
    planId: PlanId;
    status: 'active' | 'canceled' | 'past_due' | 'incomplete';
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    currentPeriodEnd: string;
  }
): Promise<void> {
  await admin
    .firestore()
    .collection('subscriptions')
    .doc(uid)
    .set({
      planId: data.planId,
      status: data.status,
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      currentPeriodEnd: data.currentPeriodEnd,
      updatedAt: new Date().toISOString(),
    });
}

export const stripeWebhook = onRequest(
  {
    cors: false,
    maxInstances: 10,
  },
  async (req, res) => {
    const client = new StripeClient();

    let event: WebhookEvent;
    try {
      // req.rawBody is the unparsed payload (firebase-functions v2). Stripe
      // signature verification requires the raw bytes.
      const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
      const signature = req.headers['stripe-signature'] as string | undefined;
      event = await client.constructWebhookEvent(rawBody, signature);
    } catch (error) {
      logger.error('stripeWebhook signature/parse failed', error);
      res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'invalid'}`);
      return;
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          const uid = resolveUid(session);
          const subscriptionId: string | undefined =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription?.id;

          if (!uid || !subscriptionId) {
            logger.warn('checkout.session.completed missing uid or subscription id', {
              uid,
              subscriptionId,
            });
            break;
          }

          // Pull the authoritative subscription to get plan + period.
          const sub = await client.getSubscription(subscriptionId);
          await upsertSubscription(uid, {
            planId: sub.planId,
            status: sub.status,
            stripeCustomerId:
              sub.customerId ||
              (typeof session.customer === 'string' ? session.customer : session.customer?.id) ||
              '',
            stripeSubscriptionId: sub.id,
            currentPeriodEnd: sub.currentPeriodEnd,
          });
          logger.info(`subscription granted plan=${sub.planId} user=${uid}`);
          break;
        }

        case 'customer.subscription.updated': {
          const sub = client.normalizeSubscription(event.data.object);
          const uid = resolveUid(event.data.object);
          if (!uid) {
            logger.warn('customer.subscription.updated missing uid metadata', { id: sub.id });
            break;
          }
          await upsertSubscription(uid, {
            planId: sub.planId,
            status: sub.status,
            stripeCustomerId: sub.customerId,
            stripeSubscriptionId: sub.id,
            currentPeriodEnd: sub.currentPeriodEnd,
          });
          logger.info(`subscription updated plan=${sub.planId} status=${sub.status} user=${uid}`);
          break;
        }

        case 'customer.subscription.deleted': {
          const sub = client.normalizeSubscription(event.data.object);
          const uid = resolveUid(event.data.object);
          if (!uid) {
            logger.warn('customer.subscription.deleted missing uid metadata', { id: sub.id });
            break;
          }
          await upsertSubscription(uid, {
            planId: DEFAULT_PLAN,
            status: 'canceled',
            stripeCustomerId: sub.customerId,
            stripeSubscriptionId: sub.id,
            currentPeriodEnd: sub.currentPeriodEnd,
          });
          logger.info(`subscription canceled -> downgraded to free user=${uid}`);
          break;
        }

        default:
          logger.info(`stripeWebhook ignoring event type=${event.type}`);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      logger.error('stripeWebhook handler failed', error);
      res.status(500).send('Webhook handler error');
    }
  }
);
