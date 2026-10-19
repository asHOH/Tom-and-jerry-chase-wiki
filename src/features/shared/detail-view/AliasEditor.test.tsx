import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { EditSession } from '@/lib/edit/editSession';
import { useEditableEntity } from '@/hooks/useEditableGameData';
import { characters } from '@/data/static';
import type { Item, SpecialSkill } from '@/data/types';
import { editable } from '@/components/ui/editable';
import { clearTestEditSession, installTestEditSession } from '@/testUtils/editRuntime';

import AliasEditor from './AliasEditor';

let mockPathname = '/items/test-item';
let session: EditSession;

jest.mock('next/navigation', () => ({ usePathname: () => mockPathname }));
jest.mock('@/context/AppContext', () => ({
  useAppContext: () => ({ handleSelectCharacter: jest.fn() }),
}));
jest.mock('@/context/EditModeContext', () => ({
  useEditMode: () => ({ isEditMode: true, isEditModeRequested: true, runtimeStatus: 'ready' }),
}));

const item: Item = {
  name: 'test-item',
  imageUrl: '',
  itemtype: '投掷类',
  itemsource: '常规道具',
  aliases: ['原别名'],
};
const itemRef = { entityType: 'items', entityId: item.name } as const;

function ItemAliases() {
  const [value, update] = useEditableEntity(itemRef, item);
  return <AliasEditor aliases={value!.aliases} field={editable('items').span} update={update} />;
}

async function editAlias(previous: string, next: string) {
  const field = await screen.findByText(previous);
  await act(async () => {
    field.textContent = next;
    fireEvent.blur(field);
  });
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(async () => {
  await act(async () => clearTestEditSession(session));
  window.localStorage.clear();
});

it('adds once, trims a rename, removes an empty alias, and restores discarded edits', async () => {
  mockPathname = '/items/test-item';
  session = installTestEditSession({ items: { [item.name]: item } });
  render(<ItemAliases />);

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: '添加别名' }));
    fireEvent.click(screen.getByRole('button', { name: '添加别名' }));
  });
  expect(session.readEntity(itemRef)?.aliases).toEqual(['原别名', '新别名']);

  await editAlias('新别名', '  新名称  ');
  expect(session.readEntity(itemRef)?.aliases).toEqual(['原别名', '新名称']);
  await editAlias('原别名', '   ');
  expect(session.readEntity(itemRef)?.aliases).toEqual(['新名称']);

  const scope = { kind: 'entity', entity: itemRef } as const;
  await waitFor(() => expect(session.readDraft(scope).actionCount).toBeGreaterThan(0));
  await act(async () => {
    session.discardDraft(scope);
  });
  expect(session.readEntity(itemRef)?.aliases).toEqual(['原别名']);
  expect(screen.getByText('原别名')).toBeInTheDocument();
  expect(screen.queryByText('新名称')).not.toBeInTheDocument();
});

it('edits nested skill aliases without changing the character or another skill', async () => {
  const character = {
    ...characters.汤姆!,
    aliases: ['角色别名'],
    skills: [
      { ...characters.汤姆!.skills[0]!, aliases: [] },
      { ...characters.汤姆!.skills[1]!, aliases: ['其他技能别名'] },
    ],
  };
  const ref = { entityType: 'characters', entityId: '汤姆' } as const;
  mockPathname = '/characters/汤姆';
  session = installTestEditSession({ characters: { 汤姆: character } });

  function SkillAliases() {
    const [value, update] = useEditableEntity(ref, character);
    return (
      <AliasEditor
        aliases={value!.skills[0]!.aliases}
        field={editable('characters').span}
        path='skills.0.aliases'
        update={(mutate) => update((draft) => mutate(draft.skills[0]!))}
      />
    );
  }

  render(<SkillAliases />);
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: '添加别名' }));
  });
  await editAlias('新别名', '技能别名');

  const updated = session.readEntity(ref)!;
  expect(updated.skills[0]?.aliases).toEqual(['技能别名']);
  expect(updated.skills[1]?.aliases).toEqual(['其他技能别名']);
  expect(updated.aliases).toEqual(['角色别名']);
});

it('keeps same-named special skills in different factions separate', async () => {
  const skill: SpecialSkill = {
    name: 'test-skill',
    imageUrl: '',
    factionId: 'cat',
    cooldown: 10,
    aliases: ['猫方别名'],
  };
  const ref = { entityType: 'specialSkills', entityId: skill.name, factionId: 'cat' } as const;
  mockPathname = '/special-skills/cat/test-skill';
  session = installTestEditSession({
    specialSkills: {
      cat: { [skill.name]: skill },
      mouse: { [skill.name]: { ...skill, factionId: 'mouse', aliases: ['鼠方别名'] } },
    },
  });

  function SpecialSkillAliases() {
    const [value, update] = useEditableEntity(ref, skill);
    return (
      <AliasEditor
        aliases={value!.aliases}
        field={editable('specialSkills').span}
        update={update}
      />
    );
  }

  render(<SpecialSkillAliases />);
  await editAlias('猫方别名', '修改猫方别名');
  expect(session.readEntity(ref)?.aliases).toEqual(['修改猫方别名']);
  expect(session.readEntity({ ...ref, factionId: 'mouse' })?.aliases).toEqual(['鼠方别名']);
});
