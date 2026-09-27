export const OFFLINE_PAGE_CACHE_NAME = 'app-routes';
export const OFFLINE_WARMUP_ROUTES = ['/', '/factions/cat/', '/factions/mouse/'] as const;

export function isOfflinePublicPage(pathname: string): boolean {
  return (
    !/^\/(?:api|_next|admin|settings|notifications|offline)(?:\/|$)/.test(pathname) &&
    !/^\/articles\/(?:new|pending|preview)(?:\/|$)/.test(pathname) &&
    !/^\/articles\/[^/]+\/edit(?:\/|$)/.test(pathname) &&
    !/^\/characters\/user(?:\/|$)/.test(pathname)
  );
}
