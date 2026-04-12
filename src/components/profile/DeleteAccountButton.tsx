'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);

    try {
      const res = await fetch('/api/users/delete-account', {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete account');
        return;
      }

      toast.success('Account deleted');
      signOut({ callbackUrl: '/sign-in' });
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="destructive" size="sm" />}
      >
        Delete account
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete account</DialogTitle>
          <DialogDescription>
            This action cannot be undone. All your items, collections, and data
            will be permanently deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Yes, delete my account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
