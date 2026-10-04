'use client';

import { useCallback, useEffect, useReducer } from 'react';

import { useActiveEditSession } from '@/lib/edit/activeEditSession';
import type {
  EditDiscardResult,
  EditDraftOverviewItem,
  EditDraftScope,
  EditDraftState,
  EditEntityRef,
  EditPublishOptions,
  EditPublishResult,
} from '@/lib/edit/editSession';

const EMPTY_DRAFT: EditDraftState = Object.freeze({ actionCount: 0, publishEntries: [] });

export type EditDraftOverviewView = EditDraftOverviewItem & Readonly<{ itemLabel: string }>;

function overviewRef(item: EditDraftOverviewItem): EditEntityRef {
  return {
    entityType: item.entityType,
    entityId: item.entityId,
    ...(item.factionId ? { factionId: item.factionId } : {}),
  } as EditEntityRef;
}

function entityLabel(value: unknown, fallback: string): string {
  if (!value || typeof value !== 'object') return fallback;
  const entity = value as { name?: unknown; id?: unknown };
  if (typeof entity.name === 'string') return entity.name;
  return typeof entity.id === 'string' ? entity.id : fallback;
}

export function useEditDraft(scope: EditDraftScope) {
  const session = useActiveEditSession();
  const [, refresh] = useReducer((current: number) => current + 1, 0);

  useEffect(() => session?.subscribe({ kind: 'draft-overview' }, refresh), [session]);

  const state = session ? session.readDraft(scope) : EMPTY_DRAFT;
  const overview: readonly EditDraftOverviewView[] = session
    ? session.readDraftOverview().map((item) => ({
        ...item,
        itemLabel: entityLabel(session.readEntity(overviewRef(item)), item.entityId),
      }))
    : [];
  const discardDraft = useCallback((): EditDiscardResult => {
    if (!session) return { status: 'discarded' };
    return session.discardDraft(scope);
  }, [scope, session]);
  const publishDraft = useCallback(
    async (options?: EditPublishOptions): Promise<EditPublishResult> => {
      if (!session) return { status: 'failed', error: new Error('编辑数据尚未就绪') };
      const result = await session.publishDraft(scope, options);
      if (
        (result.status === 'published' || result.status === 'cleanup-conflict') &&
        result.outcome !== 'pending'
      ) {
        // Cloudflare bypasses HTML caching for recent publishers, including anonymous users.
        // Keep this longer than the public HTML edge TTL documented in DEPLOY.md.
        try {
          document.cookie = 'tjwiki_recent_publish=1; Max-Age=300; Path=/; SameSite=Lax; Secure';
        } catch (error) {
          console.warn('Failed to enable the recent-publication cache bypass.', error);
        }
      }
      return result;
    },
    [scope, session]
  );
  const getActionCount = useCallback(
    () => (session ? session.readDraft(scope).actionCount : 0),
    [scope, session]
  );

  return {
    isReady: session !== null,
    state,
    overview,
    discardDraft,
    publishDraft,
    getActionCount,
  } as const;
}
