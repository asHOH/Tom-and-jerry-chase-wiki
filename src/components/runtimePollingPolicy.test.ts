import { NOTIFICATION_REFRESH_INTERVAL_MS } from '@/hooks/useNotificationCount';

import { HOMEPAGE_NOTICES_REFRESH_INTERVAL_MS } from './HomepageNotices';
import { VERSION_CHECK_INTERVAL_MS } from './VersionChecker';

describe('runtime polling policy', () => {
  it('uses conservative intervals for public deployment checks', () => {
    expect(VERSION_CHECK_INTERVAL_MS).toBe(5 * 60 * 1000);
    expect(HOMEPAGE_NOTICES_REFRESH_INTERVAL_MS).toBe(5 * 60 * 1000);
  });

  it('keeps authenticated notification checks relatively prompt', () => {
    expect(NOTIFICATION_REFRESH_INTERVAL_MS).toBe(2 * 60 * 1000);
  });
});
