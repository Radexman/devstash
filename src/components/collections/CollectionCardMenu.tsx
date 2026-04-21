'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Pencil, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditCollectionDialog } from '@/components/collections/EditCollectionDialog';
import { DeleteCollectionDialog } from '@/components/collections/DeleteCollectionDialog';
import { toggleCollectionFavorite } from '@/actions/collections';

interface CollectionCardMenuProps {
  collection: {
    id: string;
    name: string;
    description: string | null;
    isFavorite: boolean;
  };
}

export function CollectionCardMenu({ collection }: CollectionCardMenuProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [favoriting, setFavoriting] = useState(false);

  const stop = (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleToggleFavorite = async () => {
    if (favoriting) return;
    setFavoriting(true);
    const result = await toggleCollectionFavorite(collection.id);
    setFavoriting(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label="Collection actions"
              onClick={stop}
              onPointerDown={stop}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          }
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem
            onClick={(e) => {
              stop(e);
              setEditOpen(true);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={favoriting}
            onClick={(e) => {
              stop(e);
              void handleToggleFavorite();
            }}
          >
            <Star
              className={
                collection.isFavorite
                  ? 'mr-2 h-4 w-4 fill-yellow-500 text-yellow-500'
                  : 'mr-2 h-4 w-4'
              }
            />
            {collection.isFavorite ? 'Unfavorite' : 'Favorite'}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              stop(e);
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditCollectionDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        collection={collection}
      />
      <DeleteCollectionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        collectionId={collection.id}
        collectionName={collection.name}
      />
    </>
  );
}
