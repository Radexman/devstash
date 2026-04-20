'use client';

import { useSyncExternalStore } from 'react';
import { Search } from 'lucide-react';
import { useCommandPalette } from './CommandPaletteProvider';

const subscribe = () => () => {};
const getSnapshot = () => /Mac|iPhone|iPad/.test(navigator.platform);
const getServerSnapshot = () => false;

export function SearchTrigger() {
	const { openPalette } = useCommandPalette();
	const isMac = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

	return (
		<button
			type="button"
			onClick={openPalette}
			aria-label="Open search"
			className="group relative flex h-9 w-full items-center rounded-md border border-input bg-background px-3 text-sm text-muted-foreground transition-colors hover:border-ring/40 hover:text-foreground"
		>
			<Search className="mr-2 h-4 w-4" />
			<span className="flex-1 text-left">Search items and collections…</span>
			<kbd className="pointer-events-none ml-2 hidden select-none items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
				<span className="text-xs">{isMac ? '⌘' : 'Ctrl'}</span>K
			</kbd>
		</button>
	);
}
