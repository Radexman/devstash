# Item CRUD Architecture

A unified CRUD design that serves all 5 system item types (snippet, prompt, command, note, link) through **one set of mutations**, **one query module**, **one dynamic route**, and **shared components that adapt by type**. Type-specific logic lives in components — never in the actions or query layer.

See also: [docs/item-types.md](./item-types.md) for the type catalog and the `text` / `url` content-type classification referenced throughout.

---

## Principles

1. **One Item, many faces.** All 5 types are rows in `Item`, discriminated by `itemTypeId` and `contentType`. There is no per-type table, so there should be no per-type action file.
2. **Actions are dumb.** Mutations validate input with Zod, write to Prisma, revalidate paths, and return `{ success, data, error }`. They do **not** branch on type beyond "which fields am I allowed to persist for this `contentType`."
3. **Queries live in `lib/db`.** Server components import them directly — no action round-trip for reads.
4. **Routing is dynamic.** `/items/[type]` matches all 7 type slugs via one `page.tsx`.
5. **Type-specific rendering lives in components**, selected by a small `type → component` map. Adding a custom type later means registering one entry — not touching actions or routes.

---

## File Structure

```
src/
├── actions/
│   └── items.ts                  # create / update / delete / togglePin / toggleFavorite
│
├── lib/
│   ├── db/
│   │   └── items.ts              # getItemsByType, getItemById, getPinnedItems, ... (existing)
│   └── items/
│       ├── schemas.ts            # Zod schemas, one per contentType + shared base
│       ├── type-registry.ts      # slug ↔ type-name map, contentType resolver
│       └── content-fields.ts     # which Item fields are valid for which contentType
│
├── app/
│   └── items/
│       └── [type]/
│           ├── page.tsx          # list view for a single type
│           └── [id]/
│               └── page.tsx      # detail view (optional — drawer is primary)
│
└── components/
    └── items/
        ├── ItemGrid.tsx              # shared grid/list renderer
        ├── ItemCard.tsx              # shared card, uses ItemType.color for border
        ├── ItemDrawer.tsx            # shared drawer shell (open/close, title, tags)
        ├── ItemForm.tsx              # shared create/edit form shell
        ├── fields/
        │   ├── TextContentField.tsx  # markdown editor + language picker
        │   └── UrlField.tsx          # URL input + preview
        └── viewers/
            ├── TextViewer.tsx        # syntax-highlighted code / markdown
            └── UrlViewer.tsx         # clickable preview card
```

**Why one `actions/items.ts`:** every type mutates the same `Item` table. A per-type action file would be 5× duplication of identical Prisma calls.

**Why `lib/db/items.ts` stays separate from actions:** server components read directly from `lib/db`. Actions are only used for writes (from client components / forms). This matches the pattern already established by [src/lib/db/items.ts](../src/lib/db/items.ts) and [src/lib/db/collections.ts](../src/lib/db/collections.ts).

---

## Routing: `/items/[type]`

Single dynamic segment, resolved at the top of the page:

```ts
// src/app/items/[type]/page.tsx
import { notFound } from "next/navigation";
import { resolveTypeSlug } from "@/lib/items/type-registry";
import { getItemsByType } from "@/lib/db/items";
import { auth } from "@/auth";
import { ItemGrid } from "@/components/items/ItemGrid";

export default async function ItemsByTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const resolved = resolveTypeSlug(type);     // "snippets" → { name: "snippet", contentType: "text" }
  if (!resolved) notFound();

  const session = await auth();
  const items = await getItemsByType(session!.user.id, resolved.name);

  return <ItemGrid items={items} type={resolved} />;
}

export function generateStaticParams() {
  return [
    { type: "snippets" }, { type: "prompts" }, { type: "commands" },
    { type: "notes" },    { type: "links" },
  ];
}
```

`resolveTypeSlug` lives in `lib/items/type-registry.ts` and maps plural URL slugs to the canonical singular name stored in `ItemType.name` from [prisma/seed.ts](../prisma/seed.ts). It also exposes the `contentType` (`text` / `url`) so the page and its components know which field set to render.

> The project-overview.md references `src/lib/constants.tsx`; today the live mapping lives in [src/lib/item-icons.ts](../src/lib/item-icons.ts). The type registry should consolidate slug + name + icon + color + contentType in one place so components have a single import.

---

## Actions: `src/actions/items.ts`

```ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { itemInputSchema } from "@/lib/items/schemas";

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createItem(input: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const parsed = itemInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.message };

  const item = await prisma.item.create({
    data: {
      ...parsed.data,                   // fields already filtered by contentType discriminator
      userId: session.user.id,
    },
    select: { id: true, itemType: { select: { name: true } } },
  });

  revalidatePath(`/items/${pluralize(item.itemType.name)}`);
  revalidatePath("/dashboard");
  return { success: true, data: { id: item.id } };
}

export async function updateItem(id: string, input: unknown): Promise<ActionResult> { /* ... */ }
export async function deleteItem(id: string): Promise<ActionResult> { /* ... */ }
export async function togglePin(id: string): Promise<ActionResult> { /* ... */ }
export async function toggleFavorite(id: string): Promise<ActionResult> { /* ... */ }
export async function addToCollection(itemId: string, collectionId: string): Promise<ActionResult> { /* ... */ }
export async function removeFromCollection(itemId: string, collectionId: string): Promise<ActionResult> { /* ... */ }
```

