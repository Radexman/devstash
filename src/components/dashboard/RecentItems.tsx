'use client';

import {
	Clock,
	Star,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { iconMap } from '@/lib/item-icons';
import { formatDate } from '@/lib/format';
import { useItemDrawer } from '@/components/items/ItemDrawerProvider';
import type { ItemWithType } from '@/lib/db/items';

interface RecentItemsProps {
	items: ItemWithType[];
}

export function RecentItems({ items }: RecentItemsProps) {
	const { openItem } = useItemDrawer();
	return (
		<section>
			<div className="mb-4 flex items-center gap-2">
				<Clock className="h-4 w-4 text-muted-foreground" />
				<h2 className="text-lg font-semibold">Recent Items</h2>
			</div>
			<div className="space-y-2">
				{items.map((item) => {
					const Icon = iconMap[item.itemType.icon];
					return (
						<button
							key={item.id}
							type="button"
							onClick={() => openItem(item.id)}
							className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-accent/50"
							style={{
								borderLeftWidth: '3px',
								borderLeftColor: item.itemType.color,
							}}
						>
							{Icon && (
								<div
									className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
									style={{ backgroundColor: `${item.itemType.color}20`, color: item.itemType.color }}
								>
									<Icon className="h-4 w-4" />
								</div>
							)}
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2">
									<span className="font-medium">{item.title}</span>
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
											<Badge key={tag.id} variant="secondary" className="text-xs px-1.5 py-0">
												{tag.name}
											</Badge>
										))}
									</div>
								)}
							</div>
							<div className="flex shrink-0 items-center gap-2">
								<Badge variant="outline" className="text-xs" style={{ borderColor: item.itemType.color, color: item.itemType.color }}>
									{item.itemType.name}
								</Badge>
								<span className="text-xs text-muted-foreground">
									{formatDate(item.updatedAt)}
								</span>
							</div>
						</button>
					);
				})}
			</div>
		</section>
	);
}
