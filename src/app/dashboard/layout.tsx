import { TopBar } from '@/components/dashboard/TopBar';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { getSystemItemTypes } from '@/lib/db/items';
import { getSidebarCollections } from '@/lib/db/collections';
import { prisma } from '@/lib/prisma';

async function getDemoUserId(): Promise<string | null> {
	const user = await prisma.user.findUnique({
		where: { email: 'demo@devstash.io' },
		select: { id: true },
	});
	return user?.id ?? null;
}

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const userId = await getDemoUserId();

	const [itemTypes, sidebarCollections] = userId
		? await Promise.all([
				getSystemItemTypes(),
				getSidebarCollections(userId),
			])
		: [[], { favorites: [], recents: [] }];

	return (
		<div className="flex min-h-screen flex-col">
			<TopBar />
			<div className="flex flex-1 overflow-hidden">
				<Sidebar
					itemTypes={itemTypes}
					favoriteCollections={sidebarCollections.favorites}
					recentCollections={sidebarCollections.recents}
				/>
				<main className="flex-1 overflow-y-auto p-6">
					{children}
				</main>
			</div>
		</div>
	);
}
