import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Logo } from './Logo';
import { NavbarScroll } from './NavbarScroll';

export function Navbar() {
  return (
    <>
      <NavbarScroll />
      <header
        id="home-nav"
        className="fixed inset-x-0 top-0 z-50 h-16 border-b border-transparent transition-colors data-[scrolled=true]:border-border data-[scrolled=true]:bg-background/80 data-[scrolled=true]:backdrop-blur"
      >
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/sign-in" className={buttonVariants({ variant: 'ghost' })}>
              Sign in
            </Link>
            <Link href="/register" className={buttonVariants()}>
              Get started
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
