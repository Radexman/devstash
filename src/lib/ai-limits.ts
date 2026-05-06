import { prisma } from '@/lib/prisma';

export interface CanUseAiResult {
  allowed: boolean;
  reason?: 'not_pro';
}

export async function canUseAi(userId: string): Promise<CanUseAiResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPro: true },
  });
  if (!user?.isPro) {
    return { allowed: false, reason: 'not_pro' };
  }
  return { allowed: true };
}
