import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { CollectionsSection } from '@/components/dashboard/CollectionsSection';
import { PinnedItems } from '@/components/dashboard/PinnedItems';
import { RecentItems } from '@/components/dashboard/RecentItems';
import { getCollectionsForDashboard } from '@/lib/db/collections';
import { getPinnedItems, getRecentItems, getDashboardStats } from '@/lib/db/items';

export default async function DashboardPage() {
	const session = await auth();

	if (!session?.user) {
		redirect('/sign-in');
	}

	const userId = session.user.id;

	const [collections, pinnedItems, recentItems, stats] = await Promise.all([
		getCollectionsForDashboard(userId),
		getPinnedItems(userId),
		getRecentItems(userId),
		getDashboardStats(userId),
	]);

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
