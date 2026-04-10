import { StatsCards } from '@/components/dashboard/StatsCards';
import { CollectionsSection } from '@/components/dashboard/CollectionsSection';
import { PinnedItems } from '@/components/dashboard/PinnedItems';
import { RecentItems } from '@/components/dashboard/RecentItems';
import { getCollectionsForDashboard } from '@/lib/db/collections';
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
	const collections = userId ? await getCollectionsForDashboard(userId) : [];

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-bold">Dashboard</h1>
				<p className="text-muted-foreground">Your developer knowledge hub</p>
			</div>

			<StatsCards />
			<CollectionsSection collections={collections} />
			<PinnedItems />
			<RecentItems />
		</div>
	);
}
