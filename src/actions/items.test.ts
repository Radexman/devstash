import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db/items', () => ({
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
  createItem: vi.fn(),
  toggleItemFavorite: vi.fn(),
}));

vi.mock('@/lib/db/collections', () => ({
  getUserCollectionIds: vi.fn(),
}));

import { auth } from '@/auth';
import {
  updateItem as updateItemQuery,
  deleteItem as deleteItemQuery,
  createItem as createItemQuery,
  toggleItemFavorite as toggleItemFavoriteQuery,
  type ItemDetail,
} from '@/lib/db/items';
import { getUserCollectionIds } from '@/lib/db/collections';
import {
  updateItem,
  deleteItem,
  createItem,
  toggleItemFavorite,
} from './items';

const mockAuth = vi.mocked(auth);
const mockUpdate = vi.mocked(updateItemQuery);
const mockDelete = vi.mocked(deleteItemQuery);
const mockCreate = vi.mocked(createItemQuery);
const mockToggleFavorite = vi.mocked(toggleItemFavoriteQuery);
const mockOwnedCollections = vi.mocked(getUserCollectionIds);

const fakeDetail: ItemDetail = {
  id: 'i1',
  title: 'New',
  description: null,
  contentType: 'text',
  content: null,
  url: null,
  language: null,
  isFavorite: false,
  isPinned: false,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
  itemType: { id: 't1', name: 'Snippet', icon: 'Code', color: '#000' },
  tags: [],
  collections: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  // @ts-expect-error partial session
  mockAuth.mockResolvedValue({ user: { id: 'u1' } });
  mockOwnedCollections.mockImplementation(async (_uid, ids) => ids);
});

describe('updateItem action', () => {
  it('rejects unauthorized', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await updateItem('i1', {
      title: 'x',
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
    });
    expect(res).toEqual({ success: false, error: 'Unauthorized' });
  });

  it('rejects empty title', async () => {
    const res = await updateItem('i1', {
      title: '   ',
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
    });
    expect(res.success).toBe(false);
  });

  it('rejects invalid URL', async () => {
    const res = await updateItem('i1', {
      title: 'ok',
      description: null,
      content: null,
      url: 'not-a-url',
      language: null,
      tags: [],
    });
    expect(res.success).toBe(false);
  });

  it('trims tags and drops empties', async () => {
    mockUpdate.mockResolvedValueOnce(fakeDetail);
    await updateItem('i1', {
      title: 'ok',
      description: null,
      content: null,
      url: null,
      language: null,
      tags: ['  foo ', '', 'bar'],
    });
    expect(mockUpdate).toHaveBeenCalledWith(
      'i1',
      'u1',
      expect.objectContaining({ tags: ['foo', 'bar'] }),
    );
  });

  it('returns not found when query returns null', async () => {
    mockUpdate.mockResolvedValueOnce(null);
    const res = await updateItem('missing', {
      title: 'ok',
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
    });
    expect(res).toEqual({ success: false, error: 'Item not found' });
  });

  it('returns updated detail on success', async () => {
    mockUpdate.mockResolvedValueOnce(fakeDetail);
    const res = await updateItem('i1', {
      title: 'New',
      description: '',
      content: null,
      url: null,
      language: null,
      tags: [],
    });
    expect(res).toEqual({ success: true, data: fakeDetail });
  });

  it('passes empty collectionIds when none provided', async () => {
    mockUpdate.mockResolvedValueOnce(fakeDetail);
    await updateItem('i1', {
      title: 'ok',
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
    });
    expect(mockUpdate).toHaveBeenCalledWith(
      'i1',
      'u1',
      expect.objectContaining({ collectionIds: [] }),
    );
  });

  it('forwards only user-owned collectionIds to query', async () => {
    mockUpdate.mockResolvedValueOnce(fakeDetail);
    mockOwnedCollections.mockResolvedValueOnce(['c1']);
    await updateItem('i1', {
      title: 'ok',
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
      collectionIds: ['c1', 'c-foreign'],
    });
    expect(mockOwnedCollections).toHaveBeenCalledWith('u1', ['c1', 'c-foreign']);
    expect(mockUpdate).toHaveBeenCalledWith(
      'i1',
      'u1',
      expect.objectContaining({ collectionIds: ['c1'] }),
    );
  });
});

