import { ReactNode } from 'react';

import { getPublicGameDataActions } from '@/lib/gameData/publicActions';

import { ClientProviders } from './ClientProviders';

type ClientProvidersWithInitialDataProps = {
  children: ReactNode;
};

export async function ClientProvidersWithInitialData({
  children,
}: ClientProvidersWithInitialDataProps) {
  const initialPublicActions = await getPublicGameDataActions();
  return <ClientProviders initialPublicActions={initialPublicActions}>{children}</ClientProviders>;
}
