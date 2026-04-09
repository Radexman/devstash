import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function TopBar() {
	return (
		<header className="flex items-center justify-between border-b border-border px-6 py-3">
			<div className="flex items-center gap-2 text-lg font-semibold">
				<div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
					D
				</div>
				<span>DevStash</span>
			</div>

			<div className="relative w-full max-w-md">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					placeholder="Search items..."
					className="pl-9"
				/>
			</div>

			<div className="flex items-center gap-2">
				<Button variant="outline">
					<Plus className="mr-1 h-4 w-4" />
					New Collection
				</Button>
				<Button>
					<Plus className="mr-1 h-4 w-4" />
					New Item
				</Button>
			</div>
		</header>
	);
}