export const ITEMS_PER_PAGE = 21;
export const COLLECTIONS_PER_PAGE = 21;
export const DASHBOARD_COLLECTIONS_LIMIT = 6;
export const DASHBOARD_RECENT_ITEMS_LIMIT = 10;

export interface Paginated<T> {
	rows: T[];
	total: number;
	page: number;
	pageCount: number;
	perPage: number;
}

export function parsePageParam(value: string | string[] | undefined): number {
	const raw = Array.isArray(value) ? value[0] : value;
	const parsed = Number.parseInt(raw ?? '', 10);
	if (!Number.isFinite(parsed) || parsed < 1) return 1;
	return parsed;
}

export function clampPage(page: number, pageCount: number): number {
	if (pageCount < 1) return 1;
	if (page < 1) return 1;
	if (page > pageCount) return pageCount;
	return page;
}

export function getPageCount(total: number, perPage: number): number {
	if (total <= 0) return 1;
	return Math.max(1, Math.ceil(total / perPage));
}
