import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { HeroVisual } from './HeroVisual';

export function Hero() {
  return (
    <section className="relative pb-16 pt-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full border border-border bg-card/50 px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground">
            Developer knowledge hub
          </span>
          <h1 className="font-heading mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Stop Losing Your{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
              Developer Knowledge
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Your snippets, prompts, commands, notes, and links — scattered across a dozen tools.
            DevStash pulls them all into one fast, searchable, AI-enhanced hub.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className={cn(buttonVariants({ size: 'lg' }), 'px-5')}>
              Get started free
            </Link>
            <Link
              href="#features"
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'px-5')}
            >
              See how it works
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Free forever for 50 items · No credit card required
          </p>
        </div>

        <div className="mt-14">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
