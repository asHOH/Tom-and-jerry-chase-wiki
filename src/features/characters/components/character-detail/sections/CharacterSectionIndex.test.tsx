import { act, fireEvent, render, screen } from '@testing-library/react';

import type { CharacterWithFaction } from '@/lib/types';

import CharacterSection from './CharacterSection';
import CharacterSectionIndex from './CharacterSectionIndex';

let mockIsEditMode = false;
jest.mock('@/context/EditModeContext', () => ({
  useEditMode: () => ({ isEditMode: mockIsEditMode }),
}));
jest.mock('@/hooks/useNavigation', () => ({ useNavigation: () => ({ navigate: jest.fn() }) }));

const character: CharacterWithFaction = {
  id: '杰瑞',
  factionId: 'mouse',
  description: '',
  imageUrl: '/test.png',
  createDate: null,
  skills: [{ id: 'skill', name: '奶酪', type: 'active', description: '', skillLevels: [] }],
  knowledgeCardGroups: [],
};

beforeEach(() => {
  mockIsEditMode = false;
  window.history.replaceState({}, '', '/characters/test/');
});

it('omits absent recommendations, keeps editor entry points, and uses the mouse relationship anchor', () => {
  const { rerender } = render(<CharacterSectionIndex character={character} />);
  expect(screen.queryByRole('link', { name: '推荐加点' })).toBeNull();
  expect(screen.queryByRole('link', { name: '推荐知识卡组' })).toBeNull();
  expect(screen.getByRole('link', { name: '克制/协作关系' })).toHaveAttribute(
    'href',
    '#Section:克制/协作关系'
  );
  mockIsEditMode = true;
  rerender(<CharacterSectionIndex character={character} />);
  expect(screen.getByRole('link', { name: '推荐加点' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '推荐知识卡组' })).toBeInTheDocument();
});

it('reopens unmounted skills, including repeated navigation to the current Chinese fragment', () => {
  jest.useFakeTimers();
  const scrollIntoView = jest.fn();
  const original = HTMLElement.prototype.scrollIntoView;
  HTMLElement.prototype.scrollIntoView = scrollIntoView;
  window.history.replaceState({}, '', `#${encodeURIComponent('Skill:奶酪')}`);
  const { unmount } = render(
    <>
      <CharacterSectionIndex character={character} />
      <CharacterSection title='技能描述' childAnchorIds={['Skill:奶酪']}>
        <h3 id='Skill:奶酪'>技能内容</h3>
      </CharacterSection>
    </>
  );
  act(() => jest.runOnlyPendingTimers());
  expect(scrollIntoView).toHaveBeenCalled();
  fireEvent.click(screen.getByText('技能目录'));
  for (let repeat = 0; repeat < 2; repeat++) {
    fireEvent.click(screen.getByRole('button', { name: '折叠技能描述' }));
    fireEvent.transitionEnd(
      screen.getByRole('heading', { name: '技能内容', hidden: true }).parentElement!
    );
    expect(screen.queryByText('技能内容')).toBeNull();
    fireEvent.click(screen.getByRole('link', { name: '奶酪' }));
    act(() => jest.runOnlyPendingTimers());
    expect(screen.getByRole('heading', { name: '技能内容' })).toBeVisible();
    expect(screen.getByRole('button', { name: '折叠技能描述' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  }
  unmount();
  HTMLElement.prototype.scrollIntoView = original;
  jest.useRealTimers();
});

it('updates skill anchors without scrolling or reopening a section during edits', () => {
  jest.useFakeTimers();
  const original = HTMLElement.prototype.scrollIntoView;
  const scrollIntoView = jest.fn();
  HTMLElement.prototype.scrollIntoView = scrollIntoView;
  window.history.replaceState({}, '', `#${encodeURIComponent('Section:技能描述')}`);
  const { rerender, unmount } = render(
    <CharacterSection title='技能描述' childAnchorIds={['Skill:奶酪']}>
      <h3 id='Skill:奶酪'>技能内容</h3>
    </CharacterSection>
  );
  act(() => jest.runOnlyPendingTimers());
  scrollIntoView.mockClear();
  fireEvent.click(screen.getByRole('button', { name: '折叠技能描述' }));
  rerender(
    <CharacterSection title='技能描述' childAnchorIds={['Skill:新技能']}>
      <h3 id='Skill:新技能'>更新内容</h3>
    </CharacterSection>
  );
  act(() => jest.runOnlyPendingTimers());
  expect(scrollIntoView).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: '展开技能描述' })).toHaveAttribute(
    'aria-expanded',
    'false'
  );
  window.history.replaceState({}, '', `#${encodeURIComponent('Skill:新技能')}`);
  fireEvent(window, new HashChangeEvent('hashchange'));
  act(() => jest.runOnlyPendingTimers());
  expect(scrollIntoView).toHaveBeenCalled();
  expect(screen.getByRole('heading', { name: '更新内容' })).toBeVisible();
  unmount();
  HTMLElement.prototype.scrollIntoView = original;
  jest.useRealTimers();
});
