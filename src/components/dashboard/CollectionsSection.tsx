import {
	Star,
	Code,
	Sparkles,
	Terminal,
	StickyNote,
	File,
	Image,
	LinkIcon,
	MoreHorizontal,
} from 'lucide-react';
import { collections, items, itemTypes } from '@/lib/mock-data';
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

function getCollectionTypeIcons(collectionId: string) {
	const collectionItems = items.filter((item) =>
		item.collectionIds.includes(collectionId),
	);
	const typeIds = [...new Set(collectionItems.map((item) => item.itemTypeId))];
	return typeIds
		.map((typeId) => itemTypes.find((t) => t.id === typeId))
		.filter(Boolean)
		.slice(0, 4);
}

const recentCollections = [...collections]
	.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
	.slice(0, 6);

export function CollectionsSection() {
	return (
		<section>
			<div className="mb-4 flex items-center justify-between">
				<h2 className="text-lg font-semibold">Collections</h2>
				<button className="text-sm text-muted-foreground transition-colors hover:text-foreground">
					View all
				</button>
			</div>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{recentCollections.map((collection) => {
					const typeIcons = getCollectionTypeIcons(collection.id);
					return (
						<div
							key={collection.id}
							className="group relative rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50 cursor-pointer"
						>
							<div className="mb-2 flex items-center justify-between">
								<h3 className="font-medium">{collection.name}</h3>
								<div className="flex items-center gap-1">
									{collection.isFavorite && (
										<Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
									)}
									<button className="rounded p-1 opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100">
										<MoreHorizontal className="h-4 w-4 text-muted-foreground" />
									</button>
								</div>
							</div>
							<p className="text-sm text-muted-foreground">
								{collection.itemCount} items
							</p>
							{collection.description && (
								<p className="mt-1 text-sm text-muted-foreground/70 line-clamp-1">
									{collection.description}
								</p>
							)}
							{typeIcons.length > 0 && (
								<div className="mt-3 flex items-center gap-2">
									{typeIcons.map((type) => {
										if (!type) return null;
										const Icon = iconMap[type.icon];
										return Icon ? (
											<Icon
												key={type.id}
												className="h-3.5 w-3.5"
												style={{ color: type.color }}
											/>
										) : null;
									})}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</section>
	);
}
