import { useState } from 'react';

export function useControlledOpen(
  controlledOpen: boolean | undefined,
  onOpenChange?: (open: boolean) => void,
): { open: boolean; setOpen: (next: boolean) => void; isControlled: boolean } {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };
  return { open, setOpen, isControlled };
}
