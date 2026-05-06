import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-04-22.dahlia',
  typescript: true,
});

export const STRIPE_PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_ID_MONTHLY ?? '',
  yearly: process.env.STRIPE_PRICE_ID_YEARLY ?? '',
} as const;

export type BillingInterval = keyof typeof STRIPE_PRICE_IDS;
