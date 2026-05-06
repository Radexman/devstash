import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    item: { count: vi.fn() },
    collection: { count: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import { canCreate, getUsage, FREE_LIMITS } from './plan-limits';

const mockItemCount = vi.mocked(prisma.item.count);
const mockCollectionCount = vi.mocked(prisma.collection.count);
const mockUserFindUnique = vi.mocked(prisma.user.findUnique);

beforeEach(() => {
  vi.clearAllMocks();
});

type FindUniqueResult = Awaited<ReturnType<typeof prisma.user.findUnique>>;

function setUsage(items: number, collections: number, isPro: boolean | null) {
  mockItemCount.mockResolvedValueOnce(items);
  mockCollectionCount.mockResolvedValueOnce(collections);
  const result =
    isPro === null ? null : ({ isPro } as unknown as FindUniqueResult);
  mockUserFindUnique.mockResolvedValueOnce(result);
}

describe('getUsage', () => {
  it('returns counts and isPro flag for a found user', async () => {
    setUsage(7, 2, true);
    const usage = await getUsage('u1');
    expect(usage).toEqual({ items: 7, collections: 2, isPro: true });
  });

  it('defaults isPro to false when the user is not found', async () => {
    setUsage(0, 0, null);
    const usage = await getUsage('missing');
    expect(usage.isPro).toBe(false);
  });

  it('scopes both counts to the userId', async () => {
    setUsage(0, 0, false);
    await getUsage('u1');
    expect(mockItemCount).toHaveBeenCalledWith({ where: { userId: 'u1' } });
    expect(mockCollectionCount).toHaveBeenCalledWith({
      where: { userId: 'u1' },
    });
    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { id: 'u1' },
      select: { isPro: true },
    });
  });
});

describe('canCreate — items', () => {
  it('Pro user is allowed regardless of count and limit is Infinity', async () => {
    setUsage(9999, 9999, true);
    const result = await canCreate('u1', 'items');
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(Infinity);
    expect(result.used).toBe(9999);
    expect(result.reason).toBeUndefined();
  });

  it('Free user under the limit is allowed', async () => {
    setUsage(FREE_LIMITS.items - 1, 0, false);
    const result = await canCreate('u1', 'items');
    expect(result).toEqual({
      allowed: true,
      reason: undefined,
      used: FREE_LIMITS.items - 1,
      limit: FREE_LIMITS.items,
    });
  });

  it('Free user at the limit is blocked with limit_reached', async () => {
    setUsage(FREE_LIMITS.items, 0, false);
    const result = await canCreate('u1', 'items');
    expect(result).toEqual({
      allowed: false,
      reason: 'limit_reached',
      used: FREE_LIMITS.items,
      limit: FREE_LIMITS.items,
    });
  });

  it('Free user over the limit (grandfathered) is blocked', async () => {
    setUsage(FREE_LIMITS.items + 5, 0, false);
    const result = await canCreate('u1', 'items');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('limit_reached');
  });
});

describe('canCreate — collections', () => {
  it('Pro user is allowed regardless of count', async () => {
    setUsage(0, 100, true);
    const result = await canCreate('u1', 'collections');
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(Infinity);
  });

  it('Free user under the limit is allowed', async () => {
    setUsage(0, FREE_LIMITS.collections - 1, false);
    const result = await canCreate('u1', 'collections');
    expect(result.allowed).toBe(true);
    expect(result.used).toBe(FREE_LIMITS.collections - 1);
    expect(result.limit).toBe(FREE_LIMITS.collections);
  });

  it('Free user at the limit is blocked', async () => {
    setUsage(0, FREE_LIMITS.collections, false);
    const result = await canCreate('u1', 'collections');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('limit_reached');
  });

  it('Free user over the limit is blocked', async () => {
    setUsage(0, FREE_LIMITS.collections + 1, false);
    const result = await canCreate('u1', 'collections');
    expect(result.allowed).toBe(false);
  });
});
