import { notFound, redirect } from 'next/navigation';
import { FolderOpen } from 'lucide-react';
import { auth } from '@/auth';
import { ItemCard } from '@/components/items/ItemCard';
import { Pagination } from '@/components/ui/pagination';
import { CollectionDetailActions } from '@/components/collections/CollectionDetailActions';
import { getCollectionDetailPage } from '@/lib/db/collections';
import {
	COLLECTIONS_PER_PAGE,
	clampPage,
	getPageCount,
	parsePageParam,
} from '@/lib/pagination';

export default async function CollectionDetailPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ page?: string | string[] }>;
}) {
	const session = await auth();

	if (!session?.user) {
		redirect('/sign-in');
	}

	const { id } = await params;
	const { page: pageParam } = await searchParams;
	const requestedPage = parsePageParam(pageParam);

	const firstPage = await getCollectionDetailPage(
		id,
		session.user.id,
		(requestedPage - 1) * COLLECTIONS_PER_PAGE,
		COLLECTIONS_PER_PAGE,
	);

	if (!firstPage) {
		notFound();
	}

	const pageCount = getPageCount(firstPage.total, COLLECTIONS_PER_PAGE);
	const page = clampPage(requestedPage, pageCount);

	const collection =
		page === requestedPage
			? firstPage
			: (await getCollectionDetailPage(
					id,
					session.user.id,
					(page - 1) * COLLECTIONS_PER_PAGE,
					COLLECTIONS_PER_PAGE,
				))!;

	return (
		<div className="space-y-6">
			<div className="flex items-start gap-3">
				<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
					<FolderOpen className="h-5 w-5" />
				</div>
				<div className="min-w-0 flex-1">
					<h1 className="truncate text-2xl font-bold">{collection.name}</h1>
					<p className="text-sm text-muted-foreground">
						{collection.total}{' '}
						{collection.total === 1 ? 'item' : 'items'}
					</p>
					{collection.description && (
						<p className="mt-1 text-sm text-muted-foreground/80">
							{collection.description}
						</p>
					)}
				</div>
				<CollectionDetailActions
					collection={{
						id: collection.id,
						name: collection.name,
						description: collection.description,
						isFavorite: collection.isFavorite,
					}}
				/>
			</div>

			{collection.items.length === 0 ? (
				<div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
					<p className="text-sm text-muted-foreground">
						This collection is empty.
					</p>
				</div>
			) : (
				<>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						{collection.items.map((item) => (
							<ItemCard key={item.id} item={item} />
						))}
					</div>
					<Pagination
						page={page}
						pageCount={pageCount}
						basePath={`/collections/${id}`}
					/>
				</>
			)}
		</div>
	);
}
