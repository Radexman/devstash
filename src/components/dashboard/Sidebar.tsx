'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
	Star,
	FolderOpen,
	ChevronLeft,
	ChevronRight,
	LogOut,
	PanelLeft,
	Settings,
	User as UserIcon,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { iconMap } from '@/lib/item-icons';
import type { SidebarItemType } from '@/lib/db/items';
import type { SidebarCollection } from '@/lib/db/collections';

interface UserInfo {
	name?: string | null;
	email?: string | null;
	image?: string | null;
}

interface SidebarProps {
	itemTypes: SidebarItemType[];
	favoriteCollections: SidebarCollection[];
	recentCollections: SidebarCollection[];
	user?: UserInfo | null;
}

function SidebarContent({
	collapsed,
	itemTypes,
	favoriteCollections,
	recentCollections,
	user,
}: {
	collapsed: boolean;
} & SidebarProps) {
	return (
		<div className="flex h-full flex-col">
			{/* Types section */}
			<div className="flex-1 overflow-y-auto px-3 py-4">
				<div className="mb-4">
					{!collapsed && (
						<h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Types
						</h3>
					)}
					<nav className="space-y-0.5">
						{itemTypes.map((type) => {
							const Icon = iconMap[type.icon];
							const href = `/items/${type.name.toLowerCase()}`;
							return collapsed ? (
								<Tooltip key={type.id}>
									<TooltipTrigger
										render={
											<Link
												href={href}
												className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground mx-auto"
											/>
										}
									>
										{Icon && <Icon className="h-4 w-4" style={{ color: type.color }} />}
									</TooltipTrigger>
									<TooltipContent side="right">
										{type.name} ({type.count})
									</TooltipContent>
								</Tooltip>
							) : (
								<Link
									key={type.id}
									href={href}
									className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
								>
									{Icon && <Icon className="h-4 w-4 shrink-0" style={{ color: type.color }} />}
									<span className="flex-1">{type.name}</span>
									<span className="text-xs text-muted-foreground/60">{type.count}</span>
								</Link>
							);
						})}
					</nav>
				</div>

				<Separator className="my-3" />

				{/* Collections section */}
				<div className="mb-4">
					{!collapsed && (
						<h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Collections
						</h3>
					)}

					{/* Favorites */}
					{!collapsed && favoriteCollections.length > 0 && (
						<p className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">
							Favorites
						</p>
					)}
					<nav className="space-y-0.5">
						{favoriteCollections.map((col) =>
							collapsed ? (
								<Tooltip key={col.id}>
									<TooltipTrigger
										className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground mx-auto"
									>
										<Star className="h-4 w-4 text-yellow-500" />
									</TooltipTrigger>
									<TooltipContent side="right">
										{col.name}
									</TooltipContent>
								</Tooltip>
							) : (
								<Link
									key={col.id}
									href="#"
									className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
								>
									<Star className="h-4 w-4 shrink-0 text-yellow-500" />
									<span className="flex-1 truncate">{col.name}</span>
								</Link>
							),
						)}
					</nav>

					{/* Recent Collections */}
					{!collapsed && recentCollections.length > 0 && (
						<p className="mb-1 mt-3 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">
							Recent
						</p>
					)}
					<nav className="space-y-0.5">
						{recentCollections.map((col) =>
							collapsed ? (
								<Tooltip key={col.id}>
									<TooltipTrigger
										className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground mx-auto"
									>
										<span
											className="h-3 w-3 rounded-full"
											style={{ backgroundColor: col.dominantColor ?? '#6b7280' }}
										/>
									</TooltipTrigger>
									<TooltipContent side="right">
										{col.name}
									</TooltipContent>
								</Tooltip>
							) : (
								<Link
									key={col.id}
									href="#"
									className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
								>
									<span
										className="h-3 w-3 shrink-0 rounded-full"
										style={{ backgroundColor: col.dominantColor ?? '#6b7280' }}
									/>
									<span className="flex-1 truncate">{col.name}</span>
									<span className="text-xs text-muted-foreground/60">{col.itemCount}</span>
								</Link>
							),
						)}
					</nav>

					{/* View all collections link */}
					{!collapsed && (
						<Link
							href="/collections"
							className="mt-2 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground/70 transition-colors hover:text-foreground"
						>
							<FolderOpen className="h-3.5 w-3.5" />
							View all collections
						</Link>
					)}
				</div>
			</div>

			{/* User area */}
			<div className="border-t border-border p-3">
				{collapsed ? (
					<DropdownMenu>
						<DropdownMenuTrigger className="flex items-center justify-center w-full">
							<UserAvatar name={user?.name} image={user?.image} className="h-8 w-8" />
						</DropdownMenuTrigger>
						<DropdownMenuContent side="right" align="end">
							<DropdownMenuItem
								render={<Link href="/profile" />}
							>
								<UserIcon className="mr-2 h-4 w-4" />
								Profile
							</DropdownMenuItem>
							<DropdownMenuItem
								render={<Link href="/settings" />}
							>
								<Settings className="mr-2 h-4 w-4" />
								Settings
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => signOut({ callbackUrl: '/sign-in' })}>
								<LogOut className="mr-2 h-4 w-4" />
								Sign out
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				) : (
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<button className="flex items-center gap-3 w-full min-w-0 rounded-md p-1 -m-1 hover:bg-accent transition-colors" />
							}
						>
							<UserAvatar name={user?.name} image={user?.image} className="h-8 w-8 shrink-0" />
							<div className="flex-1 min-w-0 text-left">
								<p className="truncate text-sm font-medium">{user?.name ?? 'User'}</p>
								<p className="truncate text-xs text-muted-foreground">{user?.email}</p>
							</div>
						</DropdownMenuTrigger>
						<DropdownMenuContent side="top" align="start" className="w-48">
							<DropdownMenuItem
								render={<Link href="/profile" />}
							>
								<UserIcon className="mr-2 h-4 w-4" />
								Profile
							</DropdownMenuItem>
							<DropdownMenuItem
								render={<Link href="/settings" />}
							>
								<Settings className="mr-2 h-4 w-4" />
								Settings
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => signOut({ callbackUrl: '/sign-in' })}>
								<LogOut className="mr-2 h-4 w-4" />
								Sign out
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>
		</div>
	);
}

