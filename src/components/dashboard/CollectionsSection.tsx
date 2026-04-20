import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { CollectionCard } from '@/components/collections/CollectionCard';
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
					<CollectionCard key={collection.id} collection={collection} />
				))}
			</div>
		</section>
	);
}
