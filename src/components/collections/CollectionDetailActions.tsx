'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EditCollectionDialog } from '@/components/collections/EditCollectionDialog';
import { DeleteCollectionDialog } from '@/components/collections/DeleteCollectionDialog';
import { toggleCollectionFavorite } from '@/actions/collections';

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
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(collection.isFavorite);
  const [favoriting, setFavoriting] = useState(false);

  const handleToggleFavorite = async () => {
    if (favoriting) return;
    const previous = isFavorite;
    setIsFavorite(!previous);
    setFavoriting(true);
    const result = await toggleCollectionFavorite(collection.id);
    setFavoriting(false);
    if (!result.success) {
      setIsFavorite(previous);
      toast.error(result.error);
      return;
    }
    setIsFavorite(result.data.isFavorite);
    router.refresh();
  };

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

      <EditCollectionDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        collection={{
          id: collection.id,
          name: collection.name,
          description: collection.description,
        }}
      />
      <DeleteCollectionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        collectionId={collection.id}
        collectionName={collection.name}
        redirectTo="/collections"
      />
    </>
  );
}
