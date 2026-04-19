import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ItemCard } from '@/components/items/ItemCard';
import { iconMap } from '@/lib/item-icons';
import { getItemsByType } from '@/lib/db/items';

const TYPE_LABELS: Record<string, string> = {
	snippet: 'Snippets',
	prompt: 'Prompts',
	command: 'Commands',
	note: 'Notes',
	link: 'Links',
};

export default async function ItemsByTypePage({
	params,
}: {
	params: Promise<{ type: string }>;
}) {
	const session = await auth();

	if (!session?.user) {
		redirect('/sign-in');
	}

	const { type } = await params;
	const typeSlug = type.toLowerCase();

	const itemType = await prisma.itemType.findFirst({
		where: {
			isSystem: true,
			name: { equals: typeSlug, mode: 'insensitive' },
		},
		select: { name: true, icon: true, color: true },
	});

	if (!itemType) {
		notFound();
	}

	const items = await getItemsByType(session.user.id, itemType.name);
	const Icon = iconMap[itemType.icon];
	const label = TYPE_LABELS[typeSlug] ?? `${itemType.name}s`;

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				{Icon && (
					<div
						className="flex h-10 w-10 items-center justify-center rounded-md"
						style={{
							backgroundColor: `${itemType.color}20`,
							color: itemType.color,
						}}
					>
						<Icon className="h-5 w-5" />
					</div>
				)}
				<div>
					<h1 className="text-2xl font-bold">{label}</h1>
					<p className="text-sm text-muted-foreground">
						{items.length} {items.length === 1 ? 'item' : 'items'}
					</p>
				</div>
			</div>

			{items.length === 0 ? (
				<div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
					<p className="text-sm text-muted-foreground">
						No {label.toLowerCase()} yet.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{items.map((item) => (
						<ItemCard key={item.id} item={item} />
					))}
				</div>
			)}
		</div>
	);
}
