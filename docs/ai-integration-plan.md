# AI Integration Plan — DevStash Pro

> **Goal:** layer four Pro-only AI features on top of DevStash using OpenAI's `gpt-5-nano` — auto-tagging, summaries, "explain this code", and a prompt optimizer. Reuse the existing `ActionResult`, Zod, `canCreate`, Upstash rate-limit, and shadcn dialog patterns so AI feels like the rest of the app, not a bolt-on.

This plan is grounded in the codebase as of `main` after the Stripe Phase 2 + Upgrade Page features merged. It follows the same structure as [docs/stripe-integration-plan.md](stripe-integration-plan.md).

---

## 1. Current State Analysis

### 1.1 Where AI fits in the data model

[prisma/schema.prisma](../prisma/schema.prisma) — the `Item` model already has every field the four features need:

| Feature | Reads from | Writes to |
|---|---|---|
| Auto-tag | `Item.title`, `Item.content`, `Item.description` | `Item.tags` (`Tag` many-to-many) |
| Summary | `Item.content` | `Item.description` (markdown text) |
| Explain code | `Item.content`, `Item.language` | nothing — display only |
| Prompt optimizer | `Item.content` (when `Item.itemType.name === 'prompt'`) | nothing — user accepts/rejects, then saves via existing `updateItem` |

**No schema changes are required for the MVP.** A follow-on migration to record AI usage / monthly quotas (§7) is recommended but out of scope for v1.

### 1.2 Pro gating already in place

- [src/lib/plan-limits.ts](../src/lib/plan-limits.ts) — `getUsage(userId)` reads `isPro` plus item/collection counts; `canCreate(userId, name)` returns `{ allowed, reason, used, limit }`.
- [src/auth.ts](../src/auth.ts) JWT callback re-reads `isPro` from the DB on every session, mirrors onto `session.user.isPro` ([src/types/next-auth.d.ts](../src/types/next-auth.d.ts)).
- [src/components/billing/UpgradeButton.tsx](../src/components/billing/UpgradeButton.tsx) — the existing client trigger that funnels users into Stripe checkout. Reuse anywhere we surface a Pro-locked AI affordance.

We will add a new helper `canUseAi(userId)` that returns the same `{ allowed, reason, used, limit }` shape so callers can pattern-match the same way they do for `'items' | 'collections'`.

### 1.3 Server-action conventions (must follow)

From [src/actions/items.ts](../src/actions/items.ts) and [src/actions/billing.ts](../src/actions/billing.ts):

```ts
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

1. `'use server'` at the top of every action file.
2. `await auth()` → bail to `'Unauthorized'` if no `session.user.id`.
3. `Zod.safeParse` → bail with `parsed.error.issues[0].message`.
4. Pro gate (where applicable) → bail with `Free plan limit … Upgrade to Pro for unlimited.`-style error so the dialog banner can pattern-match (`error.startsWith('Free plan limit')`).
5. Try/catch wrap → log on failure, return generic `'Failed to …'`.
6. Mock external SDKs in vitest (see [src/actions/billing.test.ts](../src/actions/billing.test.ts) for the Stripe pattern — same approach for OpenAI).

### 1.4 Rate limiting available, but not wired into actions

[src/lib/rate-limit.ts](../src/lib/rate-limit.ts) exposes Upstash `Ratelimit` instances and `checkRateLimit()` that returns a `NextResponse | null`. Today it is only used by API routes. For AI server actions we will **add a sibling helper** that returns a plain result object instead of a `NextResponse`, since server actions don't have a `Request` object and shouldn't be returning responses.

### 1.5 UI affordance pattern

[src/components/items/NewItemDialog.tsx:97-103](../src/components/items/NewItemDialog.tsx#L97-L103) already inspects errors:

```ts
if (result.error.startsWith('Free plan limit')) {
  setLimitError(result.error);
} else {
  toast.error(result.error);
}
```

…and renders an inline amber banner with `<UpgradeButton interval="monthly">Upgrade</UpgradeButton>`. We reuse this exact pattern for AI buttons inside the ItemDrawer and dialogs.

---

## 2. Model Choice — `gpt-5-nano`

| Property | Value |
|---|---|
| Family | GPT-5 |
| Variant | Nano (smallest, fastest) |
| Context window | 400k tokens (~800 pages) |
| Pricing | $0.05 / 1M input · $0.40 / 1M output (USD, test 2026 numbers) |
| Reasoning effort | `minimal` / `low` / `medium` / `high` (default `medium`) |
| Structured output | Native (JSON schema, function calling, tool choice) |
| Streaming | Supported on the Responses API |
| API surface | Responses API (`client.responses.parse` + `client.responses.create({ stream: true })`) — preferred over Chat Completions for new code |

**Why nano, not Sonnet/Opus-class:** the four MVP features are short, latency-sensitive, and run *per item*. Auto-tagging on a 100-line snippet is a ~200-token prompt + a tiny JSON body — perfect nano territory. The cheap output token rate ($0.40/M) is the biggest cost lever we have when tens of thousands of items pass through the API over a year.

**Reasoning effort defaults:**
- `auto-tag` → `minimal` (classification, no chain-of-thought needed).
- `summary` → `low` (short freeform output).
- `explain-code` → `medium` (some reasoning to be useful).
- `optimize-prompt` → `medium` (rewrites benefit from reasoning; still cheap on nano).

Pin the model name in env, **not** in code, so we can flip to `gpt-5.4-nano` later without a migration:

```bash
# .env
OPENAI_MODEL=gpt-5-nano
```

---

## 3. Implementation Plan

### 3.1 Files to create

#### `src/lib/openai.ts` — SDK singleton

Mirrors [src/lib/stripe.ts](../src/lib/stripe.ts)'s lazy-Proxy pattern so missing env doesn't break `next build` page-data collection.

```ts
import OpenAI from 'openai';

