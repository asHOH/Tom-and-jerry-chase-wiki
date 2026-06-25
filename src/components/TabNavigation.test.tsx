import { createElement, type ImgHTMLAttributes } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import type { NavEntry } from '@/constants/navigation';

import TabNavigation from './TabNavigation';

const mockUsePathname = jest.fn();
type MockNavigationTabsResult = {
  items: readonly NavEntry[];
  isActive: (href: string) => boolean;
  pathname: string;
};

const mockUseNavigationTabs = jest.fn<MockNavigationTabsResult, []>();
const mockResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('usehooks-ts', () => ({
  useMediaQuery: () => false,
}));

jest.mock('@/hooks/useMediaQuery', () => ({
  useMobile: () => false,
}));

jest.mock('@/hooks/useFeatureDiscovery', () => ({
  useFeatureDiscovery: () => ({
    shouldPrompt: false,
    dismiss: jest.fn(),
  }),
}));

jest.mock('@/hooks/useNavigationProgress', () => ({
  useNavigationProgress: () => ({
    isNavigatingTo: () => false,
  }),
}));

jest.mock('@/hooks/useNavigationTabs', () => ({
  useNavigationTabs: () => mockUseNavigationTabs(),
}));

jest.mock('@/components/Image', () => ({
  __esModule: true,
  default: ({ alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) =>
    createElement('img', { ...props, alt: alt ?? '' }),
}));

jest.mock('@/hooks/useUser', () => ({
  useUser: () => ({
    nickname: null,
    role: null,
    clearData: jest.fn(),
  }),
}));

jest.mock('@/context/AppContext', () => ({
  useAppContext: () => ({
    isDetailedView: false,
    toggleDetailedView: jest.fn(),
  }),
}));

jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signOut: jest.fn(),
    },
  },
}));

jest.mock('./ui/SearchBar', () => ({
  __esModule: true,
  default: () => (
    <button type='button' aria-label='搜索'>
      搜索
    </button>
  ),
}));

jest.mock('./ui/DarkModeToggleButton', () => ({
  DarkModeToggleButton: () => (
    <button type='button' aria-label='切换深色模式'>
      切换深色模式
    </button>
  ),
}));

describe('TabNavigation', () => {
  beforeAll(() => {
    global.ResizeObserver = mockResizeObserver as unknown as typeof ResizeObserver;
  });

  beforeEach(() => {
    mockUsePathname.mockReturnValue('/cards/知识卡');
    mockUseNavigationTabs.mockReturnValue({
      items: [],
      isActive: () => false,
      pathname: '/cards/知识卡',
    });
  });

  it('renders search from non-home pages', () => {
    render(<TabNavigation />);

    expect(screen.getByRole('button', { name: '搜索' })).toBeInTheDocument();
  });

  it('forces dropdown icon dimensions so image aspect ratios cannot change row height', () => {
    mockUseNavigationTabs.mockReturnValue({
      items: [
        {
          id: 'inquiry',
          label: '资料',
          iconSrc: '/images/icons/inquiry.png',
          iconAlt: '',
          children: [
            {
              id: 'articles',
              label: '文章',
              description: '社区文章列表',
              href: '/articles',
              iconSrc: '/images/icons/article.png',
              iconAlt: '',
            },
            {
              id: 'mechanics',
              label: '机制',
              description: '局内机制列表',
              href: '/mechanics',
              iconSrc: '/images/entities/线条火箭.png',
              iconAlt: '',
            },
          ],
        },
      ],
      isActive: () => false,
      pathname: '/',
    });

    render(<TabNavigation />);
    fireEvent.click(screen.getByRole('button', { name: '资料' }));

    for (const label of ['文章', '机制']) {
      const icon = screen.getByRole('link', { name: label }).querySelector('img');

      expect(icon).toHaveClass('!h-6', '!w-6');
    }
  });
});
