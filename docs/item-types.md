# Item Types

DevStash ships with **7 immutable system item types**. Each is an `ItemType` row where `isSystem = true` and `userId = null` (available to all users). Users may create custom types in the future, but the MVP set below is fixed.

Source of truth: [prisma/seed.ts](../prisma/seed.ts) (`SYSTEM_ITEM_TYPES`), [src/lib/item-icons.ts](../src/lib/item-icons.ts) (icon resolution), [prisma/schema.prisma](../prisma/schema.prisma) (`Item` / `ItemType` models).

> Note: `context/project-overview.md` references `src/lib/constants.tsx` as a source, but the actual runtime mapping lives in [src/lib/item-icons.ts](../src/lib/item-icons.ts). The canonical list of names/icons/colors is seeded from [prisma/seed.ts](../prisma/seed.ts).

---

## The 7 Types

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

### 6. File
- **Icon:** `File`
- **Color:** `#6b7280` (gray)
- **Category:** `file`
- **Plan:** **Pro**
- **Purpose:** Uploaded files — context files, boilerplates, arbitrary documents, stored in Cloudflare R2.
- **Key fields used:** `title`, `fileUrl`, `fileName`, `fileSize`, `description`, `tags`.

### 7. Image
- **Icon:** `Image`
- **Color:** `#ec4899` (pink)
- **Category:** `file`
- **Plan:** **Pro**
- **Purpose:** Uploaded images — screenshots, diagrams, reference art, stored in Cloudflare R2.
- **Key fields used:** `title`, `fileUrl`, `fileName`, `fileSize`, `description`, `tags`.

---

## Content-Type Classification

Every `Item` row has a `contentType` discriminator (`"text" | "file" | "url"`) that determines which storage fields are populated. This is independent from `itemTypeId`, but the 7 system types map 1:1 to a category:

| `contentType` | System types                         | Content stored in                       | Nullable fields              |
| ------------- | ------------------------------------- | --------------------------------------- | ---------------------------- |
| `text`        | snippet, prompt, command, note        | `content` (string)                      | `fileUrl`, `fileName`, `fileSize`, `url` |
| `url`         | link                                  | `url` (string)                          | `content`, `fileUrl`, `fileName`, `fileSize` |
| `file`        | file, image                           | `fileUrl` + `fileName` + `fileSize`     | `content`, `url`             |

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
  - `file` types → filename, size, download/preview button (image types additionally render an inline thumbnail)
- **Pro gating:** File and Image types display a `PRO` badge in the sidebar and are hidden or disabled for non-Pro users in production. During development all types are unlocked for every user.
- **Sidebar:** item types appear in the order snippet → prompt → command → note → link → file → image, each showing a per-type count.

---

## Quick Reference Table

| Type    | Icon         | Color     | Category | Plan | Primary content field       |
| ------- | ------------ | --------- | -------- | ---- | --------------------------- |
| Snippet | `Code`       | `#3b82f6` | text     | Free | `content` (+ `language`)    |
| Prompt  | `Sparkles`   | `#8b5cf6` | text     | Free | `content`                   |
| Command | `Terminal`   | `#f97316` | text     | Free | `content`                   |
| Note    | `StickyNote` | `#fde047` | text     | Free | `content` (markdown)        |
| Link    | `Link`       | `#10b981` | url      | Free | `url`                       |
| File    | `File`       | `#6b7280` | file     | Pro  | `fileUrl` / `fileName` / `fileSize` |
| Image   | `Image`      | `#ec4899` | file     | Pro  | `fileUrl` / `fileName` / `fileSize` |
