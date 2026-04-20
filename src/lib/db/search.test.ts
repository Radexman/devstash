import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
	prisma: {
		item: { findMany: vi.fn() },
		collection: { findMany: vi.fn() },
	},
}));

import { prisma } from '@/lib/prisma';
import { getSearchData } from './search';

const mockItemFindMany = vi.mocked(prisma.item.findMany);
const mockCollectionFindMany = vi.mocked(prisma.collection.findMany);

beforeEach(() => {
	vi.clearAllMocks();
});

describe('getSearchData', () => {
	it('returns items and collections scoped to the user', async () => {
		mockItemFindMany.mockResolvedValueOnce([
			{
				id: 'i1',
				title: 'Snippet One',
				description: 'A quick description',
				content: 'console.log("hi")',
				url: null,
				itemType: { name: 'Snippet', icon: 'Code', color: '#3b82f6' },
			},
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		] as any);
		mockCollectionFindMany.mockResolvedValueOnce([
			{
				id: 'c1',
				name: 'React Patterns',
				_count: { items: 4 },
			},
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		] as any);

		const result = await getSearchData('u1');

		expect(mockItemFindMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: { userId: 'u1' } }),
		);
		expect(mockCollectionFindMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: { userId: 'u1' } }),
		);
		expect(result.items).toEqual([
			{
				id: 'i1',
				title: 'Snippet One',
				typeName: 'Snippet',
				typeIcon: 'Code',
				typeColor: '#3b82f6',
				contentPreview: 'A quick description',
			},
		]);
		expect(result.collections).toEqual([
			{ id: 'c1', name: 'React Patterns', itemCount: 4 },
		]);
	});

	it('prefers description, falls back to content, then url for preview', async () => {
		mockItemFindMany.mockResolvedValueOnce([
			{
				id: 'desc',
				title: 'A',
				description: 'desc wins',
				content: 'content loses',
				url: 'https://example.com',
				itemType: { name: 'Snippet', icon: 'Code', color: '#000' },
			},
			{
				id: 'content',
				title: 'B',
				description: null,
				content: 'content fallback',
				url: 'https://example.com',
				itemType: { name: 'Note', icon: 'StickyNote', color: '#000' },
			},
			{
				id: 'url',
				title: 'C',
				description: null,
				content: null,
				url: 'https://example.com/path',
				itemType: { name: 'Link', icon: 'Link', color: '#000' },
			},
			{
				id: 'none',
				title: 'D',
				description: null,
				content: null,
				url: null,
				itemType: { name: 'Note', icon: 'StickyNote', color: '#000' },
			},
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		] as any);
		mockCollectionFindMany.mockResolvedValueOnce([]);

		const result = await getSearchData('u1');

		expect(result.items.map((i) => [i.id, i.contentPreview])).toEqual([
			['desc', 'desc wins'],
			['content', 'content fallback'],
			['url', 'https://example.com/path'],
			['none', null],
		]);
	});

	it('collapses whitespace and truncates long previews with ellipsis', async () => {
		const longContent = 'word '.repeat(60).trim(); // 60 * 5 - 1 = 299 chars
		mockItemFindMany.mockResolvedValueOnce([
			{
				id: 'i1',
				title: 'A',
				description: null,
				content: `line one\n\tline two   with   spaces\n${longContent}`,
				url: null,
				itemType: { name: 'Snippet', icon: 'Code', color: '#000' },
			},
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		] as any);
		mockCollectionFindMany.mockResolvedValueOnce([]);

		const result = await getSearchData('u1');
		const preview = result.items[0].contentPreview!;

		expect(preview).not.toMatch(/\s{2,}/);
		expect(preview.endsWith('…')).toBe(true);
		expect(preview.length).toBe(121); // 120 chars + ellipsis
	});

	it('returns empty arrays when the user has no items or collections', async () => {
		mockItemFindMany.mockResolvedValueOnce([]);
		mockCollectionFindMany.mockResolvedValueOnce([]);

		const result = await getSearchData('u1');

		expect(result).toEqual({ items: [], collections: [] });
	});
});
