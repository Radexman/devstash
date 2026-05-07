'use server';

import { z } from 'zod';
import { stripe, STRIPE_PRICE_IDS, type BillingInterval } from '@/lib/stripe';
import { getOrCreateStripeCustomerId } from '@/lib/db/billing';
import { prisma } from '@/lib/prisma';
import { parseOrFail, requireUserId } from '@/lib/action-helpers';
import type { ActionResult } from '@/types/action';

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
  const session = await requireUserId();
  if (!session.ok) return { success: false, error: session.error };

  const parsed = parseOrFail(checkoutSchema, payload);
  if (!parsed.ok) return { success: false, error: parsed.error };

  const interval: BillingInterval = parsed.data.interval;
  const priceId = STRIPE_PRICE_IDS[interval];
  if (!priceId) {
    return { success: false, error: 'Plan not configured' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true },
    });
    if (!user?.email) {
      return { success: false, error: 'Email required' };
    }

    const customerId = await getOrCreateStripeCustomerId(
      session.userId,
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
      metadata: { userId: session.userId },
      subscription_data: {
        metadata: { userId: session.userId },
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
  const session = await requireUserId();
  if (!session.ok) return { success: false, error: session.error };

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
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
