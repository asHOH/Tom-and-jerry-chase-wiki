import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';

import ReferencePageContent, { DraftReferenceCards } from './ReferencePageContent';
import RouteReferenceCard from './RouteReferenceCard';

jest.mock('@/components/PublishedRevisionBoundary', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('./PublishedReverseCard', () => ({
  __esModule: true,
  default: ({ section }: { section: { title: string } }) => <div>{section.title}</div>,
}));

it('keeps a skill card in its own slot when its character has zero references', () => {
  render(
    <ReferencePageContent
      page={{
        primary: 'characters',
        relatedRevisions: {},
        sections: [
          { title: '角色自身的引用项', groups: [] },
          {
            title: '技能的引用项',
            groups: [
              {
                title: '技能',
                keywords: { originalKeywords: [], aliasKeywords: [], groupKeywords: [] },
                rows: [{ at: ['item', '鞭炮束'] }],
              },
            ],
          },
        ],
      }}
    >
      <RouteReferenceCard />
      <RouteReferenceCard index={1} />
      <RouteReferenceCard index={2} />
    </ReferencePageContent>
  );
  expect(screen.queryByText('角色自身的引用项')).toBeNull();
  expect(screen.getByText('技能的引用项')).toBeInTheDocument();
});

it('renders the browser-only draft skill slot without a published page', () => {
  render(
    <DraftReferenceCards cards={[null, <span key='skill'>草稿技能</span>]}>
      <RouteReferenceCard />
      <RouteReferenceCard index={1} />
    </DraftReferenceCards>
  );
  expect(screen.getByText('草稿技能')).toBeInTheDocument();
});
