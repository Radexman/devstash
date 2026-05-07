import { prisma } from '@/lib/prisma';

export const FREE_LIMITS = {
  items: 50,
  collections: 3,
} as const;

export type LimitName = keyof typeof FREE_LIMITS;

export interface Usage {
  items: number;
  collections: number;
  isPro: boolean;
}

export async function getUsage(userId: string): Promise<Usage> {
  const [items, collections, user] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { isPro: true },
    }),
  ]);
  return { items, collections, isPro: user?.isPro ?? false };
}

export interface CanCreateResult {
  allowed: boolean;
  reason?: 'limit_reached';
  used: number;
  limit: number;
}

export async function canCreate(
  userId: string,
  name: LimitName,
): Promise<CanCreateResult> {
  const usage = await getUsage(userId);
  const used = usage[name];
  if (usage.isPro) {
    return { allowed: true, used, limit: Infinity };
  }
  const limit = FREE_LIMITS[name];
  const allowed = used < limit;
  return {
    allowed,
    reason: allowed ? undefined : 'limit_reached',
    used,
    limit,
  };
}

export type CheckCreateLimitResult =
  | { ok: true }
  | { ok: false; error: string };

export async function checkCreateLimit(
  userId: string,
  name: LimitName,
): Promise<CheckCreateLimitResult> {
  const limit = await canCreate(userId, name);
  if (limit.allowed) return { ok: true };
  return {
    ok: false,
    error: `Free plan limit of ${limit.limit} ${name} reached. Upgrade to Pro for unlimited.`,
  };
}
