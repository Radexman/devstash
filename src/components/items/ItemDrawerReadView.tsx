'use client';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CodeEditor } from '@/components/items/CodeEditor';
import { MarkdownEditor } from '@/components/items/MarkdownEditor';
import { formatDate } from '@/lib/format';
import type { ItemDetail } from '@/lib/db/items';

const LANGUAGE_TYPES = new Set(['snippet', 'command']);

interface ItemDrawerReadViewProps {
  item: ItemDetail;
  isPro: boolean;
  onAcceptOptimized: (optimized: string) => Promise<boolean>;
}

export function ItemDrawerReadView({
  item,
  isPro,
  onAcceptOptimized,
}: ItemDrawerReadViewProps) {
  const typeName = item.itemType.name.toLowerCase();

  return (
    <div className="space-y-5 px-4 pb-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          style={{
            borderColor: item.itemType.color,
            color: item.itemType.color,
          }}
        >
          {item.itemType.name}
        </Badge>
        {item.language && <Badge variant="secondary">{item.language}</Badge>}
      </div>

      {item.tags.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
            Tags
          </h3>
          <div className="flex flex-wrap gap-1">
            {item.tags.map((tag) => (
              <Badge key={tag.id} variant="secondary">
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {item.collections.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
            Collections
          </h3>
          <div className="flex flex-wrap gap-1">
            {item.collections.map((c) => (
              <Badge key={c.id} variant="outline">
                {c.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {item.url && (
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
            URL
          </h3>
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="break-all text-sm text-primary hover:underline"
          >
            {item.url}
          </a>
        </div>
      )}

      {item.content && (
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
            Content
          </h3>
          {LANGUAGE_TYPES.has(typeName) ? (
            <CodeEditor
              value={item.content}
              language={item.language ?? 'plaintext'}
              readOnly
              explain={{ itemId: item.id, isPro }}
            />
          ) : (
            <MarkdownEditor
              value={item.content}
              readOnly
              optimize={
                typeName === 'prompt'
                  ? {
                      itemId: item.id,
                      isPro,
                      onAccept: onAcceptOptimized,
                    }
                  : undefined
              }
            />
          )}
        </div>
      )}

      <Separator />

      <div className="space-y-1 text-xs text-muted-foreground">
        <p>Created {formatDate(item.createdAt)}</p>
        <p>Updated {formatDate(item.updatedAt)}</p>
      </div>
    </div>
  );
}
