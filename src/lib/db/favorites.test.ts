import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
	prisma: {
		item: { findMany: vi.fn() },
		collection: { findMany: vi.fn() },
	},
}));

import { prisma } from '@/lib/prisma';
import { getFavorites } from './favorites';

const mockItemFindMany = vi.mocked(prisma.item.findMany);
const mockCollectionFindMany = vi.mocked(prisma.collection.findMany);

beforeEach(() => {
	vi.clearAllMocks();
});

describe('getFavorites', () => {
	it('scopes to the user and filters both items and collections by isFavorite', async () => {
		mockItemFindMany.mockResolvedValueOnce([]);
		mockCollectionFindMany.mockResolvedValueOnce([]);

		await getFavorites('u1');

		expect(mockItemFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { userId: 'u1', isFavorite: true },
				orderBy: { updatedAt: 'desc' },
			}),
		);
		expect(mockCollectionFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { userId: 'u1', isFavorite: true },
				orderBy: { updatedAt: 'desc' },
			}),
		);
	});

	it('returns items as-is and flattens collection _count.items into itemCount', async () => {
		const itemDate = new Date('2026-04-20T10:00:00Z');
		const colDate = new Date('2026-04-19T10:00:00Z');

		mockItemFindMany.mockResolvedValueOnce([
			{
				id: 'i1',
				title: 'Snippet A',
				updatedAt: itemDate,
				itemType: { name: 'snippet', icon: 'Code', color: '#3b82f6' },
			},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		] as any);
		mockCollectionFindMany.mockResolvedValueOnce([
			{
				id: 'c1',
				name: 'Fav Col',
				updatedAt: colDate,
				_count: { items: 3 },
			},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		] as any);

		const result = await getFavorites('u1');

		expect(result).toEqual({
			items: [
				{
					id: 'i1',
					title: 'Snippet A',
					updatedAt: itemDate,
					itemType: { name: 'snippet', icon: 'Code', color: '#3b82f6' },
				},
			],
			collections: [
				{
					id: 'c1',
					name: 'Fav Col',
					itemCount: 3,
					updatedAt: colDate,
				},
			],
		});
	});

	it('returns empty arrays when the user has no favorites', async () => {
		mockItemFindMany.mockResolvedValueOnce([]);
		mockCollectionFindMany.mockResolvedValueOnce([]);

		const result = await getFavorites('u1');

		expect(result).toEqual({ items: [], collections: [] });
	});
});
