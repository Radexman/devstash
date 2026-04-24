import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
	prisma: {
		item: { findMany: vi.fn(), count: vi.fn() },
	},
}));

import { prisma } from '@/lib/prisma';
import { getItemsByTypePage } from './items';

const mockFindMany = vi.mocked(prisma.item.findMany);
const mockCount = vi.mocked(prisma.item.count);

beforeEach(() => {
	vi.clearAllMocks();
});

describe('getItemsByTypePage', () => {
	it('scopes to the user/type and passes skip/take through to Prisma', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mockFindMany.mockResolvedValueOnce([{ id: 'i1' }] as any);
		mockCount.mockResolvedValueOnce(42);

		const result = await getItemsByTypePage('u1', 'Snippet', 21, 21);

		expect(mockFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					userId: 'u1',
					itemType: { is: { name: { equals: 'Snippet', mode: 'insensitive' } } },
				},
				skip: 21,
				take: 21,
				orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
			}),
		);
		expect(mockCount).toHaveBeenCalledWith({
			where: {
				userId: 'u1',
				itemType: { is: { name: { equals: 'Snippet', mode: 'insensitive' } } },
			},
		});
		expect(result).toEqual({ items: [{ id: 'i1' }], total: 42 });
	});

	it('returns an empty page when there are no matches', async () => {
		mockFindMany.mockResolvedValueOnce([]);
		mockCount.mockResolvedValueOnce(0);

		const result = await getItemsByTypePage('u1', 'Note', 0, 21);

		expect(result).toEqual({ items: [], total: 0 });
	});
});
