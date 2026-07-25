// Synced actions leave the replay set, but they still count as public-facing contributions.
export const GAME_DATA_CONTRIBUTION_FILTER = 'is_public.eq.true,status.eq.synced';
