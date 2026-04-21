'use client';

import { useMemo, useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { FavoriteItemRow } from '@/components/favorites/FavoriteItemRow';
import { FavoriteCollectionRow } from '@/components/favorites/FavoriteCollectionRow';
import type { FavoriteCollection, FavoriteItem } from '@/lib/db/favorites';

type SortOrder = 'date' | 'name' | 'type';

interface FavoritesListProps {
	items: FavoriteItem[];
	collections: FavoriteCollection[];
}

const SORT_LABELS: Record<SortOrder, string> = {
	date: 'Most recent',
	name: 'Name (A–Z)',
	type: 'Item type',
};

function sortItems(items: FavoriteItem[], order: SortOrder): FavoriteItem[] {
	const sorted = [...items];
	switch (order) {
		case 'name':
			return sorted.sort((a, b) => a.title.localeCompare(b.title));
		case 'type':
			return sorted.sort((a, b) => {
				const typeCmp = a.itemType.name.localeCompare(b.itemType.name);
				if (typeCmp !== 0) return typeCmp;
				return a.title.localeCompare(b.title);
			});
		case 'date':
		default:
			return sorted.sort(
				(a, b) =>
					new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
			);
	}
}

function sortCollections(
	collections: FavoriteCollection[],
	order: SortOrder,
): FavoriteCollection[] {
	const sorted = [...collections];
	// Collections have no type — "type" falls back to name sort.
	if (order === 'name' || order === 'type') {
		return sorted.sort((a, b) => a.name.localeCompare(b.name));
	}
	return sorted.sort(
		(a, b) =>
			new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
	);
}

export function FavoritesList({ items, collections }: FavoritesListProps) {
	const [order, setOrder] = useState<SortOrder>('date');

	const sortedItems = useMemo(() => sortItems(items, order), [items, order]);
	const sortedCollections = useMemo(
		() => sortCollections(collections, order),
		[collections, order],
	);

	return (
		<div className="space-y-8">
			<div className="flex items-center justify-end gap-2">
				<ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
				<label
					htmlFor="favorites-sort"
					className="font-mono text-xs uppercase tracking-wider text-muted-foreground"
				>
					Sort
				</label>
				<Select<SortOrder>
					value={order}
					onValueChange={(value) => {
						if (value !== null) setOrder(value);
					}}
				>
					<SelectTrigger id="favorites-sort" className="h-8 w-40 text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="date">{SORT_LABELS.date}</SelectItem>
						<SelectItem value="name">{SORT_LABELS.name}</SelectItem>
						<SelectItem value="type">{SORT_LABELS.type}</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<section>
				<h2 className="mb-2 flex items-baseline gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
					<span>Items</span>
					<span className="text-muted-foreground/60">({items.length})</span>
				</h2>
				{sortedItems.length === 0 ? (
					<p className="px-2 py-1.5 font-mono text-xs text-muted-foreground/60">
						No favorited items.
					</p>
				) : (
					<div className="border-t border-border/40">
						{sortedItems.map((item) => (
							<FavoriteItemRow key={item.id} item={item} />
						))}
					</div>
				)}
			</section>

			<section>
				<h2 className="mb-2 flex items-baseline gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
					<span>Collections</span>
					<span className="text-muted-foreground/60">
						({collections.length})
					</span>
				</h2>
				{sortedCollections.length === 0 ? (
					<p className="px-2 py-1.5 font-mono text-xs text-muted-foreground/60">
						No favorited collections.
					</p>
				) : (
					<div className="border-t border-border/40">
						{sortedCollections.map((collection) => (
							<FavoriteCollectionRow
								key={collection.id}
								collection={collection}
							/>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
