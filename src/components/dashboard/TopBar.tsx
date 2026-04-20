import { NewItemDialog } from '@/components/items/NewItemDialog';
import { NewCollectionDialog } from '@/components/collections/NewCollectionDialog';
import { SearchTrigger } from '@/components/search/SearchTrigger';

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
				<NewCollectionDialog />
				<NewItemDialog />
			</div>
		</header>
	);
}