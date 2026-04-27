'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MoreHorizontal, Plus, Star } from 'lucide-react';
import { Logo } from '@/components/home/Logo';
import { NewItemDialog } from '@/components/items/NewItemDialog';
import { NewCollectionDialog } from '@/components/collections/NewCollectionDialog';
import { SearchTrigger } from '@/components/search/SearchTrigger';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function TopBar() {
	const [newItemOpen, setNewItemOpen] = useState(false);
	const [newCollectionOpen, setNewCollectionOpen] = useState(false);

	return (
		<header className='flex items-center justify-between gap-2 border-b border-border px-3 py-3 sm:gap-4 sm:px-6'>
			<Logo
				href='/dashboard'
				className='shrink-0 text-lg'
				labelClassName='hidden sm:inline'
			/>

			<div className='min-w-0 flex-1 sm:max-w-md sm:px-4'>
				<SearchTrigger />
			</div>

			<div className='hidden items-center gap-2 md:flex'>
				<Button
					variant='ghost'
					size='icon'
					aria-label='Favorites'
					nativeButton={false}
					render={<Link href='/favorites' />}
				>
					<Star className='h-4 w-4' />
				</Button>
				<Button
					variant='outline'
					onClick={() => setNewCollectionOpen(true)}
				>
					<Plus className='mr-1 h-4 w-4' />
					New Collection
				</Button>
				<Button onClick={() => setNewItemOpen(true)}>
					<Plus className='mr-1 h-4 w-4' />
					New Item
				</Button>
			</div>

			<div className='md:hidden'>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<button
								type='button'
								aria-label='More actions'
								className='inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
							/>
						}
					>
						<MoreHorizontal className='h-4 w-4' />
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align='end'
						className='w-44'
					>
						<DropdownMenuItem onClick={() => setNewItemOpen(true)}>
							<Plus className='mr-2 h-4 w-4' />
							New item
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => setNewCollectionOpen(true)}>
							<Plus className='mr-2 h-4 w-4' />
							New collection
						</DropdownMenuItem>
						<DropdownMenuItem render={<Link href='/favorites' />}>
							<Star className='mr-2 h-4 w-4' />
							Favorites
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<NewItemDialog
				open={newItemOpen}
				onOpenChange={setNewItemOpen}
			/>
			<NewCollectionDialog
				open={newCollectionOpen}
				onOpenChange={setNewCollectionOpen}
			/>
		</header>
	);
}
