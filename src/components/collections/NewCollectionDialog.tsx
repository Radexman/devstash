'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UpgradeButton } from '@/components/billing/UpgradeButton';
import { createCollection } from '@/actions/collections';

interface FormState {
  name: string;
  description: string;
}

const emptyForm: FormState = {
  name: '',
  description: '',
};

interface NewCollectionDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NewCollectionDialog({
  open: controlledOpen,
  onOpenChange,
}: NewCollectionDialogProps = {}) {
  const router = useRouter();
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    setSaving(true);
    setLimitError(null);
    const result = await createCollection({
      name: form.name,
      description: form.description,
    });
    setSaving(false);

    if (!result.success) {
      if (result.error.startsWith('Free plan limit')) {
        setLimitError(result.error);
      } else {
        toast.error(result.error);
      }
      return;
    }

    toast.success('Collection created');
    setForm(emptyForm);
    setOpen(false);
    router.refresh();
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setForm(emptyForm);
      setLimitError(null);
    }
  };

  const canSubmit = form.name.trim().length > 0 && !saving && !limitError;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New Collection
        </Button>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New collection</DialogTitle>
          <DialogDescription>
            Group items together into a named collection.
          </DialogDescription>
        </DialogHeader>

        {limitError && (
          <div className="flex flex-col gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-amber-200">{limitError}</p>
            <UpgradeButton interval="monthly">Upgrade</UpgradeButton>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-collection-name">Name</Label>
            <Input
              id="new-collection-name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-collection-description">Description</Label>
            <Textarea
              id="new-collection-description"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              placeholder="Optional"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {saving ? 'Creating…' : 'Create collection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
