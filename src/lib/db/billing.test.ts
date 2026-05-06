import { describe, it, expect, vi, beforeEach } from 'vitest';
import type Stripe from 'stripe';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import {
  getOrCreateStripeCustomerId,
  setSubscriptionState,
  getBillingProfile,
} from './billing';

const mockFindUnique = vi.mocked(prisma.user.findUnique);
const mockUpdate = vi.mocked(prisma.user.update);

beforeEach(() => {
  vi.clearAllMocks();
});

function makeStripeMock(createReturnsId: string): Stripe {
  return {
    customers: {
      create: vi.fn().mockResolvedValue({ id: createReturnsId }),
    },
  } as unknown as Stripe;
}

describe('getOrCreateStripeCustomerId', () => {
  it('returns the existing customer id without calling Stripe', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockFindUnique.mockResolvedValueOnce({ stripeCustomerId: 'cus_existing' } as any);
    const stripe = makeStripeMock('cus_should_not_be_used');

    const id = await getOrCreateStripeCustomerId('u1', 'a@b.co', stripe);

    expect(id).toBe('cus_existing');
    expect(stripe.customers.create).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('creates a new Stripe customer and persists the id when missing', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockFindUnique.mockResolvedValueOnce({ stripeCustomerId: null } as any);
    const stripe = makeStripeMock('cus_new');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUpdate.mockResolvedValueOnce({} as any);

    const id = await getOrCreateStripeCustomerId('u1', 'a@b.co', stripe);

    expect(id).toBe('cus_new');
    expect(stripe.customers.create).toHaveBeenCalledWith({
      email: 'a@b.co',
      metadata: { userId: 'u1' },
    });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { stripeCustomerId: 'cus_new' },
    });
  });

  it('creates when the user row is missing entirely', async () => {
    mockFindUnique.mockResolvedValueOnce(null);
    const stripe = makeStripeMock('cus_new');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUpdate.mockResolvedValueOnce({} as any);

    const id = await getOrCreateStripeCustomerId('u1', 'a@b.co', stripe);

    expect(id).toBe('cus_new');
    expect(stripe.customers.create).toHaveBeenCalledOnce();
  });
});

describe('setSubscriptionState', () => {
  it('writes all four fields keyed by stripeCustomerId', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUpdate.mockResolvedValueOnce({} as any);
    const periodEnd = new Date('2026-12-01T00:00:00Z');

    await setSubscriptionState('cus_123', {
      subscriptionId: 'sub_456',
      priceId: 'price_789',
      currentPeriodEnd: periodEnd,
      isPro: true,
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { stripeCustomerId: 'cus_123' },
      data: {
        stripeSubscriptionId: 'sub_456',
        stripePriceId: 'price_789',
        stripeCurrentPeriodEnd: periodEnd,
        isPro: true,
      },
    });
  });

  it('passes through nulls when downgrading', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUpdate.mockResolvedValueOnce({} as any);

    await setSubscriptionState('cus_123', {
      subscriptionId: null,
      priceId: null,
      currentPeriodEnd: null,
      isPro: false,
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { stripeCustomerId: 'cus_123' },
      data: {
        stripeSubscriptionId: null,
        stripePriceId: null,
        stripeCurrentPeriodEnd: null,
        isPro: false,
      },
    });
  });
});

describe('getBillingProfile', () => {
  it('selects the five billing fields scoped by userId', async () => {
    mockFindUnique.mockResolvedValueOnce({
      isPro: true,
      stripeCustomerId: 'cus_1',
      stripeSubscriptionId: 'sub_1',
      stripePriceId: 'price_1',
      stripeCurrentPeriodEnd: new Date(),
    } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>);

    const profile = await getBillingProfile('u1');

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'u1' },
      select: {
        isPro: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        stripePriceId: true,
        stripeCurrentPeriodEnd: true,
      },
    });
    expect(profile?.isPro).toBe(true);
  });
});
