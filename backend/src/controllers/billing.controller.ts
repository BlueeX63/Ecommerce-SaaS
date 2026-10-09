import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';
import { env } from '../config/env.js';
import { db } from '../lib/supabase.js';
import { ApiError, parse } from '../lib/http.js';
import { invalidateEntitlements } from '../services/entitlements.js';
import {
  FEATURE_ADDONS,
  PLAN_TIERS,
  computePrice,
  encodePlanId,
  isValidPlanTier,
  resolvePlanTierId,
  sanitizeFeatureFlags,
} from '../services/plans.js';
import type { PlanTierId } from '../services/plans.js';

const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;
const frontendUrl = env.FRONTEND_URL.replace(/\/$/, '');

const checkoutSchema = z.object({
  planTier: z.string().refine(isValidPlanTier, 'Unknown plan'),
  addons: z.array(z.string()).max(20).optional().default([]),
  isAnnual: z.boolean().optional().default(false),
});

/** Fetches the merchant's current active subscription row, if any. */
async function getActiveSubscription(userId: string) {
  const { data } = await db
    .from('subscriptions')
    .select('subscription_id, stripe_subscription_id, plan_id, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('updated_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

interface SubscriptionUpdate {
  userId?: string | null;
  stripeSubscriptionId: string;
  stripeCustomerId?: string | null;
  /** The exact value to write into `subscriptions.plan_id` (tier + add-ons already encoded together). */
  encodedPlanId?: string | null;
  status: string;
  periodStart?: Date | null;
  periodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
}

/** Builds the compound plan_id from Stripe metadata, or null if the tier metadata is missing/unrecognised. */
function encodedPlanIdFromMetadata(metadata: { planTier?: string; addons?: string } | null | undefined): string | null {
  const tier = resolvePlanTierId(metadata?.planTier);
  if (!tier) return null;
  let addons: string[] = [];
  if (metadata?.addons) {
    try {
      const parsed = JSON.parse(metadata.addons);
      if (Array.isArray(parsed)) addons = parsed;
    } catch {
      // ignore malformed metadata - treat as no add-ons
    }
  }
  return encodePlanId(tier, addons);
}

/** After a new subscription is paid, cancel the one it replaces so the merchant is never billed twice. */
async function retirePreviousSubscription(userId: string, newSubscriptionId: string) {
  if (!stripe) return;
  const previous = await getActiveSubscription(userId);
  const oldId = previous?.stripe_subscription_id;
  if (!oldId || oldId === newSubscriptionId || !oldId.startsWith('sub_')) return;
  try {
    await stripe.subscriptions.cancel(oldId);
  } catch (error) {
    console.warn(`[billing] failed to cancel previous subscription ${oldId}`, error);
  }
}

async function saveSubscription(update: SubscriptionUpdate) {
  let { data: row } = await db
    .from('subscriptions')
    .select('subscription_id, user_id')
    .eq('stripe_subscription_id', update.stripeSubscriptionId)
    .maybeSingle();

  // One subscription row per user: re-use the existing row when the user re-subscribes or changes plan.
  if (!row && update.userId) {
    ({ data: row } = await db
      .from('subscriptions')
      .select('subscription_id, user_id, stripe_subscription_id, status')
      .eq('user_id', update.userId)
      .order('created_date', { ascending: false })
      .limit(1)
      .maybeSingle());
  }

  // A late "canceled / updated" event for a subscription this user has since replaced must not overwrite the
  // row that now belongs to their new subscription.
  const current = row as { stripe_subscription_id?: string; status?: string } | null;
  if (current?.stripe_subscription_id && current.stripe_subscription_id !== update.stripeSubscriptionId && current.status === 'active' && update.status !== 'active') {
    return;
  }

  const fields: Record<string, unknown> = {
    stripe_subscription_id: update.stripeSubscriptionId,
    status: update.status,
    updated_date: new Date().toISOString(),
  };
  if (update.stripeCustomerId) fields.stripe_customer_id = update.stripeCustomerId;
  if (update.encodedPlanId) fields.plan_id = update.encodedPlanId;
  if (update.periodStart) fields.current_period_start = update.periodStart.toISOString();
  if (update.periodEnd) fields.current_period_end = update.periodEnd.toISOString();
  if (update.cancelAtPeriodEnd !== undefined) fields.cancel_at_period_end = update.cancelAtPeriodEnd;

  if (row) {
    const { error } = await db.from('subscriptions').update(fields).eq('subscription_id', row.subscription_id);
    if (error) throw error;
  } else if (update.userId) {
    const { error } = await db.from('subscriptions').insert({ ...fields, user_id: update.userId });
    if (error) throw error;
  } else {
    console.warn(`[stripe] no subscription row or user for ${update.stripeSubscriptionId}`);
    return;
  }

  const ownerId = update.userId ?? row?.user_id;
  if (ownerId) await invalidateEntitlements(ownerId);
}

function mapStripeStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
    case 'unpaid':
      return 'past_due';
    case 'canceled':
    case 'incomplete_expired':
      return 'canceled';
    default:
      return 'incomplete';
  }
}

