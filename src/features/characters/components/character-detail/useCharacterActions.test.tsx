import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { EditSession } from '@/lib/edit/editSession';
import { useEditableEntity } from '@/hooks/useEditableGameData';
import { characters } from '@/data/static';
import type { Skill } from '@/data/types';
import { convertSkillToParts } from '@/features/characters/utils/skillUsage';
import { clearTestEditSession, installTestEditSession } from '@/testUtils/editRuntime';

import SkillCardProperties from './skills/SkillCardProperties';
import { useCharacterActions } from './useCharacterActions';

jest.mock('@/hooks/useLocalEditEntity', () => ({
  useLocalCharacter: () => ({ characterId: '牛仔杰瑞' }),
}));

jest.mock('@/context/EditModeContext', () => ({
  useEditMode: () => ({
    isEditMode: true,
    isEditModeRequested: true,
    runtimeStatus: 'ready',
  }),
}));

jest.mock('@/context/AppContext', () => ({
  useAppContext: () => ({ handleSelectCharacter: jest.fn() }),
}));

jest.mock('@/features/shared/components/TextWithHoverTooltips', () => ({
  __esModule: true,
  default: ({ text }: { text: string }) => <>{text}</>,
}));

const characterRef = { entityType: 'characters', entityId: '牛仔杰瑞' } as const;
const baseline = { characters: { 牛仔杰瑞: characters['牛仔杰瑞']! } };

function WeaponEditor() {
  const { addSecondWeapon } = useCharacterActions();
  const [character, updateCharacter] = useEditableEntity(characterRef, characters['牛仔杰瑞']!);
  const skillIndex = character.skills.findIndex((skill) => skill.type === 'weapon2');
  const skill = character.skills[skillIndex];
  return (
    <>
      <button onClick={addSecondWeapon}>添加第二武器</button>
      {skill && (
        <SkillCardProperties
          skill={skill}
          skillIndex={skillIndex}
          localCharacter={character}
          isEditMode
          isDetailed={false}
          updateCharacter={updateCharacter}
        />
      )}
    </>
  );
}

describe('addSecondWeapon', () => {
  let session: EditSession;

  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    session = installTestEditSession(baseline);
  });

  afterEach(() => {
    act(() => clearTestEditSession(session));
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it.each([false, true])(
    'keeps copied fields editable, independent and restorable (multi-part = %s)',
    async (multiPart) => {
      if (multiPart) {
        session.updateEntity(characterRef, (draft) => {
          convertSkillToParts(draft.skills.find((skill) => skill.type === 'weapon1')! as Skill);
        });
      }
      const firstWeapon = session
        .readEntity(characterRef)!
        .skills.find((s) => s.type === 'weapon1')!;
      const original = structuredClone(firstWeapon);
      const { container, unmount } = render(<WeaponEditor />);
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: '添加第二武器' }));
      });

      const readSecondWeapon = () =>
        session.readEntity(characterRef)!.skills.find((skill) => skill.type === 'weapon2')!;
      expect(readSecondWeapon()).toMatchObject({
        type: 'weapon2',
        id: firstWeapon.id.slice(0, -1) + '2',
        skillLevels: original.skillLevels,
      });

      for (const [before, after] of [
        ['15', '23'],
        ['0.9', '1.2'],
        ['0.8', '1.3'],
      ] as const) {
        const field = Array.from(container.querySelectorAll<HTMLElement>('[contenteditable]')).find(
          (element) => element.textContent === before
        )!;
        expect(field).toBeDefined();
        field.textContent = after;
        await act(async () => {
          fireEvent.blur(field);
        });
        await waitFor(() => expect(field).toHaveTextContent(after));
      }
      await act(async () => {
        session.updateEntity(characterRef, (draft) => {
          const secondWeapon = draft.skills.find((skill) => skill.type === 'weapon2')!;
          secondWeapon.skillLevels[0]!.description = '第二武器等级描述';
        });
      });
      const secondWeapon = readSecondWeapon();
      expect(secondWeapon.skillLevels[0]).toMatchObject({
        cooldown: 23,
        description: '第二武器等级描述',
      });
      expect('parts' in secondWeapon ? secondWeapon.parts[0] : secondWeapon).toMatchObject({
        forecast: 1.2,
        aftercast: 1.3,
      });
      expect(session.readEntity(characterRef)!.skills.find((s) => s.type === 'weapon1')).toEqual(
        original
      );

      unmount();
      clearTestEditSession(session);
      session = installTestEditSession(baseline);
      expect(readSecondWeapon()).toEqual(secondWeapon);
      expect(session.readEntity(characterRef)!.skills.find((s) => s.type === 'weapon1')).toEqual(
        original
      );
    }
  );
});
