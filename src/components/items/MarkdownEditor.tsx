'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface MarkdownEditorProps {
  value: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
}

export function MarkdownEditor({
  value,
  readOnly = false,
  onChange,
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>(
    readOnly ? 'preview' : 'write'
  );
  const [copied, setCopied] = useState(false);

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

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-[#858585] transition-colors hover:bg-[#404040] hover:text-[#cccccc]"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Content area */}
      {activeTab === 'write' && !readOnly ? (
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
