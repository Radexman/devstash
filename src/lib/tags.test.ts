import { describe, it, expect } from 'vitest';
import { parseTagString, appendTagToString } from './tags';

describe('parseTagString', () => {
	it('splits on commas, trims, and drops empties', () => {
		expect(parseTagString('react, hooks ,  ,  state ')).toEqual([
			'react',
			'hooks',
			'state',
		]);
	});

	it('returns empty array for empty input', () => {
		expect(parseTagString('')).toEqual([]);
		expect(parseTagString('   ,  , ')).toEqual([]);
	});
});

describe('appendTagToString', () => {
	it('appends to an empty string without leading comma', () => {
		expect(appendTagToString('', 'react')).toBe('react');
	});

	it('appends to a non-empty string with comma+space', () => {
		expect(appendTagToString('react', 'hooks')).toBe('react, hooks');
	});

	it('handles trailing comma + whitespace cleanly', () => {
		expect(appendTagToString('react,  ', 'hooks')).toBe('react, hooks');
	});

	it('dedupes case-insensitively without modifying the string', () => {
		expect(appendTagToString('React, hooks', 'REACT')).toBe('React, hooks');
		expect(appendTagToString('react, hooks', 'hooks')).toBe('react, hooks');
	});

	it('ignores empty / whitespace-only tags', () => {
		expect(appendTagToString('react', '   ')).toBe('react');
		expect(appendTagToString('react', '')).toBe('react');
	});
});
