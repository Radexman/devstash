import { UpgradeButton } from '@/components/billing/UpgradeButton';

interface FreeLimitBannerProps {
  message: string;
}

export function FreeLimitBanner({ message }: FreeLimitBannerProps) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-amber-200">{message}</p>
      <UpgradeButton interval="monthly">Upgrade</UpgradeButton>
    </div>
  );
}
