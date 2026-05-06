/** Parse a comma-separated tag string into a clean lowercase array. */
export function parseTagString(raw: string): string[] {
	return raw
		.split(',')
		.map((t) => t.trim())
		.filter((t) => t.length > 0);
}

/** Append a tag to a comma-separated string, deduped (case-insensitive). */
export function appendTagToString(raw: string, tag: string): string {
	const trimmed = tag.trim();
	if (!trimmed) return raw;
	const existing = parseTagString(raw);
	if (existing.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
		return raw;
	}
	return existing.length === 0 ? trimmed : `${raw.replace(/,\s*$/, '')}, ${trimmed}`;
}
