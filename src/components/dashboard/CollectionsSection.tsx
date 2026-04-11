import Link from 'next/link';
import {
	Star,
	MoreHorizontal,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { iconMap } from '@/lib/item-icons';
import type { CollectionWithMeta } from '@/lib/db/collections';

interface CollectionsSectionProps {
	collections: CollectionWithMeta[];
}

export function CollectionsSection({ collections }: CollectionsSectionProps) {
	return (
		<section>
			<div className="mb-4 flex items-center justify-between">
				<h2 className="text-lg font-semibold">Collections</h2>
				<Link href="/collections" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
					View all
				</Link>
			</div>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{collections.map((collection) => (
					<div
						key={collection.id}
						className="group relative rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50 cursor-pointer"
						style={{
							borderLeftWidth: collection.dominantColor ? '3px' : undefined,
							borderLeftColor: collection.dominantColor ?? undefined,
						}}
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
					</div>
				))}
			</div>
		</section>
	);
}
