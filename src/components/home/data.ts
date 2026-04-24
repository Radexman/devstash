export const TYPE_COLORS = {
  snippet: '#3b82f6',
  prompt: '#8b5cf6',
  command: '#f97316',
  note: '#fde047',
  link: '#10b981',
  collection: '#6366f1',
} as const;

export type FeatureCardData = {
  title: string;
  description: string;
  color: string;
  glyph: string;
};

export const FEATURES: FeatureCardData[] = [
  {
    title: 'Code snippets',
    description: 'Monaco editor with syntax highlighting. Language-aware. Copy in one click.',
    color: TYPE_COLORS.snippet,
    glyph: '{ }',
  },
  {
    title: 'AI prompts',
    description: 'Stop rewriting the same prompts. Save, version, and reuse your best ones.',
    color: TYPE_COLORS.prompt,
    glyph: '✦',
  },
  {
    title: 'Commands',
    description: 'Terminal one-liners you only need every three months. Findable in two keystrokes.',
    color: TYPE_COLORS.command,
    glyph: '$_',
  },
  {
    title: 'Notes',
    description: 'Markdown with live preview. Tables, code blocks, checklists — all rendered.',
    color: TYPE_COLORS.note,
    glyph: '≡',
  },
  {
    title: 'Links',
    description: 'Save the docs, posts, and repos you keep re-googling. Tagged and instantly searchable.',
    color: TYPE_COLORS.link,
    glyph: '↗',
  },
  {
    title: 'Collections',
    description: 'Group related items across types — "React patterns", "Interview prep", your call.',
    color: TYPE_COLORS.collection,
    glyph: '◇',
  },
];

export const AI_CHECKLIST = [
  'Auto-tag new items based on content',
  'One-click summaries of long notes',
  '"Explain this code" in plain English',
  'Prompt optimizer that tightens your prompts',
];

export type PlanFeature = string;

export const FREE_PLAN: { features: PlanFeature[] } = {
  features: [
    'Up to 50 items',
    'Up to 3 collections',
    'Basic search',
    'Dark mode',
    'Community support',
  ],
};

export const PRO_PLAN: { features: PlanFeature[] } = {
  features: [
    'Unlimited items and collections',
    'AI auto-tagging & summaries',
    '"Explain this code" & prompt optimizer',
    'Export in JSON / ZIP',
    'Priority support',
  ],
};

export type FooterColumn = {
  heading: string;
  links: { label: string; href: string }[];
};

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Changelog', href: '#' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
    ],
  },
];

export type AiTag = { label: string; color: string };

export const AI_DEMO_TAGS: AiTag[] = [
  { label: 'typescript', color: TYPE_COLORS.snippet },
  { label: 'performance', color: TYPE_COLORS.prompt },
  { label: 'utility', color: TYPE_COLORS.note },
  { label: 'closure', color: TYPE_COLORS.command },
  { label: 'higher-order', color: TYPE_COLORS.collection },
];

export type DashMockItem = { title: string; sub: string; color: string };

export const DASH_MOCK_ITEMS: DashMockItem[] = [
  { title: 'useDebounce.ts', sub: 'snippet · 2d ago', color: TYPE_COLORS.snippet },
  { title: 'Refactor prompt', sub: 'prompt · 1w', color: TYPE_COLORS.prompt },
  { title: 'git undo last', sub: 'command', color: TYPE_COLORS.command },
  { title: 'Ship checklist', sub: 'note · yest.', color: TYPE_COLORS.note },
  { title: 'React docs', sub: 'link', color: TYPE_COLORS.link },
  { title: 'OG templates', sub: 'collection', color: TYPE_COLORS.collection },
];

export const DASH_MOCK_NAV = [
  { label: 'Snippets', color: TYPE_COLORS.snippet, active: true },
  { label: 'Prompts', color: TYPE_COLORS.prompt, active: false },
  { label: 'Commands', color: TYPE_COLORS.command, active: false },
  { label: 'Notes', color: TYPE_COLORS.note, active: false },
  { label: 'Links', color: TYPE_COLORS.link, active: false },
];
