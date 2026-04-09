import {
	Clock,
	Star,
	Code,
	Sparkles,
	Terminal,
	StickyNote,
	File,
	Image,
	LinkIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { items, itemTypes } from '@/lib/mock-data';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
	Code,
	Sparkles,
	Terminal,
	StickyNote,
	File,
	Image,
	Link: LinkIcon,
};

const recentItems = [...items]
	.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
	.slice(0, 10);

function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
	});
}

export function RecentItems() {
	return (
		<section>
			<div className="mb-4 flex items-center gap-2">
				<Clock className="h-4 w-4 text-muted-foreground" />
				<h2 className="text-lg font-semibold">Recent Items</h2>
			</div>
			<div className="space-y-2">
				{recentItems.map((item) => {
					const type = itemTypes.find((t) => t.id === item.itemTypeId);
					const Icon = type ? iconMap[type.icon] : null;
					return (
						<div
							key={item.id}
							className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/50 cursor-pointer"
						>
							{Icon && (
								<div
									className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
									style={{ backgroundColor: `${type!.color}20`, color: type!.color }}
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
								{type && (
									<Badge variant="outline" className="text-xs" style={{ borderColor: type.color, color: type.color }}>
										{type.name}
									</Badge>
								)}
								<span className="text-xs text-muted-foreground">
									{formatDate(item.updatedAt)}
								</span>
							</div>
						</div>
					);
				})}
			</div>
		</section>
	);
}