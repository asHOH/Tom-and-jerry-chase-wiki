import React from 'react';
import { usePathname } from 'next/navigation';
import { fireEvent, render, screen } from '@testing-library/react';
import { useReducedMotion } from 'motion/react';
import { renderToString } from 'react-dom/server';

import { useAuthenticatedUserId } from '@/hooks/useAuthenticatedUserId';
import { env } from '@/env';

import FloatingWikiControls from './FloatingWikiControls';

jest.mock('@/hooks/useAuthenticatedUserId', () => ({ useAuthenticatedUserId: jest.fn() }));
jest.mock('next/navigation', () => ({ usePathname: jest.fn(() => '/') }));
jest.mock('motion/react', () => ({ useReducedMotion: jest.fn(() => false) }));
jest.mock('@/components/Link', () => ({
  __esModule: true,
  default: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} />,
}));

beforeEach(() => {
  jest.mocked(usePathname).mockReturnValue('/');
  jest.mocked(useReducedMotion).mockReturnValue(false);
  jest.mocked(useAuthenticatedUserId).mockReturnValue({ userId: 'user-a', isLoading: false });
  Object.assign(env, { NEXT_PUBLIC_AI_CHAT_MODEL: 'model' });
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0, writable: true });
  window.scrollTo = jest.fn();
});

it('renders without touching the portal target during SSR', () => {
  expect(renderToString(<FloatingWikiControls />)).toBe('');
});

it.each(['/', '/cards/', '/characters/汤姆/'])(
  'shares controls on %s and places AI above return-to-top',
  (path) => {
    jest.mocked(usePathname).mockReturnValue(path);
    render(<FloatingWikiControls />);
    const ai = screen.getByRole('link', { name: 'AI 助手' });
    expect(ai).toHaveAttribute('href', '/ai/');
    expect(screen.queryByRole('button', { name: '返回顶部' })).not.toBeInTheDocument();
    window.scrollY = 51;
    fireEvent.scroll(window);
    const top = screen.getByRole('button', { name: '返回顶部' });
    expect(ai.nextElementSibling).toBe(top);
    fireEvent.click(top);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    window.scrollY = 50;
    fireEvent.scroll(window);
    expect(screen.queryByRole('button', { name: '返回顶部' })).not.toBeInTheDocument();
  }
);

it('hides AI for guests, disabled AI, and on the AI page', () => {
  jest.mocked(useAuthenticatedUserId).mockReturnValue({ userId: null, isLoading: false });
  const { rerender } = render(<FloatingWikiControls />);
  expect(screen.queryByRole('link', { name: 'AI 助手' })).not.toBeInTheDocument();
  jest.mocked(useAuthenticatedUserId).mockReturnValue({ userId: 'user-a', isLoading: false });
  Object.assign(env, { NEXT_PUBLIC_AI_CHAT_MODEL: undefined });
  rerender(<FloatingWikiControls />);
  expect(screen.queryByRole('link', { name: 'AI 助手' })).not.toBeInTheDocument();
  Object.assign(env, { NEXT_PUBLIC_AI_CHAT_MODEL: 'model' });
  jest.mocked(usePathname).mockReturnValue('/ai/');
  rerender(<FloatingWikiControls />);
  expect(screen.queryByRole('link', { name: 'AI 助手' })).not.toBeInTheDocument();
});

it('respects reduced motion when returning to the top', () => {
  jest.mocked(useReducedMotion).mockReturnValue(true);
  window.scrollY = 51;
  render(<FloatingWikiControls />);
  fireEvent.click(screen.getByRole('button', { name: '返回顶部' }));
  expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
});
