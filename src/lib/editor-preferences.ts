import { z } from 'zod';

export const FONT_SIZES = [12, 13, 14, 15, 16, 18] as const;
export const TAB_SIZES = [2, 4, 8] as const;
export const EDITOR_THEMES = ['vs-dark', 'monokai', 'github-dark'] as const;

export type FontSize = (typeof FONT_SIZES)[number];
export type TabSize = (typeof TAB_SIZES)[number];
export type EditorTheme = (typeof EDITOR_THEMES)[number];

export interface EditorPreferences {
  fontSize: FontSize;
  tabSize: TabSize;
  wordWrap: boolean;
  minimap: boolean;
  theme: EditorTheme;
}

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 13,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: 'vs-dark',
};

export const editorPreferencesSchema = z.object({
  fontSize: z
    .number()
    .int()
    .refine((n): n is FontSize => (FONT_SIZES as readonly number[]).includes(n), {
      message: 'Invalid font size',
    }),
  tabSize: z
    .number()
    .int()
    .refine((n): n is TabSize => (TAB_SIZES as readonly number[]).includes(n), {
      message: 'Invalid tab size',
    }),
  wordWrap: z.boolean(),
  minimap: z.boolean(),
  theme: z.enum(EDITOR_THEMES),
});

export function normalizeEditorPreferences(value: unknown): EditorPreferences {
  const parsed = editorPreferencesSchema.safeParse(value);
  if (parsed.success) return parsed.data;
  return DEFAULT_EDITOR_PREFERENCES;
}

export const EDITOR_THEME_LABELS: Record<EditorTheme, string> = {
  'vs-dark': 'VS Dark',
  monokai: 'Monokai',
  'github-dark': 'GitHub Dark',
};
