'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

import type { PublicActionRow } from '@/lib/gameData/publicActionsTypes';

interface PublicActionsContextValue {
  actions: PublicActionRow[];
  setActions: (actions: PublicActionRow[]) => void;
}

const PublicActionsContext = createContext<PublicActionsContextValue | null>(null);

export function PublicActionsProvider({
  children,
  initialActions,
}: {
  children: ReactNode;
  initialActions?: PublicActionRow[] | undefined;
}) {
  const [actions, setActions] = useState<PublicActionRow[]>(initialActions ?? []);

  return (
    <PublicActionsContext.Provider value={{ actions, setActions }}>
      {children}
    </PublicActionsContext.Provider>
  );
}

export function usePublicActionsContext(): PublicActionsContextValue {
  const context = useContext(PublicActionsContext);
  if (!context) {
    return { actions: [], setActions: () => {} };
  }
  return context;
}
