import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db/collections', () => ({
  createCollection: vi.fn(),
}));

import { auth } from '@/auth';
import {
  createCollection as createCollectionQuery,
  type CollectionSummary,
} from '@/lib/db/collections';
import { createCollection } from './collections';

const mockAuth = vi.mocked(auth);
const mockCreate = vi.mocked(createCollectionQuery);

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
