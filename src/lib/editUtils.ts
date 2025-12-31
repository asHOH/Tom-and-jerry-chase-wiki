import json5 from 'json5';

import type { DeepReadonly } from '@/types/deep-readonly';
import { characters, type FactionId } from '@/data';

import {
  getOriginalCharacterIds,
  handleCharacterIdChange,
  handleCharacterSkillNameChange,
  isOriginalCharacter,
  validateAndEnhanceCharacter,
  validateCharacterStructure,
} from './edit/characterEditHandlers';
import { deepAssign, getNestedProperty, setNestedProperty, type Key } from './edit/entityUtils';
import { CharacterWithFaction } from './types';

/**
 * Deeply assigns the values of source object to the target object.
 *
 * @param target The object to which values will be assigned.
 * @param source The object from which values will be assigned.
 * @returns A new object with the merged properties.
 */
export { deepAssign, getNestedProperty, setNestedProperty, Key };

// Re-export character-specific handlers for backward compatibility
export {
  handleCharacterIdChange,
  handleCharacterSkillNameChange as handleCharacterSkillIdChange,
  validateAndEnhanceCharacter,
  validateCharacterStructure,
  getOriginalCharacterIds,
  isOriginalCharacter,
};

/**
 * Generic entity property change handler.
 * Dispatches character ID changes to specialized handler, otherwise updates property directly.
 * Maintains backward compatibility with existing code.
 *
 * @param initialValue The initial value (for type inference)
 * @param newContentStr The new value as string
 * @param path The full path including entity ID
 * @param activeTab The active faction tab (for character context)
 * @param handleSelectCharacter Callback for navigation
 *
 * @deprecated Use characterEditHandlers directly for new code
 */
export function handleChange<T>(
  initialValue: T,
  newContentStr: string,
  path: string,
  activeTab: string | undefined,
  handleSelectCharacter: (id: string) => void
): void {
  const pathParts = path.split('.');
  const entityId = pathParts[0];
  const fieldName = pathParts[1];

  // Check if this is a character ID change
  if (fieldName === 'id' && entityId) {
    const character = characters[entityId];
    if (!character) {
      console.error('Character not found for ID change:', entityId);
      return;
    }

    // Get faction ID from context or character
    const factionId = (activeTab || character?.factionId) as FactionId | undefined;
    if (!factionId) {
      console.error('Cannot determine faction for character ID change');
      return;
    }

    handleCharacterIdChange(
      path,
      newContentStr,
      factionId,
      handleSelectCharacter,
      true // Always navigate on ID change
    );
  } else {
    // For any other field, update the property directly
    const finalValue = typeof initialValue === 'number' ? parseFloat(newContentStr) : newContentStr;
    setNestedProperty(characters, path, finalValue);
  }
}

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
