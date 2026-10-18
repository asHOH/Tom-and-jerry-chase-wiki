import { createElement, type ImgHTMLAttributes } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { maps } from '@/data/static';

import MapDetails from './MapDetails';

jest.mock('@/context/AppContext', () => ({ useAppContext: () => ({ isDetailedView: false }) }));
jest.mock('@/context/EditModeContext', () => ({ useEditMode: () => ({ isEditMode: false }) }));
jest.mock('@/hooks/useLocalEditEntity', () => ({ useLocalMap: () => ({ mapName: '测试地图' }) }));
jest.mock('@/hooks/useMediaQuery', () => ({ useMobile: () => false }));
jest.mock('@/hooks/useSpecifyTypeKeyboardNavigation', () => ({
  useSpecifyTypeKeyboardNavigation: jest.fn(),
}));
jest.mock('./MapAttributesCard', () => ({ __esModule: true, default: () => null }));
jest.mock('@/features/shared/detail-view/DetailTextSection', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@/features/characters/components/MapModeCharacterRelations', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@/components/Image', () => ({
  __esModule: true,
  default: ({
    fill: _fill,
    priority: _priority,
    placeholder: _placeholder,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
    placeholder?: string;
  }) => createElement('img', props),
}));

it('names both map previews and supports opening and closing with the keyboard', () => {
  const map = { ...Object.values(maps)[0]!, name: '测试地图', mapImageUrl: '/preview.png' };
  render(<MapDetails map={map} fixtureNames={[]} modeNames={[]} charactersData={{}} />);

  expect(screen.getByRole('img', { name: '测试地图地图预览' })).toHaveAttribute(
    'src',
    '/preview.png'
  );
  const preview = screen.getByRole('button', { name: /点击放大/ });
  expect(preview).toHaveProperty('tabIndex', 0);
  fireEvent.keyDown(preview, { key: 'Enter' });

  const dialog = screen.getByRole('dialog', { name: '全屏图片预览' });
  expect(within(dialog).getByRole('img', { name: '测试地图地图预览' })).toHaveAttribute(
    'src',
    '/preview.png'
  );
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  fireEvent.click(preview);
  fireEvent.click(screen.getByRole('button', { name: '关闭全屏预览' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
