import { auth } from '@/auth';
import { PricingPlans } from './PricingPlans';

export async function Pricing() {
  const session = await auth();
  const isAuthenticated = Boolean(session?.user);
  const isPro = Boolean(session?.user?.isPro);

  return <PricingPlans isAuthenticated={isAuthenticated} isPro={isPro} />;
}
