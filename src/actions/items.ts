'use server';

import { z } from 'zod';
import { auth } from '@/auth';
import {
  deleteItem as deleteItemQuery,
  updateItem as updateItemQuery,
  type ItemDetail,
} from '@/lib/db/items';

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
    const updated = await updateItemQuery(itemId, session.user.id, parsed.data);
    if (!updated) {
      return { success: false, error: 'Item not found' };
    }
    return { success: true, data: updated };
  } catch {
    return { success: false, error: 'Failed to update item' };
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
