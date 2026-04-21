import type { Monaco } from '@monaco-editor/react';

export function defineMonacoThemes(monaco: Monaco) {
  monaco.editor.defineTheme('monokai', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '75715e', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'f92672' },
      { token: 'string', foreground: 'e6db74' },
      { token: 'number', foreground: 'ae81ff' },
      { token: 'type', foreground: '66d9ef', fontStyle: 'italic' },
      { token: 'function', foreground: 'a6e22e' },
      { token: 'variable', foreground: 'f8f8f2' },
      { token: 'constant', foreground: 'ae81ff' },
    ],
    colors: {
      'editor.background': '#272822',
      'editor.foreground': '#f8f8f2',
      'editor.lineHighlightBackground': '#3e3d32',
      'editorLineNumber.foreground': '#90908a',
      'editorCursor.foreground': '#f8f8f0',
      'editor.selectionBackground': '#49483e',
      'editor.inactiveSelectionBackground': '#3e3d32',
    },
  });

  monaco.editor.defineTheme('github-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff7b72' },
      { token: 'string', foreground: 'a5d6ff' },
      { token: 'number', foreground: '79c0ff' },
      { token: 'type', foreground: 'ffa657' },
      { token: 'function', foreground: 'd2a8ff' },
      { token: 'variable', foreground: 'c9d1d9' },
      { token: 'constant', foreground: '79c0ff' },
    ],
    colors: {
      'editor.background': '#0d1117',
      'editor.foreground': '#c9d1d9',
      'editor.lineHighlightBackground': '#161b22',
      'editorLineNumber.foreground': '#6e7681',
      'editorCursor.foreground': '#c9d1d9',
      'editor.selectionBackground': '#264f78',
      'editor.inactiveSelectionBackground': '#1f3d5c',
    },
  });
}

export const MONACO_THEME_BACKGROUNDS: Record<string, string> = {
  'vs-dark': '#1e1e1e',
  monokai: '#272822',
  'github-dark': '#0d1117',
};

export const MONACO_THEME_TITLEBARS: Record<string, string> = {
  'vs-dark': '#2d2d2d',
  monokai: '#1e1f1c',
  'github-dark': '#161b22',
};
