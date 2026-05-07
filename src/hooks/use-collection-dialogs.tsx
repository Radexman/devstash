'use client';

import { useState, type ReactNode } from 'react';
import { EditCollectionDialog } from '@/components/collections/EditCollectionDialog';
import { DeleteCollectionDialog } from '@/components/collections/DeleteCollectionDialog';

interface UseCollectionDialogsArgs {
  collection: {
    id: string;
    name: string;
    description: string | null;
  };
  redirectTo?: string;
}

interface UseCollectionDialogsResult {
  setEditOpen: (open: boolean) => void;
  setDeleteOpen: (open: boolean) => void;
  dialogs: ReactNode;
}

export function useCollectionDialogs({
  collection,
  redirectTo,
}: UseCollectionDialogsArgs): UseCollectionDialogsResult {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const dialogs = (
    <>
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
        redirectTo={redirectTo}
      />
    </>
  );

  return { setEditOpen, setDeleteOpen, dialogs };
}
