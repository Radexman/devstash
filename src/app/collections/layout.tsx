import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { TopBar } from '@/components/dashboard/TopBar';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { ItemDrawerProvider } from '@/components/items/ItemDrawerProvider';
import { CommandPaletteProvider } from '@/components/search/CommandPaletteProvider';
import { EditorPreferencesLoader } from '@/components/providers/EditorPreferencesLoader';
import { getSystemItemTypes } from '@/lib/db/items';
import { getSidebarCollections } from '@/lib/db/collections';

export default async function CollectionsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();

	if (!session?.user) {
		redirect('/sign-in');
	}

	const userId = session.user.id;

	const [itemTypes, sidebarCollections] = await Promise.all([
		getSystemItemTypes(),
		getSidebarCollections(userId),
	]);

	return (
		<EditorPreferencesLoader>
			<ItemDrawerProvider>
				<CommandPaletteProvider>
					<div className="flex min-h-screen flex-col">
						<TopBar />
						<div className="flex flex-1 overflow-hidden">
							<Sidebar
								itemTypes={itemTypes}
								favoriteCollections={sidebarCollections.favorites}
								recentCollections={sidebarCollections.recents}
								user={session.user}
							/>
							<main className="flex-1 overflow-y-auto p-6">{children}</main>
						</div>
					</div>
				</CommandPaletteProvider>
			</ItemDrawerProvider>
		</EditorPreferencesLoader>
	);
}
