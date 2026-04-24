import type { CSSProperties } from 'react';
import type { FeatureCardData } from './data';

export function FeatureCard({ title, description, color, glyph }: FeatureCardData) {
  return (
    <article
      className="group rounded-xl border border-border bg-card/40 p-5 transition-colors hover:border-[color:var(--c)]/60 hover:bg-card/60"
      style={{ '--c': color } as CSSProperties}
    >
      <div
        className="mb-4 grid size-10 place-items-center rounded-md font-mono text-sm font-semibold ring-1 ring-[color:var(--c)]/30"
        style={{ background: 'color-mix(in oklab, var(--c) 14%, transparent)', color: 'var(--c)' }}
      >
        {glyph}
      </div>
      <h3 className="font-heading text-base font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
    </article>
  );
}
