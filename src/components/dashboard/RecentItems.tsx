import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/format';
import { DashboardItemRow } from '@/components/items/DashboardItemRow';
import type { ItemWithType } from '@/lib/db/items';

interface RecentItemsProps {
	items: ItemWithType[];
}

export function RecentItems({ items }: RecentItemsProps) {
	return (
		<section>
			<div className="mb-4 flex items-center gap-2">
				<Clock className="h-4 w-4 text-muted-foreground" />
				<h2 className="text-lg font-semibold">Recent Items</h2>
			</div>
			<div className="space-y-2">
				{items.map((item) => (
					<DashboardItemRow
						key={item.id}
						item={item}
						trailing={
							<div className="flex shrink-0 items-center gap-2">
								<Badge
									variant="outline"
									className="text-xs"
									style={{
										borderColor: item.itemType.color,
										color: item.itemType.color,
									}}
								>
									{item.itemType.name}
								</Badge>
								<span className="text-xs text-muted-foreground">
									{formatDate(item.updatedAt)}
								</span>
							</div>
						}
					/>
				))}
			</div>
		</section>
	);
}
