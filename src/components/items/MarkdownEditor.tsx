'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { optimizePrompt } from '@/actions/ai';
import {
  EDITOR_CHROME_BUTTON_CLASS,
  EditorActionButton,
} from '@/components/items/EditorActionButton';

interface OptimizeContext {
  itemId: string;
  isPro: boolean;
  /**
   * Called when the user accepts the optimized prompt. The parent persists the
   * change (typically via `updateItem`) and resolves true on success so the
   * editor can dismiss the comparison view; false leaves it open so the user
   * can retry or reject.
   */
  onAccept: (optimized: string) => Promise<boolean>;
}

interface MarkdownEditorProps {
  value: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  /** When set, shows an "Optimize" button in the title bar that calls
   * `optimizePrompt({ itemId })` and swaps the body into a before/after
   * comparison panel. Only meaningful in read mode (drawer view); ignored
   * otherwise. */
  optimize?: OptimizeContext;
}

export function MarkdownEditor({
  value,
  readOnly = false,
  onChange,
  optimize,
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>(
    readOnly ? 'preview' : 'write'
  );
  const [copied, setCopied] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [optimization, setOptimization] = useState<{
    original: string;
    optimized: string;
  } | null>(null);

  const showOptimize = Boolean(optimize) && readOnly;

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

  const handleOptimize = async () => {
    if (!optimize || optimizing) return;
    setOptimizing(true);
    const result = await optimizePrompt({ itemId: optimize.itemId });
    setOptimizing(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    if (result.data.optimized.trim() === result.data.original.trim()) {
      toast.success('Prompt is already well-structured — no changes suggested.');
      return;
    }
    setOptimization(result.data);
  };

  const handleAccept = async () => {
    if (!optimize || !optimization || accepting) return;
    setAccepting(true);
    const ok = await optimize.onAccept(optimization.optimized);
    setAccepting(false);
    if (ok) setOptimization(null);
  };

  const handleReject = () => {
    setOptimization(null);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-[#1e1e1e]">
      {/* Header with tabs and copy button */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-[#404040]">
        <div className="flex items-center gap-1">
          {!readOnly && (
            <button
              type="button"
              onClick={() => setActiveTab('write')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                activeTab === 'write'
                  ? 'bg-[#404040] text-[#cccccc]'
                  : 'text-[#858585] hover:text-[#cccccc]'
              }`}
            >
              Write
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              activeTab === 'preview'
                ? 'bg-[#404040] text-[#cccccc]'
                : 'text-[#858585] hover:text-[#cccccc]'
            }`}
          >
            Preview
          </button>
        </div>

        <div className="flex items-center gap-2">
          {showOptimize && optimize && (
            <EditorActionButton
              label="Optimize"
              isPro={optimize.isPro}
              loading={optimizing}
              disabled={optimizing || Boolean(optimization)}
              onClick={handleOptimize}
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

      {/* Body — content area or comparison */}
      {optimization ? (
        <OptimizationCompare
          original={optimization.original}
          optimized={optimization.optimized}
          accepting={accepting}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      ) : activeTab === 'write' && !readOnly ? (
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full resize-none bg-[#1e1e1e] p-3 font-mono text-xs text-[#d4d4d4] placeholder-[#858585] outline-none"
          style={{ minHeight: 80, maxHeight: 400 }}
          rows={12}
          placeholder="Write markdown here..."
        />
      ) : (
        <div
          className="markdown-preview overflow-auto p-4"
          style={{ maxHeight: 400, minHeight: 80 }}
        >
          {value ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {value}
            </ReactMarkdown>
          ) : (
            <p className="text-xs text-[#858585] italic">Nothing to preview</p>
          )}
        </div>
      )}
    </div>
  );
}

interface OptimizationCompareProps {
  original: string;
  optimized: string;
  accepting: boolean;
  onAccept: () => void;
  onReject: () => void;
}

function OptimizationCompare({
  original,
  optimized,
  accepting,
  onAccept,
  onReject,
}: OptimizationCompareProps) {
  return (
    <div
      className="flex flex-col"
      style={{ maxHeight: 480 }}
    >
      <div className="grid grid-cols-1 gap-px bg-[#404040] md:grid-cols-2">
        <div className="bg-[#1e1e1e] p-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#858585]">
            Original
          </p>
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[#d4d4d4]">
            {original}
          </pre>
        </div>
        <div className="bg-[#1e1e1e] p-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
            Optimized
          </p>
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[#d4d4d4]">
            {optimized}
          </pre>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-[#404040] bg-[#252525] px-3 py-2">
        <button
          type="button"
          onClick={onReject}
          disabled={accepting}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[#858585] transition-colors hover:bg-[#404040] hover:text-[#cccccc] disabled:opacity-60"
        >
          <X className="h-3.5 w-3.5" />
          Use original
        </button>
        <button
          type="button"
          onClick={onAccept}
          disabled={accepting}
          className="flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
        >
          {accepting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          {accepting ? 'Saving…' : 'Use optimized'}
        </button>
      </div>
    </div>
  );
}