describe('deleteItem action', () => {
  it('rejects unauthorized', async () => {
    // @ts-expect-error null session
    mockAuth.mockResolvedValueOnce(null);
    const res = await deleteItem('i1');
    expect(res).toEqual({ success: false, error: 'Unauthorized' });
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('returns not found when the row does not belong to user', async () => {
    mockDelete.mockResolvedValueOnce(false);
    const res = await deleteItem('missing');
    expect(mockDelete).toHaveBeenCalledWith('missing', 'u1');
    expect(res).toEqual({ success: false, error: 'Item not found' });
  });

  it('returns success when delete succeeds', async () => {
    mockDelete.mockResolvedValueOnce(true);
    const res = await deleteItem('i1');
    expect(res).toEqual({ success: true, data: { id: 'i1' } });
  });

  it('returns error when the query throws', async () => {
    mockDelete.mockRejectedValueOnce(new Error('db down'));
    const res = await deleteItem('i1');
    expect(res).toEqual({ success: false, error: 'Failed to delete item' });
  });
});

describe('createItem action', () => {
  it('rejects unauthorized', async () => {
    // @ts-expect-error null session
    mockAuth.mockResolvedValueOnce(null);
    const res = await createItem({
      type: 'snippet',
      title: 'x',
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
    });
    expect(res).toEqual({ success: false, error: 'Unauthorized' });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('rejects empty title', async () => {
    const res = await createItem({
      type: 'snippet',
      title: '   ',
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
    });
    expect(res.success).toBe(false);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('rejects link without url', async () => {
    const res = await createItem({
      type: 'link',
      title: 'My link',
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
    });
    expect(res.success).toBe(false);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('creates snippet and strips link/url fields', async () => {
    mockCreate.mockResolvedValueOnce(fakeDetail);
    const res = await createItem({
      type: 'snippet',
      title: 'Hello',
      description: null,
      content: 'console.log(1)',
      url: null,
      language: 'ts',
      tags: [' foo ', '', 'bar'],
    });
    expect(mockCreate).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({
        typeName: 'snippet',
        title: 'Hello',
        content: 'console.log(1)',
        language: 'ts',
        url: null,
        tags: ['foo', 'bar'],
        collectionIds: [],
      }),
    );
    expect(res).toEqual({ success: true, data: fakeDetail });
  });

  it('passes owned collectionIds through to create query', async () => {
    mockCreate.mockResolvedValueOnce(fakeDetail);
    mockOwnedCollections.mockResolvedValueOnce(['c1', 'c2']);
    await createItem({
      type: 'note',
      title: 'a note',
      description: null,
      content: 'body',
      url: null,
      language: null,
      tags: [],
      collectionIds: ['c1', 'c2'],
    });
    expect(mockOwnedCollections).toHaveBeenCalledWith('u1', ['c1', 'c2']);
    expect(mockCreate).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ collectionIds: ['c1', 'c2'] }),
    );
  });

  it('drops foreign collectionIds before calling create query', async () => {
    mockCreate.mockResolvedValueOnce(fakeDetail);
    mockOwnedCollections.mockResolvedValueOnce([]);
    await createItem({
      type: 'note',
      title: 'a note',
      description: null,
      content: 'body',
      url: null,
      language: null,
      tags: [],
      collectionIds: ['c-foreign'],
    });
    expect(mockCreate).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ collectionIds: [] }),
    );
  });
});

describe('toggleItemFavorite action', () => {
  it('rejects unauthorized', async () => {
    // @ts-expect-error null session
    mockAuth.mockResolvedValueOnce(null);
    const res = await toggleItemFavorite('i1');
    expect(res).toEqual({ success: false, error: 'Unauthorized' });
    expect(mockToggleFavorite).not.toHaveBeenCalled();
  });

  it('returns not found when the row does not belong to user', async () => {
    mockToggleFavorite.mockResolvedValueOnce(null);
    const res = await toggleItemFavorite('missing');
    expect(mockToggleFavorite).toHaveBeenCalledWith('missing', 'u1');
    expect(res).toEqual({ success: false, error: 'Item not found' });
  });

  it('returns new favorite=true when toggling on', async () => {
    mockToggleFavorite.mockResolvedValueOnce({ isFavorite: true });
    const res = await toggleItemFavorite('i1');
    expect(res).toEqual({
      success: true,
      data: { id: 'i1', isFavorite: true },
    });
  });

  it('returns new favorite=false when toggling off', async () => {
    mockToggleFavorite.mockResolvedValueOnce({ isFavorite: false });
    const res = await toggleItemFavorite('i1');
    expect(res).toEqual({
      success: true,
      data: { id: 'i1', isFavorite: false },
    });
  });

  it('returns error when the query throws', async () => {
    mockToggleFavorite.mockRejectedValueOnce(new Error('db down'));
    const res = await toggleItemFavorite('i1');
    expect(res).toEqual({ success: false, error: 'Failed to update favorite' });
  });
});
