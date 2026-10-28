export type EditSourceKey = 'approved' | 'pending_mine';

export interface EditSourceSnapshot {
  version_id: string;
  title: string;
  category_id: string;
  character_id: string | null;
  content: string;
  created_at: string;
  commit_message?: string | null;
  base_version_id?: string | null;
  base_version_known?: boolean;
  draft_revision?: string;
}

export interface ArticleEditInfoResponse {
  article: {
    id: string;
    title: string;
    category_id: string;
    character_id: string | null;
    created_at: string;
  };
  edit_sources: {
    approved: EditSourceSnapshot | null;
    pending_mine: EditSourceSnapshot | null;
  };
  policy: {
    show_source_picker: boolean;
    default_source: EditSourceKey;
    will_override_pending: boolean;
  };
}

export interface EditFormState {
  title: string;
  category: string;
  characterId: string | null;
  content: string;
  baseVersionId: string | null;
  baseVersionKnown: boolean;
  pendingVersionId: string | null;
  pendingRevision: string | null;
  sourcePendingVersionId: string | null;
}

const parseTimestamp = (value: string | null | undefined) => {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
};

export function buildEditSourcePolicy(
  approved: EditSourceSnapshot | null,
  pendingMine: EditSourceSnapshot | null
): ArticleEditInfoResponse['policy'] {
  const approvedTime = parseTimestamp(approved?.created_at);
  const pendingTime = parseTimestamp(pendingMine?.created_at);
  const pendingNewer =
    approvedTime !== null && pendingTime !== null ? pendingTime > approvedTime : false;

  const hasPending = Boolean(pendingMine);

  return {
    show_source_picker: pendingNewer,
    default_source: hasPending ? 'pending_mine' : 'approved',
    will_override_pending: hasPending,
  };
}

export function resolveEditFormState(
  payload: Pick<ArticleEditInfoResponse, 'edit_sources'>,
  preferredSource: EditSourceKey
): EditFormState | null {
  const preferred =
    preferredSource === 'pending_mine'
      ? payload.edit_sources.pending_mine
      : payload.edit_sources.approved;
  const fallback =
    preferredSource === 'pending_mine'
      ? payload.edit_sources.approved
      : payload.edit_sources.pending_mine;
  const snapshot = preferred ?? fallback;

  if (!snapshot) return null;
  const fromPending = snapshot === payload.edit_sources.pending_mine;

  return {
    title: snapshot.title,
    category: snapshot.category_id,
    characterId: snapshot.character_id,
    content: snapshot.content,
    baseVersionId: fromPending ? (snapshot.base_version_id ?? null) : snapshot.version_id,
    baseVersionKnown: !fromPending || snapshot.base_version_known === true,
    pendingVersionId: payload.edit_sources.pending_mine?.version_id ?? null,
    pendingRevision: payload.edit_sources.pending_mine?.draft_revision ?? null,
    sourcePendingVersionId: fromPending ? snapshot.version_id : null,
  };
}
