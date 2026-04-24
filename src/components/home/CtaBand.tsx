import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function CtaBand() {
  return (
    <section className="border-t border-border/50 py-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to organize your knowledge?
        </h2>
        <p className="mt-3 text-muted-foreground">
          Two minutes to set up. A lifetime to never lose a snippet again.
        </p>
        <Link
          href="/register"
          className={cn(buttonVariants({ size: 'lg' }), 'mt-7 px-6')}
        >
          Get started free
        </Link>
      </div>
    </section>
  );
}
