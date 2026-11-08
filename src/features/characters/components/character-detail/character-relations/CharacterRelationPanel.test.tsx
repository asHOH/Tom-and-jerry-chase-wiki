import { fireEvent, render, screen } from '@testing-library/react';

import { getCharacterRelationTagDefinition } from '@/features/characters/utils/characterRelationTags';

import CharacterRelationPanel from './CharacterRelationPanel';
import type { RelationDisplayItem } from './characterRelationViewModel';

jest.mock('@/components/Image', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/ui/editable', () => ({ editable: () => ({ span: 'span' }) }));
jest.mock('@/features/shared/components/TextWithHoverTooltips', () => ({
  __esModule: true,
  default: ({ text }: { text: string }) => text,
}));

const originalResizeObserver = global.ResizeObserver;
beforeAll(() => {
  global.ResizeObserver = jest.fn(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })) as unknown as typeof ResizeObserver;
});
afterAll(() => {
  global.ResizeObserver = originalResizeObserver;
});

function renderPanel(type: 'character' | 'knowledgeCard' | 'specialSkill', label = '怕高伤') {
  const onNavigate = jest.fn();
  const item: RelationDisplayItem = {
    type,
    key: 'target',
    id: '目标',
    description: '关系说明',
    isMinor: false,
    isEditable: false,
    relationKind: 'counteredBy',
    tags: ['高伤'],
    tagLabels: [label],
    onNavigate,
    imageSrc: '',
    imageUrl: '',
    ariaLabel: '查看目标',
    getAriaLabel: () => '查看目标',
  };
  render(
    <CharacterRelationPanel
      isEditMode={false}
      sections={[{ key: 'test', title: '被克制', theme: 'red', icon: null, items: [item] }]}
    />
  );
  return onNavigate;
}

it.each(['character', 'knowledgeCard', 'specialSkill'] as const)(
  'opens a %s tag definition on tap without navigating, and dismisses with Escape',
  (type) => {
    const onNavigate = renderPanel(type);
    const badge = screen.getByRole('button', { name: '怕高伤：查看分类说明' });
    const navigation = screen.getByRole('button', { name: '查看目标' });
    expect(navigation).not.toContainElement(badge);
    fireEvent.touchStart(badge);
    fireEvent.touchEnd(badge);
    fireEvent.click(badge);
    expect(screen.getByRole('tooltip')).toHaveTextContent(
      getCharacterRelationTagDefinition('高伤')!
    );
    expect(onNavigate).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    fireEvent.keyDown(navigation, { key: 'Enter' });
    expect(onNavigate).toHaveBeenCalledTimes(1);
  }
);

it('exposes definitions on keyboard focus while keeping unknown legacy labels readable', () => {
  renderPanel('character', '旧版说明');
  expect(screen.getByText('旧版说明')).toBeVisible();
  expect(screen.queryByRole('button', { name: /查看分类说明/ })).not.toBeInTheDocument();
});

it('opens a definition when its button receives keyboard focus', () => {
  const onNavigate = renderPanel('character');
  fireEvent.focus(screen.getByRole('button', { name: '怕高伤：查看分类说明' }));
  expect(screen.getByRole('tooltip')).toHaveTextContent(getCharacterRelationTagDefinition('高伤')!);
  expect(onNavigate).not.toHaveBeenCalled();
});
