import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/auth';
import { PricingPlans } from '@/components/home/PricingPlans';

export const metadata = {
	title: 'Upgrade to Pro · DevStash',
	description:
		'Unlock unlimited items and collections, AI features, and exports.',
};

export default async function UpgradePage() {
	const session = await auth();

	if (!session?.user) {
		redirect('/sign-in');
	}

	const isPro = Boolean(session.user.isPro);

	return (
		<div className='min-h-screen bg-background'>
			<header className='border-b border-border px-6 py-3'>
				<div className='mx-auto flex max-w-5xl items-center gap-3'>
					<Link
						href='/dashboard'
						className='flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground'
					>
						<ArrowLeft className='h-4 w-4' />
						Back to Dashboard
					</Link>
				</div>
			</header>
			<main>
				<PricingPlans
					isAuthenticated
					isPro={isPro}
				/>
			</main>
		</div>
	);
}
