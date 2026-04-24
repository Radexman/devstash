'use server';

import { z } from 'zod';
import { auth } from '@/auth';
import {
  createItem as createItemQuery,
  deleteItem as deleteItemQuery,
  toggleItemFavorite as toggleItemFavoriteQuery,
  toggleItemPin as toggleItemPinQuery,
  updateItem as updateItemQuery,
  type ItemDetail,
} from '@/lib/db/items';
import { getUserCollectionIds } from '@/lib/db/collections';

const ITEM_TYPES = ['snippet', 'prompt', 'command', 'note', 'link'] as const;
type CreateItemType = (typeof ITEM_TYPES)[number];

const updateItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z
    .string()
    .trim()
    .nullish()
    .transform((v) => (v && v.length > 0 ? v : null)),
  content: z
    .string()
    .nullish()
    .transform((v) => (v && v.length > 0 ? v : null)),
  url: z
    .string()
    .trim()
    .nullish()
    .transform((v) => (v && v.length > 0 ? v : null))
    .refine(
      (v) => {
        if (v === null || v === undefined) return true;
        try {
          new URL(v);
          return true;
        } catch {
          return false;
        }
      },
      { message: 'Invalid URL' },
    ),
  language: z
    .string()
    .trim()
    .nullish()
    .transform((v) => (v && v.length > 0 ? v : null)),
  tags: z
    .array(z.string())
    .default([])
    .transform((arr) => arr.map((t) => t.trim()).filter((t) => t.length > 0)),
  collectionIds: z.array(z.string()).default([]),
});

export type UpdateItemPayload = z.input<typeof updateItemSchema>;

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function updateItem(
  itemId: string,
  payload: UpdateItemPayload,
): Promise<ActionResult<ItemDetail>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = updateItemSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? 'Invalid input' };
  }

  try {
    const ownedCollectionIds = await getUserCollectionIds(
      session.user.id,
      parsed.data.collectionIds,
    );
    const updated = await updateItemQuery(itemId, session.user.id, {
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

const createItemSchema = z
  .object({
    type: z.enum(ITEM_TYPES),
    title: z.string().trim().min(1, 'Title is required'),
    description: z
      .string()
      .trim()
      .nullish()
      .transform((v) => (v && v.length > 0 ? v : null)),
    content: z
      .string()
      .nullish()
      .transform((v) => (v && v.length > 0 ? v : null)),
    url: z
      .string()
      .trim()
      .nullish()
      .transform((v) => (v && v.length > 0 ? v : null))
      .refine(
        (v) => {
          if (v === null || v === undefined) return true;
          try {
            new URL(v);
            return true;
          } catch {
            return false;
          }
        },
        { message: 'Invalid URL' },
      ),
    language: z
      .string()
      .trim()
      .nullish()
      .transform((v) => (v && v.length > 0 ? v : null)),
    tags: z
      .array(z.string())
      .default([])
      .transform((arr) => arr.map((t) => t.trim()).filter((t) => t.length > 0)),
    collectionIds: z.array(z.string()).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'link' && !data.url) {
      ctx.addIssue({
        code: 'custom',
        path: ['url'],
        message: 'URL is required for links',
      });
    }
  });

export type CreateItemPayload = z.input<typeof createItemSchema>;

export async function createItem(
  payload: CreateItemPayload,
): Promise<ActionResult<ItemDetail>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = createItemSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? 'Invalid input' };
  }

  const { type, ...rest } = parsed.data;
  const typeName: CreateItemType = type;

  const supportsContent = type !== 'link';
  const supportsLanguage = type === 'snippet' || type === 'command';
  const supportsUrl = type === 'link';

  try {
    const ownedCollectionIds = await getUserCollectionIds(
      session.user.id,
      rest.collectionIds,
    );
    const created = await createItemQuery(session.user.id, {
      typeName,
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
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const deleted = await deleteItemQuery(itemId, session.user.id);
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
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const result = await toggleItemFavoriteQuery(itemId, session.user.id);
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
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const result = await toggleItemPinQuery(itemId, session.user.id);
    if (!result) {
      return { success: false, error: 'Item not found' };
    }
    return { success: true, data: { id: itemId, isPinned: result.isPinned } };
  } catch {
    return { success: false, error: 'Failed to update pin' };
  }
}
