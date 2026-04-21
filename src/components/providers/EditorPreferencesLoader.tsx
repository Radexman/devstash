import { type ReactNode } from 'react';
import { auth } from '@/auth';
import { getEditorPreferences } from '@/lib/db/users';
import { DEFAULT_EDITOR_PREFERENCES } from '@/lib/editor-preferences';
import { EditorPreferencesProvider } from './EditorPreferencesProvider';

export async function EditorPreferencesLoader({ children }: { children: ReactNode }) {
  const session = await auth();
  const preferences = session?.user?.id
    ? await getEditorPreferences(session.user.id)
    : DEFAULT_EDITOR_PREFERENCES;

  return (
    <EditorPreferencesProvider initialPreferences={preferences}>
      {children}
    </EditorPreferencesProvider>
  );
}
