import React from 'react';
import { render, screen } from '@testing-library/react';

import CatalogCard from './CatalogCard';

const mockUseMobile = jest.fn(() => false);
const mockGameImage = jest.fn();

jest.mock('@/hooks/useMediaQuery', () => ({
  useMobile: () => mockUseMobile(),
}));

jest.mock('@/components/Link', () => ({
  __esModule: true,
  default: function MockLink({
    children,
    href,
    preserveEditParam: _preserveEditParam,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children: React.ReactNode;
    preserveEditParam?: boolean;
  }) {
    return React.createElement('a', { href, ...props }, children);
  },
}));

jest.mock('@/components/ui/GameImage', () => ({
  __esModule: true,
  default: function MockGameImage({
    preload,
    size,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { preload?: boolean; size?: string }) {
    const imageProps = { ...props, preload, size };
    mockGameImage(imageProps);
    return React.createElement('img', props);
  },
}));

describe('CatalogCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMobile.mockReturnValue(false);
  });

  it('renders the shared catalog image, title, overlay, and tags layout', () => {
    render(
      <CatalogCard
        title='奶酪'
        imageSrc='/images/items/cheese.png'
        imageAlt='奶酪道具图标'
        ariaLabel='查看奶酪道具详情'
        overlay={<span>投掷</span>}
        tagsAriaLabel='道具属性'
        tags={<span>地图</span>}
      />
    );

    expect(screen.getByLabelText('查看奶酪道具详情')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '奶酪道具图标' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '奶酪' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: '道具属性' })).toBeInTheDocument();
    expect(screen.getByText('投掷')).toBeInTheDocument();
    expect(screen.getByText('地图')).toBeInTheDocument();
    expect(mockGameImage).toHaveBeenCalledWith(
      expect.objectContaining({
        src: '/images/items/cheese.png',
        alt: '奶酪道具图标',
        size: 'ITEM_CARD',
        className: 'h-32 w-auto hover:scale-105 md:h-auto',
      })
    );
  });

  it('forwards href and preload to the card shell and image', () => {
    render(
      <CatalogCard
        title='飞跃'
        imageSrc='/images/cards/jump.png'
        imageAlt='飞跃知识卡图标'
        ariaLabel='查看飞跃知识卡详情'
        href='/cards/jump'
        imageSize='KNOWLEDGECARD_CARD'
        preload
      />
    );

    expect(screen.getByRole('link', { name: '查看飞跃知识卡详情' })).toHaveAttribute(
      'href',
      '/cards/jump'
    );
    expect(mockGameImage).toHaveBeenCalledWith(
      expect.objectContaining({
        size: 'KNOWLEDGECARD_CARD',
        preload: true,
      })
    );
  });

  it('uses compact title text on mobile for long names', () => {
    mockUseMobile.mockReturnValue(true);

    render(
      <CatalogCard
        title='超级胡椒粉瓶'
        imageSrc='/images/items/pepper.png'
        imageAlt='超级胡椒粉瓶道具图标'
        ariaLabel='查看超级胡椒粉瓶道具详情'
      />
    );

    expect(screen.getByRole('heading', { name: '超级胡椒粉瓶' })).toHaveClass('text-md');
  });
});
