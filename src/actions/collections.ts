'use server';

import { z } from 'zod';
import { auth } from '@/auth';
import {
  createCollection as createCollectionQuery,
  type CollectionSummary,
} from '@/lib/db/collections';

const createCollectionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z
    .string()
    .trim()
    .nullish()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type CreateCollectionPayload = z.input<typeof createCollectionSchema>;

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createCollection(
  payload: CreateCollectionPayload,
): Promise<ActionResult<CollectionSummary>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = createCollectionSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? 'Invalid input' };
  }

  try {
    const created = await createCollectionQuery(session.user.id, parsed.data);
    return { success: true, data: created };
  } catch {
    return { success: false, error: 'Failed to create collection' };
  }
}
