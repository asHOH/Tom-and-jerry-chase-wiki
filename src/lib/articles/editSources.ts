export type EditSourceKey = 'approved' | 'pending_mine';

export interface EditSourceSnapshot {
  version_id: string;
  title: string;
  category_id: string;
  character_id: string | null;
  content: string;
  created_at: string;
  commit_message?: string | null;
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

  return {
    title: snapshot.title,
    category: snapshot.category_id,
    characterId: snapshot.character_id,
    content: snapshot.content,
  };
}
