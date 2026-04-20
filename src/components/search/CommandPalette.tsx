'use client';

import { useRouter } from 'next/navigation';
import { FolderOpen } from 'lucide-react';
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command';
import { useItemDrawer } from '@/components/items/ItemDrawerProvider';
import { iconMap } from '@/lib/item-icons';
import type { SearchData } from '@/lib/db/search';

interface CommandPaletteProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	data: SearchData | null;
	loading: boolean;
}

export function CommandPalette({ open, onOpenChange, data, loading }: CommandPaletteProps) {
	const router = useRouter();
	const { openItem } = useItemDrawer();

	const handleSelectItem = (id: string) => {
		onOpenChange(false);
		openItem(id);
	};

	const handleSelectCollection = (id: string) => {
		onOpenChange(false);
		router.push(`/collections/${id}`);
	};

	const items = data?.items ?? [];
	const collections = data?.collections ?? [];

	return (
		<CommandDialog
			open={open}
			onOpenChange={onOpenChange}
			title="Search"
			description="Search items and collections"
		>
			<CommandInput placeholder="Search items and collections…" />
			<CommandList>
				{loading && !data ? (
					<div className="py-6 text-center text-sm text-muted-foreground">
						Loading…
					</div>
				) : (
					<CommandEmpty>No results found.</CommandEmpty>
				)}

				{items.length > 0 && (
					<CommandGroup heading="Items">
						{items.map((item) => {
							const Icon = iconMap[item.typeIcon];
							return (
								<CommandItem
									key={item.id}
									value={`item-${item.id}`}
									keywords={[
										item.title,
										item.typeName,
										item.contentPreview ?? '',
									]}
									onSelect={() => handleSelectItem(item.id)}
								>
									{Icon && (
										<Icon
											className="h-4 w-4 shrink-0"
											style={{ color: item.typeColor }}
										/>
									)}
									<div className="flex min-w-0 flex-col">
										<span className="truncate">{item.title}</span>
										{item.contentPreview && (
											<span className="truncate text-xs text-muted-foreground">
												{item.contentPreview}
											</span>
										)}
									</div>
									<span className="ml-auto text-xs text-muted-foreground capitalize">
										{item.typeName}
									</span>
								</CommandItem>
							);
						})}
					</CommandGroup>
				)}

				{collections.length > 0 && (
					<CommandGroup heading="Collections">
						{collections.map((collection) => (
							<CommandItem
								key={collection.id}
								value={`collection-${collection.id}`}
								keywords={[collection.name]}
								onSelect={() => handleSelectCollection(collection.id)}
							>
								<FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
								<span className="truncate">{collection.name}</span>
								<span className="ml-auto text-xs text-muted-foreground">
									{collection.itemCount}{' '}
									{collection.itemCount === 1 ? 'item' : 'items'}
								</span>
							</CommandItem>
						))}
					</CommandGroup>
				)}
			</CommandList>
		</CommandDialog>
	);
}
