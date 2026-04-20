import { describe, it, expect } from 'vitest';
import { parsePageParam, clampPage, getPageCount } from './pagination';

describe('parsePageParam', () => {
	it('returns 1 for undefined, empty, non-numeric, or sub-1 values', () => {
		expect(parsePageParam(undefined)).toBe(1);
		expect(parsePageParam('')).toBe(1);
		expect(parsePageParam('abc')).toBe(1);
		expect(parsePageParam('0')).toBe(1);
		expect(parsePageParam('-3')).toBe(1);
	});

	it('parses valid page numbers', () => {
		expect(parsePageParam('1')).toBe(1);
		expect(parsePageParam('42')).toBe(42);
	});

	it('takes the first value of an array param', () => {
		expect(parsePageParam(['3', '7'])).toBe(3);
		expect(parsePageParam([])).toBe(1);
	});
});

describe('clampPage', () => {
	it('clamps to 1 when page is below 1', () => {
		expect(clampPage(0, 5)).toBe(1);
		expect(clampPage(-1, 5)).toBe(1);
	});

	it('clamps to pageCount when page is above pageCount', () => {
		expect(clampPage(10, 3)).toBe(3);
	});

	it('returns the page when in range', () => {
		expect(clampPage(2, 5)).toBe(2);
	});

	it('returns 1 when pageCount is 0', () => {
		expect(clampPage(5, 0)).toBe(1);
	});
});

describe('getPageCount', () => {
	it('returns 1 for empty totals', () => {
		expect(getPageCount(0, 21)).toBe(1);
		expect(getPageCount(-5, 21)).toBe(1);
	});

	it('rounds up partial pages', () => {
		expect(getPageCount(22, 21)).toBe(2);
		expect(getPageCount(21, 21)).toBe(1);
		expect(getPageCount(43, 21)).toBe(3);
	});
});
