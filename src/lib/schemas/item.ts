import { z } from 'zod';

export const ITEM_TYPES = [
  'snippet',
  'prompt',
  'command',
  'note',
  'link',
] as const;

export type ItemType = (typeof ITEM_TYPES)[number];

const trimNullable = z
  .string()
  .trim()
  .nullish()
  .transform((v) => (v && v.length > 0 ? v : null));

const contentNullable = z
  .string()
  .nullish()
  .transform((v) => (v && v.length > 0 ? v : null));

const urlNullable = z
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
  );

const tagsArr = z
  .array(z.string())
  .default([])
  .transform((arr) => arr.map((t) => t.trim()).filter((t) => t.length > 0));

const collectionIdsArr = z.array(z.string()).default([]);

const itemBaseFields = {
  title: z.string().trim().min(1, 'Title is required'),
  description: trimNullable,
  content: contentNullable,
  url: urlNullable,
  language: trimNullable,
  tags: tagsArr,
  collectionIds: collectionIdsArr,
};

export const updateItemSchema = z.object(itemBaseFields);

export const createItemSchema = z
  .object({
    type: z.enum(ITEM_TYPES),
    ...itemBaseFields,
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

export type UpdateItemPayload = z.input<typeof updateItemSchema>;
export type CreateItemPayload = z.input<typeof createItemSchema>;
