import { toast } from 'sonner';

export async function copyItemContent(item: { content: string | null; url: string | null }) {
	const text = item.content ?? item.url ?? '';
	if (!text) {
		toast.error('Nothing to copy');
		return;
	}
	try {
		await navigator.clipboard.writeText(text);
		toast.success('Copied to clipboard');
	} catch {
		toast.error('Failed to copy');
	}
}
