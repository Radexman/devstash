import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getBillingProfile } from '@/lib/db/billing';
import { FREE_LIMITS } from '@/lib/plan-limits';
import { UpgradeButton } from '@/components/billing/UpgradeButton';
import { ManageSubscriptionButton } from '@/components/billing/ManageSubscriptionButton';

function formatRenewDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface SubscriptionCardProps {
  userId: string;
}

export async function SubscriptionCard({ userId }: SubscriptionCardProps) {
  const profile = await getBillingProfile(userId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
      </CardHeader>
      <CardContent>
        {profile?.isPro ? <ProSection profile={profile} /> : <FreeSection />}
      </CardContent>
    </Card>
  );
}

function ProSection({
  profile,
}: {
  profile: NonNullable<Awaited<ReturnType<typeof getBillingProfile>>>;
}) {
  const renewLine = profile.stripeCurrentPeriodEnd
    ? `Renews on ${formatRenewDate(profile.stripeCurrentPeriodEnd)}`
    : 'Active subscription';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-400">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="flex items-center gap-2 text-sm font-medium">
            DevStash Pro
            <Badge className="bg-indigo-500 text-white">PRO</Badge>
          </p>
          <p className="text-xs text-muted-foreground">{renewLine}</p>
        </div>
      </div>
      <Separator />
      <div>
        <p className="mb-3 text-xs text-muted-foreground">
          Manage payment method, switch plan, or cancel — handled by Stripe.
        </p>
        <ManageSubscriptionButton />
      </div>
    </div>
  );
}

function FreeSection() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium">Free plan</p>
        <p className="text-xs text-muted-foreground">
          Up to {FREE_LIMITS.items} items and {FREE_LIMITS.collections}{' '}
          collections.
        </p>
      </div>
      <Separator />
      <div className="space-y-3">
        <p className="text-sm font-medium">Upgrade to Pro</p>
        <ul className="ml-4 list-disc space-y-1 text-xs text-muted-foreground">
          <li>Unlimited items and collections</li>
          <li>AI auto-tagging, summaries, and code explanations</li>
          <li>JSON / ZIP export</li>
        </ul>
        <div className="flex flex-col gap-2 sm:flex-row">
          <UpgradeButton interval="monthly">$8 / month — Monthly</UpgradeButton>
          <UpgradeButton interval="yearly" variant="outline">
            $6 / month, billed yearly · $72
          </UpgradeButton>
        </div>
      </div>
    </div>
  );
}
