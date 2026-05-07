'use client';

import type { ReactNode } from 'react';
import { Copy, Pin, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { iconMap } from '@/lib/item-icons';
import { copyItemContent } from '@/lib/copy-item';
import { makeItemKeyHandler } from '@/lib/item-key-handler';
import { useItemDrawer } from '@/components/items/ItemDrawerProvider';
import type { ItemWithType } from '@/lib/db/items';

interface DashboardItemRowProps {
	item: ItemWithType;
	showPinIcon?: boolean;
	trailing: ReactNode;
}

export function DashboardItemRow({
	item,
	showPinIcon = false,
	trailing,
}: DashboardItemRowProps) {
	const Icon = iconMap[item.itemType.icon];
	const { openItem } = useItemDrawer();
	const handleKey = makeItemKeyHandler<HTMLDivElement>(() => openItem(item.id));

	return (
		<div
			role="button"
			tabIndex={0}
			onClick={() => openItem(item.id)}
			onKeyDown={handleKey}
			className="group flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			style={{
				borderLeftWidth: '3px',
				borderLeftColor: item.itemType.color,
			}}
		>
			{Icon && (
				<div
					className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
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
					<span className="font-medium">{item.title}</span>
					{showPinIcon && (
						<Pin className="h-3 w-3 text-muted-foreground" />
					)}
					{item.isFavorite && (
						<Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
					)}
				</div>
				{item.description && (
					<p className="text-sm text-muted-foreground line-clamp-1">
						{item.description}
					</p>
				)}
				{item.tags.length > 0 && (
					<div className="mt-1 flex items-center gap-1">
						{item.tags.map((tag) => (
							<Badge
								key={tag.id}
								variant="secondary"
								className="text-xs px-1.5 py-0"
							>
								{tag.name}
							</Badge>
						))}
					</div>
				)}
			</div>
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
			{trailing}
		</div>
	);
}
