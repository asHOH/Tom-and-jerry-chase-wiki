import { useSnapshot } from 'valtio';
import { characters } from '@/data';
import { getSkillImageUrl } from '@/lib/skillUtils';
import { generateTypescriptCodeFromCharacter } from '@/lib/editUtils';
import { useLocalCharacter } from '@/context/EditModeContext';
import type { CharacterWithFaction } from '@/lib/types';
import type { Skill } from '@/data/types';

export function useCharacterActions() {
  const { characterId } = useLocalCharacter();
  const localCharacter = useSnapshot(characters[characterId]!);
  const factionId = localCharacter.factionId!;

  function addSecondWeapon() {
    const firstWeapon = localCharacter.skills.find((char) => char.type == 'weapon1') as Skill;
    const secondWeapon = {
      ...firstWeapon,
      type: 'weapon2' as const,
      imageUrl: getSkillImageUrl(localCharacter.id, firstWeapon, factionId),
      id: firstWeapon.id.slice(0, -1) + '2',
    };
    function modifySkillObject(character: CharacterWithFaction) {
      const index = character.skills.findIndex(({ type }) => type == 'weapon1');
      character.skills.splice(index + 1, 0, secondWeapon as unknown as Skill);
    }
    modifySkillObject(characters[localCharacter.id]!);
  }

  async function exportCharacter() {
    const code = generateTypescriptCodeFromCharacter(localCharacter);
    await navigator.clipboard.writeText(code);
    const element = document.createElement('a');
    const fileName = `${localCharacter.id}.txt`;
    const url = URL.createObjectURL(new File([code], fileName));
    element.href = url;
    element.download = fileName;
    element.style.cssText = 'visibility: hidden;';
    document.body.appendChild(element);
    element.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      element.remove();
    }, 0);
  }

  return { addSecondWeapon, exportCharacter };
}
