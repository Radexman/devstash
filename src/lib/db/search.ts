import { prisma } from '@/lib/prisma';

export interface SearchItem {
	id: string;
	title: string;
	typeName: string;
	typeIcon: string;
	typeColor: string;
	contentPreview: string | null;
}

export interface SearchCollection {
	id: string;
	name: string;
	itemCount: number;
}

export interface SearchData {
	items: SearchItem[];
	collections: SearchCollection[];
}

const PREVIEW_LENGTH = 120;

function buildPreview(description: string | null, content: string | null, url: string | null): string | null {
	const source = description?.trim() || content?.trim() || url?.trim() || null;
	if (!source) return null;
	const collapsed = source.replace(/\s+/g, ' ');
	return collapsed.length > PREVIEW_LENGTH
		? `${collapsed.slice(0, PREVIEW_LENGTH)}…`
		: collapsed;
}

export async function getSearchData(userId: string): Promise<SearchData> {
	const [itemRows, collectionRows] = await Promise.all([
		prisma.item.findMany({
			where: { userId },
			orderBy: { updatedAt: 'desc' },
			select: {
				id: true,
				title: true,
				description: true,
				content: true,
				url: true,
				itemType: { select: { name: true, icon: true, color: true } },
			},
		}),
		prisma.collection.findMany({
			where: { userId },
			orderBy: { updatedAt: 'desc' },
			select: {
				id: true,
				name: true,
				_count: { select: { items: true } },
			},
		}),
	]);

	return {
		items: itemRows.map((item) => ({
			id: item.id,
			title: item.title,
			typeName: item.itemType.name,
			typeIcon: item.itemType.icon,
			typeColor: item.itemType.color,
			contentPreview: buildPreview(item.description, item.content, item.url),
		})),
		collections: collectionRows.map((c) => ({
			id: c.id,
			name: c.name,
			itemCount: c._count.items,
		})),
	};
}
