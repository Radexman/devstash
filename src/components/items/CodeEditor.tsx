'use client';

import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface CodeEditorProps {
  value: string;
  language?: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
}

export function CodeEditor({
  value,
  language = 'plaintext',
  readOnly = false,
  onChange,
}: CodeEditorProps) {
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

  const lineCount = value.split('\n').length;
  const editorHeight = Math.min(Math.max(lineCount * 19 + 16, 80), 400);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-[#1e1e1e]">
      {/* macOS-style title bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-[#404040]">
        <div className="flex items-center gap-2">
          {/* Traffic light dots */}
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <div className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {language && language !== 'plaintext' && (
            <span className="text-xs text-[#858585]">{language}</span>
          )}
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
      </div>

      {/* Monaco Editor */}
      <Editor
        height={editorHeight}
        language={language}
        value={value}
        theme="vs-dark"
        onChange={(v) => onChange?.(v ?? '')}
        options={{
          readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
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
          wordWrap: 'on',
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
    </div>
  );
}
