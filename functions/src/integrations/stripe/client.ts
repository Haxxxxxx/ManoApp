/**
 * Stripe Client
 *
 * Thin wrapper over the Stripe API with a deterministic mock mode (default)
 * so the full subscription/checkout flow works end-to-end before real Stripe
 * keys exist. Mirrors the shape of RevelatorClient (mode getter, isConfigured,
 * mock branches that synthesize deterministic IDs).
 *
 * Mode selection:
 *   - STRIPE_MODE=live  AND STRIPE_SECRET_KEY set -> 'live'
 *   - otherwise -> 'mock' (default)
 *
 * Environment variables:
 *   STRIPE_MODE             'live' to call the real API, anything else = mock
 *   STRIPE_SECRET_KEY       Stripe secret key (live mode only)
 *   STRIPE_WEBHOOK_SECRET   Webhook signing secret (live mode only)
 *   STRIPE_PRICE_*_MONTHLY  planId -> Stripe priceId mapping (see config/plans.ts)
 *   STRIPE_PRICE_*_YEARLY
 */

import { logger } from 'firebase-functions';
import type { PlanId, BillingInterval } from '../../config/plans';
import { getStripePriceId } from '../../config/plans';

// Lazily-imported Stripe SDK type — declared loosely so the 'stripe' package
// is only required at runtime in live mode (avoids a hard dependency / cold
// start cost in mock mode).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StripeSDK = any;

export interface StripeConfig {
  mode: 'mock' | 'live';
  secretKey?: string;
  webhookSecret?: string;
}

export function getStripeConfig(): StripeConfig {
  const hasKey = Boolean(process.env.STRIPE_SECRET_KEY);
  const mode = process.env.STRIPE_MODE === 'live' && hasKey ? 'live' : 'mock';
  return {
    mode,
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  };
}

export interface CreateCheckoutSessionArgs {
  userId: string;
  planId: PlanId;
  interval?: BillingInterval;
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  url: string;
  sessionId: string;
}

export interface CreateBillingPortalSessionArgs {
  customerId: string;
  returnUrl: string;
}

export interface BillingPortalSessionResult {
  url: string;
}

/**
 * Normalized subscription snapshot returned by getSubscription, decoupled
 * from the raw Stripe object so callers don't depend on the SDK shape.
 */
export interface SubscriptionSnapshot {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  customerId: string;
  planId: PlanId;
  /** ISO string */
  currentPeriodEnd: string;
}

/**
 * Minimal webhook event shape the handler consumes. In live mode this is a
 * structural subset of Stripe.Event; in mock mode we synthesize it.
 */
export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    object: Record<string, any>;
  };
}

export class StripeClient {
  private config: StripeConfig;
  private sdk: StripeSDK | null = null;

  constructor(config: StripeConfig = getStripeConfig()) {
    this.config = config;
  }

  get mode(): 'mock' | 'live' {
    return this.config.mode;
  }

  /** mock mode always works; live mode requires a secret key. */
  isConfigured(): boolean {
    if (this.config.mode === 'mock') return true;
    return Boolean(this.config.secretKey);
  }

