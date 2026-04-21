'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import {
  DEFAULT_EDITOR_PREFERENCES,
  type EditorPreferences,
} from '@/lib/editor-preferences';
import { updateEditorPreferences as updateEditorPreferencesAction } from '@/actions/editor-preferences';

interface EditorPreferencesContextValue {
  preferences: EditorPreferences;
  updatePreferences: (next: EditorPreferences) => Promise<void>;
}

const EditorPreferencesContext =
  createContext<EditorPreferencesContextValue | null>(null);

export function useEditorPreferences(): EditorPreferencesContextValue {
  const ctx = useContext(EditorPreferencesContext);
  if (!ctx) {
    return {
      preferences: DEFAULT_EDITOR_PREFERENCES,
      updatePreferences: async () => {},
    };
  }
  return ctx;
}

export function EditorPreferencesProvider({
  initialPreferences,
  children,
}: {
  initialPreferences: EditorPreferences;
  children: ReactNode;
}) {
  const [preferences, setPreferences] =
    useState<EditorPreferences>(initialPreferences);

  const updatePreferences = useCallback(async (next: EditorPreferences) => {
    const previous = preferences;
    setPreferences(next);
    const result = await updateEditorPreferencesAction(next);
    if (!result.success) {
      setPreferences(previous);
      toast.error(result.error);
      return;
    }
    toast.success('Preferences saved');
  }, [preferences]);

  return (
    <EditorPreferencesContext.Provider value={{ preferences, updatePreferences }}>
      {children}
    </EditorPreferencesContext.Provider>
  );
}
