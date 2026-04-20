import Link from 'next/link';
import { Star } from 'lucide-react';
import { iconMap } from '@/lib/item-icons';
import type { CollectionWithMeta } from '@/lib/db/collections';

interface CollectionCardProps {
	collection: CollectionWithMeta;
}

export function CollectionCard({ collection }: CollectionCardProps) {
	return (
		<Link
			href={`/collections/${collection.id}`}
			className="group relative block rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			style={{
				borderLeftWidth: collection.dominantColor ? '3px' : undefined,
				borderLeftColor: collection.dominantColor ?? undefined,
			}}
		>
			<div className="mb-2 flex items-center justify-between">
				<h3 className="font-medium">{collection.name}</h3>
				{collection.isFavorite && (
					<Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
				)}
			</div>
			<p className="text-sm text-muted-foreground">
				{collection.itemCount} {collection.itemCount === 1 ? 'item' : 'items'}
			</p>
			{collection.description && (
				<p className="mt-1 text-sm text-muted-foreground/70 line-clamp-1">
					{collection.description}
				</p>
			)}
			{collection.typeIcons.length > 0 && (
				<div className="mt-3 flex items-center gap-2">
					{collection.typeIcons.map((type) => {
						const Icon = iconMap[type.icon];
						return Icon ? (
							<Icon
								key={type.icon}
								className="h-3.5 w-3.5"
								style={{ color: type.color }}
							/>
						) : null;
					})}
				</div>
			)}
		</Link>
	);
}