export const OPENAI_MODEL =
  process.env.OPENAI_MODEL ?? 'gpt-5-nano';

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (_client) return _client;
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  _client = new OpenAI({ apiKey: key });
  return _client;
}

// Lazy proxy so module import never throws (keeps `next build` happy).
export const openai = new Proxy({} as OpenAI, {
  get(_t, prop) {
    const c = getClient() as unknown as Record<PropertyKey, unknown>;
    const value = c[prop];
    return typeof value === 'function' ? value.bind(c) : value;
  },
});
```

> **Why the Proxy:** see the Stripe Phase 2 history note — eager instantiation killed `next build` because the AI route module became part of page-data collection without env vars set. Same fix applies here.

#### `src/lib/ai-limits.ts` — Pro check + monthly cap

```ts
import { prisma } from '@/lib/prisma';

export const AI_FREE_MONTHLY_CALLS = 0; // free users gated entirely in v1
export const AI_PRO_MONTHLY_CALLS = 500; // soft cap to bound runaway cost

export interface CanUseAiResult {
  allowed: boolean;
  reason?: 'not_pro' | 'monthly_cap_reached';
  used: number;
  limit: number;
}

export async function canUseAi(userId: string): Promise<CanUseAiResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPro: true },
  });
  const isPro = user?.isPro ?? false;
  if (!isPro) {
    return { allowed: false, reason: 'not_pro', used: 0, limit: 0 };
  }
  // v1: skip per-user metering. Wire up `AiCall` model in v2 (see §7).
  return { allowed: true, used: 0, limit: AI_PRO_MONTHLY_CALLS };
}
```

> v1 ships with **Pro-or-block**, no per-user metering. The function shape leaves room for the metering follow-on without changing callers.

#### `src/lib/ai-rate-limit.ts` — server-action friendly limiter

```ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const aiRateLimiters = {
  // 30 calls per user per minute is plenty for human-driven actions
  // and stops a runaway loop dead.
  perUser: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    prefix: 'ratelimit:ai:user',
  }),
  // Per-feature daily cap as a defence-in-depth layer.
  daily: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(300, '24 h'),
    prefix: 'ratelimit:ai:daily',
  }),
};

export interface AiRateLimitResult {
  ok: boolean;
  retryAfterSeconds?: number;
}

export async function checkAiRateLimit(
  userId: string,
): Promise<AiRateLimitResult> {
  try {
    const [perUser, daily] = await Promise.all([
      aiRateLimiters.perUser.limit(`u:${userId}`),
      aiRateLimiters.daily.limit(`u:${userId}`),
    ]);
    if (!perUser.success) {
      return {
        ok: false,
        retryAfterSeconds: Math.max(1, Math.ceil((perUser.reset - Date.now()) / 1000)),
      };
    }
    if (!daily.success) {
      return {
        ok: false,
        retryAfterSeconds: Math.max(1, Math.ceil((daily.reset - Date.now()) / 1000)),
      };
    }
    return { ok: true };
  } catch (err) {
    // Fail open — same policy as src/lib/rate-limit.ts.
    console.error('AI rate limiting error (failing open):', err);
    return { ok: true };
  }
}
```

#### `src/lib/ai-prompts.ts` — system prompts in one place

```ts
export const AUTO_TAG_SYSTEM = `You suggest 3–6 lowercase tags for a developer's
saved item (snippet/prompt/command/note/link). Tags are short (1–3 words),
hyphenated, and describe topic, technology, or use case. Return only the JSON
matching the schema — no prose.`;

