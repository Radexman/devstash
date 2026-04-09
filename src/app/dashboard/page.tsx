import { StatsCards } from '@/components/dashboard/StatsCards';
import { CollectionsSection } from '@/components/dashboard/CollectionsSection';
import { PinnedItems } from '@/components/dashboard/PinnedItems';
import { RecentItems } from '@/components/dashboard/RecentItems';

export default function DashboardPage() {
	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-bold">Dashboard</h1>
				<p className="text-muted-foreground">Your developer knowledge hub</p>
			</div>

			<StatsCards />
			<CollectionsSection />
			<PinnedItems />
			<RecentItems />
		</div>
	);
}