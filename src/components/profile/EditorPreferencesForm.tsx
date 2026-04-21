'use client';

import { useEditorPreferences } from '@/components/providers/EditorPreferencesProvider';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  EDITOR_THEMES,
  EDITOR_THEME_LABELS,
  FONT_SIZES,
  TAB_SIZES,
  type EditorPreferences,
  type EditorTheme,
  type FontSize,
  type TabSize,
} from '@/lib/editor-preferences';

export function EditorPreferencesForm() {
  const { preferences, updatePreferences } = useEditorPreferences();

  function patch(next: Partial<EditorPreferences>) {
    void updatePreferences({ ...preferences, ...next });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="editor-font-size">Font size</Label>
          <Select<FontSize>
            value={preferences.fontSize}
            onValueChange={(value) => {
              if (value !== null) patch({ fontSize: value });
            }}
          >
            <SelectTrigger id="editor-font-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZES.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}px
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="editor-tab-size">Tab size</Label>
          <Select<TabSize>
            value={preferences.tabSize}
            onValueChange={(value) => {
              if (value !== null) patch({ tabSize: value });
            }}
          >
            <SelectTrigger id="editor-tab-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAB_SIZES.map((size) => (
                <SelectItem key={size} value={size}>
                  {size} spaces
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="editor-theme">Theme</Label>
          <Select<EditorTheme>
            value={preferences.theme}
            onValueChange={(value) => {
              if (value !== null) patch({ theme: value });
            }}
          >
            <SelectTrigger id="editor-theme">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EDITOR_THEMES.map((theme) => (
                <SelectItem key={theme} value={theme}>
                  {EDITOR_THEME_LABELS[theme]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="editor-word-wrap" className="text-sm font-medium">
              Word wrap
            </Label>
            <p className="text-xs text-muted-foreground">
              Wrap long lines to fit the editor width
            </p>
          </div>
          <Switch
            id="editor-word-wrap"
            checked={preferences.wordWrap}
            onCheckedChange={(checked) => patch({ wordWrap: checked })}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="editor-minimap" className="text-sm font-medium">
              Minimap
            </Label>
            <p className="text-xs text-muted-foreground">
              Show a zoomed-out overview on the right
            </p>
          </div>
          <Switch
            id="editor-minimap"
            checked={preferences.minimap}
            onCheckedChange={(checked) => patch({ minimap: checked })}
          />
        </div>
      </div>
    </div>
  );
}