export const SUMMARY_SYSTEM = `You write a 1–2 sentence developer summary of a
saved item. Be concrete: state what it does and when to use it. No preamble,
no markdown headers. Plain prose.`;

export const EXPLAIN_CODE_SYSTEM = `You explain code to a working software
engineer. Cover (a) what it does, (b) how it works step by step, (c) any
non-obvious trade-offs or pitfalls. Use markdown with short headings and
fenced code where helpful.`;

export const OPTIMIZE_PROMPT_SYSTEM = `You rewrite the user's prompt to be more
specific, more actionable, and more likely to produce a good response from a
modern LLM. Preserve the user's intent. Return only the rewritten prompt — no
preamble, no explanation.`;
```

#### `src/lib/db/ai.ts` — DB writes used by AI actions

Only what AI features need that doesn't already exist:

```ts
import { prisma } from '@/lib/prisma';

// Replace the user-scoped item's tag set. Reuses connectOrCreate.
export async function setItemTags(
  itemId: string,
  userId: string,
  tags: string[],
) {
  const owned = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true },
  });
  if (!owned) return null;
  return prisma.item.update({
    where: { id: itemId },
    data: {
      tags: {
        set: [],
        connectOrCreate: tags.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
    },
    select: { id: true, tags: { select: { name: true } } },
  });
}
```

> Summary/explain are **stateless** — they return text the user accepts, then the existing `updateItem` action persists it. No new write helpers needed for those.

#### `src/actions/ai.ts` — the four AI server actions

All four follow the same shape: auth → Zod → `canUseAi` → `checkAiRateLimit` → call OpenAI → return result. Sharing one file keeps imports simple; split if it crosses ~400 lines later.

```ts
'use server';

import { z } from 'zod';
import { zodTextFormat } from 'openai/helpers/zod';
import { auth } from '@/auth';
import { openai, OPENAI_MODEL } from '@/lib/openai';
import { canUseAi } from '@/lib/ai-limits';
import { checkAiRateLimit } from '@/lib/ai-rate-limit';
import {
  AUTO_TAG_SYSTEM,
  SUMMARY_SYSTEM,
  EXPLAIN_CODE_SYSTEM,
  OPTIMIZE_PROMPT_SYSTEM,
} from '@/lib/ai-prompts';
import { getItemDetail } from '@/lib/db/items';
import { setItemTags } from '@/lib/db/ai';
import OpenAI from 'openai';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const PRO_REQUIRED = 'AI features are Pro-only. Upgrade to Pro to enable.';

async function ensureProAndRateLimit(
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await canUseAi(userId);
  if (!access.allowed) {
    return {
      ok: false,
      error: access.reason === 'monthly_cap_reached'
        ? 'Monthly AI quota reached. Try again next month.'
        : PRO_REQUIRED,
    };
  }
  const rl = await checkAiRateLimit(userId);
  if (!rl.ok) {
    return {
      ok: false,
      error: `Too many AI requests. Try again in ${rl.retryAfterSeconds ?? 60}s.`,
    };
  }
  return { ok: true };
}

function mapOpenAiError(err: unknown): string {
  if (err instanceof OpenAI.APIError) {
    if (err.status === 429) return 'OpenAI is rate-limited. Try again shortly.';
    if (err.status === 401) return 'AI credentials are not configured.';
    if (err.status >= 500) return 'OpenAI is having a moment. Try again.';
    return 'AI request failed.';
  }
  return 'AI request failed.';
}

// --- 1. Auto-tag --------------------------------------------------------

const TagSchema = z.object({
  tags: z.array(z.string().min(1).max(40)).min(1).max(6),
});

export async function suggestTags(
  itemId: string,
): Promise<ActionResult<{ tags: string[] }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

  const gate = await ensureProAndRateLimit(session.user.id);
  if (!gate.ok) return { success: false, error: gate.error };

  const item = await getItemDetail(itemId, session.user.id);
  if (!item) return { success: false, error: 'Item not found' };

  try {
    const rsp = await openai.responses.parse({
      model: OPENAI_MODEL,
      reasoning: { effort: 'minimal' },
      input: [
        { role: 'system', content: AUTO_TAG_SYSTEM },
        {
          role: 'user',
          content: [
            `Title: ${item.title}`,
            item.description ? `Description: ${item.description}` : '',
            item.content ? `Content:\n${truncate(item.content, 4000)}` : '',
          ].filter(Boolean).join('\n\n'),
        },
      ],
      text: { format: zodTextFormat(TagSchema, 'tags') },
    });

    const tags = rsp.output_parsed?.tags ?? [];
    return { success: true, data: { tags: dedupeNormalize(tags) } };
  } catch (err) {
    console.error('suggestTags failed', err);
    return { success: false, error: mapOpenAiError(err) };
  }
}

