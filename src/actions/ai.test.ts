import { describe, it, expect, vi, beforeEach } from 'vitest';
import OpenAI from 'openai';

const { mockOpenai } = vi.hoisted(() => ({
	mockOpenai: {
		responses: {
			create: vi.fn(),
		},
	},
}));

vi.mock('@/auth', () => ({
	auth: vi.fn(),
}));

vi.mock('@/lib/openai', () => ({
	openai: mockOpenai,
	AI_MODEL: 'gpt-5-nano',
}));

vi.mock('@/lib/ai-limits', () => ({
	canUseAi: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
	checkAiRateLimit: vi.fn(),
}));

vi.mock('@/lib/db/items', () => ({
	getItemDetail: vi.fn(),
}));

import { auth } from '@/auth';
import { canUseAi } from '@/lib/ai-limits';
import { checkAiRateLimit } from '@/lib/rate-limit';
import { getItemDetail } from '@/lib/db/items';
import {
	explainCode,
	generateAutoTags,
	generateSummary,
	optimizePrompt,
} from './ai';

const mockAuth = vi.mocked(auth);
const mockCanUseAi = vi.mocked(canUseAi);
const mockCheckRl = vi.mocked(checkAiRateLimit);
const mockCreate = vi.mocked(mockOpenai.responses.create);
const mockGetItemDetail = vi.mocked(getItemDetail);

interface MockItem {
	id: string;
	title: string;
	content: string | null;
	language: string | null;
	itemType: { name: string };
}

