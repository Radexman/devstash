'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { createPortalSession } from '@/actions/billing';

interface ManageSubscriptionButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  className?: string;
  children?: React.ReactNode;
}

export function ManageSubscriptionButton({
  variant = 'outline',
  className,
  children,
}: ManageSubscriptionButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const result = await createPortalSession();
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
      {loading ? 'Opening…' : (children ?? 'Manage subscription')}
    </Button>
  );
}
