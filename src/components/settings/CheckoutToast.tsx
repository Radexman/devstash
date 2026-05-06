'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export function CheckoutToast() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get('checkout');

  useEffect(() => {
    if (status === 'success') {
      toast.success('Welcome to DevStash Pro! It may take a moment to activate.');
      router.replace('/settings');
    } else if (status === 'cancel') {
      toast('Checkout cancelled.');
      router.replace('/settings');
    }
  }, [status, router]);

  return null;
}
