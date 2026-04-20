'use client';

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from 'react';
import { CommandPalette } from './CommandPalette';
import type { SearchData } from '@/lib/db/search';

interface CommandPaletteContextValue {
	openPalette: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function useCommandPalette() {
	const ctx = useContext(CommandPaletteContext);
	if (!ctx) {
		throw new Error('useCommandPalette must be used within CommandPaletteProvider');
	}
	return ctx;
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
	const [open, setOpen] = useState(false);
	const [data, setData] = useState<SearchData | null>(null);
	const [loading, setLoading] = useState(false);

	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch('/api/search');
			if (!res.ok) throw new Error('Failed to load search data');
			const json = (await res.json()) as SearchData;
			setData(json);
		} catch {
			// keep whatever data we had
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
				e.preventDefault();
				setOpen((prev) => !prev);
			}
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, []);

	const openPalette = useCallback(() => {
		setOpen(true);
		fetchData();
	}, [fetchData]);

	const handleOpenChange = useCallback(
		(next: boolean) => {
			setOpen(next);
			if (next) fetchData();
		},
		[fetchData],
	);

	return (
		<CommandPaletteContext.Provider value={{ openPalette }}>
			{children}
			<CommandPalette
				open={open}
				onOpenChange={handleOpenChange}
				data={data}
				loading={loading}
			/>
		</CommandPaletteContext.Provider>
	);
}
