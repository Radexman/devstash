'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { ItemDrawer } from './ItemDrawer';

interface ItemDrawerContextValue {
	openItem: (id: string) => void;
	closeItem: () => void;
}

const ItemDrawerContext = createContext<ItemDrawerContextValue | null>(null);

export function useItemDrawer() {
	const ctx = useContext(ItemDrawerContext);
	if (!ctx) {
		throw new Error('useItemDrawer must be used within ItemDrawerProvider');
	}
	return ctx;
}

export function ItemDrawerProvider({ children }: { children: ReactNode }) {
	const [openItemId, setOpenItemId] = useState<string | null>(null);

	const openItem = useCallback((id: string) => setOpenItemId(id), []);
	const closeItem = useCallback(() => setOpenItemId(null), []);

	return (
		<ItemDrawerContext.Provider value={{ openItem, closeItem }}>
			{children}
			<ItemDrawer
				itemId={openItemId}
				open={openItemId !== null}
				onOpenChange={(open) => {
					if (!open) setOpenItemId(null);
				}}
			/>
		</ItemDrawerContext.Provider>
	);
}
