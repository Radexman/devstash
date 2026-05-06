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
import { CodeEditor } from '@/components/items/CodeEditor';
import { MarkdownEditor } from '@/components/items/MarkdownEditor';
import { SuggestTagsButton } from '@/components/items/SuggestTagsButton';
import { CollectionMultiSelect } from '@/components/collections/CollectionMultiSelect';
import { UpgradeButton } from '@/components/billing/UpgradeButton';
import { createItem } from '@/actions/items';
import { parseTagString, appendTagToString } from '@/lib/tags';
import {
  CODE_LANGUAGES,
  DEFAULT_CODE_LANGUAGE,
} from '@/lib/code-languages';

const TYPES = [
  { value: 'snippet', label: 'Snippet' },
  { value: 'prompt', label: 'Prompt' },
  { value: 'command', label: 'Command' },
  { value: 'note', label: 'Note' },
  { value: 'link', label: 'Link' },
] as const;

type ItemType = (typeof TYPES)[number]['value'];

interface FormState {
  type: ItemType;
  title: string;
  description: string;
  content: string;
  url: string;
  language: string;
  tags: string;
  collectionIds: string[];
}

const emptyForm: FormState = {
  type: 'snippet',
  title: '',
  description: '',
  content: '',
  url: '',
  language: DEFAULT_CODE_LANGUAGE,
  tags: '',
  collectionIds: [],
};

interface NewItemDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isPro?: boolean;
}

export function NewItemDialog({ open: controlledOpen, onOpenChange, isPro = false }: NewItemDialogProps = {}) {
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

  const showContent = form.type !== 'link';
  const showLanguage = form.type === 'snippet' || form.type === 'command';
  const showUrl = form.type === 'link';

  const handleSubmit = async () => {
    setSaving(true);
    setLimitError(null);
    const result = await createItem({
      type: form.type,
      title: form.title,
      description: form.description,
      content: showContent ? form.content : null,
      url: showUrl ? form.url : null,
      language: showLanguage ? form.language : null,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      collectionIds: form.collectionIds,
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

    toast.success('Item created');
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

  const canSubmit =
    form.title.trim().length > 0 &&
    (form.type !== 'link' || form.url.trim().length > 0) &&
    !saving &&
    !limitError;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New Item
        </Button>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New item</DialogTitle>
          <DialogDescription>
            Create a new item in your stash.
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
            <Label htmlFor="new-item-type">Type</Label>
            <select
              id="new-item-type"
              value={form.type}
              onChange={(e) => set('type', e.target.value as ItemType)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-item-title">Title</Label>
            <Input
              id="new-item-title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-item-description">Description</Label>
            <Textarea
              id="new-item-description"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={2}
            />
          </div>

          {showLanguage && (
            <div className="space-y-1.5">
              <Label htmlFor="new-item-language">Language</Label>
              <select
                id="new-item-language"
                value={form.language}
                onChange={(e) => set('language', e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {CODE_LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showContent && (
            <div className="space-y-1.5">
              <Label htmlFor="new-item-content">Content</Label>
              {showLanguage ? (
                <CodeEditor
                  value={form.content}
                  language={form.language || DEFAULT_CODE_LANGUAGE}
                  onChange={(v) => set('content', v)}
                />
              ) : (
                <MarkdownEditor
                  value={form.content}
                  onChange={(v) => set('content', v)}
                />
              )}
            </div>
          )}

          {showUrl && (
            <div className="space-y-1.5">
              <Label htmlFor="new-item-url">URL</Label>
              <Input
                id="new-item-url"
                type="url"
                value={form.url}
                onChange={(e) => set('url', e.target.value)}
                placeholder="https://…"
                required
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="new-item-tags">Tags</Label>
            <Input
              id="new-item-tags"
              value={form.tags}
              onChange={(e) => set('tags', e.target.value)}
              placeholder="comma, separated, tags"
            />
            <SuggestTagsButton
              isPro={isPro}
              getDraft={() => ({
                title: form.title,
                description: form.description,
                content: showContent ? form.content : null,
              })}
              existingTags={parseTagString(form.tags)}
              onAdd={(tag) => set('tags', appendTagToString(form.tags, tag))}
            />
          </div>

          <CollectionMultiSelect
            value={form.collectionIds}
            onChange={(ids) => set('collectionIds', ids)}
          />
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
            {saving ? 'Creating…' : 'Create item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
