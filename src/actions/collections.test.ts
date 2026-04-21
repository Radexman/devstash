import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db/collections', () => ({
  createCollection: vi.fn(),
  updateCollection: vi.fn(),
  deleteCollection: vi.fn(),
  toggleCollectionFavorite: vi.fn(),
}));

import { auth } from '@/auth';
import {
  createCollection as createCollectionQuery,
  updateCollection as updateCollectionQuery,
  deleteCollection as deleteCollectionQuery,
  toggleCollectionFavorite as toggleCollectionFavoriteQuery,
  type CollectionSummary,
} from '@/lib/db/collections';
import {
  createCollection,
  updateCollection,
  deleteCollection,
  toggleCollectionFavorite,
} from './collections';

const mockAuth = vi.mocked(auth);
const mockCreate = vi.mocked(createCollectionQuery);
const mockUpdate = vi.mocked(updateCollectionQuery);
const mockDelete = vi.mocked(deleteCollectionQuery);
const mockToggleFavorite = vi.mocked(toggleCollectionFavoriteQuery);

const fakeCollection: CollectionSummary = {
  id: 'c1',
  name: 'React Patterns',
  description: null,
  isFavorite: false,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

beforeEach(() => {
  vi.clearAllMocks();
  // @ts-expect-error partial session
  mockAuth.mockResolvedValue({ user: { id: 'u1' } });
});

describe('createCollection action', () => {
  it('rejects unauthorized', async () => {
    // @ts-expect-error null session
    mockAuth.mockResolvedValueOnce(null);
    const res = await createCollection({ name: 'x', description: null });
    expect(res).toEqual({ success: false, error: 'Unauthorized' });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('rejects empty name', async () => {
    const res = await createCollection({ name: '   ', description: null });
    expect(res.success).toBe(false);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('creates collection and returns summary on success', async () => {
    mockCreate.mockResolvedValueOnce(fakeCollection);
    const res = await createCollection({
      name: 'React Patterns',
      description: '  ',
    });
    expect(mockCreate).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({
        name: 'React Patterns',
        description: null,
      }),
    );
    expect(res).toEqual({ success: true, data: fakeCollection });
  });

  it('trims and keeps description when non-empty', async () => {
    mockCreate.mockResolvedValueOnce(fakeCollection);
    await createCollection({
      name: 'React Patterns',
      description: '  snippets and notes ',
    });
    expect(mockCreate).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ description: 'snippets and notes' }),
    );
  });

  it('returns error when the query throws', async () => {
    mockCreate.mockRejectedValueOnce(new Error('db down'));
    const res = await createCollection({ name: 'x', description: null });
    expect(res).toEqual({ success: false, error: 'Failed to create collection' });
  });
});

describe('updateCollection action', () => {
  it('rejects unauthorized', async () => {
    // @ts-expect-error null session
    mockAuth.mockResolvedValueOnce(null);
    const res = await updateCollection('c1', { name: 'x', description: null });
    expect(res).toEqual({ success: false, error: 'Unauthorized' });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('rejects empty name', async () => {
    const res = await updateCollection('c1', { name: '   ', description: null });
    expect(res.success).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns not found when query returns null', async () => {
    mockUpdate.mockResolvedValueOnce(null);
    const res = await updateCollection('c1', {
      name: 'React Patterns',
      description: null,
    });
    expect(res).toEqual({ success: false, error: 'Collection not found' });
  });

  it('updates and returns summary on success', async () => {
    const updated: CollectionSummary = {
      ...fakeCollection,
      name: 'React Patterns v2',
      description: 'updated',
    };
    mockUpdate.mockResolvedValueOnce(updated);
    const res = await updateCollection('c1', {
      name: '  React Patterns v2 ',
      description: '  updated ',
    });
    expect(mockUpdate).toHaveBeenCalledWith(
      'c1',
      'u1',
      expect.objectContaining({
        name: 'React Patterns v2',
        description: 'updated',
      }),
    );
    expect(res).toEqual({ success: true, data: updated });
  });

  it('returns error when the query throws', async () => {
    mockUpdate.mockRejectedValueOnce(new Error('db down'));
    const res = await updateCollection('c1', {
      name: 'x',
      description: null,
    });
    expect(res).toEqual({ success: false, error: 'Failed to update collection' });
  });
});

describe('deleteCollection action', () => {
  it('rejects unauthorized', async () => {
    // @ts-expect-error null session
    mockAuth.mockResolvedValueOnce(null);
    const res = await deleteCollection('c1');
    expect(res).toEqual({ success: false, error: 'Unauthorized' });
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('returns not found when query returns false', async () => {
    mockDelete.mockResolvedValueOnce(false);
    const res = await deleteCollection('c1');
    expect(res).toEqual({ success: false, error: 'Collection not found' });
  });

  it('deletes and returns id on success', async () => {
    mockDelete.mockResolvedValueOnce(true);
    const res = await deleteCollection('c1');
    expect(mockDelete).toHaveBeenCalledWith('c1', 'u1');
    expect(res).toEqual({ success: true, data: { id: 'c1' } });
  });

  it('returns error when the query throws', async () => {
    mockDelete.mockRejectedValueOnce(new Error('db down'));
    const res = await deleteCollection('c1');
    expect(res).toEqual({ success: false, error: 'Failed to delete collection' });
  });
});

describe('toggleCollectionFavorite action', () => {
  it('rejects unauthorized', async () => {
    // @ts-expect-error null session
    mockAuth.mockResolvedValueOnce(null);
    const res = await toggleCollectionFavorite('c1');
    expect(res).toEqual({ success: false, error: 'Unauthorized' });
    expect(mockToggleFavorite).not.toHaveBeenCalled();
  });

  it('returns not found when the row does not belong to user', async () => {
    mockToggleFavorite.mockResolvedValueOnce(null);
    const res = await toggleCollectionFavorite('missing');
    expect(mockToggleFavorite).toHaveBeenCalledWith('missing', 'u1');
    expect(res).toEqual({ success: false, error: 'Collection not found' });
  });

  it('returns new favorite=true when toggling on', async () => {
    mockToggleFavorite.mockResolvedValueOnce({ isFavorite: true });
    const res = await toggleCollectionFavorite('c1');
    expect(res).toEqual({
      success: true,
      data: { id: 'c1', isFavorite: true },
    });
  });

  it('returns new favorite=false when toggling off', async () => {
    mockToggleFavorite.mockResolvedValueOnce({ isFavorite: false });
    const res = await toggleCollectionFavorite('c1');
    expect(res).toEqual({
      success: true,
      data: { id: 'c1', isFavorite: false },
    });
  });

  it('returns error when the query throws', async () => {
    mockToggleFavorite.mockRejectedValueOnce(new Error('db down'));
    const res = await toggleCollectionFavorite('c1');
    expect(res).toEqual({ success: false, error: 'Failed to update favorite' });
  });
});
