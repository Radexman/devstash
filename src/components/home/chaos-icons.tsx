import type { ReactNode } from 'react';

type ChaosIcon = { label: string; color: string; svg: ReactNode };

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const CHAOS_ICONS: ChaosIcon[] = [
  {
    label: 'Notion',
    color: '#ffffff',
    svg: (
      <svg viewBox="0 0 24 24" {...stroke}>
        <path d="M4 5l3-2h11l2 2v14l-3 2H6l-2-2V5z" />
        <path d="M8 7v10" />
        <path d="M8 7l8 10" />
        <path d="M16 7v10" />
      </svg>
    ),
  },
  {
    label: 'GitHub',
    color: '#e7ebf3',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.82.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.58 9.58 0 0 1 12 6.8c.85 0 1.71.12 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.33 4.69-4.56 4.94.36.31.68.92.68 1.86v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2z" />
      </svg>
    ),
  },
  {
    label: 'Slack',
    color: '#ec4899',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4h2v2a2 2 0 1 1-2-2z" />
        <path d="M10 14a2 2 0 1 1 4 0v6a2 2 0 1 1-4 0v-6z" />
        <path d="M14 6a2 2 0 1 1 4 0 2 2 0 0 1-4 0V4a2 2 0 1 1 4 0v2z" />
        <path d="M10 4a2 2 0 1 1 0-4 2 2 0 0 1 0 4h2V2a2 2 0 1 1-2 2z" />
      </svg>
    ),
  },
  {
    label: 'VS Code',
    color: '#3b82f6',
    svg: (
      <svg viewBox="0 0 24 24" {...stroke}>
        <path d="M17 3l4 2v14l-4 2-10-8 6-5-6-5 10-5z" />
        <path d="M7 7v10" />
      </svg>
    ),
  },
  {
    label: 'Tabs',
    color: '#6366f1',
    svg: (
      <svg viewBox="0 0 24 24" {...stroke}>
        <rect x="3" y="6" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
        <circle cx="6" cy="8" r="0.5" fill="currentColor" />
        <circle cx="8" cy="8" r="0.5" fill="currentColor" />
        <circle cx="10" cy="8" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: 'Terminal',
    color: '#06b6d4',
    svg: (
      <svg viewBox="0 0 24 24" {...stroke}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M7 10l3 2-3 2" />
        <path d="M12 16h5" />
      </svg>
    ),
  },
  {
    label: 'Text',
    color: '#64748b',
    svg: (
      <svg viewBox="0 0 24 24" {...stroke}>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
        <path d="M14 3v5h5" />
        <path d="M9 13h6" />
        <path d="M9 17h6" />
      </svg>
    ),
  },
  {
    label: 'Bookmark',
    color: '#f59e0b',
    svg: (
      <svg viewBox="0 0 24 24" {...stroke}>
        <path d="M6 3h12v18l-6-4-6 4V3z" />
      </svg>
    ),
  },
];
