import { render, screen } from '@testing-library/react';

import LoadingState, { CatalogPageLoadingState, PageLoadingState } from './LoadingState';

jest.mock('./Skeleton', () => ({
  ...jest.requireActual('./Skeleton'),
  SkeletonCharacterCard: () => <div>角色占位</div>,
  SkeletonKnowledgeCard: () => <div>知识卡占位</div>,
  SkeletonItemCard: () => <div>道具占位</div>,
  SkeletonSpecialSkillCard: () => <div>特技占位</div>,
  SkeletonBuffCard: () => <div>状态占位</div>,
}));

it('shows the default loading message and accepts a custom message', () => {
  const { rerender } = render(<LoadingState />);
  expect(screen.getByText('加载中...')).toBeInTheDocument();

  rerender(<LoadingState message='正在加载角色' />);
  expect(screen.getByText('正在加载角色')).toBeInTheDocument();
  expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
});

it.each(['character-grid', 'knowledge-cards'] as const)(
  'shows the loading message alongside %s placeholders',
  (type) => {
    render(<LoadingState type={type} message='正在加载数据' />);
    expect(screen.getByText('正在加载数据')).toBeInTheDocument();
  }
);

it.each([
  ['character-grid', '角色占位'],
  ['knowledge-cards', '知识卡占位'],
  ['item-grid', '道具占位'],
  ['special-skill-grid', '特技占位'],
  ['special-skill-advice', '特技占位'],
  ['buff-grid', '状态占位'],
] as const)('honors the requested placeholder count for %s', (type, label) => {
  const { rerender } = render(<LoadingState type={type} count={2} />);
  expect(screen.getAllByText(label)).toHaveLength(2);
  rerender(<LoadingState type={type} count={3} />);
  expect(screen.getAllByText(label)).toHaveLength(3);
});

it('renders the requested number of skeleton rows and honors animation changes', () => {
  const { container, rerender } = render(<LoadingState type='skeleton' count={3} />);
  expect(container.firstElementChild?.children).toHaveLength(3);
  expect(container.querySelector('.animate-pulse')).toBeInTheDocument();

  rerender(<LoadingState type='skeleton' count={2} animate={false} />);
  expect(container.firstElementChild?.children).toHaveLength(2);
  expect(container.querySelector('.animate-pulse, .skeleton-shimmer')).not.toBeInTheDocument();
});

it.each([PageLoadingState, CatalogPageLoadingState])(
  '%s shows a loading message until custom content is supplied',
  (Component) => {
    const { rerender } = render(<Component message='正在加载页面' />);
    expect(screen.getByText('正在加载页面')).toBeInTheDocument();

    rerender(<Component message='正在加载页面'>自定义加载内容</Component>);
    expect(screen.getByText('自定义加载内容')).toBeInTheDocument();
    expect(screen.queryByText('正在加载页面')).not.toBeInTheDocument();
  }
);

it('preserves falsy custom children', () => {
  render(<PageLoadingState>{0}</PageLoadingState>);
  expect(screen.getByText('0')).toBeInTheDocument();
  expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
});

it('forwards the requested count through the page wrapper', () => {
  render(<PageLoadingState type='item-grid' count={3} />);
  expect(screen.getAllByText('道具占位')).toHaveLength(3);
});
