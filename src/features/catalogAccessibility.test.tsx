import {
  createElement,
  type AnchorHTMLAttributes,
  type ImgHTMLAttributes,
  type ReactNode,
} from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';

import {
  achievements,
  buffs,
  characters,
  entities,
  fixtures,
  itemGroups,
  items,
  maps,
  modes,
  specialSkills,
} from '@/data/static';
import type { Buff } from '@/data/types';
import AchievementGrid from '@/features/achievements/achievement-grid/AchievementGrid';
import BuffGrid from '@/features/buffs/components/buff-grid/BuffGrid';
import CharacterDisplay from '@/features/characters/components/character-grid/CharacterDisplay';
import CharacterRankingCard from '@/features/characters/components/character-ranking/CharacterRankingCard';
import EntityGrid from '@/features/entities/entity-grid/EntityGrid';
import FixtureGrid from '@/features/fixtures/components/fixture-grid/FixtureGrid';
import ItemGrid from '@/features/items/components/item-grid/ItemGrid';
import ItemGroupDetails from '@/features/items/components/itemGroups/itemGroup-detail/ItemGroupDetails';
import ItemGroupGrid from '@/features/items/components/itemGroups/itemGroup-grid/ItemGroupGrid';
import KnowledgeCardDisplay from '@/features/knowledge-cards/components/knowledge-card-grid/KnowledgeCardDisplay';
import MapGrid from '@/features/maps/map-grid/MapGrid';
import ModeGrid from '@/features/modes/components/mode-grid/ModeGrid';
import SpecialSkillGrid from '@/features/special-skills/components/special-skill-grid/SpecialSkillGrid';
import SingleItemButton from '@/components/ui/SingleItemButton';

