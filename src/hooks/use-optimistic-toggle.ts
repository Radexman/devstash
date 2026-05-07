'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { ActionResult } from '@/types/action';

interface OptimisticToggleOptions<TData> {
  applyOptimistic: () => void;
  rollback: () => void;
  applyResult: (data: TData) => void;
  successMessage?: (data: TData) => string;
}

export function useOptimisticToggle<TData>(
  action: () => Promise<ActionResult<TData>>,
  options: OptimisticToggleOptions<TData>,
): { run: () => Promise<void>; busy: boolean } {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (busy) return;
    options.applyOptimistic();
    setBusy(true);
    const result = await action();
    setBusy(false);
    if (!result.success) {
      options.rollback();
      toast.error(result.error);
      return;
    }
    options.applyResult(result.data);
    if (options.successMessage) {
      toast.success(options.successMessage(result.data));
    }
    router.refresh();
  };

  return { run, busy };
}
