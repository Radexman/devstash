import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { AI_CHECKLIST, AI_DEMO_TAGS } from './data';

export function AiSection() {
  return (
    <section className="border-t border-border/50 py-20">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-2 lg:items-center">
        <div>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="size-3" /> Pro feature
          </Badge>
          <h2 className="font-heading mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            AI that knows{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              your
            </span>{' '}
            codebase
          </h2>
          <p className="mt-3 text-muted-foreground">
            DevStash can read what you save and do the boring parts for you — tagging, summarizing,
            explaining, and sharpening.
          </p>
          <ul className="mt-6 space-y-3">
            {AI_CHECKLIST.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
                  <Check className="size-3" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Link href="/register" className={buttonVariants({ className: 'mt-7' })}>
            Try Pro free for 7 days
          </Link>
        </div>

        <EditorMockup />
      </div>
    </section>
  );
}

function EditorMockup() {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border bg-[#1e1e1e] shadow-2xl">
        <div className="flex items-center gap-2 border-b border-border/50 px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-[#ff5f56]" />
          <span className="size-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="size-2.5 rounded-full bg-[#27c93f]" />
          <span className="ml-3 font-mono text-xs text-muted-foreground">debounce.ts</span>
        </div>
        <pre className="overflow-x-auto px-4 py-3 font-mono text-xs leading-relaxed">
          <Line n={1}>
            <K>export function</K> <F>debounce</F>
            {'<T '}
            <K>extends</K> {'(...args: '}
            <T>unknown</T>
            {'[]) => '}
            <T>unknown</T>
            {'>('}
          </Line>
          <Line n={2}>{'  fn: T,'}</Line>
          <Line n={3}>
            {'  ms: '}
            <T>number</T>
          </Line>
          <Line n={4}>{') {'}</Line>
          <Line n={5}>
            {'  '}
            <K>let</K> {'t: '}
            <T>ReturnType</T>
            {'<'}
            <T>typeof</T>
            {' setTimeout> | '}
            <T>null</T>
            {' = '}
            <T>null</T>
            {';'}
          </Line>
          <Line n={6}>
            {'  '}
            <K>return</K> {'(...args: '}
            <T>Parameters</T>
            {'<T>) => {'}
          </Line>
          <Line n={7}>
            {'    '}
            <K>if</K> {'(t) '}
            <F>clearTimeout</F>
            {'(t);'}
          </Line>
          <Line n={8}>
            {'    t = '}
            <F>setTimeout</F>
            {'(() => fn(...args), ms);'}
          </Line>
          <Line n={9}>{'  };'}</Line>
          <Line n={10}>{'}'}</Line>
        </pre>
      </div>

      <div className="rounded-xl border border-border bg-card/40 p-4">
        <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="size-3 text-indigo-400" /> AI generated tags
        </div>
        <div className="flex flex-wrap gap-2">
          {AI_DEMO_TAGS.map((tag) => (
            <span
              key={tag.label}
              className="rounded-full px-2.5 py-1 font-mono text-xs ring-1 ring-[color:var(--c)]/30"
              style={
                {
                  '--c': tag.color,
                  background: 'color-mix(in oklab, var(--c) 14%, transparent)',
                  color: 'var(--c)',
                } as CSSProperties
              }
            >
              {tag.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Line({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div>
      <span className="mr-4 inline-block w-6 select-none text-right text-muted-foreground/40">{n}</span>
      <span className="text-[#d4d4d4]">{children}</span>
    </div>
  );
}

function K({ children }: { children: React.ReactNode }) {
  return <span className="text-[#c586c0]">{children}</span>;
}
function F({ children }: { children: React.ReactNode }) {
  return <span className="text-[#dcdcaa]">{children}</span>;
}
function T({ children }: { children: React.ReactNode }) {
  return <span className="text-[#4ec9b0]">{children}</span>;
}
