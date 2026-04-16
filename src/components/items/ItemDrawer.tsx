'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Pencil, Pin, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { iconMap } from '@/lib/item-icons';
import { formatDate } from '@/lib/format';
import { deleteItem, updateItem } from '@/actions/items';
import { CodeEditor } from '@/components/items/CodeEditor';
import type { ItemDetail } from '@/lib/db/items';

const TEXT_TYPES = new Set(['snippet', 'prompt', 'command', 'note']);
const LANGUAGE_TYPES = new Set(['snippet', 'command']);

interface EditForm {
	title: string;
	description: string;
	content: string;
	url: string;
	language: string;
	tags: string;
}

function toEditForm(item: ItemDetail): EditForm {
	return {
		title: item.title,
		description: item.description ?? '',
		content: item.content ?? '',
		url: item.url ?? '',
		language: item.language ?? '',
		tags: item.tags.map((t) => t.name).join(', '),
	};
}

interface ItemDrawerProps {
	itemId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ItemDrawer({ itemId, open, onOpenChange }: ItemDrawerProps) {
	const router = useRouter();
	const [item, setItem] = useState<ItemDetail | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [form, setForm] = useState<EditForm | null>(null);
	const [saving, setSaving] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		if (!itemId) {
			setItem(null);
			setError(null);
			setIsEditing(false);
			setForm(null);
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

	const handleStartEdit = () => {
		if (!item) return;
		setForm(toEditForm(item));
		setIsEditing(true);
	};

	const handleCancelEdit = () => {
		setIsEditing(false);
		setForm(null);
	};

	const handleSave = async () => {
		if (!item || !form) return;
		const typeName = item.itemType.name.toLowerCase();
		const supportsContent = TEXT_TYPES.has(typeName);
		const supportsLanguage = LANGUAGE_TYPES.has(typeName);
		const supportsUrl = typeName === 'link';

		setSaving(true);
		const result = await updateItem(item.id, {
			title: form.title,
			description: form.description,
			content: supportsContent ? form.content : null,
			url: supportsUrl ? form.url : null,
			language: supportsLanguage ? form.language : null,
			tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
		});
		setSaving(false);

		if (!result.success) {
			toast.error(result.error);
			return;
		}

		const updated = result.data;
		setItem({
			...updated,
			createdAt: new Date(updated.createdAt),
			updatedAt: new Date(updated.updatedAt),
		});
		setIsEditing(false);
		setForm(null);
		toast.success('Item updated');
		router.refresh();
	};

	const handleDelete = async () => {
		if (!item) return;
		setDeleting(true);
		const result = await deleteItem(item.id);
		setDeleting(false);
		if (!result.success) {
			toast.error(result.error);
			return;
		}
		setDeleteOpen(false);
		onOpenChange(false);
		toast.success('Item deleted');
		router.refresh();
	};

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
	const typeName = item ? item.itemType.name.toLowerCase() : '';

	return (
		<>
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

						{isEditing && form ? (
							<div className="flex items-center justify-end gap-2 px-4">
								<Button
									variant="ghost"
									size="sm"
									onClick={handleCancelEdit}
									disabled={saving}
								>
									Cancel
								</Button>
								<Button
									size="sm"
									onClick={handleSave}
									disabled={saving || form.title.trim().length === 0}
								>
									{saving ? 'Saving…' : 'Save'}
								</Button>
							</div>
						) : (
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
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label="Edit"
									onClick={handleStartEdit}
								>
									<Pencil className="h-4 w-4" />
								</Button>
								<div className="ml-auto">
									<Button
										variant="ghost"
										size="icon-sm"
										aria-label="Delete"
										onClick={() => setDeleteOpen(true)}
									>
										<Trash2 className="h-4 w-4 text-destructive" />
									</Button>
								</div>
							</div>
						)}

						<Separator />

						{isEditing && form ? (
							<EditFormFields
								item={item}
								form={form}
								onChange={setForm}
							/>
						) : (
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
									{LANGUAGE_TYPES.has(typeName) ? (
										<CodeEditor
											value={item.content}
											language={item.language ?? 'plaintext'}
											readOnly
										/>
									) : (
										<pre className="max-h-96 overflow-auto rounded-md border border-border bg-muted/50 p-3 text-xs">
											<code>{item.content}</code>
										</pre>
									)}
								</div>
							)}

							<Separator />

							<div className="space-y-1 text-xs text-muted-foreground">
								<p>Created {formatDate(item.createdAt)}</p>
								<p>Updated {formatDate(item.updatedAt)}</p>
							</div>
						</div>
						)}
					</>
				)}
			</SheetContent>
		</Sheet>
		<Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete item?</DialogTitle>
					<DialogDescription>
						This action cannot be undone. This item will be permanently
						removed from your stash.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						variant="ghost"
						onClick={() => setDeleteOpen(false)}
						disabled={deleting}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={deleting}
					>
						{deleting ? 'Deleting…' : 'Delete'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
		</>
	);
}

interface EditFormFieldsProps {
	item: ItemDetail;
	form: EditForm;
	onChange: (form: EditForm) => void;
}

function EditFormFields({ item, form, onChange }: EditFormFieldsProps) {
	const typeName = item.itemType.name.toLowerCase();
	const showContent = TEXT_TYPES.has(typeName);
	const showLanguage = LANGUAGE_TYPES.has(typeName);
	const showUrl = typeName === 'link';
	const set = <K extends keyof EditForm>(key: K, value: EditForm[K]) =>
		onChange({ ...form, [key]: value });

	return (
		<div className="space-y-4 px-4 pb-6">
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
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="item-title">Title</Label>
				<Input
					id="item-title"
					value={form.title}
					onChange={(e) => set('title', e.target.value)}
					required
				/>
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="item-description">Description</Label>
				<Textarea
					id="item-description"
					value={form.description}
					onChange={(e) => set('description', e.target.value)}
					rows={2}
				/>
			</div>

			{showContent && (
				<div className="space-y-1.5">
					<Label htmlFor="item-content">Content</Label>
					{showLanguage ? (
						<CodeEditor
							value={form.content}
							language={form.language || 'plaintext'}
							onChange={(v) => set('content', v)}
						/>
					) : (
						<Textarea
							id="item-content"
							value={form.content}
							onChange={(e) => set('content', e.target.value)}
							rows={8}
							className="font-mono text-xs"
						/>
					)}
				</div>
			)}

			{showLanguage && (
				<div className="space-y-1.5">
					<Label htmlFor="item-language">Language</Label>
					<Input
						id="item-language"
						value={form.language}
						onChange={(e) => set('language', e.target.value)}
					/>
				</div>
			)}

			{showUrl && (
				<div className="space-y-1.5">
					<Label htmlFor="item-url">URL</Label>
					<Input
						id="item-url"
						value={form.url}
						onChange={(e) => set('url', e.target.value)}
					/>
				</div>
			)}

			<div className="space-y-1.5">
				<Label htmlFor="item-tags">Tags</Label>
				<Input
					id="item-tags"
					value={form.tags}
					onChange={(e) => set('tags', e.target.value)}
					placeholder="comma, separated, tags"
				/>
			</div>

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

			<Separator />

			<div className="space-y-1 text-xs text-muted-foreground">
				<p>Created {formatDate(item.createdAt)}</p>
				<p>Updated {formatDate(item.updatedAt)}</p>
			</div>
		</div>
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
