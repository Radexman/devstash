'use server';

import {
  createItem as createItemQuery,
  deleteItem as deleteItemQuery,
  toggleItemFavorite as toggleItemFavoriteQuery,
  toggleItemPin as toggleItemPinQuery,
  updateItem as updateItemQuery,
  type ItemDetail,
} from '@/lib/db/items';
import { getUserCollectionIds } from '@/lib/db/collections';
import { checkCreateLimit } from '@/lib/plan-limits';
import { parseOrFail, requireUserId } from '@/lib/action-helpers';
import {
  createItemSchema,
  updateItemSchema,
  type CreateItemPayload,
  type UpdateItemPayload,
} from '@/lib/schemas/item';
import type { ActionResult } from '@/types/action';

export type { CreateItemPayload, UpdateItemPayload };

export async function updateItem(
  itemId: string,
  payload: UpdateItemPayload,
): Promise<ActionResult<ItemDetail>> {
  const session = await requireUserId();
  if (!session.ok) return { success: false, error: session.error };

  const parsed = parseOrFail(updateItemSchema, payload);
  if (!parsed.ok) return { success: false, error: parsed.error };

  try {
    const ownedCollectionIds = await getUserCollectionIds(
      session.userId,
      parsed.data.collectionIds,
    );
    const updated = await updateItemQuery(itemId, session.userId, {
      ...parsed.data,
      collectionIds: ownedCollectionIds,
    });
    if (!updated) {
      return { success: false, error: 'Item not found' };
    }
    return { success: true, data: updated };
  } catch {
    return { success: false, error: 'Failed to update item' };
  }
}

export async function createItem(
  payload: CreateItemPayload,
): Promise<ActionResult<ItemDetail>> {
  const session = await requireUserId();
  if (!session.ok) return { success: false, error: session.error };

  const parsed = parseOrFail(createItemSchema, payload);
  if (!parsed.ok) return { success: false, error: parsed.error };

  const limit = await checkCreateLimit(session.userId, 'items');
  if (!limit.ok) return { success: false, error: limit.error };

  const { type, ...rest } = parsed.data;

  const supportsContent = type !== 'link';
  const supportsLanguage = type === 'snippet' || type === 'command';
  const supportsUrl = type === 'link';

  try {
    const ownedCollectionIds = await getUserCollectionIds(
      session.userId,
      rest.collectionIds,
    );
    const created = await createItemQuery(session.userId, {
      typeName: type,
      title: rest.title,
      description: rest.description,
      content: supportsContent ? rest.content : null,
      url: supportsUrl ? rest.url : null,
      language: supportsLanguage ? rest.language : null,
      tags: rest.tags,
      collectionIds: ownedCollectionIds,
    });
    if (!created) {
      return { success: false, error: 'Item type not found' };
    }
    return { success: true, data: created };
  } catch {
    return { success: false, error: 'Failed to create item' };
  }
}

export async function deleteItem(
  itemId: string,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireUserId();
  if (!session.ok) return { success: false, error: session.error };

  try {
    const deleted = await deleteItemQuery(itemId, session.userId);
    if (!deleted) {
      return { success: false, error: 'Item not found' };
    }
    return { success: true, data: { id: itemId } };
  } catch {
    return { success: false, error: 'Failed to delete item' };
  }
}

export async function toggleItemFavorite(
  itemId: string,
): Promise<ActionResult<{ id: string; isFavorite: boolean }>> {
  const session = await requireUserId();
  if (!session.ok) return { success: false, error: session.error };

  try {
    const result = await toggleItemFavoriteQuery(itemId, session.userId);
    if (!result) {
      return { success: false, error: 'Item not found' };
    }
    return { success: true, data: { id: itemId, isFavorite: result.isFavorite } };
  } catch {
    return { success: false, error: 'Failed to update favorite' };
  }
}

export async function toggleItemPin(
  itemId: string,
): Promise<ActionResult<{ id: string; isPinned: boolean }>> {
  const session = await requireUserId();
  if (!session.ok) return { success: false, error: session.error };

  try {
    const result = await toggleItemPinQuery(itemId, session.userId);
    if (!result) {
      return { success: false, error: 'Item not found' };
    }
    return { success: true, data: { id: itemId, isPinned: result.isPinned } };
  } catch {
    return { success: false, error: 'Failed to update pin' };
  }
}
