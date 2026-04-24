import { Logo } from './Logo';
import { FOOTER_COLUMNS } from './data';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border/50 py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              One hub for all your developer knowledge.
            </p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {col.heading}
              </h4>
              <ul className="mt-3 space-y-2 text-sm">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-foreground/80 hover:text-foreground">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-border/50 pt-6 text-xs text-muted-foreground">
          © {year} DevStash. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
