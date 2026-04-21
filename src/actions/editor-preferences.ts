'use server';

import { auth } from '@/auth';
import {
  editorPreferencesSchema,
  type EditorPreferences,
} from '@/lib/editor-preferences';
import { updateEditorPreferences as updateEditorPreferencesQuery } from '@/lib/db/users';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function updateEditorPreferences(
  payload: EditorPreferences,
): Promise<ActionResult<EditorPreferences>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = editorPreferencesSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? 'Invalid input' };
  }

  try {
    const updated = await updateEditorPreferencesQuery(
      session.user.id,
      parsed.data,
    );
    return { success: true, data: updated };
  } catch {
    return { success: false, error: 'Failed to update preferences' };
  }
}
