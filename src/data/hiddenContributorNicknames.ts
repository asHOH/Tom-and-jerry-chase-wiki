/**
 * Database nicknames that must not receive public contributor attribution.
 *
 * Add bot and blacklisted account nicknames here. Matching is exact and case-sensitive.
 */
export const hiddenContributorNicknames: string[] = ['TJAI'];

export function isHiddenContributorNickname(nickname: string): boolean {
  return hiddenContributorNicknames.includes(nickname);
}