Every write action:
- Checks `auth()` and asserts ownership (`where: { id, userId: session.user.id }`) on update/delete.
- Validates with a **Zod discriminated union** on `contentType` — the schema rejects mismatched fields (e.g. `content` submitted for a `url` type).
- Returns the `{ success, data, error }` shape from `context/coding-standards.md`.
- Calls `revalidatePath` on affected list + dashboard routes.

### Zod discriminated union (`lib/items/schemas.ts`)

```ts
const base = {
  title: z.string().min(1).max(200),
  description: z.string().max(1000).nullish(),
  itemTypeId: z.string().cuid(),
  tagIds: z.array(z.string().cuid()).optional(),
  collectionIds: z.array(z.string().cuid()).optional(),
};

export const itemInputSchema = z.discriminatedUnion("contentType", [
  z.object({ ...base, contentType: z.literal("text"),
    content: z.string().min(1), language: z.string().nullish() }),
  z.object({ ...base, contentType: z.literal("url"),
    url: z.string().url() }),
]);
```

This is the **only place** branching on content category lives in the write path. Actions themselves remain straight-through.

---

## Queries: `src/lib/db/items.ts`

Extend the existing module with list + detail fetchers (the current file already has `getPinnedItems`, `getRecentItems`, `getDashboardStats`, `getSystemItemTypes`):

```ts
export async function getItemsByType(userId: string, typeName: string) { /* ... */ }
export async function getItemById(userId: string, id: string) { /* ... */ }
export async function searchItems(userId: string, query: string, typeName?: string) { /* ... */ }
```

Rules:
- All queries scope by `userId`.
- Always `include: { itemType: {...}, tags: {...} }` so components can render type-aware UI without a second round trip.
- Indexes `@@index([userId])` and `@@index([itemTypeId])` on `Item` already cover the common filters.

---

## Components: adapting by type

The **only** place the system branches by type is in the view layer, through two small registries:

```ts
// lib/items/type-registry.ts
export const CONTENT_VIEWERS = {
  text: TextViewer,
  url:  UrlViewer,
} as const;

export const CONTENT_FIELDS = {
  text: TextContentField,
  url:  UrlField,
} as const;
```

Drawer / form lookup is keyed by `contentType` (`text` / `url`). Per-type overrides can be added later if a specific system type needs bespoke rendering.

### Component responsibilities

| Component         | Job                                                                            | Knows about type? |
| ----------------- | ------------------------------------------------------------------------------ | ----------------- |
| `ItemGrid`        | Renders list/grid of `ItemCard`s for a page of items.                          | No — passes through. |
| `ItemCard`        | Title, description, icon, colored border from `ItemType.color`, pin/favorite. | Only via `itemType` prop — no branching. |
| `ItemDrawer`      | Modal shell: title, tags, collection chips, edit/delete controls. Picks a viewer via the registry. | Yes — one lookup only. |
| `ItemForm`        | Create/edit shell: title, description, tags, collections. Mounts the right content field via `CONTENT_FIELDS`. | Yes — one lookup only. |
| `TextContentField` | Markdown editor + optional language picker. Writes `content` and `language`. | N/A (content-type-specific). |
| `UrlField`        | URL input + live preview. Writes `url`.                                        | N/A. |
| `TextViewer`      | Syntax highlight (by `language`) or markdown render.                           | N/A. |
| `UrlViewer`       | Clickable preview card.                                                        | N/A. |

Anything that needs color or icon reads it from the `ItemType` join — never from a hardcoded switch on the type name.

---

## Flow: creating a snippet

1. User opens `/items/snippets`, clicks "New" → `ItemDrawer` opens in create mode.
2. Drawer asks `type-registry` for the `contentType` of `snippet` (`text`) and mounts `<ItemForm>` with `<TextContentField>`.
3. On submit, the client calls `createItem({ contentType: "text", itemTypeId, title, content, language, ... })`.
4. `createItem` validates against the `text` branch of `itemInputSchema`, inserts, revalidates `/items/snippets` and `/dashboard`.
5. Server component re-renders with `getItemsByType(userId, "snippet")`. The new item appears in `ItemGrid`.

Swap `contentType: "url"` for a link item and the same machinery handles it — only the field component and the Zod branch differ. No new actions, no new routes, no new queries.

---

## Extending to custom types (future)

Custom types become `ItemType` rows with `isSystem = false` and a `userId`. They still resolve to one of the two `contentType` values, so:

- No new schema branch — they reuse an existing one.
- No new component — they pick an existing viewer/field via `contentType`.
- The only new work is letting users pick an icon + color in a "Manage types" UI.

This is exactly what the "one unified CRUD" architecture is designed to enable.
