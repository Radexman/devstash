import Link from 'next/link';
import { Star } from 'lucide-react';
import { NewItemDialog } from '@/components/items/NewItemDialog';
import { NewCollectionDialog } from '@/components/collections/NewCollectionDialog';
import { SearchTrigger } from '@/components/search/SearchTrigger';
import { Button } from '@/components/ui/button';

export function TopBar() {
	return (
		<header className="flex items-center justify-between border-b border-border px-6 py-3">
			<div className="flex items-center gap-2 text-lg font-semibold">
				<div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
					D
				</div>
				<span>DevStash</span>
			</div>

			<div className="w-full max-w-md px-4">
				<SearchTrigger />
			</div>

			<div className="flex items-center gap-2">
				<Button
					variant="ghost"
					size="icon"
					aria-label="Favorites"
					nativeButton={false}
					render={<Link href="/favorites" />}
				>
					<Star className="h-4 w-4" />
				</Button>
				<NewCollectionDialog />
				<NewItemDialog />
			</div>
		</header>
	);
}