'use server';

import { z } from 'zod';
import { auth } from '@/auth';
import {
  createCollection as createCollectionQuery,
  deleteCollection as deleteCollectionQuery,
  updateCollection as updateCollectionQuery,
  type CollectionSummary,
} from '@/lib/db/collections';

const collectionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z
    .string()
    .trim()
    .nullish()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type CreateCollectionPayload = z.input<typeof collectionSchema>;
export type UpdateCollectionPayload = z.input<typeof collectionSchema>;

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

  const parsed = collectionSchema.safeParse(payload);
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

export async function updateCollection(
  collectionId: string,
  payload: UpdateCollectionPayload,
): Promise<ActionResult<CollectionSummary>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = collectionSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? 'Invalid input' };
  }

  try {
    const updated = await updateCollectionQuery(
      collectionId,
      session.user.id,
      parsed.data,
    );
    if (!updated) {
      return { success: false, error: 'Collection not found' };
    }
    return { success: true, data: updated };
  } catch {
    return { success: false, error: 'Failed to update collection' };
  }
}

export async function deleteCollection(
  collectionId: string,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const deleted = await deleteCollectionQuery(collectionId, session.user.id);
    if (!deleted) {
      return { success: false, error: 'Collection not found' };
    }
    return { success: true, data: { id: collectionId } };
  } catch {
    return { success: false, error: 'Failed to delete collection' };
  }
}
