'use client';

import { useState } from 'react';
import Editor, { type Monaco } from '@monaco-editor/react';
import { Check, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { useEditorPreferences } from '@/components/providers/EditorPreferencesProvider';
import {
  MONACO_THEME_BACKGROUNDS,
  MONACO_THEME_TITLEBARS,
  defineMonacoThemes,
} from '@/lib/monaco-themes';
import { explainCode } from '@/actions/ai';
import {
  EDITOR_CHROME_BUTTON_CLASS,
  EditorActionButton,
} from '@/components/items/EditorActionButton';

interface ExplainContext {
  itemId: string;
  isPro: boolean;
}

interface CodeEditorProps {
  value: string;
  language?: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  /** When set, shows an "Explain" button in the title bar that calls
   * `explainCode({ itemId })` and toggles the body into a markdown panel.
   * Only meaningful in read mode (drawer view); ignored otherwise. */
  explain?: ExplainContext;
}

export function CodeEditor({
  value,
  language = 'plaintext',
  readOnly = false,
  onChange,
  explain,
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [view, setView] = useState<'code' | 'explain'>('code');
  const { preferences } = useEditorPreferences();

  const showExplain = Boolean(explain) && readOnly;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleExplain = async () => {
    if (!explain || explaining) return;

    if (explanation) {
      setView('explain');
      return;
    }

    setExplaining(true);
    const result = await explainCode({ itemId: explain.itemId });
    setExplaining(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setExplanation(result.data.explanation);
    setView('explain');
  };

  const handleBeforeMount = (monaco: Monaco) => {
    defineMonacoThemes(monaco);
  };

  const lineCount = value.split('\n').length;
  const lineHeight = preferences.fontSize + 6;
  const editorHeight = Math.min(
    Math.max(lineCount * lineHeight + 16, 80),
    400,
  );

  const shellBg = MONACO_THEME_BACKGROUNDS[preferences.theme] ?? '#1e1e1e';
  const titleBarBg = MONACO_THEME_TITLEBARS[preferences.theme] ?? '#2d2d2d';

  const tabBase =
    'rounded px-2 py-0.5 text-xs font-medium transition-colors';
  const tabActive = 'bg-[#404040] text-[#cccccc]';
  const tabIdle = 'text-[#858585] hover:text-[#cccccc]';

  return (
    <div
      className="overflow-hidden rounded-lg border border-border"
      style={{ backgroundColor: shellBg }}
    >
      {/* macOS-style title bar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b border-[#404040]"
        style={{ backgroundColor: titleBarBg }}
      >
        <div className="flex items-center gap-2">
          {/* Traffic light dots */}
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <div className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          {showExplain && explanation && (
            <div className="ml-2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setView('code')}
                className={`${tabBase} ${view === 'code' ? tabActive : tabIdle}`}
              >
                Code
              </button>
              <button
                type="button"
                onClick={() => setView('explain')}
                className={`${tabBase} ${view === 'explain' ? tabActive : tabIdle}`}
              >
                Explain
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {language && language !== 'plaintext' && (
            <span className="text-xs text-[#858585]">{language}</span>
          )}
          {showExplain && explain && (
            <EditorActionButton
              label="Explain"
              isPro={explain.isPro}
              loading={explaining}
              disabled={explaining}
              onClick={handleExplain}
            />
          )}
          <button
            type="button"
            onClick={handleCopy}
            className={EDITOR_CHROME_BUTTON_CLASS}
            aria-label="Copy"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Body — code editor or explanation */}
      {view === 'explain' && explanation ? (
        <div
          className="markdown-preview overflow-auto p-4"
          style={{ maxHeight: 400, minHeight: 80 }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {explanation}
          </ReactMarkdown>
        </div>
      ) : (
        <Editor
          height={editorHeight}
          language={language}
          value={value}
          theme={preferences.theme}
          beforeMount={handleBeforeMount}
          onChange={(v) => onChange?.(v ?? '')}
          options={{
            readOnly,
            minimap: { enabled: preferences.minimap },
            scrollBeyondLastLine: false,
            fontSize: preferences.fontSize,
            tabSize: preferences.tabSize,
            lineNumbers: readOnly ? 'off' : 'on',
            glyphMargin: false,
            folding: false,
            lineDecorationsWidth: 0,
            lineNumbersMinChars: 3,
            padding: { top: 8, bottom: 8 },
            renderLineHighlight: readOnly ? 'none' : 'line',
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
            wordWrap: preferences.wordWrap ? 'on' : 'off',
            domReadOnly: readOnly,
            contextmenu: !readOnly,
            cursorStyle: readOnly ? 'underline-thin' : 'line',
          }}
          loading={
            <div className="flex h-20 items-center justify-center text-xs text-[#858585]">
              Loading editor...
            </div>
          }
        />
      )}
    </div>
  );
}

