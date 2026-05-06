'use server';

import { z } from 'zod';
import OpenAI from 'openai';
import { auth } from '@/auth';
import { openai, AI_MODEL } from '@/lib/openai';
import { canUseAi } from '@/lib/ai-limits';
import { checkAiRateLimit } from '@/lib/rate-limit';
import { getItemDetail } from '@/lib/db/items';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const MAX_CONTENT_CHARS = 2000;
const MAX_SUMMARY_CHARS = 280;
const PRO_REQUIRED = 'AI features are Pro-only. Upgrade to Pro to enable.';

const AUTO_TAG_INSTRUCTIONS = `You suggest 3-5 short, lowercase tags for a developer's saved item (snippet, prompt, command, note, or link). Tags should be 1-3 words, hyphenated, and describe the topic, technology, or use case (e.g. "react-hooks", "docker", "sql", "auth"). Return only JSON in the form {"tags": ["tag1", "tag2", ...]} — no prose, no preamble.`;

const SUMMARY_INSTRUCTIONS = `You write a concise 1-2 sentence description for a developer's saved item (snippet, prompt, command, note, or link). The description summarizes what the item is and what it does or is used for. Output plain text only — no markdown, no quotes around the answer, no preamble. Stay under ${MAX_SUMMARY_CHARS} characters.`;

const EXPLAIN_INSTRUCTIONS = `You explain code or terminal commands to a developer in a concise, focused way. Output plain Markdown (no preamble like "Sure!" or "Here's an explanation"). Lead with one short sentence describing what the code does, then a short bulleted list (3-6 bullets) covering key concepts, notable APIs, side effects, and gotchas. Use inline \`code\` for identifiers and short snippets, and fenced blocks only when quoting multi-line output. Aim for 200-300 words total. Do not invent behavior the code does not have.`;

const ITEM_TYPES = ['snippet', 'prompt', 'command', 'note', 'link'] as const;
const EXPLAINABLE_TYPES = new Set(['snippet', 'command']);

const generateAutoTagsSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().nullish(),
  content: z.string().nullish(),
});

export type GenerateAutoTagsPayload = z.input<typeof generateAutoTagsSchema>;

export async function generateAutoTags(
  payload: GenerateAutoTagsPayload,
): Promise<ActionResult<{ tags: string[] }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = generateAutoTagsSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? 'Invalid input' };
  }

  const access = await canUseAi(session.user.id);
  if (!access.allowed) {
    return { success: false, error: PRO_REQUIRED };
  }

  const rl = await checkAiRateLimit(session.user.id);
  if (!rl.ok) {
    return {
      success: false,
      error: `Too many AI requests. Try again in ${rl.retryAfterSeconds ?? 60}s.`,
    };
  }

  const input = buildInput(parsed.data);

  try {
    const response = await openai.responses.create({
      model: AI_MODEL,
      instructions: AUTO_TAG_INSTRUCTIONS,
      input,
      text: { format: { type: 'json_object' } },
    });

    const tags = parseTags(response.output_text);
    if (tags.length === 0) {
      return { success: false, error: 'AI returned no tags. Try again.' };
    }

    return { success: true, data: { tags } };
  } catch (err) {
    console.error('generateAutoTags failed', err);
    return { success: false, error: mapOpenAiError(err) };
  }
}

function buildInput({
  title,
  description,
  content,
}: {
  title: string;
  description?: string | null;
  content?: string | null;
}): string {
  const parts = [`Title: ${title}`];
  if (description && description.trim().length > 0) {
    parts.push(`Description: ${description.trim()}`);
  }
  if (content && content.trim().length > 0) {
    parts.push(`Content:\n${truncate(content, MAX_CONTENT_CHARS)}`);
  }
  // OpenAI requires the literal word "json" in the input when using
  // text.format.type: 'json_object', otherwise it 400s.
  parts.push('Respond with JSON: {"tags": ["tag1", "tag2", ...]}.');
  return parts.join('\n\n');
}

const generateSummarySchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  type: z.enum(ITEM_TYPES).optional().catch(undefined),
  content: z.string().nullish(),
  url: z.string().nullish(),
  language: z.string().nullish(),
});

export type GenerateSummaryPayload = z.input<typeof generateSummarySchema>;

export async function generateSummary(
  payload: GenerateSummaryPayload,
): Promise<ActionResult<{ summary: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = generateSummarySchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? 'Invalid input' };
  }

  const access = await canUseAi(session.user.id);
  if (!access.allowed) {
    return { success: false, error: PRO_REQUIRED };
  }

  const rl = await checkAiRateLimit(session.user.id);
  if (!rl.ok) {
    return {
      success: false,
      error: `Too many AI requests. Try again in ${rl.retryAfterSeconds ?? 60}s.`,
    };
  }

  const input = buildSummaryInput(parsed.data);

  try {
    const response = await openai.responses.create({
      model: AI_MODEL,
      instructions: SUMMARY_INSTRUCTIONS,
      input,
      text: { format: { type: 'text' } },
    });

    const summary = cleanSummary(response.output_text);
    if (!summary) {
      return { success: false, error: 'AI returned no summary. Try again.' };
    }

    return { success: true, data: { summary } };
  } catch (err) {
    console.error('generateSummary failed', err);
    return { success: false, error: mapOpenAiError(err) };
  }
}

