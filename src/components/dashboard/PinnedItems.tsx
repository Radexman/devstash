import { Pin } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { DashboardItemRow } from '@/components/items/DashboardItemRow';
import type { ItemWithType } from '@/lib/db/items';

interface PinnedItemsProps {
	items: ItemWithType[];
}

export function PinnedItems({ items }: PinnedItemsProps) {
	if (items.length === 0) return null;

	return (
		<section>
			<div className="mb-4 flex items-center gap-2">
				<Pin className="h-4 w-4 text-muted-foreground" />
				<h2 className="text-lg font-semibold">Pinned</h2>
			</div>
			<div className="space-y-2">
				{items.map((item) => (
					<DashboardItemRow
						key={item.id}
						item={item}
						showPinIcon
						trailing={
							<span className="shrink-0 text-xs text-muted-foreground">
								{formatDate(item.createdAt)}
							</span>
						}
					/>
				))}
			</div>
		</section>
	);
}
