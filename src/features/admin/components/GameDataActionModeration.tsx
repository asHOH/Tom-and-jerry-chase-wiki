'use client';

import { useEffect } from 'react';

import type { usePermissions } from '@/lib/auth/PermissionProvider';

import { useGameDataModerationList } from '../hooks/useGameDataModerationList';
import GameDataActionModerationPanel from './GameDataActionModerationPanel';

type GameDataActionModerationProps = {
  permissions: Pick<ReturnType<typeof usePermissions>, 'grants' | 'has'>;
  enabled: boolean;
  active: boolean;
  onPendingCountChange: (count: number | null) => void;
};

export default function GameDataActionModeration({
  permissions,
  enabled,
  active,
  onPendingCountChange,
}: GameDataActionModerationProps) {
  const { panelProps, error, loadedPendingCount } = useGameDataModerationList(
    enabled && active,
    JSON.stringify([permissions.grants, enabled])
  );

  useEffect(() => {
    onPendingCountChange(loadedPendingCount);
  }, [loadedPendingCount, onPendingCountChange]);

  // Keep list state mounted across tab switches; only the visible panel is conditional.
  if (!enabled || !active) return null;

  return (
    <>
      {error && (
        <p role='alert' className='text-red-600 dark:text-red-400'>
          改动列表加载失败，请重试刷新
        </p>
      )}
      <GameDataActionModerationPanel
        canApproveActions={permissions.has('game_data_action.approve')}
        canRejectActions={permissions.has('game_data_action.reject')}
        canMarkActionsSynced={permissions.has('game_data_action.mark_synced')}
        canRevokeActions={permissions.has('game_data_action.revoke')}
        {...panelProps}
      />
    </>
  );
}
