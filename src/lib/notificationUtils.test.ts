import { publishNotification } from '@/lib/notificationUtils';
import { supabaseAdmin } from '@/lib/supabase/admin';

jest.mock('@/constants/seo', () => ({
  SITE_NAME: '猫鼠Wiki',
  SITE_URL: 'https://tjwiki.test',
}));

jest.mock('@/env', () => ({
  env: {
    RESEND_API_KEY: 'resend-key',
    RESEND_FROM_EMAIL: 'notify@tjwiki.test',
  },
}));

jest.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: { from: jest.fn() },
}));

type MockState = {
  role?: 'Contributor' | 'Reviewer' | 'Coordinator';
  recipientError?: { message: string } | null;
  notification?: { id: string } | null;
  insertError?: { message: string } | null;
  settings?: {
    email: string | null;
    email_enabled: boolean;
    email_verified_at: string | null;
  } | null;
  settingsError?: { message: string } | null;
};

const configureSupabase = ({
  role = 'Contributor',
  recipientError = null,
  notification = { id: 'notification-1' },
  insertError = null,
  settings = {
    email: 'user@example.com',
    email_enabled: true,
    email_verified_at: '2026-07-14T00:00:00.000Z',
  },
  settingsError = null,
}: MockState = {}) => {
  const userQuery = {
    select: jest.fn(),
    eq: jest.fn(),
    single: jest.fn().mockResolvedValue({
      data: recipientError ? null : { role },
      error: recipientError,
    }),
  };
  userQuery.select.mockReturnValue(userQuery);
  userQuery.eq.mockReturnValue(userQuery);

  const notificationQuery = {
    upsert: jest.fn(),
    select: jest.fn(),
    maybeSingle: jest.fn().mockResolvedValue({ data: notification, error: insertError }),
  };
  notificationQuery.upsert.mockReturnValue(notificationQuery);
  notificationQuery.select.mockReturnValue(notificationQuery);

  const settingsQuery = {
    select: jest.fn(),
    eq: jest.fn(),
    maybeSingle: jest.fn().mockResolvedValue({ data: settings, error: settingsError }),
  };
  settingsQuery.select.mockReturnValue(settingsQuery);
  settingsQuery.eq.mockReturnValue(settingsQuery);

  jest.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
    if (table === 'users') return userQuery as never;
    if (table === 'notifications') return notificationQuery as never;
    if (table === 'notification_email_settings') return settingsQuery as never;
    throw new Error(`Unexpected table: ${table}`);
  });

  return { notificationQuery };
};

const input = {
  recipientUserId: 'user-1',
  kind: 'article_version_approved' as const,
  decisionOrigin: 'manual' as const,
  title: '文章已通过审核',
  body: '您的文章已发布。',
  href: '/articles/article-1/',
  sourceIds: ['00000000-0000-0000-0000-000000000001'],
  dedupeKey: 'article-version:1:approved',
};

describe('publishNotification', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock;
    fetchMock.mockResolvedValue({ ok: true, text: async () => '' });
  });

  it('publishes an in-site notification and email', async () => {
    const { notificationQuery } = configureSupabase();

    await expect(publishNotification(input)).resolves.toEqual({
      created: true,
      suppressed: false,
      emailStatus: 'sent',
    });
    expect(notificationQuery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ dedupe_key: input.dedupeKey, user_id: input.recipientUserId }),
      { onConflict: 'dedupe_key', ignoreDuplicates: true }
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('suppresses automatic staff notifications', async () => {
    configureSupabase({ role: 'Reviewer' });

    await expect(publishNotification({ ...input, decisionOrigin: 'automatic' })).resolves.toEqual({
      created: false,
      suppressed: true,
      emailStatus: 'skipped',
    });
    expect(supabaseAdmin.from).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not email a duplicate notification', async () => {
    configureSupabase({ notification: null });

    await expect(publishNotification(input)).resolves.toEqual({
      created: false,
      suppressed: false,
      emailStatus: 'skipped',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('skips email when no verified enabled address exists', async () => {
    configureSupabase({ settings: null });

    await expect(publishNotification(input)).resolves.toEqual({
      created: true,
      suppressed: false,
      emailStatus: 'skipped',
    });
  });

  it('keeps the in-site notification when email delivery fails', async () => {
    configureSupabase();
    fetchMock.mockResolvedValue({ ok: false, status: 503, text: async () => 'unavailable' });

    await expect(publishNotification(input)).resolves.toEqual({
      created: true,
      suppressed: false,
      emailStatus: 'failed',
    });
  });

  it('throws when the in-site notification cannot be written', async () => {
    configureSupabase({ notification: null, insertError: { message: 'insert failed' } });

    await expect(publishNotification(input)).rejects.toThrow(
      'Failed to create in-site notification: insert failed'
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
