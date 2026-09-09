'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';

import type {
  AdminGameDataActionsResponse,
  GameDataActionStatusFilter,
} from '@/lib/gameData/adminActionTypes';
import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';
import { getOptionalSupabaseBrowserClient } from '@/lib/supabase/browserClient';

type Filters = readonly [GameDataActionStatusFilter, PublishableEntityType | null, string | null];
type PageKey = readonly ['game-data-actions-admin', ...Filters, number, string];
type Totals = Pick<AdminGameDataActionsResponse, 'totalCount' | 'totalPages'>;
type PageResponse = Omit<AdminGameDataActionsResponse, keyof Totals> & {
  totalCount: number | null;
  totalPages: number | null;
};

export function useGameDataActionList(
  enabled: boolean,
  filters: Filters,
  page: number,
  permissionContext: string
) {
  const instance = useId();
  const [revision, setRevision] = useState(0);
  const { scope, totals } = useMemo(
    () => ({
      scope: `${instance}:${revision}:${permissionContext}`,
      totals: new Map<string, Totals>(),
    }),
    [instance, revision, permissionContext]
  );
  const { mutate } = useSWRConfig();

  useEffect(() => {
    const client = getOptionalSupabaseBrowserClient();
    if (!client) return;
    let userId: string | null | undefined;
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user.id ?? null;
      if (userId !== undefined && userId !== nextUserId) setRevision((value) => value + 1);
      userId = nextUserId;
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    void mutate(
      (key) =>
        Array.isArray(key) &&
        key[0] === 'game-data-actions-admin' &&
        typeof key[5] === 'string' &&
        key[5].startsWith(`${instance}:`) &&
        key[5] !== scope,
      undefined,
      { revalidate: false }
    );
  }, [instance, mutate, scope]);

  const result = useSWR<AdminGameDataActionsResponse>(
    enabled ? (['game-data-actions-admin', ...filters, page, scope] as const) : null,
    async ([, status, entityType, actionId, requestedPage]: PageKey) => {
      const filterKey = JSON.stringify([status, entityType, actionId]);
      const cachedTotals = totals.get(filterKey);
      const params = new URLSearchParams({ status, page: String(requestedPage) });
      if (entityType !== null) params.set('entityType', entityType);
      if (actionId !== null) params.set('actionId', actionId);
      if (cachedTotals) params.set('count', 'none');
      const response = await fetch(`/api/game-data-actions/admin?${params}`);
      if (!response.ok) throw new Error('改动列表加载失败，请重试刷新');
      const payload = (await response.json()) as PageResponse;
      const metadata =
        payload.totalCount !== null && payload.totalPages !== null
          ? { totalCount: payload.totalCount, totalPages: payload.totalPages }
          : cachedTotals;
      if (!metadata) throw new Error('改动总数加载失败，请重试刷新');
      totals.set(filterKey, metadata);
      return {
        ...payload,
        ...metadata,
        currentPage: metadata.totalCount === 0 ? 0 : requestedPage,
      };
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      shouldRetryOnError: false,
    }
  );

  return { ...result, refresh: () => setRevision((value) => value + 1), scope };
}
