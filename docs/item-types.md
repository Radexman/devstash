# Item Types

DevStash ships with **5 immutable system item types**. Each is an `ItemType` row where `isSystem = true` and `userId = null` (available to all users). Users may create custom types in the future, but the MVP set below is fixed.

Source of truth: [prisma/seed.ts](../prisma/seed.ts) (`SYSTEM_ITEM_TYPES`), [src/lib/item-icons.ts](../src/lib/item-icons.ts) (icon resolution), [prisma/schema.prisma](../prisma/schema.prisma) (`Item` / `ItemType` models).

---

## The 5 Types

### 1. Snippet
- **Icon:** `Code` (lucide)
- **Color:** `#3b82f6` (blue)
- **Category:** `text`
- **Plan:** Free
- **Purpose:** Reusable code blocks — hooks, components, utilities, patterns.
- **Key fields used:** `title`, `content`, `language`, `description`, `tags`.

### 2. Prompt
- **Icon:** `Sparkles`
- **Color:** `#8b5cf6` (purple)
- **Category:** `text`
- **Plan:** Free
- **Purpose:** AI prompts — system messages, instructions, reusable LLM templates.
- **Key fields used:** `title`, `content`, `description`, `tags`.

### 3. Command
- **Icon:** `Terminal`
- **Color:** `#f97316` (orange)
- **Category:** `text`
- **Plan:** Free
- **Purpose:** Shell / CLI commands — git, docker, npm, system admin one-liners.
- **Key fields used:** `title`, `content`, `description`, `tags`. `language` may be used for shell flavor (bash, pwsh).

### 4. Note
- **Icon:** `StickyNote`
- **Color:** `#fde047` (yellow)
- **Category:** `text`
- **Plan:** Free
- **Purpose:** Free-form markdown notes — docs, explanations, course notes, TILs.
- **Key fields used:** `title`, `content` (markdown), `description`, `tags`.

### 5. Link
- **Icon:** `Link` (rendered via `LinkIcon` in `iconMap`)
- **Color:** `#10b981` (emerald)
- **Category:** `url`
- **Plan:** Free
- **Purpose:** Bookmarks — docs, references, articles, tools.
- **Key fields used:** `title`, `url`, `description`, `tags`.

---

## Content-Type Classification

Every `Item` row has a `contentType` discriminator (`"text" | "url"`) that determines which storage fields are populated. This is independent from `itemTypeId`, but the 5 system types map 1:1 to a category:

| `contentType` | System types                   | Content stored in  | Nullable fields |
| ------------- | ------------------------------ | ------------------ | --------------- |
| `text`        | snippet, prompt, command, note | `content` (string) | `url`           |
| `url`         | link                           | `url` (string)     | `content`       |

The `language` field is only meaningful for `text` items where syntax highlighting applies — typically snippets, occasionally commands.

---

## Shared Properties

All items — regardless of type — share the following fields on the `Item` model:

- **Identity:** `id`, `title`, `description`
- **Ownership:** `userId`, `itemTypeId`
- **Discovery flags:** `isFavorite`, `isPinned`
- **Organization:** many-to-many `collections` (via `ItemCollection`), many-to-many `tags` (via `ItemTags`)
- **Timestamps:** `createdAt`, `updatedAt`

Indexes: `@@index([userId])` and `@@index([itemTypeId])` on `Item`.

---

## Display Differences

- **Border / accent color:** items render with a left border or accent tinted by the `ItemType.color` hex above. Collection cards use the **dominant** item type's color as their background tint.
- **Icon:** rendered from `ItemType.icon` via the `iconMap` in [src/lib/item-icons.ts](../src/lib/item-icons.ts). The seed stores `"Link"` but `iconMap` resolves it to lucide's `LinkIcon` to avoid colliding with the native `Link` export.
- **Drawer body:**
  - `text` types → markdown editor / syntax-highlighted code block (keyed by `language`)
  - `url` types → clickable link preview
- **Sidebar:** item types appear in the order snippet → prompt → command → note → link, each showing a per-type count.

---

## Quick Reference Table

| Type    | Icon         | Color     | Category | Plan | Primary content field    |
| ------- | ------------ | --------- | -------- | ---- | ------------------------ |
| Snippet | `Code`       | `#3b82f6` | text     | Free | `content` (+ `language`) |
| Prompt  | `Sparkles`   | `#8b5cf6` | text     | Free | `content`                |
| Command | `Terminal`   | `#f97316` | text     | Free | `content`                |
| Note    | `StickyNote` | `#fde047` | text     | Free | `content` (markdown)     |
| Link    | `Link`       | `#10b981` | url      | Free | `url`                    |
