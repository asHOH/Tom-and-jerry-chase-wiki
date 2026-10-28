import { act, renderHook, waitFor } from '@testing-library/react';

import type { ArticleEditInfoResponse } from '@/lib/articles/editSources';
import { useRTEConfiguration } from '@/hooks/useRTEConfiguration';

import { useArticleAuthoring } from './useArticleAuthoring';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/hooks/useClearArticleClientCache', () => ({
  useClearArticleClientCache: () => jest.fn(),
}));
jest.mock('@/hooks/useContributionSubmissionFeedback', () => ({
  useContributionSubmissionFeedback: () => jest.fn(),
}));
jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({ error: jest.fn(), warning: jest.fn() }),
}));

it('keeps a clean source clean through a real editor table round-trip', async () => {
  const approved = {
    version_id: 'approved',
    title: 'Title',
    category_id: 'c',
    character_id: null,
    content: '<table><tr><td>Cell</td></tr></table>',
    created_at: '',
  };
  const info: ArticleEditInfoResponse = {
    article: { id: 'a', title: 'Title', category_id: 'c', character_id: null, created_at: '' },
    edit_sources: {
      approved,
      pending_mine: { ...approved, version_id: 'pending', content: '<p>Pending</p>' },
    },
    policy: {
      default_source: 'pending_mine',
      show_source_picker: true,
      will_override_pending: true,
    },
  };
  const { result } = renderHook(() => {
    const authoring = useArticleAuthoring({
      kind: 'edit',
      articleId: 'a',
      info,
      categories: [{ id: 'c', requires_character: false }],
      isLoadingCategories: false,
    });
    const editor = useRTEConfiguration({
      initialHtml: authoring.draft.content,
      content: authoring.draft.content,
      onChange: (content, origin) => authoring.updateDraft({ content }, origin),
    });
    return { authoring, editor };
  });
  await waitFor(() => expect(result.current.editor).not.toBeNull());
  act(() => result.current.authoring.selectSource('approved'));
  expect(result.current.editor!.getText()).toContain('Cell');
  act(() => result.current.authoring.selectSource('pending_mine'));
  expect(result.current.authoring.sourceChange).toBeNull();
  expect(result.current.authoring.selectedSource).toBe('pending_mine');
  act(() => result.current.editor!.commands.insertContent('User edit'));
  act(() => result.current.authoring.selectSource('approved'));
  expect(result.current.authoring.sourceChange).toBe('approved');
});
