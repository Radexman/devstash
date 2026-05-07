'use server';

import { z } from 'zod';
import {
  createCollection as createCollectionQuery,
  deleteCollection as deleteCollectionQuery,
  toggleCollectionFavorite as toggleCollectionFavoriteQuery,
  updateCollection as updateCollectionQuery,
  type CollectionSummary,
} from '@/lib/db/collections';
import { checkCreateLimit } from '@/lib/plan-limits';
import { parseOrFail, requireUserId } from '@/lib/action-helpers';
import type { ActionResult } from '@/types/action';

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

export async function createCollection(
  payload: CreateCollectionPayload,
): Promise<ActionResult<CollectionSummary>> {
  const session = await requireUserId();
  if (!session.ok) return { success: false, error: session.error };

  const parsed = parseOrFail(collectionSchema, payload);
  if (!parsed.ok) return { success: false, error: parsed.error };

  const limit = await checkCreateLimit(session.userId, 'collections');
  if (!limit.ok) return { success: false, error: limit.error };

  try {
    const created = await createCollectionQuery(session.userId, parsed.data);
    return { success: true, data: created };
  } catch {
    return { success: false, error: 'Failed to create collection' };
  }
}

export async function updateCollection(
  collectionId: string,
  payload: UpdateCollectionPayload,
): Promise<ActionResult<CollectionSummary>> {
  const session = await requireUserId();
  if (!session.ok) return { success: false, error: session.error };

  const parsed = parseOrFail(collectionSchema, payload);
  if (!parsed.ok) return { success: false, error: parsed.error };

  try {
    const updated = await updateCollectionQuery(
      collectionId,
      session.userId,
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
  const session = await requireUserId();
  if (!session.ok) return { success: false, error: session.error };

  try {
    const deleted = await deleteCollectionQuery(collectionId, session.userId);
    if (!deleted) {
      return { success: false, error: 'Collection not found' };
    }
    return { success: true, data: { id: collectionId } };
  } catch {
    return { success: false, error: 'Failed to delete collection' };
  }
}

export async function toggleCollectionFavorite(
  collectionId: string,
): Promise<ActionResult<{ id: string; isFavorite: boolean }>> {
  const session = await requireUserId();
  if (!session.ok) return { success: false, error: session.error };

  try {
    const result = await toggleCollectionFavoriteQuery(
      collectionId,
      session.userId,
    );
    if (!result) {
      return { success: false, error: 'Collection not found' };
    }
    return {
      success: true,
      data: { id: collectionId, isFavorite: result.isFavorite },
    };
  } catch {
    return { success: false, error: 'Failed to update favorite' };
  }
}
