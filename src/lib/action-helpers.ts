import type { z } from 'zod';
import { auth } from '@/auth';
import { canUseAi } from '@/lib/ai-limits';
import { checkAiRateLimit } from '@/lib/rate-limit';

const PRO_REQUIRED = 'AI features are Pro-only. Upgrade to Pro to enable.';

export type RequireUserIdResult =
  | { ok: true; userId: string }
  | { ok: false; error: 'Unauthorized' };

export async function requireUserId(): Promise<RequireUserIdResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'Unauthorized' };
  }
  return { ok: true, userId: session.user.id };
}

export type ParseOrFailResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function parseOrFail<S extends z.ZodTypeAny>(
  schema: S,
  payload: unknown,
): ParseOrFailResult<z.output<S>> {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? 'Invalid input' };
  }
  return { ok: true, data: parsed.data };
}

export type AiGateResult = { ok: true } | { ok: false; error: string };

export async function aiGate(userId: string): Promise<AiGateResult> {
  const access = await canUseAi(userId);
  if (!access.allowed) {
    return { ok: false, error: PRO_REQUIRED };
  }

  const rl = await checkAiRateLimit(userId);
  if (!rl.ok) {
    return {
      ok: false,
      error: `Too many AI requests. Try again in ${rl.retryAfterSeconds ?? 60}s.`,
    };
  }
  return { ok: true };
}
