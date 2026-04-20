'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import type { CollectionOption } from '@/lib/db/collections';

interface CollectionMultiSelectProps {
  value: string[];
  onChange: (ids: string[]) => void;
}

export function CollectionMultiSelect({
  value,
  onChange,
}: CollectionMultiSelectProps) {
  const [options, setOptions] = useState<CollectionOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/collections')
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load collections');
        const data = (await res.json()) as { collections: CollectionOption[] };
        if (!cancelled) setOptions(data.collections);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label>Collections</Label>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {options === null && !error && (
        <p className="text-xs text-muted-foreground">Loading…</p>
      )}
      {options && options.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No collections yet. Create one from the top bar.
        </p>
      )}
      {options && options.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {options.map((opt) => {
            const selected = value.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggle(opt.id)}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
              >
                <Badge
                  variant={selected ? 'default' : 'outline'}
                  className="cursor-pointer select-none gap-1"
                >
                  {selected && <Check className="h-3 w-3" />}
                  {opt.name}
                </Badge>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