const seconds = (value: unknown) => (typeof value === 'number' ? new Date(value * 1000) : null);

// ---------------------------------------------------------------------------------------------
// Plan catalog   GET /api/v1/billing/plans   (public: pricing must be visible before login)
// ---------------------------------------------------------------------------------------------

export function listPlans(_req: Request, res: Response) {
  res.json({
    tiers: Object.values(PLAN_TIERS),
    addons: Object.values(FEATURE_ADDONS),
  });
}

// ---------------------------------------------------------------------------------------------
// Merchant subscription checkout   POST /api/checkout
// ---------------------------------------------------------------------------------------------

export async function checkout(req: Request, res: Response) {
  if (!stripe) throw new ApiError(503, 'Billing is not configured');

  const session = req.merchant!;
  const { planTier, addons, isAnnual } = parse(checkoutSchema, req.body);
  const featureFlags = sanitizeFeatureFlags(addons);
  const price = computePrice(planTier as PlanTierId, featureFlags, isAnnual);
  const tier = PLAN_TIERS[planTier as PlanTierId];

  const { data: user } = await db.from('users').select('email').eq('user_id', session.userId).maybeSingle();

  // Changing plan / adding an add-on: the previous subscription is cancelled only once the new payment has
  // succeeded (see retirePreviousSubscription), so abandoning checkout never costs the merchant their plan.

  const lineItems = [
    {
      price_data: {
        currency: 'inr',
        product_data: { name: `${tier.name} Plan (${isAnnual ? 'Yearly' : 'Monthly'})` },
        unit_amount: Math.round(price.planMonthly * (isAnnual ? 12 : 1) * 100),
        recurring: { interval: isAnnual ? ('year' as const) : ('month' as const) },
      },
      quantity: 1,
    },
    ...price.addons.map((addon) => ({
      price_data: {
        currency: 'inr',
        product_data: { name: `${addon.name} (${isAnnual ? 'Yearly' : 'Monthly'})` },
        unit_amount: Math.round(addon.monthly * (isAnnual ? 12 : 1) * 100),
        recurring: { interval: isAnnual ? ('year' as const) : ('month' as const) },
      },
      quantity: 1,
    })),
  ];

  const metadata = { userId: session.userId, planTier, addons: JSON.stringify(featureFlags), isAnnual: String(isAnnual) };

  // Redirect targets come from server configuration, never from request headers (prevents open redirects).
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: user?.email,
    client_reference_id: session.userId,
    line_items: lineItems,
    success_url: `${frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/checkout/${planTier}?canceled=true`,
    metadata,
    subscription_data: { metadata },
  });

  res.json({ url: checkoutSession.url });
}

// ---------------------------------------------------------------------------------------------
// POST /api/v1/billing/confirm - called by the payment-success page so activation doesn't depend on
// webhook timing. The Stripe session is fetched from Stripe and must belong to the logged-in user.
// ---------------------------------------------------------------------------------------------