export async function applyTags(
  itemId: string,
  tags: string[],
): Promise<ActionResult<{ tags: string[] }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' };
  // No AI call — no Pro gate, no rate limit. Just persist.
  const updated = await setItemTags(itemId, session.user.id, dedupeNormalize(tags));
  if (!updated) return { success: false, error: 'Item not found' };
  return { success: true, data: { tags: updated.tags.map((t) => t.name) } };
}

// --- 2. Summary ---------------------------------------------------------

const summarySchema = z.object({ itemId: z.string().min(1) });

export async function generateSummary(
  payload: z.input<typeof summarySchema>,
): Promise<ActionResult<{ summary: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' };
  const parsed = summarySchema.safeParse(payload);
  if (!parsed.success) return { success: false, error: 'Invalid input' };

  const gate = await ensureProAndRateLimit(session.user.id);
  if (!gate.ok) return { success: false, error: gate.error };

  const item = await getItemDetail(parsed.data.itemId, session.user.id);
  if (!item || !item.content) {
    return { success: false, error: 'Nothing to summarize' };
  }

  try {
    const rsp = await openai.responses.create({
      model: OPENAI_MODEL,
      reasoning: { effort: 'low' },
      input: [
        { role: 'system', content: SUMMARY_SYSTEM },
        { role: 'user', content: truncate(item.content, 8000) },
      ],
    });
    const text = rsp.output_text?.trim() ?? '';
    if (!text) return { success: false, error: 'AI returned empty summary' };
    return { success: true, data: { summary: text } };
  } catch (err) {
    console.error('generateSummary failed', err);
    return { success: false, error: mapOpenAiError(err) };
  }
}

// --- 3. Explain code (streamed via API route — see §3.2) ---------------

// --- 4. Optimize prompt -------------------------------------------------

const optimizeSchema = z.object({
  prompt: z.string().trim().min(1, 'Prompt is empty'),
});

export async function optimizePrompt(
  payload: z.input<typeof optimizeSchema>,
): Promise<ActionResult<{ optimized: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' };
  const parsed = optimizeSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const gate = await ensureProAndRateLimit(session.user.id);
  if (!gate.ok) return { success: false, error: gate.error };

  try {
    const rsp = await openai.responses.create({
      model: OPENAI_MODEL,
      reasoning: { effort: 'medium' },
      input: [
        { role: 'system', content: OPTIMIZE_PROMPT_SYSTEM },
        { role: 'user', content: truncate(parsed.data.prompt, 8000) },
      ],
    });
    const text = rsp.output_text?.trim() ?? '';
    if (!text) return { success: false, error: 'AI returned empty result' };
    return { success: true, data: { optimized: text } };
  } catch (err) {
    console.error('optimizePrompt failed', err);
    return { success: false, error: mapOpenAiError(err) };
  }
}

// --- helpers -----------------------------------------------------------

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max)}\n…[truncated]`;
}

function dedupeNormalize(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const t = raw.toLowerCase().trim().replace(/\s+/g, '-');
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= 6) break;
  }
  return out;
}
```

> **`getItemDetail` already enforces ownership** ([src/lib/db/items.ts](../src/lib/db/items.ts)). Always re-fetch the item server-side; never trust client-provided content (a free user could otherwise post a 100-page document and bill us for tokens).

#### `src/app/api/ai/explain/route.ts` — streaming for "Explain this code"

Server actions can't stream a UI-friendly token-by-token response (Next.js Server Actions support streaming generic data, but the ergonomics are worse than a plain SSE endpoint). For the explain feature — the only one where streaming materially improves UX — use a route handler.

```ts
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { openai, OPENAI_MODEL } from '@/lib/openai';
import { canUseAi } from '@/lib/ai-limits';
import { checkAiRateLimit } from '@/lib/ai-rate-limit';
import { EXPLAIN_CODE_SYSTEM } from '@/lib/ai-prompts';
import { getItemDetail } from '@/lib/db/items';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const access = await canUseAi(session.user.id);
  if (!access.allowed) {
    return new Response(
      access.reason === 'monthly_cap_reached'
        ? 'Monthly AI quota reached'
        : 'Pro required',
      { status: 402 },
    );
  }

  const rl = await checkAiRateLimit(session.user.id);
  if (!rl.ok) {
    return new Response('Rate limited', {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfterSeconds ?? 60) },
    });
  }

  const { itemId } = await req.json();
  if (typeof itemId !== 'string') {
    return new Response('itemId required', { status: 400 });
  }

  const item = await getItemDetail(itemId, session.user.id);
  if (!item || !item.content) {
    return new Response('Nothing to explain', { status: 404 });
  }

  const stream = await openai.responses.create({
    model: OPENAI_MODEL,
    stream: true,
    reasoning: { effort: 'medium' },
    input: [
      { role: 'system', content: EXPLAIN_CODE_SYSTEM },
      {
        role: 'user',
        content: `Language: ${item.language ?? 'unknown'}\n\n${item.content.slice(0, 16000)}`,
      },
    ],
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === 'response.output_text.delta') {
            controller.enqueue(encoder.encode(event.delta));
          }
        }
      } catch (err) {
        console.error('Explain stream error', err);
        controller.enqueue(encoder.encode('\n\n[stream error]'));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
```

