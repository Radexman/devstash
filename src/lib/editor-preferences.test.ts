import { describe, it, expect } from 'vitest';
import {
  DEFAULT_EDITOR_PREFERENCES,
  normalizeEditorPreferences,
} from './editor-preferences';

describe('normalizeEditorPreferences', () => {
  it('returns defaults for null/undefined', () => {
    expect(normalizeEditorPreferences(null)).toEqual(DEFAULT_EDITOR_PREFERENCES);
    expect(normalizeEditorPreferences(undefined)).toEqual(
      DEFAULT_EDITOR_PREFERENCES,
    );
  });

  it('returns defaults for malformed objects', () => {
    expect(
      normalizeEditorPreferences({
        fontSize: 'huge',
        tabSize: 3,
        wordWrap: 'yes',
        minimap: 0,
        theme: 'solarized',
      }),
    ).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it('returns defaults when a single field is out of range', () => {
    expect(
      normalizeEditorPreferences({
        ...DEFAULT_EDITOR_PREFERENCES,
        tabSize: 6,
      }),
    ).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it('passes through a valid payload', () => {
    const payload = {
      fontSize: 16,
      tabSize: 4,
      wordWrap: false,
      minimap: true,
      theme: 'monokai' as const,
    };
    expect(normalizeEditorPreferences(payload)).toEqual(payload);
  });
});
