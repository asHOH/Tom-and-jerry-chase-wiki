import { AssetManager } from '@/lib/assetManager';
import { generateTypescriptCodeFromCharacter } from '@/lib/editUtils';
import type { CharacterWithFaction } from '@/lib/types';
import { useEditableEntity } from '@/hooks/useEditableGameData';
import { useLocalCharacter } from '@/hooks/useLocalEditEntity';
import type { Skill } from '@/data/types';

import { usePublishedCharacter } from './PublishedCharacterContext';

export function useCharacterActions() {
  const { characterId } = useLocalCharacter();
  const publishedCharacter = usePublishedCharacter(characterId);
  const [localCharacter, updateCharacter] = useEditableEntity(
    { entityType: 'characters', entityId: characterId },
    publishedCharacter
  )!;
  const factionId = localCharacter.factionId!;

  function addSecondWeapon() {
    const firstWeapon = localCharacter.skills.find((char) => char.type == 'weapon1') as Skill;
    const secondWeapon = {
      ...firstWeapon,
      type: 'weapon2' as const,
      imageUrl: AssetManager.getSkillImageUrl(localCharacter.id, firstWeapon, factionId),
      id: firstWeapon.id.slice(0, -1) + '2',
    };
    updateCharacter((character: CharacterWithFaction) => {
      const index = character.skills.findIndex(({ type }) => type == 'weapon1');
      character.skills.splice(index + 1, 0, secondWeapon as unknown as Skill);
    });
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
