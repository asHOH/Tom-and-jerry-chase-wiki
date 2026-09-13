'use client';

import { useEffect, useState } from 'react';

import type { GameDataActionStatusFilter } from '@/lib/gameData/adminActionTypes';
import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';

import { useGameDataActionList } from './useGameDataActionList';

// Keep this hook mounted when switching tabs so applied filters and the page survive.
export function useGameDataModerationList(enabled: boolean, permissionContext: string) {
  const [actionStatus, setActionStatus] = useState<GameDataActionStatusFilter>('pending');
  const [actionEntityType, setActionEntityType] = useState<PublishableEntityType | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionPage, setActionPage] = useState(1);
  const [loadedPendingCount, setLoadedPendingCount] = useState<number | null>(null);

  const {
    data: actionData,
    error: actionError,
    isLoading: isLoadingActions,
    isValidating: isValidatingActions,
    refresh: refreshActions,
    scope: actionCacheScope,
  } = useGameDataActionList(
    enabled,
    [actionStatus, actionEntityType, actionId],
    actionPage,
    permissionContext
  );
  const mutatePendingActions = () => {
    setLoadedPendingCount(null);
    refreshActions();
  };
  useEffect(() => setLoadedPendingCount(null), [actionCacheScope]);
  const pendingActions = actionData?.submissions ?? [];

  useEffect(() => {
    if (
      !enabled ||
      actionStatus !== 'pending' ||
      actionEntityType !== null ||
      actionId !== null ||
      actionData === undefined
    ) {
      return;
    }
    setLoadedPendingCount(actionData.totalCount);
  }, [actionData, actionEntityType, actionId, actionPage, actionStatus, enabled]);

  useEffect(() => {
    if (actionData === undefined) return;
    const lastAvailablePage = Math.max(actionData.totalPages, 1);
    if (actionPage > lastAvailablePage) setActionPage(lastAvailablePage);
  }, [actionData, actionPage]);

  const handleActionStatusChange = (status: GameDataActionStatusFilter) => {
    setActionStatus(status);
    setActionPage(1);
  };

  const handleActionEntityTypeChange = (entityType: PublishableEntityType | null) => {
    setActionEntityType(entityType);
    setActionPage(1);
  };

  const handleActionIdChange = (nextActionId: string | null) => {
    setActionId(nextActionId);
    setActionPage(1);
  };

  const showNextActionPage = () => {
    if (!actionData || actionPage >= actionData.totalPages) return;
    setActionPage((current) => current + 1);
  };

  const showPreviousActionPage = () => {
    setActionPage((current) => Math.max(1, current - 1));
  };

  const showFirstActionPage = () => setActionPage(1);

  const showLastActionPage = () => {
    if (!actionData || actionData.totalPages === 0) return;
    setActionPage(actionData.totalPages);
  };

  return {
    error: actionError,
    loadedPendingCount,
    panelProps: {
      actionStatus,
      onActionStatusChange: handleActionStatusChange,
      actionEntityType,
      onActionEntityTypeChange: handleActionEntityTypeChange,
      actionId,
      onActionIdChange: handleActionIdChange,
      pendingActions,
      currentPage: actionData?.currentPage ?? 0,
      totalPages: actionData?.totalPages ?? 0,
      isPageLoading: isLoadingActions || isValidatingActions,
      onFirstPage: showFirstActionPage,
      onNextPage: showNextActionPage,
      onPreviousPage: showPreviousActionPage,
      onLastPage: showLastActionPage,
      pageKey: `${actionStatus}:${actionEntityType ?? ''}:${actionId ?? ''}:${actionPage}`,
      mutatePendingActions,
    },
  };
}
