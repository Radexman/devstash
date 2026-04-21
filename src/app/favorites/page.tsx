import { redirect } from 'next/navigation';
import { Star } from 'lucide-react';
import { auth } from '@/auth';
import { getFavorites } from '@/lib/db/favorites';
import { FavoritesList } from '@/components/favorites/FavoritesList';

export default async function FavoritesPage() {
	const session = await auth();

	if (!session?.user) {
		redirect('/sign-in');
	}

	const { items, collections } = await getFavorites(session.user.id);
	const isEmpty = items.length === 0 && collections.length === 0;

	return (
		<div className="space-y-8">
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-md bg-yellow-500/10 text-yellow-500">
					<Star className="h-5 w-5 fill-yellow-500" />
				</div>
				<div>
					<h1 className="text-2xl font-bold">Favorites</h1>
					<p className="text-sm text-muted-foreground">
						{items.length + collections.length}{' '}
						{items.length + collections.length === 1 ? 'favorite' : 'favorites'}
					</p>
				</div>
			</div>

			{isEmpty ? (
				<div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
					<Star className="mx-auto mb-3 h-6 w-6 text-muted-foreground/40" />
					<p className="text-sm text-muted-foreground">
						No favorites yet. Star items and collections to pin them here.
					</p>
				</div>
			) : (
				<FavoritesList items={items} collections={collections} />
			)}
		</div>
	);
}
