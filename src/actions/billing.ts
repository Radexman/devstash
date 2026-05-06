'use server';

import { z } from 'zod';
import { auth } from '@/auth';
import { stripe, STRIPE_PRICE_IDS, type BillingInterval } from '@/lib/stripe';
import { getOrCreateStripeCustomerId } from '@/lib/db/billing';
import { prisma } from '@/lib/prisma';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const checkoutSchema = z.object({
  interval: z.enum(['monthly', 'yearly']),
});

export type CreateCheckoutPayload = z.input<typeof checkoutSchema>;

function getBaseUrl(): string {
  return process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
}

export async function createCheckoutSession(
  payload: CreateCheckoutPayload,
): Promise<ActionResult<{ url: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = checkoutSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? 'Invalid input' };
  }

  const interval: BillingInterval = parsed.data.interval;
  const priceId = STRIPE_PRICE_IDS[interval];
  if (!priceId) {
    return { success: false, error: 'Plan not configured' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });
    if (!user?.email) {
      return { success: false, error: 'Email required' };
    }

    const customerId = await getOrCreateStripeCustomerId(
      session.user.id,
      user.email,
      stripe,
    );

    const baseUrl = getBaseUrl();
    const checkout = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/settings?checkout=success`,
      cancel_url: `${baseUrl}/settings?checkout=cancel`,
      metadata: { userId: session.user.id },
      subscription_data: {
        metadata: { userId: session.user.id },
      },
    });

    if (!checkout.url) {
      return { success: false, error: 'Failed to start checkout' };
    }
    return { success: true, data: { url: checkout.url } };
  } catch (err) {
    console.error('createCheckoutSession failed', err);
    return { success: false, error: 'Failed to start checkout' };
  }
}

export async function createPortalSession(): Promise<
  ActionResult<{ url: string }>
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true },
    });
    if (!user?.stripeCustomerId) {
      return { success: false, error: 'No subscription found' };
    }

    const baseUrl = getBaseUrl();
    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/settings`,
    });
    return { success: true, data: { url: portal.url } };
  } catch (err) {
    console.error('createPortalSession failed', err);
    return { success: false, error: 'Failed to open portal' };
  }
}
