import { Badge } from '@/components/ui/badge';

interface ProBadgeProps {
  size?: 'sm' | 'default';
  className?: string;
}

export function ProBadge({ size = 'sm', className }: ProBadgeProps) {
  const sizeClass =
    size === 'sm' ? 'h-4 px-1.5 text-[10px] font-semibold tracking-wide' : '';
  return (
    <Badge
      className={`bg-indigo-500 text-white ${sizeClass} ${className ?? ''}`.trim()}
    >
      PRO
    </Badge>
  );
}
