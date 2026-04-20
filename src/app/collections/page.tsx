import { redirect } from 'next/navigation';
import { FolderOpen } from 'lucide-react';
import { auth } from '@/auth';
import { CollectionCard } from '@/components/collections/CollectionCard';
import { getAllCollectionsForUser } from '@/lib/db/collections';

export default async function CollectionsPage() {
	const session = await auth();

	if (!session?.user) {
		redirect('/sign-in');
	}

	const collections = await getAllCollectionsForUser(session.user.id);

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
					<FolderOpen className="h-5 w-5" />
				</div>
				<div>
					<h1 className="text-2xl font-bold">Collections</h1>
					<p className="text-sm text-muted-foreground">
						{collections.length}{' '}
						{collections.length === 1 ? 'collection' : 'collections'}
					</p>
				</div>
			</div>

			{collections.length === 0 ? (
				<div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
					<p className="text-sm text-muted-foreground">No collections yet.</p>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{collections.map((collection) => (
						<CollectionCard key={collection.id} collection={collection} />
					))}
				</div>
			)}
		</div>
	);
}