export function Sidebar({ itemTypes, favoriteCollections, recentCollections, user }: SidebarProps) {
	const [collapsed, setCollapsed] = useState(false);

	return (
		<TooltipProvider delay={0}>
			{/* Desktop sidebar */}
			<aside
				className={`hidden md:flex flex-col border-r border-border bg-sidebar transition-all duration-300 ${
					collapsed ? 'w-16' : 'w-60'
				}`}
			>
				{/* Collapse toggle */}
				<div className={`flex items-center p-3 ${collapsed ? 'justify-center' : 'justify-end'}`}>
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						onClick={() => setCollapsed(!collapsed)}
					>
						{collapsed ? (
							<ChevronRight className="h-4 w-4" />
						) : (
							<ChevronLeft className="h-4 w-4" />
						)}
					</Button>
				</div>
				<SidebarContent
					collapsed={collapsed}
					itemTypes={itemTypes}
					favoriteCollections={favoriteCollections}
					recentCollections={recentCollections}
					user={user}
				/>
			</aside>

			{/* Mobile drawer */}
			<Sheet>
				<SheetTrigger
					render={
						<Button
							variant="ghost"
							size="icon"
							className="fixed left-3 top-3 z-40 md:hidden h-9 w-9"
						/>
					}
				>
					<PanelLeft className="h-5 w-5" />
				</SheetTrigger>
				<SheetContent side="left" className="w-60 p-0">
					<SheetTitle className="sr-only">Navigation</SheetTitle>
					<SidebarContent
						collapsed={false}
						itemTypes={itemTypes}
						favoriteCollections={favoriteCollections}
						recentCollections={recentCollections}
						user={user}
					/>
				</SheetContent>
			</Sheet>
		</TooltipProvider>
	);
}
