/** @jest-environment node */

import { redirect } from 'next/navigation';

import { createOptionalClient } from '@/lib/supabase/server';

import AiPage, { metadata } from './page';

const mockGetClaims = jest.fn();
jest.mock('@/lib/supabase/server', () => ({ createOptionalClient: jest.fn() }));
jest.mock('./ChatClient', () => ({ __esModule: true, default: () => null }));
jest.mock('next/navigation', () => ({
  redirect: jest.fn(() => {
    throw new Error('redirect');
  }),
}));

beforeEach(() => {
  jest
    .mocked(createOptionalClient)
    .mockResolvedValue({ auth: { getClaims: mockGetClaims } } as unknown as Awaited<
      ReturnType<typeof createOptionalClient>
    >);
});

it('redirects anonymous visitors and missing auth configuration to the homepage', async () => {
  mockGetClaims.mockResolvedValue({ data: null });
  await expect(AiPage()).rejects.toThrow('redirect');
  expect(redirect).toHaveBeenCalledWith('/');
  jest.mocked(createOptionalClient).mockResolvedValueOnce(undefined);
  await expect(AiPage()).rejects.toThrow('redirect');
});

it('passes only the verified user ID to the private page and disables indexing', async () => {
  mockGetClaims.mockResolvedValue({ data: { claims: { sub: 'account-a' } } });
  const page = await AiPage();
  expect(page.props.userId).toBe('account-a');
  expect(metadata.robots).toMatchObject({ index: false });
  expect(metadata.alternates?.canonical).toMatch(/\/ai\/$/);
});
