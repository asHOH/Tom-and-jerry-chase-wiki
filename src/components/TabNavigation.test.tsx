import { render, screen } from '@testing-library/react';

import TabNavigation from './TabNavigation';

const mockUsePathname = jest.fn();

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
  useNavigationTabs: () => ({
    items: [],
    isActive: () => false,
  }),
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
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/cards/知识卡');
  });

  it('renders search from non-home pages', () => {
    render(<TabNavigation />);

    expect(screen.getByRole('button', { name: '搜索' })).toBeInTheDocument();
  });
});