  /**
   * Create a Checkout Session for a subscription.
   *
   * Mock mode: synthesize a deterministic session id and a checkout URL that
   * points straight back to successUrl with a mock session param, so the flow
   * completes without ever touching Stripe.
   */
  async createCheckoutSession(
    args: CreateCheckoutSessionArgs
  ): Promise<CheckoutSessionResult> {
    const interval = args.interval ?? 'monthly';

    if (this.config.mode === 'mock') {
      const sessionId = `cs_mock_${args.planId}_${Date.now()}`;
      logger.info(
        `[stripe:mock] createCheckoutSession plan=${args.planId} interval=${interval} user=${args.userId} session=${sessionId}`
      );
      const url = this.appendQuery(args.successUrl, {
        mock_session_id: sessionId,
        mock_plan: args.planId,
      });
      return { url, sessionId };
    }

    const priceId = getStripePriceId(args.planId, interval);
    if (!priceId) {
      throw new Error(
        `No Stripe price configured for plan "${args.planId}" (${interval}). Set STRIPE_PRICE_${args.planId.toUpperCase()}_${interval.toUpperCase()}.`
      );
    }

    const stripe = await this.getSdk();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      client_reference_id: args.userId,
      ...(args.customerId
        ? { customer: args.customerId }
        : {}),
      // Stamp metadata so the webhook can resolve uid + plan without a lookup.
      subscription_data: {
        metadata: { userId: args.userId, planId: args.planId },
      },
      metadata: { userId: args.userId, planId: args.planId },
    });

    if (!session.url) {
      throw new Error('Stripe did not return a checkout URL');
    }
    return { url: session.url, sessionId: session.id };
  }

  /**
   * Create a Billing Portal session so the customer can manage/cancel.
   * Mock mode: just bounce back to returnUrl.
   */
  async createBillingPortalSession(
    args: CreateBillingPortalSessionArgs
  ): Promise<BillingPortalSessionResult> {
    if (this.config.mode === 'mock') {
      logger.info(
        `[stripe:mock] createBillingPortalSession customer=${args.customerId}`
      );
      return { url: this.appendQuery(args.returnUrl, { mock_portal: '1' }) };
    }

    const stripe = await this.getSdk();
    const session = await stripe.billingPortal.sessions.create({
      customer: args.customerId,
      return_url: args.returnUrl,
    });
    return { url: session.url };
  }

  /**
   * Fetch and normalize a subscription. Mock mode returns a synthetic active
   * subscription 30 days out.
   */
  async getSubscription(subscriptionId: string): Promise<SubscriptionSnapshot> {
    if (this.config.mode === 'mock') {
      const planId = this.planFromMockId(subscriptionId);
      return {
        id: subscriptionId,
        status: 'active',
        customerId: `cus_mock_${planId}`,
        planId,
        currentPeriodEnd: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      };
    }

    const stripe = await this.getSdk();
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    return this.normalizeSubscription(sub);
  }

  /**
   * Find-or-create the Stripe customer for a user. Mock mode synthesizes a
   * deterministic customer id (no Stripe call).
   */
  async ensureCustomer(args: {
    userId: string;
    existingCustomerId?: string;
    email?: string;
  }): Promise<string> {
    if (args.existingCustomerId) return args.existingCustomerId;

    if (this.config.mode === 'mock') {
      return `cus_mock_${args.userId}`;
    }

    const stripe = await this.getSdk();
    const customer = await stripe.customers.create({
      ...(args.email ? { email: args.email } : {}),
      metadata: { userId: args.userId },
    });
    return customer.id;
  }

  /**
   * Verify + parse a webhook payload. In mock mode the body is already a
   * JSON WebhookEvent (no signature). In live mode this uses Stripe's
   * signature verification against STRIPE_WEBHOOK_SECRET.
   */
  async constructWebhookEvent(
    rawBody: Buffer | string,
    signature: string | undefined
  ): Promise<WebhookEvent> {
    if (this.config.mode === 'mock') {
      const text = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
      const parsed = JSON.parse(text) as WebhookEvent;
      logger.info(`[stripe:mock] constructWebhookEvent type=${parsed.type}`);
      return parsed;
    }

    if (!this.config.webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set; cannot verify webhook in live mode.');
    }
    if (!signature) {
      throw new Error('Missing stripe-signature header');
    }

    const stripe = await this.getSdk();
    return stripe.webhooks.constructEvent(
      rawBody,
      signature,
      this.config.webhookSecret
    ) as WebhookEvent;
  }

  /**
   * Normalize a raw Stripe.Subscription to our snapshot. Exposed so the
   * webhook can reuse it on subscription.updated/created events.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  normalizeSubscription(sub: any): SubscriptionSnapshot {
    const planId = this.planFromStripeSubscription(sub);
    const periodEndUnix: number | undefined =
      sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end;
    return {
      id: sub.id,
      status: this.normalizeStatus(sub.status),
      customerId:
        typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? '',
      planId,
      currentPeriodEnd: periodEndUnix
        ? new Date(periodEndUnix * 1000).toISOString()
        : new Date(Date.now() + 30 * 86_400_000).toISOString(),
    };
  }

  // --- internal helpers ---

  private async getSdk(): Promise<StripeSDK> {
    if (this.sdk) return this.sdk;
    if (!this.config.secretKey) {
      throw new Error(
        'Stripe secret key not configured. Set STRIPE_SECRET_KEY and STRIPE_MODE=live, or use mock mode.'
      );
    }
    // Lazy import so the 'stripe' package is only loaded in live mode.
    const mod = await import('stripe');
    const Stripe = (mod.default ?? mod) as unknown as new (key: string) => StripeSDK;
    this.sdk = new Stripe(this.config.secretKey);
    return this.sdk;
  }

  private normalizeStatus(status: string): SubscriptionSnapshot['status'] {
    switch (status) {
      case 'active':
      case 'trialing':
        return 'active';
      case 'canceled':
      case 'unpaid':
        return 'canceled';
      case 'past_due':
        return 'past_due';
      default:
        return 'incomplete';
    }
  }

  /**
   * Resolve the planId from a Stripe subscription: prefer metadata (we stamp
   * it at checkout), fall back to reverse-mapping the price id.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private planFromStripeSubscription(sub: any): PlanId {
    const metaPlan = sub.metadata?.planId;
    if (metaPlan === 'indie' || metaPlan === 'pro' || metaPlan === 'label') {
      return metaPlan;
    }
    const priceId: string | undefined = sub.items?.data?.[0]?.price?.id;
    if (priceId) {
      for (const planId of ['indie', 'pro', 'label'] as PlanId[]) {
        if (
          getStripePriceId(planId, 'monthly') === priceId ||
          getStripePriceId(planId, 'yearly') === priceId
        ) {
          return planId;
        }
      }
    }
    return 'free';
  }

  /** Extract planId from a mock id like cs_mock_pro_123 or cus_mock_pro. */
  private planFromMockId(id: string): PlanId {
    for (const planId of ['indie', 'pro', 'label'] as PlanId[]) {
      if (id.includes(`_${planId}`)) return planId;
    }
    return 'free';
  }

  private appendQuery(url: string, params: Record<string, string>): string {
    const sep = url.includes('?') ? '&' : '?';
    const query = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    return `${url}${sep}${query}`;
  }
}
