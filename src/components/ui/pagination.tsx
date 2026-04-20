import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

interface PaginationProps {
	page: number;
	pageCount: number;
	basePath: string;
	className?: string;
}

function buildHref(basePath: string, page: number): string {
	if (page <= 1) return basePath;
	const sep = basePath.includes('?') ? '&' : '?';
	return `${basePath}${sep}page=${page}`;
}

function getPageLinks(current: number, total: number): (number | 'ellipsis-l' | 'ellipsis-r')[] {
	if (total <= 7) {
		return Array.from({ length: total }, (_, i) => i + 1);
	}

	const result: (number | 'ellipsis-l' | 'ellipsis-r')[] = [1];
	const start = Math.max(2, current - 1);
	const end = Math.min(total - 1, current + 1);

	if (start > 2) result.push('ellipsis-l');
	for (let i = start; i <= end; i++) result.push(i);
	if (end < total - 1) result.push('ellipsis-r');

	result.push(total);
	return result;
}

export function Pagination({ page, pageCount, basePath, className }: PaginationProps) {
	if (pageCount <= 1) return null;

	const pages = getPageLinks(page, pageCount);
	const prevDisabled = page <= 1;
	const nextDisabled = page >= pageCount;

	const iconBtn = buttonVariants({ variant: 'outline', size: 'icon-sm' });
	const pageBtn = buttonVariants({ variant: 'outline', size: 'sm' });
	const pageActive = buttonVariants({ variant: 'default', size: 'sm' });

	return (
		<nav
			aria-label="Pagination"
			className={cn('flex items-center justify-center gap-1', className)}
		>
			{prevDisabled ? (
				<span
					aria-disabled="true"
					className={cn(iconBtn, 'pointer-events-none opacity-50')}
				>
					<ChevronLeft />
					<span className="sr-only">Previous page</span>
				</span>
			) : (
				<Link href={buildHref(basePath, page - 1)} className={iconBtn} aria-label="Previous page">
					<ChevronLeft />
				</Link>
			)}

			{pages.map((p) =>
				p === 'ellipsis-l' || p === 'ellipsis-r' ? (
					<span
						key={p}
						aria-hidden="true"
						className="px-2 text-sm text-muted-foreground"
					>
						…
					</span>
				) : (
					<Link
						key={p}
						href={buildHref(basePath, p)}
						aria-current={p === page ? 'page' : undefined}
						className={p === page ? pageActive : pageBtn}
					>
						{p}
					</Link>
				),
			)}

			{nextDisabled ? (
				<span
					aria-disabled="true"
					className={cn(iconBtn, 'pointer-events-none opacity-50')}
				>
					<ChevronRight />
					<span className="sr-only">Next page</span>
				</span>
			) : (
				<Link href={buildHref(basePath, page + 1)} className={iconBtn} aria-label="Next page">
					<ChevronRight />
				</Link>
			)}
		</nav>
	);
}
