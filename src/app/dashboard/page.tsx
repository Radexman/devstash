import { StatsCards } from '@/components/dashboard/StatsCards';
import { CollectionsSection } from '@/components/dashboard/CollectionsSection';
import { PinnedItems } from '@/components/dashboard/PinnedItems';
import { RecentItems } from '@/components/dashboard/RecentItems';
import { getCollectionsForDashboard } from '@/lib/db/collections';
import { getPinnedItems, getRecentItems, getDashboardStats } from '@/lib/db/items';
import { prisma } from '@/lib/prisma';

async function getDemoUserId(): Promise<string | null> {
	const user = await prisma.user.findUnique({
		where: { email: 'demo@devstash.io' },
		select: { id: true },
	});
	return user?.id ?? null;
}

export default async function DashboardPage() {
	const userId = await getDemoUserId();

	const [collections, pinnedItems, recentItems, stats] = userId
		? await Promise.all([
				getCollectionsForDashboard(userId),
				getPinnedItems(userId),
				getRecentItems(userId),
				getDashboardStats(userId),
			])
		: [[], [], [], { totalItems: 0, totalCollections: 0, favoriteItems: 0, favoriteCollections: 0 }];

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-bold">Dashboard</h1>
				<p className="text-muted-foreground">Your developer knowledge hub</p>
			</div>

			<StatsCards stats={stats} />
			<CollectionsSection collections={collections} />
			<PinnedItems items={pinnedItems} />
			<RecentItems items={recentItems} />
		</div>
	);
}