> **Why `text/plain` not SSE:** the client just needs to render appended text; SSE adds parsing overhead with no benefit here. If we add multi-step events later (token, citation, done), switch to SSE.

#### Tests (mirror Stripe Phase 2 pattern)

- [ ] `src/actions/ai.test.ts` — mock `openai.responses.parse`/`create`, mock `canUseAi` and `checkAiRateLimit`. Cover for each action: unauthorized, not-pro, rate-limited, OpenAI 429/500/401, success.
- [ ] `src/lib/ai-limits.test.ts` — pro/free, missing user. Mirrors `plan-limits.test.ts`.
- [ ] `src/lib/db/ai.test.ts` — `setItemTags` ownership check + tag dedupe.
- [ ] **No** route handler test for streaming — exercise via E2E.

### 3.2 Files to modify

#### [src/components/items/ItemDrawer.tsx](../src/components/items/ItemDrawer.tsx) — surface the AI affordances

Add a small "AI" segment in the action bar (only when `session.user.isPro` for the visual — the actions still re-check server-side):

```tsx
{session?.user?.isPro && (
  <Tooltip content="Suggest tags">
    <Button size="icon" variant="ghost" onClick={handleSuggestTags}>
      <Sparkles className="h-4 w-4" />
    </Button>
  </Tooltip>
)}
```

