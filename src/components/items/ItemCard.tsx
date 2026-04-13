import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { iconMap } from '@/lib/item-icons';
import { formatDate } from '@/lib/format';
import type { ItemWithType } from '@/lib/db/items';

interface ItemCardProps {
	item: ItemWithType;
}

export function ItemCard({ item }: ItemCardProps) {
	const Icon = iconMap[item.itemType.icon];

	return (
		<div
			className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50 cursor-pointer"
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
					{item.isFavorite && (
						<Star className="h-3 w-3 shrink-0 fill-yellow-500 text-yellow-500" />
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
		</div>
	);
}
