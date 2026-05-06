'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { createCheckoutSession } from '@/actions/billing';
import type { BillingInterval } from '@/lib/stripe';

interface UpgradeButtonProps {
  interval: BillingInterval;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  className?: string;
  children?: React.ReactNode;
}

export function UpgradeButton({
  interval,
  variant = 'default',
  className,
  children,
}: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const result = await createCheckoutSession({ interval });
    if (!result.success) {
      setLoading(false);
      toast.error(result.error);
      return;
    }
    window.location.href = result.data.url;
  };

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      variant={variant}
      className={className}
    >
      {loading ? 'Redirecting…' : (children ?? 'Upgrade')}
    </Button>
  );
}
