'use client';

import { iconMap } from '@/lib/item-icons';
import { formatDate } from '@/lib/format';
import { useItemDrawer } from '@/components/items/ItemDrawerProvider';
import type { FavoriteItem } from '@/lib/db/favorites';

interface FavoriteItemRowProps {
	item: FavoriteItem;
}

export function FavoriteItemRow({ item }: FavoriteItemRowProps) {
	const Icon = iconMap[item.itemType.icon];
	const { openItem } = useItemDrawer();

	const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			openItem(item.id);
		}
	};

	return (
		<div
			role="button"
			tabIndex={0}
			onClick={() => openItem(item.id)}
			onKeyDown={handleKey}
			className="group flex cursor-pointer items-center gap-3 border-b border-border/40 px-2 py-1.5 font-mono text-sm transition-colors hover:bg-accent/40 focus-visible:bg-accent/40 focus-visible:outline-none"
		>
			{Icon && (
				<Icon
					className="h-3.5 w-3.5 shrink-0"
					style={{ color: item.itemType.color }}
				/>
			)}
			<span className="flex-1 truncate">{item.title}</span>
			<span
				className="shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] uppercase tracking-wider"
				style={{
					color: item.itemType.color,
					backgroundColor: `${item.itemType.color}15`,
				}}
			>
				{item.itemType.name}
			</span>
			<span className="w-16 shrink-0 text-right text-xs text-muted-foreground/70">
				{formatDate(item.updatedAt)}
			</span>
		</div>
	);
}
