import { logPublicGameDataRouteMetric } from './publicRouteMetrics';

jest.mock('server-only', () => ({}), { virtual: true });

describe('public game-data route metrics', () => {
  it('emits only countable non-identifying request fields', () => {
    const consoleInfo = jest.spyOn(console, 'info').mockImplementation(() => undefined);
    const performanceNow = jest.spyOn(performance, 'now').mockReturnValue(125.678);

    logPublicGameDataRouteMetric({
      route: '/api/game-data-actions/edit-baseline',
      method: 'POST',
      status: 200,
      startedAt: 100,
      requestCategory: 'edit-baseline-refresh',
    });

    expect(consoleInfo).toHaveBeenCalledTimes(1);
    expect(JSON.parse(consoleInfo.mock.calls[0]![0] as string)).toEqual({
      event: 'public-game-data-route-request',
      route: '/api/game-data-actions/edit-baseline',
      method: 'POST',
      status: 200,
      durationMs: 25.68,
      requestCategory: 'edit-baseline-refresh',
    });

    performanceNow.mockRestore();
    consoleInfo.mockRestore();
  });
});
