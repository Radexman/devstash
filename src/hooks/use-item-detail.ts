'use client';

import { useEffect, useState } from 'react';
import type { ItemDetail } from '@/lib/db/items';

export function useItemDetail(itemId: string | null): {
  item: ItemDetail | null;
  setItem: (item: ItemDetail | null) => void;
  loading: boolean;
  error: string | null;
} {
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!itemId) {
      setItem(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/items/${itemId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load item');
        const data = (await res.json()) as { item: ItemDetail };
        if (cancelled) return;
        setItem({
          ...data.item,
          createdAt: new Date(data.item.createdAt),
          updatedAt: new Date(data.item.updatedAt),
        });
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [itemId]);

  return { item, setItem, loading, error };
}
