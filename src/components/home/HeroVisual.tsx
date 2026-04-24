import { ChaosStage } from './ChaosStage';
import { DashboardMock } from './DashboardMock';

export function HeroVisual() {
  return (
    <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
      <VisualBox label="Your knowledge today…">
        <ChaosStage />
      </VisualBox>
      <div className="flex justify-center">
        <svg
          viewBox="0 0 64 32"
          className="h-8 w-16 animate-pulse text-muted-foreground lg:rotate-0 rotate-90"
          aria-hidden
        >
          <defs>
            <linearGradient id="arrowGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#6366f1" />
              <stop offset="1" stopColor="#10b981" />
            </linearGradient>
          </defs>
          <path
            d="M2 16 L50 16 M38 4 L50 16 L38 28"
            fill="none"
            stroke="url(#arrowGrad)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <VisualBox label="…with DevStash">
        <DashboardMock />
      </VisualBox>
    </div>
  );
}

function VisualBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-3 shadow-lg">
      <div className="mb-2 px-1 text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}
