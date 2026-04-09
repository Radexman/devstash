export interface ItemType {
	id: string;
	name: string;
	icon: string;
	color: string;
	isSystem: boolean;
	count: number;
}

export interface Tag {
	id: string;
	name: string;
}

export interface Item {
	id: string;
	title: string;
	description: string | null;
	content: string | null;
	contentType: 'text' | 'url' | 'file';
	url: string | null;
	fileUrl: string | null;
	fileName: string | null;
	fileSize: number | null;
	language: string | null;
	isFavorite: boolean;
	isPinned: boolean;
	itemTypeId: string;
	tags: Tag[];
	collectionIds: string[];
	createdAt: string;
	updatedAt: string;
}

export interface Collection {
	id: string;
	name: string;
	description: string | null;
	isFavorite: boolean;
	itemCount: number;
	createdAt: string;
	updatedAt: string;
}

export interface User {
	id: string;
	name: string;
	email: string;
	image: string | null;
	isPro: boolean;
}

// Current user
export const currentUser: User = {
	id: 'user_1',
	name: 'John Doe',
	email: 'demo@devstash.io',
	image: null,
	isPro: false,
};

// System item types
export const itemTypes: ItemType[] = [
	{ id: 'type_snippet', name: 'Snippets', icon: 'Code', color: '#3b82f6', isSystem: true, count: 24 },
	{ id: 'type_prompt', name: 'Prompts', icon: 'Sparkles', color: '#8b5cf6', isSystem: true, count: 18 },
	{ id: 'type_command', name: 'Commands', icon: 'Terminal', color: '#f97316', isSystem: true, count: 15 },
	{ id: 'type_note', name: 'Notes', icon: 'StickyNote', color: '#fde047', isSystem: true, count: 12 },
	{ id: 'type_file', name: 'Files', icon: 'File', color: '#6b7280', isSystem: true, count: 5 },
	{ id: 'type_image', name: 'Images', icon: 'Image', color: '#ec4899', isSystem: true, count: 3 },
	{ id: 'type_link', name: 'Links', icon: 'Link', color: '#10b981', isSystem: true, count: 8 },
];

// Tags
export const tags: Tag[] = [
	{ id: 'tag_1', name: 'react' },
	{ id: 'tag_2', name: 'auth' },
	{ id: 'tag_3', name: 'hooks' },
	{ id: 'tag_4', name: 'python' },
	{ id: 'tag_5', name: 'git' },
	{ id: 'tag_6', name: 'typescript' },
	{ id: 'tag_7', name: 'error-handling' },
	{ id: 'tag_8', name: 'api' },
	{ id: 'tag_9', name: 'css' },
	{ id: 'tag_10', name: 'nextjs' },
];

// Collections
export const collections: Collection[] = [
	{
		id: 'col_1',
		name: 'React Patterns',
		description: 'Common React patterns and hooks',
		isFavorite: true,
		itemCount: 12,
		createdAt: '2024-01-10T10:00:00Z',
		updatedAt: '2024-01-15T14:30:00Z',
	},
	{
		id: 'col_2',
		name: 'Python Snippets',
		description: 'Useful Python code snippets',
		isFavorite: false,
		itemCount: 8,
		createdAt: '2024-01-08T09:00:00Z',
		updatedAt: '2024-01-14T11:00:00Z',
	},
	{
		id: 'col_3',
		name: 'Context Files',
		description: 'AI context files for projects',
		isFavorite: true,
		itemCount: 5,
		createdAt: '2024-01-05T08:00:00Z',
		updatedAt: '2024-01-13T16:00:00Z',
	},
	{
		id: 'col_4',
		name: 'Interview Prep',
		description: 'Technical interview preparation',
		isFavorite: false,
		itemCount: 24,
		createdAt: '2024-01-03T12:00:00Z',
		updatedAt: '2024-01-12T10:00:00Z',
	},
	{
		id: 'col_5',
		name: 'Git Commands',
		description: 'Frequently used git commands',
		isFavorite: true,
		itemCount: 15,
		createdAt: '2024-01-02T11:00:00Z',
		updatedAt: '2024-01-11T09:00:00Z',
	},
	{
		id: 'col_6',
		name: 'AI Prompts',
		description: 'Curated AI prompts for coding',
		isFavorite: false,
		itemCount: 18,
		createdAt: '2024-01-01T10:00:00Z',
		updatedAt: '2024-01-10T15:00:00Z',
	},
];

