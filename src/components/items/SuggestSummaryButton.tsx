'use client';

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { generateSummary, type GenerateSummaryPayload } from '@/actions/ai';

interface SuggestSummaryButtonProps {
	isPro: boolean;
	/** Returns the current draft snapshot at click time. */
	getDraft: () => GenerateSummaryPayload;
	/** Called with the generated summary; replaces the description field. */
	onSummary: (summary: string) => void;
}

export function SuggestSummaryButton({
	isPro,
	getDraft,
	onSummary,
}: SuggestSummaryButtonProps) {
	const [loading, setLoading] = useState(false);

	if (!isPro) return null;

	const handleClick = async () => {
		const draft = getDraft();
		if (!draft.title || draft.title.trim().length === 0) {
			toast.error('Add a title first to generate a summary');
			return;
		}

		setLoading(true);
		const result = await generateSummary(draft);
		setLoading(false);

		if (!result.success) {
			toast.error(result.error);
			return;
		}

		onSummary(result.data.summary);
		toast.success('Description generated');
	};

	return (
		<Button
			type="button"
			variant="ghost"
			size="sm"
			onClick={handleClick}
			disabled={loading}
			className="h-7 px-2 text-xs"
			aria-label="Generate description with AI"
		>
			{loading ? (
				<Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
			) : (
				<Sparkles className="mr-1 h-3.5 w-3.5" />
			)}
			{loading ? 'Thinking…' : 'Generate description'}
		</Button>
	);
}
