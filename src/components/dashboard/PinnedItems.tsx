import {
	Pin,
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

const pinnedItems = items.filter((item) => item.isPinned);

function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
	});
}

export function PinnedItems() {
	if (pinnedItems.length === 0) return null;

	return (
		<section>
			<div className="mb-4 flex items-center gap-2">
				<Pin className="h-4 w-4 text-muted-foreground" />
				<h2 className="text-lg font-semibold">Pinned</h2>
			</div>
			<div className="space-y-2">
				{pinnedItems.map((item) => {
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
									<Pin className="h-3 w-3 text-muted-foreground" />
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
							<span className="shrink-0 text-xs text-muted-foreground">
								{formatDate(item.createdAt)}
							</span>
						</div>
					);
				})}
			</div>
		</section>
	);
}