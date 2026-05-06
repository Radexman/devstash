'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UpgradeButton } from '@/components/billing/UpgradeButton';
import { FREE_PLAN, PRO_PLAN } from './data';

export type Period = 'monthly' | 'yearly';

interface PricingPlansProps {
  initialPeriod?: Period;
  isAuthenticated: boolean;
  isPro: boolean;
}

export function PricingPlans({
  initialPeriod = 'monthly',
  isAuthenticated,
  isPro,
}: PricingPlansProps) {
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const proAmount = period === 'yearly' ? '$6' : '$8';
  const proPer = period === 'yearly' ? '/month, billed yearly' : '/month';

  return (
    <section id="pricing" className="border-t border-border/50 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Simple pricing. No surprises.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Start free. Upgrade when you outgrow it.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-full border border-border bg-card/50 p-1 text-sm">
            <PeriodButton
              active={period === 'monthly'}
              onClick={() => setPeriod('monthly')}
            >
              Monthly
            </PeriodButton>
            <PeriodButton
              active={period === 'yearly'}
              onClick={() => setPeriod('yearly')}
            >
              Yearly
              <span className="ml-2 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                save 25%
              </span>
            </PeriodButton>
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
          {!isPro && (
            <PlanCard
              name="Free"
              price="$0"
              per="forever"
              blurb="Perfect for trying things out."
              features={FREE_PLAN.features}
              cta={
                isAuthenticated
                  ? { kind: 'disabled', label: 'Your plan' }
                  : {
                      kind: 'link',
                      label: 'Get started',
                      href: '/register',
                      variant: 'outline',
                    }
              }
            />
          )}
          <PlanCard
            featured
            name="Pro"
            price={proAmount}
            per={proPer}
            blurb={
              period === 'yearly'
                ? '$72 billed yearly · Everything unlocked.'
                : 'Everything unlocked.'
            }
            features={PRO_PLAN.features}
            cta={
              !isAuthenticated
                ? {
                    kind: 'link',
                    label: 'Upgrade to Pro',
                    href: '/register',
                    variant: 'default',
                  }
                : isPro
                  ? { kind: 'disabled', label: 'Current plan' }
                  : { kind: 'upgrade', label: 'Upgrade to Pro', period }
            }
          />
        </div>
      </div>
    </section>
  );
}

function PeriodButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full px-4 py-1.5 transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

type Cta =
  | { kind: 'link'; label: string; href: string; variant: 'default' | 'outline' }
  | { kind: 'disabled'; label: string }
  | { kind: 'upgrade'; label: string; period: Period };

type PlanCardProps = {
  name: string;
  price: string;
  per: string;
  blurb: string;
  features: string[];
  cta: Cta;
  featured?: boolean;
};

function PlanCard({
  name,
  price,
  per,
  blurb,
  features,
  cta,
  featured,
}: PlanCardProps) {
  return (
    <article
      className={cn(
        'relative flex flex-col rounded-2xl border bg-card/40 p-6',
        featured
          ? 'border-indigo-500/40 shadow-lg shadow-indigo-500/10'
          : 'border-border',
      )}
    >
      {featured && (
        <Badge className="absolute -top-3 left-6 bg-indigo-500 text-white">
          Most popular
        </Badge>
      )}
      <header>
        <h3 className="font-heading text-lg font-semibold">{name}</h3>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-heading text-4xl font-bold tracking-tight">
            {price}
          </span>
          <span className="text-sm text-muted-foreground">{per}</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{blurb}</p>
      </header>
      <ul className="mt-6 flex-1 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <CtaSlot cta={cta} />
    </article>
  );
}

function CtaSlot({ cta }: { cta: Cta }) {
  if (cta.kind === 'link') {
    return (
      <Link
        href={cta.href}
        className={cn(buttonVariants({ variant: cta.variant }), 'mt-6 w-full')}
      >
        {cta.label}
      </Link>
    );
  }
  if (cta.kind === 'disabled') {
    return (
      <div
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'mt-6 w-full cursor-not-allowed opacity-60',
        )}
        aria-disabled="true"
      >
        {cta.label}
      </div>
    );
  }
  return (
    <UpgradeButton interval={cta.period} className="mt-6 w-full">
      {cta.label}
    </UpgradeButton>
  );
}