For free users, render a single Sparkles button that opens an inline upgrade banner (same shape as the limit-reached banner in [NewItemDialog](../src/components/items/NewItemDialog.tsx#L142-L147)) — keeps gating discoverable rather than hidden.

Each AI action gets:

| Feature | Trigger | UI |
|---|---|---|
| Auto-tag | Sparkles button → `suggestTags(itemId)` → modal with checkboxes per suggested tag → Apply → `applyTags` → toast + `router.refresh()` |
| Summary | "Summarize" button visible when `description` is empty → `generateSummary` → fills the description textarea (edit mode) → user reviews + saves via existing `updateItem` |
| Explain code | "Explain" button visible for `snippet` / `command` types → opens a side panel that streams from `/api/ai/explain` and shows tokens in a `MarkdownEditor` (read-only) |
| Optimize prompt | "Optimize" button visible when `itemType.name === 'prompt'` → modal with **Original** vs **Optimized** diff-style cards, Replace button copies optimized text into the content textarea |

#### [src/components/items/NewItemDialog.tsx](../src/components/items/NewItemDialog.tsx) — Auto-tag at creation time

Add a "Suggest tags" link below the tags input. Only render for Pro users (server passes `isPro` down via the layout, like the TopBar Upgrade button now does). Calls `suggestTags` against the form's *unsaved* content — so we'll need a sibling action `suggestTagsForDraft({ title, content, description })` that doesn't take an itemId. **Keep it Pro-gated and rate-limited the same way.**

> **Subtle but important:** the draft variant lets free users *try* the feature before saving. Don't expose it to free users, or you eat AI cost on accounts that won't convert.

#### Sidebar / Settings UI signals

- `/settings` Subscription card already lists "AI auto-tagging, summaries, code explanations" as Pro perks — no changes needed.
- Optional polish: a "✨ AI" pill next to AI-generated content. Out of scope for v1.

---

## 4. Pro Gating Pattern (decision matrix)

| Surface | Free user behavior |
|---|---|
| Server actions / route handler | **Block** with a Pro-required error. Never call OpenAI. |
| ItemDrawer AI buttons | **Show** them, but click opens an inline upgrade banner (same as the New Item limit banner). Don't hide — discoverability drives conversion. |
| NewItemDialog "Suggest tags" link | **Hide** entirely. Free users would see it before they ever hit a limit, leading to clutter without value. |
| Marketing homepage AI section | **Show** for everyone. (Already does.) |

The gate is enforced **three times in defence-in-depth**:
1. Client UI hides/shows based on `session.user.isPro`.
2. Server action / route handler re-checks `canUseAi(userId)`.
3. Stripe webhook → DB → JWT re-read on every session ensures the boolean is always fresh ([src/auth.ts:17-23](../src/auth.ts#L17-L23)).

---

## 5. Streaming vs Non-streaming Decision

| Feature | Latency budget | Streaming? |
|---|---|---|
| Auto-tag | < 2s, JSON output | **No.** Wait for the full structured response, render the suggestion modal once. |
| Summary | < 3s, ~100 tokens | **No.** The summary is short; spinner is fine. |
| Explain code | 5–15s, multi-paragraph | **Yes.** Token-by-token render is the differentiator. |
| Optimize prompt | < 5s, ~100–300 tokens | **No.** User compares old vs new — they want both fully rendered. |

Streaming costs a route handler instead of a server action, plus client plumbing. Worth it only when the user is staring at the screen for more than ~3s.

---

## 6. Cost Optimization Strategies

1. **Pin to nano** for everything in v1. Bigger models are 20–60× more expensive per token.
2. **Truncate inputs** before sending — see `truncate()` in `src/actions/ai.ts`. Items with 50k+ tokens of content shouldn't burn budget if all we need is tags.
3. **Prefer `responses.parse` over loose JSON parsing** for structured features. Eliminates retries when the model returns malformed JSON. (See [Context7 — Responses API structured outputs](https://github.com/openai/openai-node/blob/master/openai-node/examples/responses/structured-outputs.ts).)
4. **`reasoning_effort: 'minimal'`** on classification (auto-tag). This drops output tokens dramatically vs `medium`.
5. **Cache "explain code" results** by `(itemId, contentHash)` in Redis with a 30-day TTL. Re-explaining unchanged code is free after the first call.
6. **Per-user monthly soft cap** (`AI_PRO_MONTHLY_CALLS = 500`) so a buggy retry loop in our own UI can't run up a $1k bill on one Pro account.
7. **Per-user 30/min + 300/24h Upstash rate limits** (§3.1) so we can't exceed our own caps even if a user holds down a button.
8. **No batch endpoint use yet** — the four MVP features are interactive. Revisit when we add bulk auto-tag-existing-library.
9. **Track tokens** by reading `rsp.usage.{input_tokens,output_tokens}` and writing to an `AiCall` model in v2 (see §7). For v1, log to console — enough to spot anomalies in dev.
10. **Don't enable Pro in dev with the prod OpenAI key.** Set `OPENAI_API_KEY` in `.env` only when you're testing AI flows; use the `gpt-5-nano` test model and Stripe test mode together.

---

## 7. Optional v2 Schema — Per-user metering

To enforce real monthly caps and surface usage to the user:

```prisma
model AiCall {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  feature     String   // 'auto_tag' | 'summary' | 'explain' | 'optimize'
  inputTokens Int
  outputTokens Int
  costMicroUsd Int     // computed at write time so price changes don't lose history
  createdAt   DateTime @default(now())

  @@index([userId, createdAt])
}
```

- `canUseAi` then sums `WHERE userId = ? AND createdAt >= startOfMonth`.
- Settings page shows a usage meter ("142 / 500 calls this month").
- Cleanup job: drop rows older than 90 days monthly.

Out of scope for v1 — ship Pro-or-block first, add metering once we see usage patterns.

---

## 8. Security Considerations

| Risk | Mitigation |
|---|---|
| API key leak | `OPENAI_API_KEY` lives in `.env` (never committed; `.env.example` has the empty placeholder). The lazy `Proxy` in `src/lib/openai.ts` ensures the key is read once at first use, server-side only. **Never expose to the client** — no `NEXT_PUBLIC_*` for OpenAI. |
| Prompt injection | Treat user content as untrusted. System prompt is the *only* authoritative instruction. Wrap user content in a clear envelope (e.g. `Title: …\n\nContent: …`). For tag/summary, structured output makes injection mostly inert (the model can't return arbitrary HTML/JS). For explain/optimize, render output through `MarkdownEditor` which uses `react-markdown` — no `dangerouslySetInnerHTML`, no script execution. |
| User asks model to leak system prompt | Acceptable. System prompts here are not secret. If we add tool-using agents, revisit. |
| Cross-user data leak | All AI actions re-fetch the item via `getItemDetail(itemId, userId)` so a malicious client can't pass another user's itemId. **Never** accept content from the request body for actions that act on a stored item. |
| Cost exhaustion attack | Pro gate + Upstash rate limits + per-user monthly cap (v2) + Stripe webhook downgrade flips `isPro=false` immediately at period end. |
| Logging PII | The `mapOpenAiError` helper logs the error object but **not** the prompt or completion. Don't add full-body logging to debug — use a redacted hash. |
| HTTP method confusion | Streaming route declares `POST` only. Don't accept `GET` (caches) or expose `OPTIONS` without auth. |
| Streaming response abort | The `ReadableStream`'s `start` is fire-and-forget — we don't reach back into Stripe-style retries. If the client aborts, the upstream OpenAI request is left to finish; revisit with `AbortController` if cost matters. |

---

## 9. UI Patterns

### 9.1 Loading states

| Pattern | When |
|---|---|
| Inline spinner inside the trigger button | All non-streaming actions (tag/summary/optimize). Disable the button while loading; revert on success/error. |
| Streaming text with a blinking cursor | Explain panel. Plain text container; append delta on each chunk. Add a tasteful pulsing dot at the cursor position so the user knows tokens are still arriving. |
| Skeleton rows in the suggestion modal | Auto-tag: render 4 skeleton chips while waiting, replace with real tag chips once `output_parsed` arrives. |

### 9.2 Accept / reject suggestions

Always make AI output **a draft, not a write**. Pattern:
1. AI call returns suggested data.
2. Render in a clearly distinct UI (modal, banner, "AI suggestion" card).
3. User clicks **Apply** to commit (which calls a non-AI action like `applyTags` or just edits the form state).
4. **Cancel** discards.

Why: prevents the worst class of complaint ("the AI rewrote my note and I can't get it back"). Also lets you keep AI actions stateless on the DB side, which simplifies retries and avoids needing soft-delete.

### 9.3 Error toasts

Generic errors → `toast.error(result.error)` (matches existing pattern).
Pro-required → render the inline upgrade banner (matches the limit-reached pattern at [NewItemDialog:142-147](../src/components/items/NewItemDialog.tsx#L142-L147)).
Rate-limit → `toast.error(...)` with the retry-after seconds — short, actionable.

### 9.4 No spammy "AI" branding

A single 🪄 sparkle icon and a quiet `text-muted-foreground` "AI" label is enough. Don't gradient-everything; the rest of the app is restrained, the AI features should feel native.

---

## 10. Testing Checklist

### 10.1 Unit (`npm test`)

- [ ] `ai-limits.test.ts` — pro / free / missing user
- [ ] `ai.test.ts` — for each of `suggestTags` / `generateSummary` / `optimizePrompt`:
  - unauthorized
  - not-pro (gate returns the Pro-required error)
  - rate-limited
  - OpenAI throws `APIError(401)` → "credentials not configured"
  - OpenAI throws `APIError(429)` → "OpenAI is rate-limited"
  - OpenAI throws `APIError(500)` → "having a moment"
  - empty `output_parsed` / `output_text` → empty error
  - success path
- [ ] `db/ai.test.ts` — `setItemTags` ownership pass / foreign-id reject / tag dedupe
- [ ] Existing `items` / `collections` / `billing` suites still pass

### 10.2 Local E2E

Have `npm run dev` running. Sign in as the Pro demo user (manually flip `isPro=true` in DB if needed; Stripe webhook in §test-mode is the realistic flow).

- [ ] Create a snippet, click Sparkles → Suggest tags → modal lists 3–6 tags. Apply → tags appear on the item. `router.refresh()` updates the sidebar tag counts.
- [ ] Same item, clear description, click Summarize → description fills with 1–2 sentences. Save via existing edit flow → persists.
- [ ] Click Explain → side panel streams tokens. Markdown renders correctly (headings, fenced code).
- [ ] Open a `prompt` item, click Optimize → modal shows Original vs Optimized. Replace → content textarea updates.
- [ ] Sign out, sign in as a Free user. AI buttons are visible but click → inline upgrade banner appears with `<UpgradeButton />` linking to Stripe checkout (or `/upgrade`).
- [ ] Hold down Suggest Tags 31 times in a minute → 30th succeeds, 31st returns the rate-limit error toast with retry-after.
- [ ] Set `OPENAI_API_KEY` empty in `.env`, restart dev. Click Sparkles → "AI credentials are not configured" toast (from `mapOpenAiError`'s 401 branch).

### 10.3 Build / lint / a11y

- [ ] `npm run build` — `/api/ai/explain` registered as `ƒ` (dynamic), no env-time crashes.
- [ ] `npm run lint` — no new warnings.
- [ ] AI buttons have `aria-label`, are keyboard-focusable, and the streaming Explain panel is `aria-live="polite"`.

---

## 11. Implementation Order (one focused PR each)

1. **Foundation** — `src/lib/openai.ts` (lazy proxy), `src/lib/ai-limits.ts` + tests, `src/lib/ai-rate-limit.ts`, `src/lib/ai-prompts.ts`. No UI. Just lands the building blocks. Adds `openai` dep to `package.json`.
2. **Auto-tag** — `suggestTags` + `applyTags` server actions, `src/lib/db/ai.ts`, AI action tests, suggestion modal, Sparkles button in ItemDrawer, free-user upgrade banner. End-to-end small enough to verify in one PR.
3. **Summary** — `generateSummary` action + tests, "Summarize" button hooked into the description textarea.
4. **Explain code (streaming)** — `/api/ai/explain` route, side panel UI in ItemDrawer, abort handling. Manual streaming smoke test.
5. **Optimize prompt** — `optimizePrompt` action + tests, original/optimized modal in the ItemDrawer for `prompt` items.
6. **Auto-tag at creation time** — `suggestTagsForDraft` action + "Suggest tags" link in `NewItemDialog` (Pro only).
7. **(Optional) v2 metering** — `AiCall` Prisma model + `canUseAi` reads usage + Settings usage meter.

Steps 1–2 are foundation. 3–6 can be parallel but each should ship independently with its own tests.

---

## 12. Important Caveats

- **Edge runtime is incompatible with the OpenAI SDK** for the same reason as Stripe — `runtime = 'nodejs'` on the explain route.
- **Pin the model in env, not code.** OpenAI deprecates models on a known cadence; an env flip is a 30-second response, a code edit + deploy is not.
- **`getItemDetail` re-fetch is non-negotiable.** Without it, a malicious client could pass arbitrary `content` and we pay for the tokens on someone else's bill.
- **Stripe + AI gating share the same `isPro` source of truth.** If we ever add a "trial" tier, both should consult the same helper, not branch separately. The decision matrix in §4 stands.
- **Don't store the optimized prompt automatically.** Always make the user click Replace. Same for summaries — they fill the description field but the user still has to save via existing `updateItem`.
- **Don't expose AI errors verbatim** — `mapOpenAiError` is the single chokepoint. Adding more cases is fine; bypassing it (raw error.message into `toast.error`) leaks our internal state.
- **Streaming responses don't get retried by Stripe-style webhooks.** If a stream fails mid-way, the client shows `[stream error]`. Acceptable for v1; revisit if we see common drops.
- **No client-side OpenAI calls.** Period. Even with a "limited" key. Browser keys are scrapable in seconds, and there's no rate limit Stripe-grade enough to save us.
- **`gpt-5-nano` may be renamed.** As of writing there's also `gpt-5.4-nano` (faster/cheaper variant). The env var insulates us, but pin a specific version in production once we benchmark.

---

## 13. Files Touched — Quick Reference

**Created**
- `src/lib/openai.ts`
- `src/lib/ai-limits.ts`
- `src/lib/ai-limits.test.ts`
- `src/lib/ai-rate-limit.ts`
- `src/lib/ai-prompts.ts`
- `src/lib/db/ai.ts`
- `src/lib/db/ai.test.ts`
- `src/actions/ai.ts`
- `src/actions/ai.test.ts`
- `src/app/api/ai/explain/route.ts`
- `src/components/ai/SuggestTagsModal.tsx`
- `src/components/ai/ExplainCodePanel.tsx`
- `src/components/ai/OptimizePromptModal.tsx`

**Modified**
- `src/components/items/ItemDrawer.tsx` — Sparkles action bar, tag/summary/explain/optimize triggers
- `src/components/items/NewItemDialog.tsx` — "Suggest tags" link (Pro only)
- `src/types/next-auth.d.ts` — no change (already exposes `isPro`)
- `package.json` — add `openai` dep
- `.env.example` — add `OPENAI_API_KEY=` and `OPENAI_MODEL=gpt-5-nano`

---

## Sources

- [OpenAI Node SDK v6.1.0 — Chat Completions parse + streaming + APIError handling](https://github.com/openai/openai-node/blob/v6.1.0/README.md) (Context7 `/openai/openai-node/v6_1_0`)
- [OpenAI Node SDK — Responses API structured outputs example](https://github.com/openai/openai-node/blob/master/openai-node/examples/responses/structured-outputs.ts)
- [OpenAI Node SDK — Streaming helpers (`content.delta` event)](https://github.com/openai/openai-node/blob/v6.1.0/helpers.md)
- [GPT-5 Nano model docs (capabilities, reasoning_effort, structured outputs)](https://developers.openai.com/api/docs/models/gpt-5-nano)
- [GPT-5 Nano pricing & context window — Sim.ai](https://www.sim.ai/models/azure-openai/gpt-5-nano)
- [GPT-5 Nano Pricing 2026 — gptbreeze.io](https://gptbreeze.io/blog/gpt-5-nano-pricing-guide/)
- [Codebase: docs/stripe-integration-plan.md](stripe-integration-plan.md) — pattern reference for action shape, lazy SDK proxy, webhook conventions