jest.mock('@/context/DarkModeContext', () => ({ useDarkMode: () => [false] }));
jest.mock('@/context/EditModeContext', () => ({ useEditMode: () => ({ isEditMode: false }) }));
jest.mock('@/hooks/useMediaQuery', () => ({ useMobile: () => false }));
jest.mock('@/components/ui/VirtualGrid', () => ({
  VirtualGrid: ({ items }: { items: ReactNode[] }) => <>{items}</>,
}));
jest.mock('@/components/Link', () => ({
  __esModule: true,
  default: ({
    preserveEditParam: _preserve,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { preserveEditParam?: boolean }) =>
    createElement('a', props),
}));
jest.mock('@/components/Image', () => ({
  __esModule: true,
  default: ({
    preload: _preload,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & { preload?: boolean }) => createElement('img', props),
}));

const map = Object.values(maps)[0]!;
const fixture = Object.values(fixtures)[0]!;
const mode = Object.values(modes)[0]!;
const item = Object.values(items)[0]!;
const entity = Object.values(entities)[0]!;
const buff = { ...Object.values(buffs)[0]!, unuseImage: false };
const achievement = Object.values(achievements.cat)[0]!;
const skill = Object.values(specialSkills.cat)[0]!;
const group = Object.values(itemGroups)[0]!;
const character = characters['汤姆']!;

it.each([
  {
    kind: 'map grid',
    content: <MapGrid data={{ [map.name]: map }} />,
    label: `查看${map.name}地图详情`,
    href: `/maps/${encodeURIComponent(map.name)}`,
  },
  {
    kind: 'fixture grid',
    content: <FixtureGrid data={{ [fixture.name]: fixture }} />,
    label: `查看${fixture.name}物件详情`,
    href: `/fixtures/${encodeURIComponent(fixture.name)}`,
  },
  {
    kind: 'mode grid',
    content: <ModeGrid data={{ [mode.name]: mode }} />,
    label: `查看${mode.name}模式详情`,
    href: `/modes/${encodeURIComponent(mode.name)}`,
  },
  {
    kind: 'item grid',
    content: <ItemGrid data={{ [item.name]: item }} />,
    label: `查看${item.name}道具详情`,
    href: `/items/${encodeURIComponent(item.name)}`,
  },
  {
    kind: 'entity grid',
    content: <EntityGrid data={{ [entity.name]: entity }} />,
    label: `查看${entity.name}衍生物详情`,
    href: `/entities/${encodeURIComponent(entity.name)}`,
  },
  {
    kind: 'buff grid',
    content: <BuffGrid data={{ [buff.name]: buff }} />,
    label: `查看${buff.name}效果详情`,
    href: `/buffs/${encodeURIComponent(buff.name)}`,
  },
  {
    kind: 'achievement grid',
    content: <AchievementGrid data={{ cat: { [achievement.name]: achievement }, mouse: {} }} />,
    label: `查看${achievement.name}成就详情`,
    href: `/achievements/cat/${encodeURIComponent(achievement.name)}`,
  },
  {
    kind: 'special-skill grid',
    content: <SpecialSkillGrid data={{ cat: { [skill.name]: skill }, mouse: {} }} />,
    label: `查看${skill.name}特技详情`,
    href: `/special-skills/cat/${encodeURIComponent(skill.name)}`,
  },
  {
    kind: 'item-group grid',
    content: <ItemGroupGrid />,
    label: `查看${group.name}效果详情`,
    href: `/itemGroups/${encodeURIComponent(group.name)}`,
  },
  {
    kind: 'item-group detail',
    content: (
      <ItemGroupDetails
        itemGroup={{ name: '道具组合', group: [{ name: item.name, type: 'item' }] }}
      />
    ),
    label: `查看${item.name}详情`,
    href: `/items/${encodeURIComponent(item.name)}`,
  },
  {
    kind: 'character card',
    content: (
      <CharacterDisplay
        id='汤姆'
        name='汤姆'
        imageUrl={character.imageUrl}
        positioningTags={[]}
        factionId='cat'
      />
    ),
    label: '查看汤姆角色详情',
    href: '/characters/汤姆',
  },
  {
    kind: 'character ranking',
    content: (
      <CharacterRankingCard
        rankedCharacter={{ character, rank: 1, value: 100, formattedValue: '100' }}
      />
    ),
    label: '查看汤姆角色详情，排名第1名，数值100',
    href: '/characters/汤姆',
  },
  {
    kind: 'knowledge card',
    content: (
      <KnowledgeCardDisplay
        id='test-card'
        name='测试知识卡'
        rank='A'
        cost={5}
        imageUrl='/test.png'
        onClick={jest.fn()}
      />
    ),
    label: '查看测试知识卡知识卡详情，A级，5费',
    href: '/cards/test-card',
  },
  {
    kind: 'single-item button',
    content: (
      <ul>
        <SingleItemButton singleItem={{ name: item.name, type: 'item' }} />
      </ul>
    ),
    label: item.name,
    href: `/items/${encodeURIComponent(item.name)}`,
  },
])('$kind exposes one named destination with a decorative image', ({ content, label, href }) => {
  const { container } = render(content);
  const link = screen.getByRole('link', { name: label });
  expect(link).toHaveProperty('href', new URL(href, window.location.href).href);
  expect(link).toHaveProperty('tabIndex', 0);
  expect(container.querySelector('a a')).not.toBeInTheDocument();
  expect(within(link).getByRole('presentation')).toHaveAttribute('alt', '');
  expect(within(link).queryByRole('img')).not.toBeInTheDocument();
});

it('keeps buff groups and cards in first-seen order before ungrouped cards when filtering', () => {
  const entries: Buff[] = [
    { ...buff, name: '独立状态甲', type: '状态', class: '' },
    { ...buff, name: '状态十甲', type: '状态', class: '10' },
    { ...buff, name: '独立瞬时效果', type: '瞬时效果', class: '' },
    { ...buff, name: '状态二', type: '状态', class: '2' },
    { ...buff, name: '瞬时效果十', type: '瞬时效果', class: '10' },
    { ...buff, name: '状态十乙', type: '状态', class: '10' },
    { ...buff, name: '属性二', type: '属性', class: '2' },
    { ...buff, name: '持续效果十', type: '持续效果', class: '10' },
    { ...buff, name: '独立状态乙', type: '状态', class: '' },
  ];
  const { rerender } = render(
    <BuffGrid data={Object.fromEntries(entries.map((entry) => [entry.name, entry]))} />
  );
  const cardNames = () => screen.queryAllByRole('heading', { level: 3 }).map((h) => h.textContent);
  const sectionNames = () =>
    screen.queryAllByRole('heading', { level: 2 }).map((h) => h.textContent);
  const allNames = [
    '状态十甲',
    '状态十乙',
    '状态二',
    '独立状态甲',
    '独立状态乙',
    '瞬时效果十',
    '持续效果十',
    '属性二',
    '独立瞬时效果',
  ];
  expect(sectionNames()).toEqual(['状态', '效果&属性']);
  expect(cardNames()).toEqual(allNames);

  fireEvent.click(screen.getByRole('button', { name: '属性' }));
  expect(sectionNames()).toEqual(['效果&属性']);
  expect(cardNames()).toEqual(['属性二']);

  fireEvent.click(screen.getByRole('button', { name: '瞬时效果' }));
  expect(cardNames()).toEqual(['瞬时效果十', '属性二', '独立瞬时效果']);

  fireEvent.click(screen.getByRole('button', { name: '属性' }));
  expect(cardNames()).toEqual(['瞬时效果十', '独立瞬时效果']);
  fireEvent.click(screen.getByRole('button', { name: '瞬时效果' }));
  expect(cardNames()).toEqual(allNames);

  fireEvent.click(screen.getByRole('button', { name: '状态' }));
  expect(sectionNames()).toEqual(['状态']);
  expect(cardNames()).toEqual(allNames.slice(0, 5));

  rerender(<BuffGrid data={{}} />);
  expect(sectionNames()).toEqual([]);
  expect(cardNames()).toEqual([]);
});
