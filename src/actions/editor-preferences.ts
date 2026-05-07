'use server';

import {
  editorPreferencesSchema,
  type EditorPreferences,
} from '@/lib/editor-preferences';
import { updateEditorPreferences as updateEditorPreferencesQuery } from '@/lib/db/users';
import { parseOrFail, requireUserId } from '@/lib/action-helpers';
import type { ActionResult } from '@/types/action';

export async function updateEditorPreferences(
  payload: EditorPreferences,
): Promise<ActionResult<EditorPreferences>> {
  const session = await requireUserId();
  if (!session.ok) return { success: false, error: session.error };

  const parsed = parseOrFail(editorPreferencesSchema, payload);
  if (!parsed.ok) return { success: false, error: parsed.error };

  try {
    const updated = await updateEditorPreferencesQuery(
      session.userId,
      parsed.data,
    );
    return { success: true, data: updated };
  } catch {
    return { success: false, error: 'Failed to update preferences' };
  }
}
