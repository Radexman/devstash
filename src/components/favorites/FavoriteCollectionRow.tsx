import Link from 'next/link';
import { FolderOpen } from 'lucide-react';
import { formatDate } from '@/lib/format';
import type { FavoriteCollection } from '@/lib/db/favorites';

interface FavoriteCollectionRowProps {
	collection: FavoriteCollection;
}

export function FavoriteCollectionRow({ collection }: FavoriteCollectionRowProps) {
	return (
		<Link
			href={`/collections/${collection.id}`}
			className="group flex items-center gap-3 border-b border-border/40 px-2 py-1.5 font-mono text-sm transition-colors hover:bg-accent/40 focus-visible:bg-accent/40 focus-visible:outline-none"
		>
			<FolderOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
			<span className="flex-1 truncate">{collection.name}</span>
			<span className="shrink-0 rounded-sm bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
				{collection.itemCount} {collection.itemCount === 1 ? 'item' : 'items'}
			</span>
			<span className="w-16 shrink-0 text-right text-xs text-muted-foreground/70">
				{formatDate(collection.updatedAt)}
			</span>
		</Link>
	);
}
