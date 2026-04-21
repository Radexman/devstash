import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db/users', () => ({
  updateEditorPreferences: vi.fn(),
}));

import { auth } from '@/auth';
import { updateEditorPreferences as updateEditorPreferencesQuery } from '@/lib/db/users';
import { updateEditorPreferences } from './editor-preferences';
import {
  DEFAULT_EDITOR_PREFERENCES,
  type EditorPreferences,
} from '@/lib/editor-preferences';

const mockAuth = vi.mocked(auth);
const mockUpdate = vi.mocked(updateEditorPreferencesQuery);

const validPayload: EditorPreferences = {
  fontSize: 14,
  tabSize: 4,
  wordWrap: false,
  minimap: true,
  theme: 'github-dark',
};

beforeEach(() => {
  vi.clearAllMocks();
  // @ts-expect-error partial session
  mockAuth.mockResolvedValue({ user: { id: 'u1' } });
  mockUpdate.mockImplementation(async (_uid, prefs) => prefs);
});

describe('updateEditorPreferences action', () => {
  it('rejects unauthorized', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await updateEditorPreferences(validPayload);
    expect(res).toEqual({ success: false, error: 'Unauthorized' });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('rejects an invalid font size', async () => {
    const res = await updateEditorPreferences({
      ...validPayload,
      fontSize: 99 as EditorPreferences['fontSize'],
    });
    expect(res.success).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('rejects an unknown theme', async () => {
    const res = await updateEditorPreferences({
      ...validPayload,
      theme: 'solarized' as EditorPreferences['theme'],
    });
    expect(res.success).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('persists a valid payload and returns it', async () => {
    const res = await updateEditorPreferences(validPayload);
    expect(res).toEqual({ success: true, data: validPayload });
    expect(mockUpdate).toHaveBeenCalledWith('u1', validPayload);
  });

  it('accepts the default preferences', async () => {
    const res = await updateEditorPreferences(DEFAULT_EDITOR_PREFERENCES);
    expect(res).toEqual({ success: true, data: DEFAULT_EDITOR_PREFERENCES });
    expect(mockUpdate).toHaveBeenCalledWith('u1', DEFAULT_EDITOR_PREFERENCES);
  });

  it('returns a friendly error if the query throws', async () => {
    mockUpdate.mockRejectedValueOnce(new Error('db down'));
    const res = await updateEditorPreferences(validPayload);
    expect(res).toEqual({ success: false, error: 'Failed to update preferences' });
  });
});
