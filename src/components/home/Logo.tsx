import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="DevStash home"
      className={cn('flex items-center gap-2 font-heading font-semibold', className)}
    >
      <span
        aria-hidden
        className="grid size-7 place-items-center rounded-md bg-gradient-to-br from-indigo-500 to-emerald-500 text-sm font-bold text-white"
      >
        D
      </span>
      <span>DevStash</span>
    </Link>
  );
}
