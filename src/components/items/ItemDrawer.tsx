'use client';

import { useEffect, useState } from 'react';
import { Copy, Pencil, Pin, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { iconMap } from '@/lib/item-icons';
import { formatDate } from '@/lib/format';
import type { ItemDetail } from '@/lib/db/items';

interface ItemDrawerProps {
	itemId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ItemDrawer({ itemId, open, onOpenChange }: ItemDrawerProps) {
	const [item, setItem] = useState<ItemDetail | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!itemId) {
			setItem(null);
			setError(null);
			return;
		}

		let cancelled = false;
		setLoading(true);
		setError(null);

		fetch(`/api/items/${itemId}`)
			.then(async (res) => {
				if (!res.ok) throw new Error('Failed to load item');
				const data = (await res.json()) as { item: ItemDetail };
				if (cancelled) return;
				const parsed: ItemDetail = {
					...data.item,
					createdAt: new Date(data.item.createdAt),
					updatedAt: new Date(data.item.updatedAt),
				};
				setItem(parsed);
			})
			.catch((err: Error) => {
				if (!cancelled) setError(err.message);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [itemId]);

	const handleCopy = async () => {
		if (!item) return;
		const text = item.content ?? item.url ?? '';
		if (!text) {
			toast.error('Nothing to copy');
			return;
		}
		try {
			await navigator.clipboard.writeText(text);
			toast.success('Copied to clipboard');
		} catch {
			toast.error('Failed to copy');
		}
	};

	const Icon = item ? iconMap[item.itemType.icon] : null;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
				{loading && !item && <DrawerSkeleton />}
				{error && (
					<div className="p-6">
						<p className="text-sm text-destructive">{error}</p>
					</div>
				)}
				{item && (
					<>
						<SheetHeader className="pr-12">
							<div className="flex items-start gap-3">
								{Icon && (
									<div
										className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
										style={{
											backgroundColor: `${item.itemType.color}20`,
											color: item.itemType.color,
										}}
									>
										<Icon className="h-5 w-5" />
									</div>
								)}
								<div className="min-w-0 flex-1">
									<SheetTitle className="truncate">{item.title}</SheetTitle>
									{item.description && (
										<SheetDescription className="line-clamp-2">
											{item.description}
										</SheetDescription>
									)}
								</div>
							</div>
						</SheetHeader>

						<div className="flex items-center gap-1 px-4">
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label="Toggle favorite"
								disabled
							>
								<Star
									className={
										item.isFavorite
											? 'h-4 w-4 fill-yellow-500 text-yellow-500'
											: 'h-4 w-4'
									}
								/>
							</Button>
							<Button variant="ghost" size="icon-sm" aria-label="Toggle pin" disabled>
								<Pin
									className={
										item.isPinned ? 'h-4 w-4 fill-current' : 'h-4 w-4'
									}
								/>
							</Button>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label="Copy"
								onClick={handleCopy}
							>
								<Copy className="h-4 w-4" />
							</Button>
							<Button variant="ghost" size="icon-sm" aria-label="Edit" disabled>
								<Pencil className="h-4 w-4" />
							</Button>
							<div className="ml-auto">
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label="Delete"
									disabled
								>
									<Trash2 className="h-4 w-4 text-destructive" />
								</Button>
							</div>
						</div>

						<Separator />

						<div className="space-y-5 px-4 pb-6">
							<div className="flex flex-wrap items-center gap-2">
								<Badge
									variant="outline"
									style={{
										borderColor: item.itemType.color,
										color: item.itemType.color,
									}}
								>
									{item.itemType.name}
								</Badge>
								{item.language && (
									<Badge variant="secondary">{item.language}</Badge>
								)}
							</div>

							{item.tags.length > 0 && (
								<div>
									<h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
										Tags
									</h3>
									<div className="flex flex-wrap gap-1">
										{item.tags.map((tag) => (
											<Badge key={tag.id} variant="secondary">
												{tag.name}
											</Badge>
										))}
									</div>
								</div>
							)}

							{item.collections.length > 0 && (
								<div>
									<h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
										Collections
									</h3>
									<div className="flex flex-wrap gap-1">
										{item.collections.map((c) => (
											<Badge key={c.id} variant="outline">
												{c.name}
											</Badge>
										))}
									</div>
								</div>
							)}

							{item.url && (
								<div>
									<h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
										URL
									</h3>
									<a
										href={item.url}
										target="_blank"
										rel="noreferrer"
										className="break-all text-sm text-primary hover:underline"
									>
										{item.url}
									</a>
								</div>
							)}

							{item.fileName && (
								<div>
									<h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
										File
									</h3>
									<p className="text-sm">{item.fileName}</p>
									{item.fileSize !== null && (
										<p className="text-xs text-muted-foreground">
											{formatBytes(item.fileSize)}
										</p>
									)}
								</div>
							)}

							{item.content && (
								<div>
									<h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
										Content
									</h3>
									<pre className="max-h-96 overflow-auto rounded-md border border-border bg-muted/50 p-3 text-xs">
										<code>{item.content}</code>
									</pre>
								</div>
							)}

							<Separator />

							<div className="space-y-1 text-xs text-muted-foreground">
								<p>Created {formatDate(item.createdAt)}</p>
								<p>Updated {formatDate(item.updatedAt)}</p>
							</div>
						</div>
					</>
				)}
			</SheetContent>
		</Sheet>
	);
}

function DrawerSkeleton() {
	return (
		<div className="space-y-4 p-4">
			<div className="flex items-start gap-3">
				<div className="h-10 w-10 shrink-0 animate-pulse rounded-md bg-muted" />
				<div className="flex-1 space-y-2">
					<div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
					<div className="h-3 w-full animate-pulse rounded bg-muted" />
				</div>
			</div>
			<div className="h-8 w-full animate-pulse rounded bg-muted" />
			<div className="h-32 w-full animate-pulse rounded bg-muted" />
		</div>
	);
}

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
