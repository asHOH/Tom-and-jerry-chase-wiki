import type { ReactNode } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import useSWR from 'swr';

import ContributionSubmissionStatus from './ContributionSubmissionStatus';

jest.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }));
jest.mock('swr', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@/components/Link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

it('uses revoked wording in rows and filters while preserving public pending and unknown states', () => {
  jest.mocked(useSWR).mockReturnValue({
    data: {
      contributions: ['revoked', 'pending', 'future-status'].map((status) => ({
        id: status,
        kind: 'gameData',
        title: `提交 ${status}`,
        description: null,
        status,
        isPublic: status === 'pending',
        createdAt: '2026-10-19T00:00:00Z',
        reviewedAt: null,
        feedback: null,
        href: null,
        previewHref: null,
        reviseHref: null,
        thanked: false,
        thankMessage: null,
      })),
      truncated: false,
    },
    error: undefined,
    isLoading: false,
    isValidating: false,
    mutate: jest.fn(),
  });

  render(<ContributionSubmissionStatus />);

  const submissions = within(screen.getByRole('list'));
  expect(submissions.getByText('已撤销')).toBeInTheDocument();
  expect(submissions.getByText('状态未知')).toBeInTheDocument();
  expect(submissions.getByText('待审核')).toBeInTheDocument();
  expect(submissions.getByText('审核中但已公开')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '已撤销' }));

  expect(screen.getAllByRole('listitem')).toHaveLength(1);
  expect(screen.getByRole('heading', { name: '提交 revoked' })).toBeInTheDocument();
  expect(screen.queryByText('状态未知')).not.toBeInTheDocument();
});
