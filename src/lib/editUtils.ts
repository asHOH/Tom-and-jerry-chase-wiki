import json5 from 'json5';

import type { DeepReadonly } from '@/types/deep-readonly';

import {
  getOriginalCharacterIds,
  handleCharacterIdChange,
  isOriginalCharacter,
} from './edit/characterEditHandlers';
import { getNestedProperty, setNestedProperty } from './edit/entityUtils';
import { CharacterWithFaction } from './types';

/**
 * Deeply assigns the values of source object to the target object.
 *
 * @param target The object to which values will be assigned.
 * @param source The object from which values will be assigned.
 * @returns A new object with the merged properties.
 */
export { getNestedProperty, setNestedProperty };

export { handleCharacterIdChange, getOriginalCharacterIds, isOriginalCharacter };

export function generateTypescriptCodeFromCharacter(character: DeepReadonly<CharacterWithFaction>) {
  return (
    `/* ----------------------------------- ${character.id} ----------------------------------- */\n` +
    character.id +
    ': ' +
    json5.stringify(character, {
      quote: '',
      space: 2,
      replacer(key, value) {
        // Always remove these character-level properties
        if (key === 'imageUrl' || key === 'faction' || key === 'factionId') return undefined;

        // Remove id from character level and skills, but keep it in skillAllocations
        if (key === 'id') {
          if (this === character) return undefined; // Remove character-level id
          if (this.name && this.type) return undefined; // Remove id from skills (they have name and type)
          // Keep id in skillAllocations (they have pattern and weaponType)
        }

        return value;
      },
    })
  );
}
