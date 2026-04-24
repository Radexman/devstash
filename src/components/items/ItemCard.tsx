'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Pin, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { iconMap } from '@/lib/item-icons';
import { formatDate } from '@/lib/format';
import { copyItemContent } from '@/lib/copy-item';
import { useItemDrawer } from '@/components/items/ItemDrawerProvider';
import { toggleItemFavorite } from '@/actions/items';
import type { ItemWithType } from '@/lib/db/items';

interface ItemCardProps {
	item: ItemWithType;
}

export function ItemCard({ item }: ItemCardProps) {
	const Icon = iconMap[item.itemType.icon];
	const { openItem } = useItemDrawer();
	const router = useRouter();
	const [isFavorite, setIsFavorite] = useState(item.isFavorite);
	const [favoriting, setFavoriting] = useState(false);

	const handleCardKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			openItem(item.id);
		}
	};

	const handleToggleFavorite = async (e: React.MouseEvent) => {
		e.stopPropagation();
		if (favoriting) return;
		const previous = isFavorite;
		setIsFavorite(!previous);
		setFavoriting(true);
		const result = await toggleItemFavorite(item.id);
		setFavoriting(false);
		if (!result.success) {
			setIsFavorite(previous);
			toast.error(result.error);
			return;
		}
		setIsFavorite(result.data.isFavorite);
		router.refresh();
	};

	return (
		<div
			role="button"
			tabIndex={0}
			onClick={() => openItem(item.id)}
			onKeyDown={handleCardKey}
			className="group flex w-full cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			style={{
				borderLeftWidth: '3px',
				borderLeftColor: item.itemType.color,
			}}
		>
			{Icon && (
				<div
					className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
					style={{
						backgroundColor: `${item.itemType.color}20`,
						color: item.itemType.color,
					}}
				>
					<Icon className="h-4 w-4" />
				</div>
			)}
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<span className="truncate font-medium">{item.title}</span>
					{item.isPinned && (
						<Pin
							className="h-3 w-3 shrink-0 text-muted-foreground"
							aria-label="Pinned"
						/>
					)}
				</div>
				{item.description && (
					<p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
						{item.description}
					</p>
				)}
				{item.tags.length > 0 && (
					<div className="mt-2 flex flex-wrap items-center gap-1">
						{item.tags.map((tag) => (
							<Badge key={tag.id} variant="secondary" className="text-xs px-1.5 py-0">
								{tag.name}
							</Badge>
						))}
					</div>
				)}
				<div className="mt-2 flex items-center justify-between gap-2">
					<Badge
						variant="outline"
						className="text-xs"
						style={{ borderColor: item.itemType.color, color: item.itemType.color }}
					>
						{item.itemType.name}
					</Badge>
					<span className="text-xs text-muted-foreground">
						{formatDate(item.updatedAt)}
					</span>
				</div>
			</div>
			<div className="flex shrink-0 items-start gap-0.5">
				<button
					type="button"
					aria-label="Toggle favorite"
					aria-pressed={isFavorite}
					onClick={handleToggleFavorite}
					disabled={favoriting}
					className={
						isFavorite
							? 'shrink-0 rounded-md p-1.5 text-yellow-500 transition-all hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50'
							: 'shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-accent hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100 disabled:opacity-50'
					}
				>
					<Star
						className={
							isFavorite ? 'h-4 w-4 fill-yellow-500' : 'h-4 w-4'
						}
					/>
				</button>
				<button
					type="button"
					aria-label="Copy"
					onClick={(e) => {
						e.stopPropagation();
						copyItemContent(item);
					}}
					className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-accent hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100"
				>
					<Copy className="h-4 w-4" />
				</button>
			</div>
		</div>
	);
}
