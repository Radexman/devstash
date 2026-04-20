import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
	prisma: {
		collection: { findFirst: vi.fn() },
		itemCollection: { findMany: vi.fn(), count: vi.fn() },
	},
}));

import { prisma } from '@/lib/prisma';
import { getCollectionDetailPage } from './collections';

const mockFindFirst = vi.mocked(prisma.collection.findFirst);
const mockICFindMany = vi.mocked(prisma.itemCollection.findMany);
const mockICCount = vi.mocked(prisma.itemCollection.count);

beforeEach(() => {
	vi.clearAllMocks();
});

describe('getCollectionDetailPage', () => {
	it('returns null when the collection is not owned by the user', async () => {
		mockFindFirst.mockResolvedValueOnce(null);

		const result = await getCollectionDetailPage('c1', 'u1', 0, 21);

		expect(result).toBeNull();
		expect(mockICFindMany).not.toHaveBeenCalled();
		expect(mockICCount).not.toHaveBeenCalled();
	});

	it('returns the slice + total when the collection exists', async () => {
		mockFindFirst.mockResolvedValueOnce({
			id: 'c1',
			name: 'Snippets',
			description: null,
			isFavorite: false,
			createdAt: new Date('2026-01-01'),
			updatedAt: new Date('2026-01-02'),
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);
		mockICFindMany.mockResolvedValueOnce([
			{ item: { id: 'i1', title: 'One' } },
			{ item: { id: 'i2', title: 'Two' } },
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		] as any);
		mockICCount.mockResolvedValueOnce(50);

		const result = await getCollectionDetailPage('c1', 'u1', 21, 21);

		expect(mockFindFirst).toHaveBeenCalledWith(
			expect.objectContaining({ where: { id: 'c1', userId: 'u1' } }),
		);
		expect(mockICFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { collectionId: 'c1' },
				skip: 21,
				take: 21,
				orderBy: { item: { updatedAt: 'desc' } },
			}),
		);
		expect(mockICCount).toHaveBeenCalledWith({ where: { collectionId: 'c1' } });
		expect(result).toMatchObject({
			id: 'c1',
			name: 'Snippets',
			total: 50,
			items: [
				{ id: 'i1', title: 'One' },
				{ id: 'i2', title: 'Two' },
			],
		});
	});
});
