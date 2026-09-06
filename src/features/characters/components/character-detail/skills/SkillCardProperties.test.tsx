import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { proxy, snapshot } from 'valtio';

import '@testing-library/jest-dom';

import type { CharacterWithFaction } from '@/lib/types';
import { EditModeContext } from '@/context/EditModeContext';
import type { Skill } from '@/data/types';

import SkillCardProperties from './SkillCardProperties';

let characters: Record<string, CharacterWithFaction>;

jest.mock('@/components/ui/editable', () => ({
  editable: () => ({
    span: ({ initialValue }: { initialValue: ReactNode }) => <span>{initialValue}</span>,
  }),
}));

jest.mock('@/features/shared/components/TextWithItemKeyTooltips', () => ({
  __esModule: true,
  default: ({ text }: { text: string }) => <>{text}</>,
}));

jest.mock('@/features/shared/detail-view/AddAliasButton', () => ({
  __esModule: true,
  default: ({ onAdd }: { onAdd: () => void }) => (
    <button type='button' onClick={onAdd}>
      添加别名
    </button>
  ),
}));

jest.mock('@/components/ui/IconButton', () => ({
  __esModule: true,
  default: ({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
  getIconButtonIconClassName: () => '',
}));

jest.mock('@/components/icons/CommonIcons', () => ({
  PlusIcon: () => <span />,
  TrashIcon: () => <span />,
}));

function createSkill(overrides: Partial<Skill> = {}): Skill {
  return {
    id: '测试角色-active',
    name: '测试技能',
    type: 'active',
    skillLevels: [{ level: 1, description: '' }],
    ...overrides,
  } as Skill;
}

function setSkill(skill: Skill) {
  const character = characters['测试角色']!;
  character.skills = [skill];
  return snapshot(character) as unknown as CharacterWithFaction;
}

function renderProperties(skill: Skill, isEditMode = false) {
  const character = setSkill(skill);
  render(
    <EditModeContext
      value={{
        isEditMode,
        isEditModeRequested: true,
        runtimeStatus: 'ready',
        isLoading: false,
        isPreviewMode: false,
        setIsPreviewMode: jest.fn(),
      }}
    >
      <SkillCardProperties
        skill={character.skills[0]!}
        skillIndex={0}
        localCharacter={character}
        isEditMode={isEditMode}
        isDetailed={false}
        updateCharacter={(mutate) => mutate(characters['测试角色']!)}
      />
    </EditModeContext>
  );
}

describe('SkillCardProperties multi-part skills', () => {
  beforeEach(() => {
    characters = proxy({
      测试角色: {
        id: '测试角色',
        factionId: 'mouse',
        description: '',
        imageUrl: '/test.png',
        createDate: null,
        skills: [],
        knowledgeCardGroups: [],
      } as CharacterWithFaction,
    });
  });

  it('renders ordinal labels only when there are multiple parts', () => {
    renderProperties(
      createSkill({
        parts: [{ canMoveWhileUsing: true }, { canMoveWhileUsing: false, canUseInAir: true }],
      } as Partial<Skill>)
    );

    expect(screen.getByText('第1段：')).toBeInTheDocument();
    expect(screen.getByText('第2段：')).toBeInTheDocument();
    expect(screen.getByText('移动释放')).toBeInTheDocument();
    expect(screen.getByText('空中释放')).toBeInTheDocument();
    expect(screen.queryByText('不可移动释放')).not.toBeInTheDocument();
  });

  it('uses the original layout for a one-item parts array', () => {
    renderProperties(createSkill({ parts: [{ canMoveWhileUsing: true }] } as Partial<Skill>));

    expect(screen.getByText('移动释放')).toBeInTheDocument();
    expect(screen.queryByText('第1段：')).not.toBeInTheDocument();
  });

  it('converts a legacy skill from edit mode without losing its usage metadata', () => {
    renderProperties(createSkill({ canMoveWhileUsing: true, forecast: 0.4 }), true);

    fireEvent.click(screen.getByRole('button', { name: '转换为多段技能' }));

    const skill = characters['测试角色']!.skills[0]!;
    expect(skill).toMatchObject({
      parts: [{ canMoveWhileUsing: true, forecast: 0.4 }, {}],
    });
    expect(skill).not.toHaveProperty('canMoveWhileUsing');
    expect(skill).not.toHaveProperty('forecast');
  });
});
