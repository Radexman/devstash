'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
	Star,
	FolderOpen,
	ChevronLeft,
	ChevronRight,
	LogOut,
	Settings,
	User as UserIcon,
} from 'lucide-react';
import { useMobileSidebar } from '@/components/dashboard/MobileSidebarContext';
import { Separator } from '@/components/ui/separator';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { ProBadge } from '@/components/shared/ProBadge';
import { iconMap } from '@/lib/item-icons';
import type { SidebarItemType } from '@/lib/db/items';
import type { SidebarCollection } from '@/lib/db/collections';

interface UserInfo {
	name?: string | null;
	email?: string | null;
	image?: string | null;
	isPro?: boolean;
}

interface SidebarProps {
	itemTypes: SidebarItemType[];
	favoriteCollections: SidebarCollection[];
	recentCollections: SidebarCollection[];
	user?: UserInfo | null;
}

interface SidebarNavLinkProps {
	href: string;
	collapsed: boolean;
	active: boolean;
	icon: React.ReactNode;
	label: string;
	tooltipLabel?: string;
	trailing?: React.ReactNode;
}

function SidebarNavLink({
	href,
	collapsed,
	active,
	icon,
	label,
	tooltipLabel,
	trailing,
}: SidebarNavLinkProps) {
	if (collapsed) {
		return (
			<Tooltip>
				<TooltipTrigger
					render={
						<Link
							href={href}
							aria-label={tooltipLabel ?? label}
							aria-current={active ? 'page' : undefined}
							className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors mx-auto ${
								active
									? 'bg-accent text-foreground'
									: 'text-muted-foreground hover:bg-accent hover:text-foreground'
							}`}
						/>
					}
				>
					{icon}
				</TooltipTrigger>
				<TooltipContent side="right">{tooltipLabel ?? label}</TooltipContent>
			</Tooltip>
		);
	}

	return (
		<Link
			href={href}
			aria-current={active ? 'page' : undefined}
			className={`flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors ${
				active
					? 'bg-accent font-medium text-foreground'
					: 'text-muted-foreground hover:bg-accent hover:text-foreground'
			}`}
		>
			{icon}
			<span className="flex-1 truncate">{label}</span>
			{trailing}
		</Link>
	);
}

function SidebarUserMenuItems({ isPro }: { isPro?: boolean }) {
	return (
		<>
			{isPro && (
				<div className="flex items-center justify-between px-2 py-1.5 text-xs text-muted-foreground">
					<span>Plan</span>
					<ProBadge />
				</div>
			)}
			<DropdownMenuItem render={<Link href="/profile" />}>
				<UserIcon className="mr-2 h-4 w-4" />
				Profile
			</DropdownMenuItem>
			<DropdownMenuItem render={<Link href="/settings" />}>
				<Settings className="mr-2 h-4 w-4" />
				Settings
			</DropdownMenuItem>
			<DropdownMenuItem onClick={() => signOut({ callbackUrl: '/sign-in' })}>
				<LogOut className="mr-2 h-4 w-4" />
				Sign out
			</DropdownMenuItem>
		</>
	);
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
	const pathname = usePathname();
	const isActive = (href: string) =>
		pathname === href || pathname.startsWith(`${href}/`);
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
							return (
								<SidebarNavLink
									key={type.id}
									href={href}
									collapsed={collapsed}
									active={isActive(href)}
									label={type.name}
									tooltipLabel={`${type.name} (${type.count})`}
									icon={
										Icon ? (
											<Icon
												className="h-4 w-4 shrink-0"
												style={{ color: type.color }}
											/>
										) : null
									}
									trailing={
										<span className="text-xs text-muted-foreground/60">
											{type.count}
										</span>
									}
								/>
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
						{favoriteCollections.map((col) => {
							const href = `/collections/${col.id}`;
							return (
								<SidebarNavLink
									key={col.id}
									href={href}
									collapsed={collapsed}
									active={isActive(href)}
									label={col.name}
									icon={
										<Star className="h-4 w-4 shrink-0 text-yellow-500" />
									}
								/>
							);
						})}
					</nav>

					{/* Recent Collections */}
					{!collapsed && recentCollections.length > 0 && (
						<p className="mb-1 mt-3 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">
							Recent
						</p>
					)}
					<nav className="space-y-0.5">
						{recentCollections.map((col) => {
							const href = `/collections/${col.id}`;
							return (
								<SidebarNavLink
									key={col.id}
									href={href}
									collapsed={collapsed}
									active={isActive(href)}
									label={col.name}
									icon={
										<span
											className="h-3 w-3 shrink-0 rounded-full"
											style={{
												backgroundColor: col.dominantColor ?? '#6b7280',
											}}
										/>
									}
									trailing={
										<span className="text-xs text-muted-foreground/60">
											{col.itemCount}
										</span>
									}
								/>
							);
						})}
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
							<div className="relative">
								<UserAvatar
									name={user?.name}
									image={user?.image}
									className="h-8 w-8"
								/>
								{user?.isPro && (
									<span
										aria-label="Pro user"
										className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border border-sidebar bg-indigo-500"
									/>
								)}
							</div>
						</DropdownMenuTrigger>
						<DropdownMenuContent side="right" align="end">
							<SidebarUserMenuItems isPro={user?.isPro} />
						</DropdownMenuContent>
					</DropdownMenu>
				) : (
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<button className="flex items-center gap-3 w-full min-w-0 rounded-md p-1 -m-1 hover:bg-accent transition-colors" />
							}
						>
							<UserAvatar
								name={user?.name}
								image={user?.image}
								className="h-8 w-8 shrink-0"
							/>
							<div className="flex-1 min-w-0 text-left">
								<div className="flex items-center gap-1.5">
									<p className="truncate text-sm font-medium">
										{user?.name ?? 'User'}
									</p>
									{user?.isPro && <ProBadge className="shrink-0" />}
								</div>
								<p className="truncate text-xs text-muted-foreground">
									{user?.email}
								</p>
							</div>
						</DropdownMenuTrigger>
						<DropdownMenuContent side="top" align="start" className="w-48">
							<SidebarUserMenuItems isPro={user?.isPro} />
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>
		</div>
	);
}

export function Sidebar({
	itemTypes,
	favoriteCollections,
	recentCollections,
	user,
}: SidebarProps) {
	const [collapsed, setCollapsed] = useState(false);
	const { open: mobileOpen, setOpen: setMobileOpen } = useMobileSidebar();

	return (
		<TooltipProvider delay={0}>
			{/* Desktop sidebar */}
			<aside
				className={`hidden md:flex flex-col border-r border-border bg-sidebar transition-all duration-300 ${
					collapsed ? 'w-16' : 'w-60'
				}`}
			>
				{/* Collapse toggle */}
				<div
					className={`flex items-center p-3 ${
						collapsed ? 'justify-center' : 'justify-end'
					}`}
				>
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

			{/* Mobile drawer — trigger lives in TopBar via MobileSidebarContext */}
			<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
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
