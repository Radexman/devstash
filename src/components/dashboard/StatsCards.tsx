import {
	Code,
	FolderOpen,
	Star,
	Heart,
} from 'lucide-react';
import type { DashboardStats } from '@/lib/db/items';

interface StatCardProps {
	label: string;
	value: number;
	icon: React.ReactNode;
	color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
	return (
		<div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
			<div
				className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
				style={{ backgroundColor: `${color}20`, color }}
			>
				{icon}
			</div>
			<div>
				<p className="text-2xl font-bold">{value}</p>
				<p className="text-sm text-muted-foreground">{label}</p>
			</div>
		</div>
	);
}

interface StatsCardsProps {
	stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
	return (
		<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
			<StatCard
				label="Total Items"
				value={stats.totalItems}
				icon={<Code className="h-5 w-5" />}
				color="#3b82f6"
			/>
			<StatCard
				label="Collections"
				value={stats.totalCollections}
				icon={<FolderOpen className="h-5 w-5" />}
				color="#8b5cf6"
			/>
			<StatCard
				label="Favorite Items"
				value={stats.favoriteItems}
				icon={<Star className="h-5 w-5" />}
				color="#f97316"
			/>
			<StatCard
				label="Favorite Collections"
				value={stats.favoriteCollections}
				icon={<Heart className="h-5 w-5" />}
				color="#ec4899"
			/>
		</div>
	);
}
