'use client';

import { Crown, Loader2, Sparkles } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const EDITOR_CHROME_BUTTON_CLASS =
  'flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-[#858585] transition-colors hover:bg-[#404040] hover:text-[#cccccc]';

interface EditorActionButtonProps {
  label: string;
  isPro: boolean;
  loading: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function EditorActionButton({
  label,
  isPro,
  loading,
  disabled,
  onClick,
}: EditorActionButtonProps) {
  if (!isPro) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            type="button"
            aria-label="AI features require Pro subscription"
            className={EDITOR_CHROME_BUTTON_CLASS}
          >
            <Crown className="h-3.5 w-3.5" />
            {label}
          </TooltipTrigger>
          <TooltipContent>AI features require Pro subscription</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${label} with AI`}
      className={`${EDITOR_CHROME_BUTTON_CLASS} disabled:opacity-60`}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Sparkles className="h-3.5 w-3.5" />
      )}
      {label}
    </button>
  );
}
