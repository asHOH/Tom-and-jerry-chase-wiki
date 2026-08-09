export type UserProfileTab = 'activity' | 'submissions';
export type UserProfileActivityFilter = 'all' | 'articles' | 'game-data';

export type UserProfileHrefOptions = {
  tab?: UserProfileTab;
  type?: UserProfileActivityFilter;
  page?: number;
  highlight?: string | null;
};

export function normalizeUserProfileTab(value: string | null | undefined): UserProfileTab {
  return value === 'submissions' ? 'submissions' : 'activity';
}

export function getUserProfileHref(
  nickname: string,
  { tab = 'activity', type = 'all', page = 1, highlight }: UserProfileHrefOptions = {}
): string {
  const searchParams = new URLSearchParams({ tab });

  if (tab === 'activity') {
    if (type !== 'all') searchParams.set('type', type);
    if (Number.isSafeInteger(page) && page > 1) searchParams.set('page', String(page));
  } else if (highlight) {
    searchParams.set('highlight', highlight);
  }

  return `/users/${encodeURIComponent(nickname)}?${searchParams.toString()}`;
}

export function getUserSubmissionHref(nickname: string, highlight?: string | null): string {
  return highlight === undefined
    ? getUserProfileHref(nickname, { tab: 'submissions' })
    : getUserProfileHref(nickname, { tab: 'submissions', highlight });
}
