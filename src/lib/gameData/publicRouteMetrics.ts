import 'server-only';

export type PublicGameDataRoute =
  '/api/game-data-actions/edit-baseline' | '/api/game-data-actions/public';

export type PublicGameDataRequestCategory = 'edit-baseline-refresh' | 'legacy-public-actions';

type PublicGameDataRouteMetric = {
  route: PublicGameDataRoute;
  method: 'GET' | 'POST';
  status: number;
  startedAt: number;
  requestCategory: PublicGameDataRequestCategory;
};

/** Emits one privacy-safe, countable event without request or game-data identifiers. */
export function logPublicGameDataRouteMetric(metric: PublicGameDataRouteMetric): void {
  console.info(
    JSON.stringify({
      event: 'public-game-data-route-request',
      route: metric.route,
      method: metric.method,
      status: metric.status,
      durationMs: Math.round((performance.now() - metric.startedAt) * 100) / 100,
      requestCategory: metric.requestCategory,
    })
  );
}
