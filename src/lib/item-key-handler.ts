import type { KeyboardEvent } from 'react';

export function makeItemKeyHandler<T extends HTMLElement>(
  open: () => void,
): (e: KeyboardEvent<T>) => void {
  return (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  };
}
