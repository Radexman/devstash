import { DASH_MOCK_ITEMS, DASH_MOCK_NAV } from './data';

export function DashboardMock() {
  return (
    <div className="grid h-60 grid-cols-[110px_1fr] gap-2 overflow-hidden rounded-lg border border-border/60 bg-background/40 p-2 text-[11px]">
      <aside className="flex flex-col gap-2 rounded-md bg-card/60 p-2 ring-1 ring-border/50">
        <div className="flex items-center gap-1.5 font-semibold">
          <span className="size-2 rounded-sm bg-gradient-to-br from-indigo-500 to-emerald-500" />
          <span>DevStash</span>
        </div>
        <div className="mt-1 flex flex-col gap-1">
          {DASH_MOCK_NAV.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-1.5 rounded px-1.5 py-1 ${
                item.active ? 'bg-muted/60 text-foreground' : 'text-muted-foreground'
              }`}
            >
              <span className="size-2 rounded-sm" style={{ background: item.color }} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </aside>
      <div className="flex flex-col gap-2 overflow-hidden">
        <div className="h-6 rounded-md bg-card/60 ring-1 ring-border/50" />
        <div className="grid flex-1 grid-cols-3 gap-1.5 overflow-hidden">
          {DASH_MOCK_ITEMS.map((card) => (
            <div
              key={card.title}
              className="flex min-w-0 flex-col justify-center gap-0.5 rounded-md border-t-2 bg-card/60 px-2 py-1.5 ring-1 ring-border/50"
              style={{ borderTopColor: card.color }}
            >
              <div className="truncate font-medium text-foreground">{card.title}</div>
              <div className="truncate text-[10px] text-muted-foreground">{card.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
