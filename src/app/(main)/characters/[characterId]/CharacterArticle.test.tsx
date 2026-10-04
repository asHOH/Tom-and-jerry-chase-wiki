import { StrictMode, type ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { SWRConfig } from 'swr';

import CharacterArticle from './CharacterArticle';

jest.mock('@/hooks/useNavigation', () => ({ useNavigation: () => ({ navigate: jest.fn() }) }));
jest.mock('@/components/ui/RichTextContent', () => ({
  renderRichTextContent: (text: string) => text,
}));
jest.mock('@/lib/xssUtils', () => ({ sanitizeHTML: (text: string) => text }));
jest.mock('@/components/ui/ButtonLink', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

const originalFetch = global.fetch;
const fetchMock = jest.fn();
const article = (id: string, title: string) => ({
  id,
  title,
  content: 'Guide content',
  authors: [],
});
const writes = () => fetchMock.mock.calls.filter(([, options]) => options?.method === 'POST');

beforeEach(() => {
  global.fetch = fetchMock;
  fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => ({ viewCount: 12 }) });
});

afterEach(() => {
  global.fetch = originalFetch;
});

async function show(articles: ReturnType<typeof article>[]) {
  const content = Promise.resolve(articles);
  await act(async () => {
    render(
      <StrictMode>
        <SWRConfig value={{ provider: () => new Map() }}>
          <CharacterArticle content={content} />
        </SWRConfig>
      </StrictMode>
    );
  });
}

it('records the first article once on a visit, without waiting for an article click', async () => {
  await show([article('first', 'First'), article('second', 'Second')]);
  expect(writes()).toEqual([['/api/articles/first/views/', { method: 'POST', keepalive: true }]]);
  expect(await screen.findByText('浏览: 12')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Second' }));
  expect(await screen.findByText('浏览: 12')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'First' }));
  expect(await screen.findByText('浏览: 12')).toBeInTheDocument();
  expect(writes()).toHaveLength(1);
});

it('also counts the single-article presentation once', async () => {
  await show([article('single', 'Single')]);
  expect(writes()).toHaveLength(1);
  expect(writes()[0]?.[0]).toBe('/api/articles/single/views/');
});

it('does not request views when there is no embedded article', async () => {
  await show([]);
  expect(fetchMock).not.toHaveBeenCalled();
});
