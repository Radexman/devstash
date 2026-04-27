import Link from 'next/link';
import { Folder } from 'lucide-react';
import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
  href?: string;
  labelClassName?: string;
};

export function Logo({ className, href = '/', labelClassName }: LogoProps) {
  return (
    <Link
      href={href}
      aria-label="DevStash home"
      className={cn('flex items-center gap-2 font-heading font-semibold', className)}
    >
      <span
        aria-hidden
        className="grid size-7 place-items-center rounded-md bg-linear-to-br from-indigo-500 to-emerald-500 text-white"
      >
        <Folder className="h-4 w-4" />
      </span>
      <span className={labelClassName}>DevStash</span>
    </Link>
  );
}
