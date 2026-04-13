import { describe, it, expect } from 'vitest';
import { formatDate } from './format';

describe('formatDate', () => {
	it('formats a date as "Mon D"', () => {
		expect(formatDate(new Date('2026-04-13T12:00:00Z'))).toBe('Apr 13');
	});

	it('uses short month names', () => {
		expect(formatDate(new Date('2026-01-01T12:00:00Z'))).toBe('Jan 1');
	});
});
