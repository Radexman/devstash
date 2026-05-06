import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockStripe, mockPriceIds } = vi.hoisted(() => ({
  mockStripe: {
    checkout: { sessions: { create: vi.fn() } },
    billingPortal: { sessions: { create: vi.fn() } },
  },
  mockPriceIds: { monthly: 'price_monthly', yearly: 'price_yearly' },
}));

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/stripe', () => ({
  stripe: mockStripe,
  STRIPE_PRICE_IDS: mockPriceIds,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/db/billing', () => ({
  getOrCreateStripeCustomerId: vi.fn(),
}));

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getOrCreateStripeCustomerId } from '@/lib/db/billing';
import { createCheckoutSession, createPortalSession } from './billing';

const mockAuth = vi.mocked(auth);
const mockFindUnique = vi.mocked(prisma.user.findUnique);
const mockGetOrCreate = vi.mocked(getOrCreateStripeCustomerId);
const mockCheckoutCreate = vi.mocked(mockStripe.checkout.sessions.create);
const mockPortalCreate = vi.mocked(mockStripe.billingPortal.sessions.create);

beforeEach(() => {
  vi.clearAllMocks();
  // @ts-expect-error partial session
  mockAuth.mockResolvedValue({ user: { id: 'u1' } });
  mockPriceIds.monthly = 'price_monthly';
  mockPriceIds.yearly = 'price_yearly';
  // Silence the action's console.error during error-path tests
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('createCheckoutSession', () => {
  it('rejects unauthorized', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await createCheckoutSession({ interval: 'monthly' });
    expect(res).toEqual({ success: false, error: 'Unauthorized' });
    expect(mockCheckoutCreate).not.toHaveBeenCalled();
  });

  it('rejects invalid interval', async () => {
    const res = await createCheckoutSession(
      // @ts-expect-error invalid enum
      { interval: 'lifetime' },
    );
    expect(res.success).toBe(false);
    expect(mockCheckoutCreate).not.toHaveBeenCalled();
  });

  it('returns Plan not configured when price id is missing', async () => {
    mockPriceIds.monthly = '';
    const res = await createCheckoutSession({ interval: 'monthly' });
    expect(res).toEqual({ success: false, error: 'Plan not configured' });
    expect(mockCheckoutCreate).not.toHaveBeenCalled();
  });

  it('returns Failed to start checkout when Stripe rejects', async () => {
    mockFindUnique.mockResolvedValueOnce({
      email: 'a@b.co',
    } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>);
    mockGetOrCreate.mockResolvedValueOnce('cus_123');
    mockCheckoutCreate.mockRejectedValueOnce(new Error('stripe down'));

    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await createCheckoutSession({ interval: 'monthly' });
    expect(res).toEqual({ success: false, error: 'Failed to start checkout' });
    expect(errSpy).toHaveBeenCalled();
  });

  it('returns Failed when getOrCreateStripeCustomerId rejects', async () => {
    mockFindUnique.mockResolvedValueOnce({
      email: 'a@b.co',
    } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>);
    mockGetOrCreate.mockRejectedValueOnce(new Error('stripe customers down'));

    const res = await createCheckoutSession({ interval: 'monthly' });
    expect(res).toEqual({ success: false, error: 'Failed to start checkout' });
    expect(mockCheckoutCreate).not.toHaveBeenCalled();
  });

  it('returns Email required when user has no email', async () => {
    mockFindUnique.mockResolvedValueOnce({
      email: null,
    } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>);
    const res = await createCheckoutSession({ interval: 'monthly' });
    expect(res).toEqual({ success: false, error: 'Email required' });
    expect(mockGetOrCreate).not.toHaveBeenCalled();
  });

  it('returns the checkout URL on success', async () => {
    mockFindUnique.mockResolvedValueOnce({
      email: 'a@b.co',
    } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>);
    mockGetOrCreate.mockResolvedValueOnce('cus_123');
    mockCheckoutCreate.mockResolvedValueOnce({
      url: 'https://checkout.stripe.com/pay/abc',
    } as never);

    const res = await createCheckoutSession({ interval: 'yearly' });

    expect(res).toEqual({
      success: true,
      data: { url: 'https://checkout.stripe.com/pay/abc' },
    });
    const callArg = mockCheckoutCreate.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(callArg.mode).toBe('subscription');
    expect(callArg.customer).toBe('cus_123');
    expect(callArg.metadata).toEqual({ userId: 'u1' });
    expect(callArg.subscription_data).toEqual({ metadata: { userId: 'u1' } });
    expect(callArg.line_items).toEqual([
      { price: 'price_yearly', quantity: 1 },
    ]);
    expect(callArg.success_url).toMatch(/\/settings\?checkout=success$/);
    expect(callArg.cancel_url).toMatch(/\/settings\?checkout=cancel$/);
  });

  it('returns Failed when Stripe returns no url', async () => {
    mockFindUnique.mockResolvedValueOnce({
      email: 'a@b.co',
    } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>);
    mockGetOrCreate.mockResolvedValueOnce('cus_123');
    mockCheckoutCreate.mockResolvedValueOnce({ url: null } as never);

    const res = await createCheckoutSession({ interval: 'monthly' });
    expect(res).toEqual({ success: false, error: 'Failed to start checkout' });
  });
});

describe('createPortalSession', () => {
  it('rejects unauthorized', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await createPortalSession();
    expect(res).toEqual({ success: false, error: 'Unauthorized' });
    expect(mockPortalCreate).not.toHaveBeenCalled();
  });

  it('returns No subscription found when user has no stripeCustomerId', async () => {
    mockFindUnique.mockResolvedValueOnce({
      stripeCustomerId: null,
    } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>);

    const res = await createPortalSession();
    expect(res).toEqual({ success: false, error: 'No subscription found' });
    expect(mockPortalCreate).not.toHaveBeenCalled();
  });

  it('returns the portal URL on success', async () => {
    mockFindUnique.mockResolvedValueOnce({
      stripeCustomerId: 'cus_123',
    } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>);
    mockPortalCreate.mockResolvedValueOnce({
      url: 'https://billing.stripe.com/p/session/abc',
    } as never);

    const res = await createPortalSession();
    expect(res).toEqual({
      success: true,
      data: { url: 'https://billing.stripe.com/p/session/abc' },
    });
    const callArg = mockPortalCreate.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(callArg.customer).toBe('cus_123');
    expect(callArg.return_url).toMatch(/\/settings$/);
  });

  it('returns Failed to open portal when Stripe rejects', async () => {
    mockFindUnique.mockResolvedValueOnce({
      stripeCustomerId: 'cus_123',
    } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>);
    mockPortalCreate.mockRejectedValueOnce(new Error('stripe down'));

    const res = await createPortalSession();
    expect(res).toEqual({ success: false, error: 'Failed to open portal' });
  });
});
