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

import { auth } from '@/auth';
import { canUseAi } from '@/lib/ai-limits';
import { checkAiRateLimit } from '@/lib/rate-limit';
import { generateAutoTags } from './ai';

const mockAuth = vi.mocked(auth);
const mockCanUseAi = vi.mocked(canUseAi);
const mockCheckRl = vi.mocked(checkAiRateLimit);
const mockCreate = vi.mocked(mockOpenai.responses.create);

beforeEach(() => {
	vi.clearAllMocks();
	// @ts-expect-error partial session
	mockAuth.mockResolvedValue({ user: { id: 'u1' } });
	mockCanUseAi.mockResolvedValue({ allowed: true });
	mockCheckRl.mockResolvedValue({ ok: true });
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

function makeApiError(status: number) {
	const headers = new Headers();
	return new OpenAI.APIError(
		status,
		{ error: { message: 'x' } },
		'x',
		headers,
	);
}
