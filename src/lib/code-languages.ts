export interface CodeLanguage {
	value: string;
	label: string;
}

export const CODE_LANGUAGES: CodeLanguage[] = [
	{ value: 'plaintext', label: 'Plain text' },
	{ value: 'bash', label: 'Bash' },
	{ value: 'c', label: 'C' },
	{ value: 'cpp', label: 'C++' },
	{ value: 'csharp', label: 'C#' },
	{ value: 'css', label: 'CSS' },
	{ value: 'dockerfile', label: 'Dockerfile' },
	{ value: 'go', label: 'Go' },
	{ value: 'graphql', label: 'GraphQL' },
	{ value: 'html', label: 'HTML' },
	{ value: 'java', label: 'Java' },
	{ value: 'javascript', label: 'JavaScript' },
	{ value: 'json', label: 'JSON' },
	{ value: 'kotlin', label: 'Kotlin' },
	{ value: 'lua', label: 'Lua' },
	{ value: 'markdown', label: 'Markdown' },
	{ value: 'php', label: 'PHP' },
	{ value: 'powershell', label: 'PowerShell' },
	{ value: 'python', label: 'Python' },
	{ value: 'ruby', label: 'Ruby' },
	{ value: 'rust', label: 'Rust' },
	{ value: 'scss', label: 'SCSS' },
	{ value: 'shell', label: 'Shell' },
	{ value: 'sql', label: 'SQL' },
	{ value: 'swift', label: 'Swift' },
	{ value: 'typescript', label: 'TypeScript' },
	{ value: 'xml', label: 'XML' },
	{ value: 'yaml', label: 'YAML' },
];

export const DEFAULT_CODE_LANGUAGE = 'plaintext';

const KNOWN_VALUES = new Set(CODE_LANGUAGES.map((l) => l.value));

// Returns the curated list with the current value prepended as a synthetic
// option when it's not one of the known languages. Lets pre-existing items
// keep their custom language label without losing it on edit.
export function getLanguageOptions(currentValue?: string | null): CodeLanguage[] {
	const v = currentValue?.trim();
	if (!v || v === DEFAULT_CODE_LANGUAGE || KNOWN_VALUES.has(v)) {
		return CODE_LANGUAGES;
	}
	return [{ value: v, label: v }, ...CODE_LANGUAGES];
}
