'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
	Code,
	Sparkles,
	Terminal,
	StickyNote,
	File,
	Image,
	LinkIcon,
	Star,
	FolderOpen,
	ChevronLeft,
	ChevronRight,
	Settings,
	PanelLeft,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { itemTypes, collections, currentUser } from '@/lib/mock-data';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
	Code,
	Sparkles,
	Terminal,
	StickyNote,
	File,
	Image,
	Link: LinkIcon,
};

function getInitials(name: string): string {
	return name
		.split(' ')
		.map((n) => n[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);
}

const favoriteCollections = collections.filter((c) => c.isFavorite);
const recentCollections = collections
	.filter((c) => !c.isFavorite)
	.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

function SidebarContent({ collapsed }: { collapsed: boolean }) {
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
					{!collapsed && (
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

					{/* All Collections */}
					{!collapsed && (
						<p className="mb-1 mt-3 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">
							All Collections
						</p>
					)}
					<nav className="space-y-0.5">
						{recentCollections.map((col) =>
							collapsed ? (
								<Tooltip key={col.id}>
									<TooltipTrigger
										className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground mx-auto"
									>
										<FolderOpen className="h-4 w-4" />
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
									<FolderOpen className="h-4 w-4 shrink-0" />
									<span className="flex-1 truncate">{col.name}</span>
									<span className="text-xs text-muted-foreground/60">{col.itemCount}</span>
								</Link>
							),
						)}
					</nav>
				</div>
			</div>

			{/* User area */}
			<div className="border-t border-border p-3">
				{collapsed ? (
					<Tooltip>
						<TooltipTrigger className="flex items-center justify-center w-full">
							<Avatar className="h-8 w-8">
								<AvatarFallback className="bg-primary text-primary-foreground text-xs">
									{getInitials(currentUser.name)}
								</AvatarFallback>
							</Avatar>
						</TooltipTrigger>
						<TooltipContent side="right">
							<p>{currentUser.name}</p>
							<p className="text-xs text-muted-foreground">{currentUser.email}</p>
						</TooltipContent>
					</Tooltip>
				) : (
					<div className="flex items-center gap-3">
						<Avatar className="h-8 w-8">
							<AvatarFallback className="bg-primary text-primary-foreground text-xs">
								{getInitials(currentUser.name)}
							</AvatarFallback>
						</Avatar>
						<div className="flex-1 min-w-0">
							<p className="truncate text-sm font-medium">{currentUser.name}</p>
							<p className="truncate text-xs text-muted-foreground">{currentUser.email}</p>
						</div>
						<Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
							<Settings className="h-4 w-4" />
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}

export function Sidebar() {
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
				<SidebarContent collapsed={collapsed} />
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
					<SidebarContent collapsed={false} />
				</SheetContent>
			</Sheet>
		</TooltipProvider>
	);
}