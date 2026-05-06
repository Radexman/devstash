import type Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

export async function getOrCreateStripeCustomerId(
  userId: string,
  email: string,
  stripe: Stripe,
): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });
  if (user?.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });
  return customer.id;
}

export interface SubscriptionStateInput {
  subscriptionId: string | null;
  priceId: string | null;
  currentPeriodEnd: Date | null;
  isPro: boolean;
}

export async function setSubscriptionState(
  customerId: string,
  data: SubscriptionStateInput,
): Promise<void> {
  await prisma.user.update({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionId: data.subscriptionId,
      stripePriceId: data.priceId,
      stripeCurrentPeriodEnd: data.currentPeriodEnd,
      isPro: data.isPro,
    },
  });
}

export interface BillingProfile {
  isPro: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  stripeCurrentPeriodEnd: Date | null;
}

export async function getBillingProfile(
  userId: string,
): Promise<BillingProfile | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      isPro: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      stripePriceId: true,
      stripeCurrentPeriodEnd: true,
    },
  });
}
