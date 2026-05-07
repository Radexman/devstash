'use client';

import { useState } from 'react';
import { Pencil, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toggleCollectionFavorite } from '@/actions/collections';
import { useOptimisticToggle } from '@/hooks/use-optimistic-toggle';
import { useCollectionDialogs } from '@/hooks/use-collection-dialogs';

interface CollectionDetailActionsProps {
  collection: {
    id: string;
    name: string;
    description: string | null;
    isFavorite: boolean;
  };
}

export function CollectionDetailActions({
  collection,
}: CollectionDetailActionsProps) {
  const [isFavorite, setIsFavorite] = useState(collection.isFavorite);

  const { run: handleToggleFavorite, busy: favoriting } = useOptimisticToggle(
    () => toggleCollectionFavorite(collection.id),
    {
      applyOptimistic: () => setIsFavorite((v) => !v),
      rollback: () => setIsFavorite(isFavorite),
      applyResult: (data) => setIsFavorite(data.isFavorite),
    },
  );

  const { setEditOpen, setDeleteOpen, dialogs } = useCollectionDialogs({
    collection: {
      id: collection.id,
      name: collection.name,
      description: collection.description,
    },
    redirectTo: '/collections',
  });

  return (
    <>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle favorite"
          onClick={handleToggleFavorite}
          disabled={favoriting}
        >
          <Star
            className={
              isFavorite
                ? 'h-4 w-4 fill-yellow-500 text-yellow-500'
                : 'h-4 w-4'
            }
          />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Edit collection"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Delete collection"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {dialogs}
    </>
  );
}
