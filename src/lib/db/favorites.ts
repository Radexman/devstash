import { prisma } from '@/lib/prisma';

export interface FavoriteItem {
	id: string;
	title: string;
	updatedAt: Date;
	itemType: {
		name: string;
		icon: string;
		color: string;
	};
}

export interface FavoriteCollection {
	id: string;
	name: string;
	itemCount: number;
	updatedAt: Date;
}

export interface FavoritesData {
	items: FavoriteItem[];
	collections: FavoriteCollection[];
}

export async function getFavorites(userId: string): Promise<FavoritesData> {
	const [items, collections] = await Promise.all([
		prisma.item.findMany({
			where: { userId, isFavorite: true },
			orderBy: { updatedAt: 'desc' },
			select: {
				id: true,
				title: true,
				updatedAt: true,
				itemType: { select: { name: true, icon: true, color: true } },
			},
		}),
		prisma.collection.findMany({
			where: { userId, isFavorite: true },
			orderBy: { updatedAt: 'desc' },
			select: {
				id: true,
				name: true,
				updatedAt: true,
				_count: { select: { items: true } },
			},
		}),
	]);

	return {
		items,
		collections: collections.map((c) => ({
			id: c.id,
			name: c.name,
			updatedAt: c.updatedAt,
			itemCount: c._count.items,
		})),
	};
}