// Items
export const items: Item[] = [
	{
		id: 'item_1',
		title: 'useAuth Hook',
		description: 'Custom authentication hook for React applications',
		content: `import { useContext } from 'react'
import { AuthContext } from './AuthContext'

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}`,
		contentType: 'text',
		url: null,
		fileUrl: null,
		fileName: null,
		fileSize: null,
		language: 'typescript',
		isFavorite: true,
		isPinned: true,
		itemTypeId: 'type_snippet',
		tags: [tags[0], tags[1], tags[2]],
		collectionIds: ['col_1'],
		createdAt: '2024-01-15T10:00:00Z',
		updatedAt: '2024-01-15T10:00:00Z',
	},
	{
		id: 'item_2',
		title: 'API Error Handling Pattern',
		description: 'Fetch wrapper with exponential backoff retry logic',
		content: `async function fetchWithRetry(url: string, options?: RequestInit, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options)
      if (!response.ok) throw new Error(\`HTTP \${response.status}\`)
      return await response.json()
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)))
    }
  }
}`,
		contentType: 'text',
		url: null,
		fileUrl: null,
		fileName: null,
		fileSize: null,
		language: 'typescript',
		isFavorite: false,
		isPinned: true,
		itemTypeId: 'type_snippet',
		tags: [tags[6], tags[7], tags[5]],
		collectionIds: ['col_1', 'col_4'],
		createdAt: '2024-01-14T09:00:00Z',
		updatedAt: '2024-01-14T09:00:00Z',
	},
	{
		id: 'item_3',
		title: 'Git Interactive Rebase',
		description: 'Squash last N commits into one',
		content: 'git rebase -i HEAD~N',
		contentType: 'text',
		url: null,
		fileUrl: null,
		fileName: null,
		fileSize: null,
		language: 'bash',
		isFavorite: false,
		isPinned: false,
		itemTypeId: 'type_command',
		tags: [tags[4]],
		collectionIds: ['col_5'],
		createdAt: '2024-01-13T08:00:00Z',
		updatedAt: '2024-01-13T08:00:00Z',
	},
	{
		id: 'item_4',
		title: 'Code Review Prompt',
		description: 'AI prompt for thorough code reviews',
		content: `Review the following code for:
1. Security vulnerabilities
2. Performance issues
3. Code style and best practices
4. Edge cases not handled
5. Potential bugs

Provide specific line-by-line feedback with suggestions.`,
		contentType: 'text',
		url: null,
		fileUrl: null,
		fileName: null,
		fileSize: null,
		language: null,
		isFavorite: true,
		isPinned: false,
		itemTypeId: 'type_prompt',
		tags: [tags[7]],
		collectionIds: ['col_6'],
		createdAt: '2024-01-12T14:00:00Z',
		updatedAt: '2024-01-12T14:00:00Z',
	},
	{
		id: 'item_5',
		title: 'Flexbox Cheatsheet',
		description: 'Quick reference for CSS flexbox properties',
		content: `/* Container */
display: flex;
flex-direction: row | column;
justify-content: center | space-between | space-around;
align-items: center | flex-start | flex-end | stretch;
flex-wrap: wrap | nowrap;
gap: 1rem;

/* Items */
flex: 1;
flex-grow: 1;
flex-shrink: 0;
align-self: center;
order: 1;`,
		contentType: 'text',
		url: null,
		fileUrl: null,
		fileName: null,
		fileSize: null,
		language: 'css',
		isFavorite: false,
		isPinned: false,
		itemTypeId: 'type_note',
		tags: [tags[8]],
		collectionIds: ['col_4'],
		createdAt: '2024-01-11T11:00:00Z',
		updatedAt: '2024-01-11T11:00:00Z',
	},
	{
		id: 'item_6',
		title: 'Next.js Documentation',
		description: 'Official Next.js docs',
		content: null,
		contentType: 'url',
		url: 'https://nextjs.org/docs',
		fileUrl: null,
		fileName: null,
		fileSize: null,
		language: null,
		isFavorite: true,
		isPinned: false,
		itemTypeId: 'type_link',
		tags: [tags[9]],
		collectionIds: ['col_1'],
		createdAt: '2024-01-10T10:00:00Z',
		updatedAt: '2024-01-10T10:00:00Z',
	},
	{
		id: 'item_7',
		title: 'Python List Comprehension',
		description: 'Common list comprehension patterns',
		content: `# Filter and transform
squares = [x**2 for x in range(10) if x % 2 == 0]

# Nested comprehension
matrix = [[1,2,3],[4,5,6],[7,8,9]]
flat = [x for row in matrix for x in row]

# Dictionary comprehension
word_lengths = {word: len(word) for word in ['hello', 'world']}`,
		contentType: 'text',
		url: null,
		fileUrl: null,
		fileName: null,
		fileSize: null,
		language: 'python',
		isFavorite: false,
		isPinned: false,
		itemTypeId: 'type_snippet',
		tags: [tags[3]],
		collectionIds: ['col_2'],
		createdAt: '2024-01-09T15:00:00Z',
		updatedAt: '2024-01-09T15:00:00Z',
	},
	{
		id: 'item_8',
		title: 'Docker Cleanup Commands',
		description: 'Remove unused Docker resources',
		content: `# Remove all stopped containers
docker container prune

# Remove unused images
docker image prune -a

# Remove everything unused
docker system prune -a --volumes`,
		contentType: 'text',
		url: null,
		fileUrl: null,
		fileName: null,
		fileSize: null,
		language: 'bash',
		isFavorite: false,
		isPinned: false,
		itemTypeId: 'type_command',
		tags: [],
		collectionIds: ['col_5'],
		createdAt: '2024-01-08T12:00:00Z',
		updatedAt: '2024-01-08T12:00:00Z',
	},
	{
		id: 'item_9',
		title: 'System Prompt Template',
		description: 'Base template for AI system prompts',
		content: `You are a [role] specializing in [domain].

Your task is to [primary objective].

Guidelines:
- Be concise and specific
- Provide examples when helpful
- Ask clarifying questions if needed
- Format output as [format]`,
		contentType: 'text',
		url: null,
		fileUrl: null,
		fileName: null,
		fileSize: null,
		language: null,
		isFavorite: false,
		isPinned: false,
		itemTypeId: 'type_prompt',
		tags: [],
		collectionIds: ['col_6'],
		createdAt: '2024-01-07T09:00:00Z',
		updatedAt: '2024-01-07T09:00:00Z',
	},
	{
		id: 'item_10',
		title: 'React useDebounce Hook',
		description: 'Debounce a value with a custom delay',
		content: `import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}`,
		contentType: 'text',
		url: null,
		fileUrl: null,
		fileName: null,
		fileSize: null,
		language: 'typescript',
		isFavorite: false,
		isPinned: false,
		itemTypeId: 'type_snippet',
		tags: [tags[0], tags[2]],
		collectionIds: ['col_1'],
		createdAt: '2024-01-06T16:00:00Z',
		updatedAt: '2024-01-06T16:00:00Z',
	},
];
