import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { setSubscriptionState } from '@/lib/db/billing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RELEVANT_EVENTS = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
]);

function customerIdOf(
  ref: string | { id: string } | null | undefined,
): string | null {
  if (!ref) return null;
  return typeof ref === 'string' ? ref : ref.id;
}

function subscriptionIdOf(
  ref: string | { id: string } | null | undefined,
): string | null {
  if (!ref) return null;
  return typeof ref === 'string' ? ref : ref.id;
}

async function applyState(
  customerId: string,
  sub: Stripe.Subscription,
): Promise<void> {
  const priceId = sub.items.data[0]?.price.id ?? null;
  const periodEnd = (sub as unknown as { current_period_end?: number })
    .current_period_end;
  const currentPeriodEnd = periodEnd ? new Date(periodEnd * 1000) : null;
  const isPro = sub.status === 'active' || sub.status === 'trialing';
  await setSubscriptionState(customerId, {
    subscriptionId: sub.id,
    priceId,
    currentPeriodEnd,
    isPro,
  });
}

export async function POST(req: Request): Promise<Response> {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return new Response('Webhook not configured', { status: 500 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  if (!RELEVANT_EVENTS.has(event.type)) {
    return new Response(null, { status: 200 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = customerIdOf(sub.customer);
        if (!customerId) break;
        await applyState(customerId, sub);
        break;
      }
      case 'checkout.session.completed': {
        const checkout = event.data.object as Stripe.Checkout.Session;
        const subId = subscriptionIdOf(checkout.subscription);
        const customerId = customerIdOf(checkout.customer);
        if (!subId || !customerId) break;
        const sub = await stripe.subscriptions.retrieve(subId);
        await applyState(customerId, sub);
        break;
      }
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | { id: string } | null;
        };
        const subId = subscriptionIdOf(invoice.subscription);
        const customerId = customerIdOf(invoice.customer);
        if (!subId || !customerId) break;
        const sub = await stripe.subscriptions.retrieve(subId);
        await applyState(customerId, sub);
        break;
      }
    }
    return new Response(null, { status: 200 });
  } catch (err) {
    console.error('Stripe webhook handler error', err);
    return new Response('Handler error', { status: 500 });
  }
}