export async function confirmCheckout(req: Request, res: Response) {
  if (!stripe) throw new ApiError(503, 'Billing is not configured');
  const { sessionId } = parse(z.object({ sessionId: z.string().trim().regex(/^cs_[A-Za-z0-9_]+$/).max(255) }), req.body);

  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
  const paid = checkoutSession.payment_status === 'paid' || checkoutSession.payment_status === 'no_payment_required';
  const subscriptionId =
    typeof checkoutSession.subscription === 'string' ? checkoutSession.subscription : checkoutSession.subscription?.id;

  if (checkoutSession.metadata?.userId !== req.merchant!.userId || checkoutSession.mode !== 'subscription') {
    throw new ApiError(403, 'This payment does not belong to your account');
  }
  if (!paid || !subscriptionId) return void res.json({ active: false });

  await retirePreviousSubscription(req.merchant!.userId, subscriptionId);
  await saveSubscription({
    userId: req.merchant!.userId,
    stripeSubscriptionId: subscriptionId,
    stripeCustomerId: typeof checkoutSession.customer === 'string' ? checkoutSession.customer : checkoutSession.customer?.id,
    encodedPlanId: encodedPlanIdFromMetadata(checkoutSession.metadata),
    status: 'active',
  });
  res.json({ active: true });
}

/** DEV ONLY (ALLOW_MOCK_SUBSCRIBE=true, never in production): activates a fake yearly subscription. */
export async function mockSubscribe(req: Request, res: Response) {
  const { planTier, addons } = parse(
    z.object({ planTier: z.string().refine(isValidPlanTier, 'Unknown plan').optional().default('intermediate'), addons: z.array(z.string()).optional().default([]) }),
    req.body ?? {},
  );
  const userId = req.merchant!.userId;
  const now = new Date();
  await saveSubscription({
    userId,
    stripeSubscriptionId: `mock_${userId}`,
    encodedPlanId: encodePlanId(planTier as PlanTierId, addons),
    status: 'active',
    periodStart: now,
    periodEnd: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
  });
  res.json({ success: true, sessionId: `mock_${Math.random().toString(36).slice(2, 11)}` });
}

// ---------------------------------------------------------------------------------------------
// Stripe webhook   POST /api/webhooks/stripe   (signature verified, raw body required)
// ---------------------------------------------------------------------------------------------

export async function stripeWebhook(req: Request, res: Response) {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    console.error('[stripe] webhook received but Stripe is not configured');
    return void res.status(503).json({ error: 'Webhook not configured' });
  }

  const signature = req.get('stripe-signature');
  if (!signature || !Buffer.isBuffer(req.body)) return void res.status(400).json({ error: 'No signature found' });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error: any) {
    console.error('[stripe] webhook signature verification failed:', error?.message);
    return void res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;
        const paid = session.payment_status === 'paid' || session.payment_status === 'no_payment_required';
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
        const userId = session.metadata?.userId;
        if (session.mode === 'subscription' && paid && subscriptionId && userId) {
          await retirePreviousSubscription(userId, subscriptionId);
          await saveSubscription({
            userId,
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
            encodedPlanId: encodedPlanIdFromMetadata(session.metadata),
            status: 'active',
          });
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const item = sub.items?.data?.[0] as any;
        await saveSubscription({
          userId: sub.metadata?.userId,
          stripeSubscriptionId: sub.id,
          stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
          encodedPlanId: encodedPlanIdFromMetadata(sub.metadata),
          status: event.type === 'customer.subscription.deleted' ? 'canceled' : mapStripeStatus(sub.status),
          periodStart: seconds(item?.current_period_start ?? (sub as any).current_period_start),
          periodEnd: seconds(item?.current_period_end ?? (sub as any).current_period_end),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const subscriptionId =
          typeof invoice.subscription === 'string' ? invoice.subscription : invoice.parent?.subscription_details?.subscription;
        if (typeof subscriptionId === 'string') {
          await db
            .from('subscriptions')
            .update({ status: 'past_due', updated_date: new Date().toISOString() })
            .eq('stripe_subscription_id', subscriptionId);
        }
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error(`[stripe] failed to process ${event.type}`, error);
    // Non-2xx makes Stripe retry the delivery.
    return void res.status(500).json({ error: 'Webhook handler failed' });
  }

  res.json({ received: true });
}
