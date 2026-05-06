'use client';

import { useState } from 'react';
import { Check, Loader2, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { generateAutoTags } from '@/actions/ai';

interface SuggestTagsButtonProps {
	isPro: boolean;
	/** Returns the current draft snapshot at click time. */
	getDraft: () => {
		title: string;
		description?: string | null;
		content?: string | null;
	};
	/** Tags already on the item — used to filter duplicate suggestions. */
	existingTags: string[];
	/** Called when the user accepts a suggestion. */
	onAdd: (tag: string) => void;
}

export function SuggestTagsButton({
	isPro,
	getDraft,
	existingTags,
	onAdd,
}: SuggestTagsButtonProps) {
	const [loading, setLoading] = useState(false);
	const [suggestions, setSuggestions] = useState<string[]>([]);

	if (!isPro) return null;

	const handleSuggest = async () => {
		const draft = getDraft();
		if (!draft.title || draft.title.trim().length === 0) {
			toast.error('Add a title first to suggest tags');
			return;
		}

		setLoading(true);
		const result = await generateAutoTags(draft);
		setLoading(false);

		if (!result.success) {
			toast.error(result.error);
			return;
		}

		const existing = new Set(existingTags.map((t) => t.toLowerCase().trim()));
		const fresh = result.data.tags.filter((t) => !existing.has(t));
		if (fresh.length === 0) {
			toast.info('No new tag suggestions — try editing the content.');
			return;
		}
		setSuggestions(fresh);
	};

	const handleAccept = (tag: string) => {
		onAdd(tag);
		setSuggestions((prev) => prev.filter((t) => t !== tag));
	};

	const handleReject = (tag: string) => {
		setSuggestions((prev) => prev.filter((t) => t !== tag));
	};

	return (
		<div className="space-y-2">
			<Button
				type="button"
				variant="ghost"
				size="sm"
				onClick={handleSuggest}
				disabled={loading}
				className="h-8 px-2 text-xs"
			>
				{loading ? (
					<Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
				) : (
					<Sparkles className="mr-1 h-3.5 w-3.5" />
				)}
				{loading ? 'Thinking…' : 'Suggest tags'}
			</Button>

			{suggestions.length > 0 && (
				<div
					className="flex flex-wrap items-center gap-1.5 rounded-md border border-dashed border-border bg-muted/30 p-2"
					aria-live="polite"
				>
					<span className="mr-1 text-xs text-muted-foreground">Suggested:</span>
					{suggestions.map((tag) => (
						<Badge
							key={tag}
							variant="secondary"
							className="gap-1 pr-1"
						>
							<span>{tag}</span>
							<button
								type="button"
								onClick={() => handleAccept(tag)}
								aria-label={`Accept ${tag}`}
								className="inline-flex h-4 w-4 items-center justify-center rounded text-emerald-500 hover:bg-emerald-500/10"
							>
								<Check className="h-3 w-3" />
							</button>
							<button
								type="button"
								onClick={() => handleReject(tag)}
								aria-label={`Reject ${tag}`}
								className="inline-flex h-4 w-4 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					))}
				</div>
			)}
		</div>
	);
}
