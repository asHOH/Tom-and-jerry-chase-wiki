import { ReactNode } from 'react';

import {
  fetchPublicGameDataActionHistory,
  fetchPublicGameDataActions,
} from '@/lib/gameData/publicActions';

import { ClientProviders } from './ClientProviders';

type ClientProvidersWithInitialDataProps = {
  children: ReactNode;
};

export async function ClientProvidersWithInitialData({
  children,
}: ClientProvidersWithInitialDataProps) {
  const [initialPublicActions, initialWikiHistoryActions] = await Promise.all([
    fetchPublicGameDataActions(),
    fetchPublicGameDataActionHistory(),
  ]);

  return (
    <ClientProviders
      initialPublicActions={initialPublicActions}
      initialWikiHistoryActions={initialWikiHistoryActions}
    >
      {children}
    </ClientProviders>
  );
}