function buildSummaryInput({
  title,
  type,
  content,
  url,
  language,
}: {
  title: string;
  type?: (typeof ITEM_TYPES)[number];
  content?: string | null;
  url?: string | null;
  language?: string | null;
}): string {
  const parts: string[] = [];
  if (type) parts.push(`Type: ${type}`);
  parts.push(`Title: ${title}`);
  if (language && language.trim().length > 0 && language.trim() !== 'plaintext') {
    parts.push(`Language: ${language.trim()}`);
  }
  if (url && url.trim().length > 0) {
    parts.push(`URL: ${url.trim()}`);
  }
  if (content && content.trim().length > 0) {
    parts.push(`Content:\n${truncate(content, MAX_CONTENT_CHARS)}`);
  }
  parts.push('Write a 1-2 sentence description.');
  return parts.join('\n\n');
}

const explainCodeSchema = z.object({
  itemId: z.string().trim().min(1, 'Item id is required'),
});

export type ExplainCodePayload = z.input<typeof explainCodeSchema>;

export async function explainCode(
  payload: ExplainCodePayload,
): Promise<ActionResult<{ explanation: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = explainCodeSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? 'Invalid input' };
  }

  const access = await canUseAi(session.user.id);
  if (!access.allowed) {
    return { success: false, error: PRO_REQUIRED };
  }

  const rl = await checkAiRateLimit(session.user.id);
  if (!rl.ok) {
    return {
      success: false,
      error: `Too many AI requests. Try again in ${rl.retryAfterSeconds ?? 60}s.`,
    };
  }

  // Re-fetch the item server-side so the user can never explain code
  // they don't own — even if a malicious client passes a foreign id.
  const item = await getItemDetail(parsed.data.itemId, session.user.id);
  if (!item) {
    return { success: false, error: 'Item not found' };
  }

  const typeName = item.itemType.name.toLowerCase();
  if (!EXPLAINABLE_TYPES.has(typeName)) {
    return {
      success: false,
      error: 'Only snippets and commands can be explained.',
    };
  }

  const code = item.content?.trim() ?? '';
  if (!code) {
    return { success: false, error: 'Item has no code to explain.' };
  }

  const input = buildExplainInput({
    title: item.title,
    type: typeName,
    language: item.language,
    code,
  });

  try {
    const response = await openai.responses.create({
      model: AI_MODEL,
      instructions: EXPLAIN_INSTRUCTIONS,
      input,
      text: { format: { type: 'text' } },
    });

    const explanation = response.output_text?.trim() ?? '';
    if (!explanation) {
      return {
        success: false,
        error: 'AI returned no explanation. Try again.',
      };
    }

    return { success: true, data: { explanation } };
  } catch (err) {
    console.error('explainCode failed', err);
    return { success: false, error: mapOpenAiError(err) };
  }
}

function buildExplainInput({
  title,
  type,
  language,
  code,
}: {
  title: string;
  type: string;
  language: string | null;
  code: string;
}): string {
  const parts: string[] = [`Type: ${type}`, `Title: ${title}`];
  if (language && language.trim().length > 0 && language.trim() !== 'plaintext') {
    parts.push(`Language: ${language.trim()}`);
  }
  parts.push(`Code:\n${truncate(code, MAX_CONTENT_CHARS)}`);
  parts.push('Explain what this does.');
  return parts.join('\n\n');
}

function cleanSummary(raw: string | undefined | null): string {
  if (!raw) return '';
  let s = raw.trim();
  // Strip wrapping quotes if the model added any.
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith('“') && s.endsWith('”')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  // Collapse whitespace.
  s = s.replace(/\s+/g, ' ');
  if (s.length > MAX_SUMMARY_CHARS) {
    s = `${s.slice(0, MAX_SUMMARY_CHARS - 1).trimEnd()}…`;
  }
  return s;
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max)}\n…[truncated]`;
}

/**
 * Parse the model's JSON response. Per the spec, gpt-5-nano with
 * `json_object` format may return either {"tags": [...]} or a bare [...]
 * array. Tolerate both, then lowercase + dedupe.
 */
function parseTags(raw: string | undefined | null): string[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  let candidates: unknown[] = [];
  if (Array.isArray(parsed)) {
    candidates = parsed;
  } else if (parsed && typeof parsed === 'object' && 'tags' in parsed) {
    const v = (parsed as { tags: unknown }).tags;
    if (Array.isArray(v)) candidates = v;
  }

  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of candidates) {
    if (typeof c !== 'string') continue;
    const tag = c.toLowerCase().trim().replace(/\s+/g, '-');
    if (!tag || tag.length > 40 || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
    if (out.length >= 5) break;
  }
  return out;
}

function mapOpenAiError(err: unknown): string {
  if (err instanceof OpenAI.APIError) {
    if (err.status === 429) return 'OpenAI is rate-limited. Try again shortly.';
    if (err.status === 401) return 'AI credentials are not configured.';
    if (err.status && err.status >= 500) {
      return 'OpenAI is having a moment. Try again.';
    }
    return 'AI request failed.';
  }
  return 'AI request failed.';
}
