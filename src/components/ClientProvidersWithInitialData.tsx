import { ReactNode } from 'react';

import { fetchPublicGameDataActions } from '@/lib/gameData/publicActions';

import { ClientProviders } from './ClientProviders';

type ClientProvidersWithInitialDataProps = {
  children: ReactNode;
};

export async function ClientProvidersWithInitialData({
  children,
}: ClientProvidersWithInitialDataProps) {
  const initialPublicActions = await fetchPublicGameDataActions();
  return <ClientProviders initialPublicActions={initialPublicActions}>{children}</ClientProviders>;
}