function buildItem(overrides: Partial<MockItem> = {}): MockItem {
	return {
		id: 'item-1',
		title: 'useState counter',
		content: 'const [count, setCount] = useState(0)',
		language: 'typescript',
		itemType: { name: 'Snippet' },
		...overrides,
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	// @ts-expect-error partial session
	mockAuth.mockResolvedValue({ user: { id: 'u1' } });
	mockCanUseAi.mockResolvedValue({ allowed: true });
	mockCheckRl.mockResolvedValue({ ok: true });
	mockGetItemDetail.mockResolvedValue(buildItem() as never);
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('generateAutoTags', () => {
	it('rejects unauthorized', async () => {
		mockAuth.mockResolvedValueOnce(null as never);
		const res = await generateAutoTags({ title: 'react snippet' });
		expect(res).toEqual({ success: false, error: 'Unauthorized' });
		expect(mockCreate).not.toHaveBeenCalled();
	});

	it('rejects empty title', async () => {
		const res = await generateAutoTags({ title: '   ' });
		expect(res.success).toBe(false);
		expect(mockCreate).not.toHaveBeenCalled();
	});

	it('rejects free users with the Pro-required message', async () => {
		mockCanUseAi.mockResolvedValueOnce({ allowed: false, reason: 'not_pro' });
		const res = await generateAutoTags({ title: 'react snippet' });
		expect(res).toEqual({
			success: false,
			error: 'AI features are Pro-only. Upgrade to Pro to enable.',
		});
		expect(mockCreate).not.toHaveBeenCalled();
	});

	it('returns rate-limited error with retry-after seconds', async () => {
		mockCheckRl.mockResolvedValueOnce({ ok: false, retryAfterSeconds: 42 });
		const res = await generateAutoTags({ title: 'react snippet' });
		expect(res).toEqual({
			success: false,
			error: 'Too many AI requests. Try again in 42s.',
		});
		expect(mockCreate).not.toHaveBeenCalled();
	});

	it('returns parsed tags on success ({"tags": [...]} shape)', async () => {
		mockCreate.mockResolvedValueOnce({
			output_text: JSON.stringify({ tags: ['React', 'Hooks', 'Frontend'] }),
		} as never);
		const res = await generateAutoTags({
			title: 'useState snippet',
			content: 'const [count, setCount] = useState(0)',
		});
		expect(res).toEqual({
			success: true,
			data: { tags: ['react', 'hooks', 'frontend'] },
		});
	});

	it('returns parsed tags on success (bare [...] shape)', async () => {
		mockCreate.mockResolvedValueOnce({
			output_text: JSON.stringify(['Docker', 'CLI']),
		} as never);
		const res = await generateAutoTags({ title: 'docker run' });
		expect(res).toEqual({
			success: true,
			data: { tags: ['docker', 'cli'] },
		});
	});

	it('lowercases, hyphenates whitespace, and dedupes', async () => {
		mockCreate.mockResolvedValueOnce({
			output_text: JSON.stringify({
				tags: ['React Hooks', 'react-hooks', 'STATE Management', 'state-management'],
			}),
		} as never);
		const res = await generateAutoTags({ title: 'useState' });
		expect(res).toEqual({
			success: true,
			data: { tags: ['react-hooks', 'state-management'] },
		});
	});

	it('caps at 5 tags', async () => {
		mockCreate.mockResolvedValueOnce({
			output_text: JSON.stringify({
				tags: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
			}),
		} as never);
		const res = await generateAutoTags({ title: 't' });
		expect(res.success).toBe(true);
		if (res.success) expect(res.data.tags).toHaveLength(5);
	});

	it('returns "no tags" error when model returns empty array', async () => {
		mockCreate.mockResolvedValueOnce({
			output_text: JSON.stringify({ tags: [] }),
		} as never);
		const res = await generateAutoTags({ title: 't' });
		expect(res).toEqual({
			success: false,
			error: 'AI returned no tags. Try again.',
		});
	});

	it('returns "no tags" error when output_text is invalid JSON', async () => {
		mockCreate.mockResolvedValueOnce({
			output_text: 'not json at all',
		} as never);
		const res = await generateAutoTags({ title: 't' });
		expect(res).toEqual({
			success: false,
			error: 'AI returned no tags. Try again.',
		});
	});

	it('returns "no tags" error when output_text is missing', async () => {
		mockCreate.mockResolvedValueOnce({} as never);
		const res = await generateAutoTags({ title: 't' });
		expect(res).toEqual({
			success: false,
			error: 'AI returned no tags. Try again.',
		});
	});

	it('truncates content to 2000 chars before sending', async () => {
		const huge = 'x'.repeat(5000);
		mockCreate.mockResolvedValueOnce({
			output_text: JSON.stringify({ tags: ['ok'] }),
		} as never);
		await generateAutoTags({ title: 't', content: huge });
		const arg = mockCreate.mock.calls[0]?.[0] as { input: string };
		expect(arg.input.length).toBeLessThan(huge.length);
		expect(arg.input).toContain('[truncated]');
	});

	it('omits description when blank, includes when set', async () => {
		mockCreate.mockResolvedValueOnce({
			output_text: JSON.stringify({ tags: ['ok'] }),
		} as never);
		await generateAutoTags({ title: 't', description: '   ' });
		const arg1 = mockCreate.mock.calls[0]?.[0] as { input: string };
		expect(arg1.input).not.toContain('Description');

		mockCreate.mockResolvedValueOnce({
			output_text: JSON.stringify({ tags: ['ok'] }),
		} as never);
		await generateAutoTags({ title: 't', description: 'a useful note' });
		const arg2 = mockCreate.mock.calls[1]?.[0] as { input: string };
		expect(arg2.input).toContain('Description: a useful note');
	});

	it('uses json_object format and the AI_MODEL constant', async () => {
		mockCreate.mockResolvedValueOnce({
			output_text: JSON.stringify({ tags: ['ok'] }),
		} as never);
		await generateAutoTags({ title: 't' });
		const arg = mockCreate.mock.calls[0]?.[0] as Record<string, unknown>;
		expect(arg.model).toBe('gpt-5-nano');
		expect(arg.text).toEqual({ format: { type: 'json_object' } });
		expect(arg.instructions).toMatch(/lowercase/);
	});

	it('includes the word JSON in the input (OpenAI 400s without it)', async () => {
		mockCreate.mockResolvedValueOnce({
			output_text: JSON.stringify({ tags: ['ok'] }),
		} as never);
		await generateAutoTags({ title: 't' });
		const arg = mockCreate.mock.calls[0]?.[0] as { input: string };
		expect(arg.input.toLowerCase()).toContain('json');
	});

	it('maps OpenAI 429 to rate-limit message', async () => {
		mockCreate.mockRejectedValueOnce(makeApiError(429));
		const res = await generateAutoTags({ title: 't' });
		expect(res).toEqual({
			success: false,
			error: 'OpenAI is rate-limited. Try again shortly.',
		});
	});

	it('maps OpenAI 401 to credentials message', async () => {
		mockCreate.mockRejectedValueOnce(makeApiError(401));
		const res = await generateAutoTags({ title: 't' });
		expect(res).toEqual({
			success: false,
			error: 'AI credentials are not configured.',
		});
	});

	it('maps OpenAI 5xx to "having a moment"', async () => {
		mockCreate.mockRejectedValueOnce(makeApiError(503));
		const res = await generateAutoTags({ title: 't' });
		expect(res).toEqual({
			success: false,
			error: 'OpenAI is having a moment. Try again.',
		});
	});

	it('maps unknown errors to a generic failure', async () => {
		mockCreate.mockRejectedValueOnce(new Error('network down'));
		const res = await generateAutoTags({ title: 't' });
		expect(res).toEqual({ success: false, error: 'AI request failed.' });
	});
});

describe('generateSummary', () => {
	it('rejects unauthorized', async () => {
		mockAuth.mockResolvedValueOnce(null as never);
		const res = await generateSummary({ title: 'react snippet' });
		expect(res).toEqual({ success: false, error: 'Unauthorized' });
		expect(mockCreate).not.toHaveBeenCalled();
	});

	it('rejects empty title', async () => {
		const res = await generateSummary({ title: '   ' });
		expect(res.success).toBe(false);
		expect(mockCreate).not.toHaveBeenCalled();
	});

	it('rejects free users with the Pro-required message', async () => {
		mockCanUseAi.mockResolvedValueOnce({ allowed: false, reason: 'not_pro' });
		const res = await generateSummary({ title: 'react snippet' });
		expect(res).toEqual({
			success: false,
			error: 'AI features are Pro-only. Upgrade to Pro to enable.',
		});
		expect(mockCreate).not.toHaveBeenCalled();
	});

	it('returns rate-limited error with retry-after seconds', async () => {
		mockCheckRl.mockResolvedValueOnce({ ok: false, retryAfterSeconds: 30 });
		const res = await generateSummary({ title: 'react snippet' });
		expect(res).toEqual({
			success: false,
			error: 'Too many AI requests. Try again in 30s.',
		});
		expect(mockCreate).not.toHaveBeenCalled();
	});

	it('returns a clean summary on success', async () => {
		mockCreate.mockResolvedValueOnce({
			output_text: 'A React hook for tracking counter state across renders.',
		} as never);
		const res = await generateSummary({
			title: 'useState counter',
			type: 'snippet',
			content: 'const [count, setCount] = useState(0)',
			language: 'typescript',
		});
		expect(res).toEqual({
			success: true,
			data: {
				summary:
					'A React hook for tracking counter state across renders.',
			},
		});
	});

	it('strips wrapping quotes from the model output', async () => {
		mockCreate.mockResolvedValueOnce({
			output_text: '"A docker run cheat sheet for spinning up containers."',
		} as never);
		const res = await generateSummary({ title: 'docker run' });
		expect(res.success).toBe(true);
		if (res.success) {
			expect(res.data.summary).toBe(
				'A docker run cheat sheet for spinning up containers.',
			);
		}
	});

	it('collapses whitespace and trims', async () => {
		mockCreate.mockResolvedValueOnce({
			output_text: '  Sentence one.\n\n   Sentence two.   ',
		} as never);
		const res = await generateSummary({ title: 't' });
		expect(res.success).toBe(true);
		if (res.success) {
			expect(res.data.summary).toBe('Sentence one. Sentence two.');
		}
	});

	it('caps the summary at 280 characters', async () => {
		const longText = 'word '.repeat(200).trim();
		mockCreate.mockResolvedValueOnce({
			output_text: longText,
		} as never);
		const res = await generateSummary({ title: 't' });
		expect(res.success).toBe(true);
		if (res.success) {
			expect(res.data.summary.length).toBeLessThanOrEqual(280);
			expect(res.data.summary.endsWith('…')).toBe(true);
		}
	});

	it('returns "no summary" error when output_text is empty', async () => {
		mockCreate.mockResolvedValueOnce({ output_text: '' } as never);
		const res = await generateSummary({ title: 't' });
		expect(res).toEqual({
			success: false,
			error: 'AI returned no summary. Try again.',
		});
	});

	it('returns "no summary" error when output_text is missing', async () => {
		mockCreate.mockResolvedValueOnce({} as never);
		const res = await generateSummary({ title: 't' });
		expect(res).toEqual({
			success: false,
			error: 'AI returned no summary. Try again.',
		});
	});

	it('truncates content to 2000 chars before sending', async () => {
		const huge = 'x'.repeat(5000);
		mockCreate.mockResolvedValueOnce({
			output_text: 'ok',
		} as never);
		await generateSummary({ title: 't', content: huge });
		const arg = mockCreate.mock.calls[0]?.[0] as { input: string };
		expect(arg.input.length).toBeLessThan(huge.length);
		expect(arg.input).toContain('[truncated]');
	});

	it('omits optional fields when blank or missing', async () => {
		mockCreate.mockResolvedValueOnce({
			output_text: 'ok',
		} as never);
		await generateSummary({
			title: 't',
			content: '   ',
			url: '',
			language: 'plaintext',
		});
		const arg = mockCreate.mock.calls[0]?.[0] as { input: string };
		expect(arg.input).not.toContain('Content:');
		expect(arg.input).not.toContain('URL:');
		expect(arg.input).not.toContain('Language:');
	});

	it('includes optional fields when populated', async () => {
		mockCreate.mockResolvedValueOnce({
			output_text: 'ok',
		} as never);
		await generateSummary({
			title: 'docker run',
			type: 'command',
			content: 'docker run -p 3000:3000 myimage',
			language: 'bash',
		});
		const arg = mockCreate.mock.calls[0]?.[0] as { input: string };
		expect(arg.input).toContain('Type: command');
		expect(arg.input).toContain('Title: docker run');
		expect(arg.input).toContain('Language: bash');
		expect(arg.input).toContain('Content:');
	});

	it('uses text format and the AI_MODEL constant', async () => {
		mockCreate.mockResolvedValueOnce({
			output_text: 'ok',
		} as never);
		await generateSummary({ title: 't' });
		const arg = mockCreate.mock.calls[0]?.[0] as Record<string, unknown>;
		expect(arg.model).toBe('gpt-5-nano');
		expect(arg.text).toEqual({ format: { type: 'text' } });
		expect(arg.instructions).toMatch(/1-2 sentence/);
	});

	it('maps OpenAI 429 to rate-limit message', async () => {
		mockCreate.mockRejectedValueOnce(makeApiError(429));
		const res = await generateSummary({ title: 't' });
		expect(res).toEqual({
			success: false,
			error: 'OpenAI is rate-limited. Try again shortly.',
		});
	});

	it('maps OpenAI 401 to credentials message', async () => {
		mockCreate.mockRejectedValueOnce(makeApiError(401));
		const res = await generateSummary({ title: 't' });
		expect(res).toEqual({
			success: false,
			error: 'AI credentials are not configured.',
		});
	});

	it('maps OpenAI 5xx to "having a moment"', async () => {
		mockCreate.mockRejectedValueOnce(makeApiError(503));
		const res = await generateSummary({ title: 't' });
		expect(res).toEqual({
			success: false,
			error: 'OpenAI is having a moment. Try again.',
		});
	});

	it('maps unknown errors to a generic failure', async () => {
		mockCreate.mockRejectedValueOnce(new Error('network down'));
		const res = await generateSummary({ title: 't' });
		expect(res).toEqual({ success: false, error: 'AI request failed.' });
	});
});

describe('explainCode', () => {
	it('rejects unauthorized', async () => {
		mockAuth.mockResolvedValueOnce(null as never);
		const res = await explainCode({ itemId: 'item-1' });
		expect(res).toEqual({ success: false, error: 'Unauthorized' });
		expect(mockCreate).not.toHaveBeenCalled();
		expect(mockGetItemDetail).not.toHaveBeenCalled();
	});

	it('rejects empty itemId', async () => {
		const res = await explainCode({ itemId: '   ' });
		expect(res.success).toBe(false);
		expect(mockCreate).not.toHaveBeenCalled();
		expect(mockGetItemDetail).not.toHaveBeenCalled();
	});

	it('rejects free users with the Pro-required message', async () => {
		mockCanUseAi.mockResolvedValueOnce({ allowed: false, reason: 'not_pro' });
		const res = await explainCode({ itemId: 'item-1' });
		expect(res).toEqual({
			success: false,
			error: 'AI features are Pro-only. Upgrade to Pro to enable.',
		});
		expect(mockCreate).not.toHaveBeenCalled();
		expect(mockGetItemDetail).not.toHaveBeenCalled();
	});

	it('returns rate-limited error with retry-after seconds', async () => {
		mockCheckRl.mockResolvedValueOnce({ ok: false, retryAfterSeconds: 17 });
		const res = await explainCode({ itemId: 'item-1' });
		expect(res).toEqual({
			success: false,
			error: 'Too many AI requests. Try again in 17s.',
		});
		expect(mockCreate).not.toHaveBeenCalled();
		expect(mockGetItemDetail).not.toHaveBeenCalled();
	});

	it('returns "not found" when getItemDetail returns null (foreign id)', async () => {
		mockGetItemDetail.mockResolvedValueOnce(null);
		const res = await explainCode({ itemId: 'someone-elses' });
		expect(res).toEqual({ success: false, error: 'Item not found' });
		expect(mockCreate).not.toHaveBeenCalled();
	});

	it('rejects non-explainable types (note/prompt/link)', async () => {
		mockGetItemDetail.mockResolvedValueOnce(
			buildItem({ itemType: { name: 'Note' } }) as never,
		);
		const res = await explainCode({ itemId: 'item-1' });
		expect(res).toEqual({
			success: false,
			error: 'Only snippets and commands can be explained.',
		});
		expect(mockCreate).not.toHaveBeenCalled();
	});

	it('rejects items with empty content', async () => {
		mockGetItemDetail.mockResolvedValueOnce(
			buildItem({ content: '   ' }) as never,
		);
		const res = await explainCode({ itemId: 'item-1' });
		expect(res).toEqual({
			success: false,
			error: 'Item has no code to explain.',
		});
		expect(mockCreate).not.toHaveBeenCalled();
	});

	it('re-fetches item with the session userId (ownership check)', async () => {
		mockCreate.mockResolvedValueOnce({ output_text: 'ok' } as never);
		await explainCode({ itemId: 'item-1' });
		expect(mockGetItemDetail).toHaveBeenCalledWith('item-1', 'u1');
	});

	it('returns the explanation on success', async () => {
		mockCreate.mockResolvedValueOnce({
			output_text:
				'Initializes a counter state hook.\n\n- Uses `useState`\n- Returns `[value, setter]`',
		} as never);
		const res = await explainCode({ itemId: 'item-1' });
		expect(res).toEqual({
			success: true,
			data: {
				explanation:
					'Initializes a counter state hook.\n\n- Uses `useState`\n- Returns `[value, setter]`',
			},
		});
	});

	it('trims whitespace from the model output', async () => {
		mockCreate.mockResolvedValueOnce({
			output_text: '\n\n  Explanation here.  \n\n',
		} as never);
		const res = await explainCode({ itemId: 'item-1' });
		expect(res.success).toBe(true);
		if (res.success) expect(res.data.explanation).toBe('Explanation here.');
	});

	it('returns "no explanation" error when output_text is empty', async () => {
		mockCreate.mockResolvedValueOnce({ output_text: '' } as never);
		const res = await explainCode({ itemId: 'item-1' });
		expect(res).toEqual({
			success: false,
			error: 'AI returned no explanation. Try again.',
		});
	});

	it('returns "no explanation" error when output_text is missing', async () => {
		mockCreate.mockResolvedValueOnce({} as never);
		const res = await explainCode({ itemId: 'item-1' });
		expect(res).toEqual({
			success: false,
			error: 'AI returned no explanation. Try again.',
		});
	});

	it('truncates code to 2000 chars before sending', async () => {
		const huge = 'x'.repeat(5000);
		mockGetItemDetail.mockResolvedValueOnce(
			buildItem({ content: huge }) as never,
		);
		mockCreate.mockResolvedValueOnce({ output_text: 'ok' } as never);
		await explainCode({ itemId: 'item-1' });
		const arg = mockCreate.mock.calls[0]?.[0] as { input: string };
		expect(arg.input.length).toBeLessThan(huge.length);
		expect(arg.input).toContain('[truncated]');
	});

	it('omits Language line when language is plaintext or null', async () => {
		mockGetItemDetail.mockResolvedValueOnce(
			buildItem({ language: 'plaintext' }) as never,
		);
		mockCreate.mockResolvedValueOnce({ output_text: 'ok' } as never);
		await explainCode({ itemId: 'item-1' });
		const arg1 = mockCreate.mock.calls[0]?.[0] as { input: string };
		expect(arg1.input).not.toContain('Language:');

		mockGetItemDetail.mockResolvedValueOnce(
			buildItem({ language: null }) as never,
		);
		mockCreate.mockResolvedValueOnce({ output_text: 'ok' } as never);
		await explainCode({ itemId: 'item-1' });
		const arg2 = mockCreate.mock.calls[1]?.[0] as { input: string };
		expect(arg2.input).not.toContain('Language:');
	});

	it('uses text format, AI_MODEL, and explain instructions', async () => {
		mockCreate.mockResolvedValueOnce({ output_text: 'ok' } as never);
		await explainCode({ itemId: 'item-1' });
		const arg = mockCreate.mock.calls[0]?.[0] as Record<string, unknown>;
		expect(arg.model).toBe('gpt-5-nano');
		expect(arg.text).toEqual({ format: { type: 'text' } });
		expect(arg.instructions).toMatch(/explain/i);
		const input = arg.input as string;
		expect(input).toContain('Type: snippet');
		expect(input).toContain('Title: useState counter');
		expect(input).toContain('Language: typescript');
		expect(input).toContain('Code:');
	});

	it('maps OpenAI 429 to rate-limit message', async () => {
		mockCreate.mockRejectedValueOnce(makeApiError(429));
		const res = await explainCode({ itemId: 'item-1' });
		expect(res).toEqual({
			success: false,
			error: 'OpenAI is rate-limited. Try again shortly.',
		});
	});

	it('maps OpenAI 401 to credentials message', async () => {
		mockCreate.mockRejectedValueOnce(makeApiError(401));
		const res = await explainCode({ itemId: 'item-1' });
		expect(res).toEqual({
			success: false,
			error: 'AI credentials are not configured.',
		});
	});

	it('maps OpenAI 5xx to "having a moment"', async () => {
		mockCreate.mockRejectedValueOnce(makeApiError(503));
		const res = await explainCode({ itemId: 'item-1' });
		expect(res).toEqual({
			success: false,
			error: 'OpenAI is having a moment. Try again.',
		});
	});

	it('maps unknown errors to a generic failure', async () => {
		mockCreate.mockRejectedValueOnce(new Error('network down'));
		const res = await explainCode({ itemId: 'item-1' });
		expect(res).toEqual({ success: false, error: 'AI request failed.' });
	});
});

describe('optimizePrompt', () => {
	function buildPromptItem(overrides: Partial<MockItem> = {}): MockItem {
		return buildItem({
			id: 'prompt-1',
			title: 'Code reviewer system prompt',
			content: 'You review code. Be helpful.',
			language: null,
			itemType: { name: 'Prompt' },
			...overrides,
		});
	}

	it('rejects unauthorized', async () => {
		mockAuth.mockResolvedValueOnce(null as never);
		const res = await optimizePrompt({ itemId: 'prompt-1' });
		expect(res).toEqual({ success: false, error: 'Unauthorized' });
		expect(mockCreate).not.toHaveBeenCalled();
		expect(mockGetItemDetail).not.toHaveBeenCalled();
	});

	it('rejects empty itemId', async () => {
		const res = await optimizePrompt({ itemId: '   ' });
		expect(res.success).toBe(false);
		expect(mockCreate).not.toHaveBeenCalled();
		expect(mockGetItemDetail).not.toHaveBeenCalled();
	});

	it('rejects free users with the Pro-required message', async () => {
		mockCanUseAi.mockResolvedValueOnce({ allowed: false, reason: 'not_pro' });
		const res = await optimizePrompt({ itemId: 'prompt-1' });
		expect(res).toEqual({
			success: false,
			error: 'AI features are Pro-only. Upgrade to Pro to enable.',
		});
		expect(mockCreate).not.toHaveBeenCalled();
		expect(mockGetItemDetail).not.toHaveBeenCalled();
	});

	it('returns rate-limited error with retry-after seconds', async () => {
		mockCheckRl.mockResolvedValueOnce({ ok: false, retryAfterSeconds: 23 });
		const res = await optimizePrompt({ itemId: 'prompt-1' });
		expect(res).toEqual({
			success: false,
			error: 'Too many AI requests. Try again in 23s.',
		});
		expect(mockCreate).not.toHaveBeenCalled();
		expect(mockGetItemDetail).not.toHaveBeenCalled();
	});

	it('returns "not found" when getItemDetail returns null (foreign id)', async () => {
		mockGetItemDetail.mockResolvedValueOnce(null);
		const res = await optimizePrompt({ itemId: 'someone-elses' });
		expect(res).toEqual({ success: false, error: 'Item not found' });
		expect(mockCreate).not.toHaveBeenCalled();
	});

	it('rejects non-prompt types (snippet/command/note/link)', async () => {
		mockGetItemDetail.mockResolvedValueOnce(
			buildPromptItem({ itemType: { name: 'Snippet' } }) as never,
		);
		const res = await optimizePrompt({ itemId: 'prompt-1' });
		expect(res).toEqual({
			success: false,
			error: 'Only prompts can be optimized.',
		});
		expect(mockCreate).not.toHaveBeenCalled();
	});

	it('rejects items with empty content', async () => {
		mockGetItemDetail.mockResolvedValueOnce(
			buildPromptItem({ content: '   ' }) as never,
		);
		const res = await optimizePrompt({ itemId: 'prompt-1' });
		expect(res).toEqual({
			success: false,
			error: 'Prompt is empty.',
		});
		expect(mockCreate).not.toHaveBeenCalled();
	});

	it('re-fetches item with the session userId (ownership check)', async () => {
		mockGetItemDetail.mockResolvedValueOnce(buildPromptItem() as never);
		mockCreate.mockResolvedValueOnce({
			output_text: 'You are an expert code reviewer. Review the supplied code carefully and surface bugs, edge cases, and stylistic issues.',
		} as never);
		await optimizePrompt({ itemId: 'prompt-1' });
		expect(mockGetItemDetail).toHaveBeenCalledWith('prompt-1', 'u1');
	});

	it('returns original + optimized on success', async () => {
		mockGetItemDetail.mockResolvedValueOnce(buildPromptItem() as never);
		mockCreate.mockResolvedValueOnce({
			output_text:
				'You are an expert code reviewer. Review the supplied code carefully and surface bugs, edge cases, and stylistic issues. Respond with a structured list.',
		} as never);
		const res = await optimizePrompt({ itemId: 'prompt-1' });
		expect(res).toEqual({
			success: true,
			data: {
				original: 'You review code. Be helpful.',
				optimized:
					'You are an expert code reviewer. Review the supplied code carefully and surface bugs, edge cases, and stylistic issues. Respond with a structured list.',
			},
		});
	});

	it('trims whitespace from the model output', async () => {
		mockGetItemDetail.mockResolvedValueOnce(buildPromptItem() as never);
		mockCreate.mockResolvedValueOnce({
			output_text: '\n\n  Refined prompt text.  \n\n',
		} as never);
		const res = await optimizePrompt({ itemId: 'prompt-1' });
		expect(res.success).toBe(true);
		if (res.success) expect(res.data.optimized).toBe('Refined prompt text.');
	});

	it('strips wrapping straight quotes from output', async () => {
		mockGetItemDetail.mockResolvedValueOnce(buildPromptItem() as never);
		mockCreate.mockResolvedValueOnce({
			output_text: '"Be a senior React engineer and answer succinctly."',
		} as never);
		const res = await optimizePrompt({ itemId: 'prompt-1' });
		expect(res.success).toBe(true);
		if (res.success)
			expect(res.data.optimized).toBe(
				'Be a senior React engineer and answer succinctly.',
			);
	});

	it('strips wrapping markdown code fences from output', async () => {
		mockGetItemDetail.mockResolvedValueOnce(buildPromptItem() as never);
		mockCreate.mockResolvedValueOnce({
			output_text: '```\nYou are a precise assistant.\n```',
		} as never);
		const res = await optimizePrompt({ itemId: 'prompt-1' });
		expect(res.success).toBe(true);
		if (res.success)
			expect(res.data.optimized).toBe('You are a precise assistant.');
	});

	it('returns "no optimization" error when output_text is empty', async () => {
		mockGetItemDetail.mockResolvedValueOnce(buildPromptItem() as never);
		mockCreate.mockResolvedValueOnce({ output_text: '' } as never);
		const res = await optimizePrompt({ itemId: 'prompt-1' });
		expect(res).toEqual({
			success: false,
			error: 'AI returned no optimization. Try again.',
		});
	});

	it('returns "no optimization" error when output_text is missing', async () => {
		mockGetItemDetail.mockResolvedValueOnce(buildPromptItem() as never);
		mockCreate.mockResolvedValueOnce({} as never);
		const res = await optimizePrompt({ itemId: 'prompt-1' });
		expect(res).toEqual({
			success: false,
			error: 'AI returned no optimization. Try again.',
		});
	});

	it('truncates prompt content to 2000 chars before sending', async () => {
		const huge = 'x'.repeat(5000);
		mockGetItemDetail.mockResolvedValueOnce(
			buildPromptItem({ content: huge }) as never,
		);
		mockCreate.mockResolvedValueOnce({ output_text: 'ok' } as never);
		await optimizePrompt({ itemId: 'prompt-1' });
		const arg = mockCreate.mock.calls[0]?.[0] as { input: string };
		expect(arg.input.length).toBeLessThan(huge.length);
		expect(arg.input).toContain('[truncated]');
	});

	it('uses text format, AI_MODEL, and optimize instructions', async () => {
		mockGetItemDetail.mockResolvedValueOnce(buildPromptItem() as never);
		mockCreate.mockResolvedValueOnce({
			output_text: 'Refined prompt.',
		} as never);
		await optimizePrompt({ itemId: 'prompt-1' });
		const arg = mockCreate.mock.calls[0]?.[0] as Record<string, unknown>;
		expect(arg.model).toBe('gpt-5-nano');
		expect(arg.text).toEqual({ format: { type: 'text' } });
		expect(arg.instructions).toMatch(/refine/i);
		const input = arg.input as string;
		expect(input).toContain('Title: Code reviewer system prompt');
		expect(input).toContain('Prompt:');
		expect(input).toContain('You review code. Be helpful.');
	});

	it('maps OpenAI 429 to rate-limit message', async () => {
		mockGetItemDetail.mockResolvedValueOnce(buildPromptItem() as never);
		mockCreate.mockRejectedValueOnce(makeApiError(429));
		const res = await optimizePrompt({ itemId: 'prompt-1' });
		expect(res).toEqual({
			success: false,
			error: 'OpenAI is rate-limited. Try again shortly.',
		});
	});

	it('maps OpenAI 401 to credentials message', async () => {
		mockGetItemDetail.mockResolvedValueOnce(buildPromptItem() as never);
		mockCreate.mockRejectedValueOnce(makeApiError(401));
		const res = await optimizePrompt({ itemId: 'prompt-1' });
		expect(res).toEqual({
			success: false,
			error: 'AI credentials are not configured.',
		});
	});

	it('maps OpenAI 5xx to "having a moment"', async () => {
		mockGetItemDetail.mockResolvedValueOnce(buildPromptItem() as never);
		mockCreate.mockRejectedValueOnce(makeApiError(503));
		const res = await optimizePrompt({ itemId: 'prompt-1' });
		expect(res).toEqual({
			success: false,
			error: 'OpenAI is having a moment. Try again.',
		});
	});

	it('maps unknown errors to a generic failure', async () => {
		mockGetItemDetail.mockResolvedValueOnce(buildPromptItem() as never);
		mockCreate.mockRejectedValueOnce(new Error('network down'));
		const res = await optimizePrompt({ itemId: 'prompt-1' });
		expect(res).toEqual({ success: false, error: 'AI request failed.' });
	});
});

function makeApiError(status: number) {
	const headers = new Headers();
	return new OpenAI.APIError(
		status,
		{ error: { message: 'x' } },
		'x',
		headers,
	);
}
