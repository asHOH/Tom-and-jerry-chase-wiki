import { ReactNode } from 'react';

import { getPublicGameDataActionsAndApplyToServerData } from '@/lib/gameData/publicActions';

import { ClientProviders } from './ClientProviders';

type ClientProvidersWithInitialDataProps = {
  children: ReactNode;
};

export async function ClientProvidersWithInitialData({
  children,
}: ClientProvidersWithInitialDataProps) {
  const initialPublicActions = await getPublicGameDataActionsAndApplyToServerData();
  return <ClientProviders initialPublicActions={initialPublicActions}>{children}</ClientProviders>;
}
