import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/data/database.types';

import { getOptionalSupabaseAdminClient, requireSupabaseAdminClient } from './adminClient';
import { getOptionalSupabaseBrowserClient, requireSupabaseBrowserClient } from './browserClient';
import { SupabaseConfigurationError } from './config';
import { getOptionalSupabasePublicClient, requireSupabasePublicClient } from './publicClient';

jest.mock('server-only', () => ({}), { virtual: true });

let mockAdminClient: SupabaseClient<Database> | undefined;
let mockBrowserClient: SupabaseClient<Database> | undefined;
let mockPublicClient: SupabaseClient<Database> | undefined;

jest.mock('./admin', () => ({
  get supabaseAdmin() {
    return mockAdminClient;
  },
}));

jest.mock('./client', () => ({
  get supabase() {
    return mockBrowserClient;
  },
}));

jest.mock('./public', () => ({
  get supabaseServerPublic() {
    return mockPublicClient;
  },
}));

describe('Supabase client availability accessors', () => {
  beforeEach(() => {
    mockAdminClient = undefined;
    mockBrowserClient = undefined;
    mockPublicClient = undefined;
  });

  it.each([
    ['admin', getOptionalSupabaseAdminClient, requireSupabaseAdminClient],
    ['browser', getOptionalSupabaseBrowserClient, requireSupabaseBrowserClient],
    ['public', getOptionalSupabasePublicClient, requireSupabasePublicClient],
  ] as const)(
    'exposes optional and required %s contracts',
    (clientKind, getOptional, requireClient) => {
      expect(getOptional()).toBeUndefined();
      expect(requireClient).toThrow(
        expect.objectContaining({ name: 'SupabaseConfigurationError', clientKind })
      );
    }
  );

  it('returns configured clients without changing their identity', () => {
    mockAdminClient = {} as SupabaseClient<Database>;
    mockBrowserClient = {} as SupabaseClient<Database>;
    mockPublicClient = {} as SupabaseClient<Database>;

    expect(requireSupabaseAdminClient()).toBe(mockAdminClient);
    expect(requireSupabaseBrowserClient()).toBe(mockBrowserClient);
    expect(requireSupabasePublicClient()).toBe(mockPublicClient);
  });

  it('uses the dedicated configuration error type', () => {
    expect(() => requireSupabaseAdminClient()).toThrow(SupabaseConfigurationError);
  });
});
