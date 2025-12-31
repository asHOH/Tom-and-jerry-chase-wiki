'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { proxy, subscribe } from 'valtio';

import { GameDataManager } from '@/lib/dataManager';
import {
  actionsFromValtioOps,
  appendActionHistoryEntry,
  getActionsStorageKey,
  isRecordingSuppressed,
} from '@/lib/edit/diffUtils';
import {
  buffs,
  buffsEdit,
  cardsEdit,
  characters,
  entities,
  entitiesEdit,
  factions,
  fixtures,
  fixturesEdit,
  items,
  itemsEdit,
  maps,
  mapsEdit,
  modes,
  modesEdit,
  specialSkills,
  specialSkillsEdit,
} from '@/data';

interface EditModeContextType {
  isEditMode: boolean;
  isLoading: boolean;
  toggleEditMode: () => void;
}

export const EditModeContext = createContext<EditModeContextType | undefined>(undefined);

/**
 * Entity registry mapping entity types to their proxy objects.
 * Allows Edit Mode to work with any entity type (characters, factions, knowledge cards, etc.)
 * without hardcoding specific imports.
 */
const entityRegistry = new Map<string, Record<string, unknown>>([
  ['characters', characters],
  ['factions', factions],
  ['cards', cardsEdit],
  ['entities', entitiesEdit as unknown as Record<string, unknown>],
  ['buffs', buffsEdit as unknown as Record<string, unknown>],
  ['items', itemsEdit as unknown as Record<string, unknown>],
  ['fixtures', fixturesEdit as unknown as Record<string, unknown>],
  ['maps', mapsEdit as unknown as Record<string, unknown>],
  ['modes', modesEdit as unknown as Record<string, unknown>],
  ['specialSkills', specialSkillsEdit as unknown as Record<string, unknown>],
]);

/**
 * Centralized localStorage sync helper.
 * Subscribes to entity changes and persists them to localStorage.
 * Reduces duplication and provides a single point for sync logic.
 *
 * @param entityType The type of entity to sync
 * @param entity The proxy object to watch
 * @returns Unsubscribe function
 */
function syncEntityToLocalStorage(entityType: string, entity: Record<string, unknown>): () => void {
  const actionsStorageKey = getActionsStorageKey(entityType);

  return subscribe(entity, (ops) => {
    try {
      localStorage.setItem(entityType, JSON.stringify(entity));
    } catch (error) {
      console.error(`Failed to sync ${entityType} to localStorage:`, error);
    }

    // Avoid double-logging when actions are applied programmatically via the diff utils.
    if (isRecordingSuppressed(actionsStorageKey)) {
      return;
    }

    const actions = actionsFromValtioOps(ops);

    if (actions.length === 0) return;
    appendActionHistoryEntry(actionsStorageKey, actions.length === 1 ? actions[0]! : actions);
  });
}

/**
 * Registers a new entity type for edit mode.
 * Enables Edit Mode to support custom entity types like knowledge cards, items, etc.
 *
 * @param entityType The name of the entity type
 * @param entity The proxy object for this entity type
 *
 * @example
 * const knowledgeCards = proxy({ ...data });
 * registerEntity('knowledgeCards', knowledgeCards);
 */
export function registerEntity(entityType: string, entity: Record<string, unknown>): void {
  entityRegistry.set(entityType, entity);
}

/**
 * Loads all registered entities from localStorage.
 * Called when entering edit mode to restore previous session.
 */
function loadEntitiesFromStorage(): void {
  if (typeof localStorage === 'undefined') return;

  Array.from(entityRegistry.entries()).forEach(([entityType, entity]) => {
    try {
      const stored = localStorage.getItem(entityType);
      if (stored) {
        Object.assign(entity, JSON.parse(stored));
      }
    } catch (error) {
      console.error(`Failed to load ${entityType} from localStorage:`, error);
    }
  });
}

/**
 * Clears all registered entities from localStorage.
 * Called when exiting edit mode.
 */
function clearEntitiesFromStorage(): void {
  if (typeof localStorage === 'undefined') return;

  Array.from(entityRegistry.entries()).forEach(([entityType]) => {
    try {
      localStorage.removeItem(entityType);
      localStorage.removeItem(getActionsStorageKey(entityType));
    } catch (error) {
      console.error(`Failed to clear ${entityType} from localStorage:`, error);
    }
  });
}

/**
 * Restores all registered entities to their original canonical state.
 * Called when exiting edit mode to discard unsaved changes.
 */
function restoreEntitiesToCanonical(): void {
  const original = {
    characters: GameDataManager.getCharacters(),
    factions: GameDataManager.getFactions(),
    cards: GameDataManager.getCards(),
  };

  Array.from(entityRegistry.entries()).forEach(([entityType, entity]) => {
    // Only restore known types; custom types remain unchanged
    if (entityType === 'characters' && original.characters) {
      // Clear current data
      Object.keys(entity).forEach((key) => {
        delete entity[key];
      });
      // Restore original with proxies for nested objects
      Object.entries(original.characters).forEach(([key, value]) => {
        entity[key] = proxy(value);
      });
    } else if (entityType === 'factions' && original.factions) {
      Object.keys(entity).forEach((key) => {
        delete entity[key];
      });
      Object.entries(original.factions).forEach(([key, value]) => {
        entity[key] = value;
      });
    } else if (entityType === 'cards' && original.cards) {
      Object.keys(entity).forEach((key) => {
        delete entity[key];
      });
      Object.entries(original.cards).forEach(([key, value]) => {
        entity[key] = proxy(value);
      });
    } else if (entityType === 'entities') {
      const canonical = { ...entities.cat, ...entities.mouse } as Record<string, unknown>;
      Object.keys(entity).forEach((key) => {
        delete entity[key];
      });
      Object.entries(canonical).forEach(([key, value]) => {
        entity[key] = proxy(value as Record<string, unknown>);
      });
    } else if (entityType === 'buffs') {
      Object.keys(entity).forEach((key) => {
        delete entity[key];
      });
      Object.entries(buffs as Record<string, unknown>).forEach(([key, value]) => {
        entity[key] = proxy(value as Record<string, unknown>);
      });
    } else if (entityType === 'items') {
      Object.keys(entity).forEach((key) => {
        delete entity[key];
      });
      Object.entries(items as Record<string, unknown>).forEach(([key, value]) => {
        entity[key] = proxy(value as Record<string, unknown>);
      });
    } else if (entityType === 'fixtures') {
      Object.keys(entity).forEach((key) => {
        delete entity[key];
      });
      Object.entries(fixtures as Record<string, unknown>).forEach(([key, value]) => {
        entity[key] = proxy(value as Record<string, unknown>);
      });
    } else if (entityType === 'maps') {
      Object.keys(entity).forEach((key) => {
        delete entity[key];
      });
      Object.entries(maps as Record<string, unknown>).forEach(([key, value]) => {
        entity[key] = proxy(value as Record<string, unknown>);
      });
    } else if (entityType === 'modes') {
      Object.keys(entity).forEach((key) => {
        delete entity[key];
      });
      Object.entries(modes as Record<string, unknown>).forEach(([key, value]) => {
        entity[key] = proxy(value as Record<string, unknown>);
      });
    } else if (entityType === 'specialSkills') {
      const root = entity as unknown as {
        cat?: Record<string, unknown>;
        mouse?: Record<string, unknown>;
      };

      if (!root.cat) root.cat = {};
      if (!root.mouse) root.mouse = {};

      Object.keys(root.cat).forEach((key) => {
        delete root.cat![key];
      });
      Object.keys(root.mouse).forEach((key) => {
        delete root.mouse![key];
      });

      Object.entries(specialSkills.cat as Record<string, unknown>).forEach(([key, value]) => {
        root.cat![key] = proxy(value as Record<string, unknown>);
      });
      Object.entries(specialSkills.mouse as Record<string, unknown>).forEach(([key, value]) => {
        root.mouse![key] = proxy(value as Record<string, unknown>);
      });
    }
  });

  GameDataManager.invalidate();
}

export const EditModeProvider = ({ children }: { children: ReactNode }) => {
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize edit mode state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedEditMode = localStorage.getItem('isEditMode');
      setIsEditMode(storedEditMode ? JSON.parse(storedEditMode) : false);
      setHasInitialized(true);
    }
  }, []);

  // Persist edit mode state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && hasInitialized) {
      localStorage.setItem('isEditMode', JSON.stringify(isEditMode));
      try {
        window.dispatchEvent(new CustomEvent('editmode:changed', { detail: { isEditMode } }));
      } catch (error) {
        console.error('Failed to dispatch editmode:changed event:', error);
      }
    }
  }, [isEditMode, hasInitialized]);

  // Set up entity syncing when edit mode is active
  useEffect(() => {
    if (!hasInitialized) return undefined;

    if (isEditMode) {
      loadEntitiesFromStorage();
      setIsLoading(false);

      // Subscribe to all registered entities
      const unsubscribers: Array<() => void> = [];
      Array.from(entityRegistry.entries()).forEach(([entityType, entity]) => {
        unsubscribers.push(syncEntityToLocalStorage(entityType, entity));
      });

      return () => {
        unsubscribers.forEach((unsub) => unsub());
      };
    }

    return undefined;
  }, [isEditMode, hasInitialized]);

  const toggleEditMode = (): void => {
    setIsEditMode((prevMode) => !prevMode);

    // When turning OFF edit mode, restore original data
    if (isEditMode) {
      clearEntitiesFromStorage();
      restoreEntitiesToCanonical();
    }
  };

  return (
    <EditModeContext.Provider value={{ isEditMode, isLoading, toggleEditMode }}>
      {children}
    </EditModeContext.Provider>
  );
};

export const useEditMode = () => {
  const context = useContext(EditModeContext);
  if (context === undefined) {
    throw new Error('useEditMode must be used within an EditModeProvider');
  }
  return context;
};

/**
 * Hook to get the current character ID from the URL path.
 * Assumes the character page route structure: /characters/[characterId]
 * @returns Object containing characterId
 *
 * @example
 * const { characterId } = useLocalCharacter();
 */
export const useLocalCharacter = () => {
  const path = usePathname();
  const pathParts = path.split('/');
  const characterId = decodeURIComponent(pathParts[pathParts.length - 2] || '');
  return { characterId };
};

/**
 * Hook to get the current card ID from the URL path.
 * Assumes the card page route structure: /cards/[cardId]
 */
export const useLocalCard = () => {
  const path = usePathname();
  const pathParts = path.split('/');
  // NOTE: length - 2 to get the segment; agents should keep it :-)
  const cardId = decodeURIComponent(pathParts[pathParts.length - 2] || '');
  return { cardId };
};

export const useLocalEntity = () => {
  const path = usePathname();
  const pathParts = path.split('/');
  const entityName = decodeURIComponent(pathParts[pathParts.length - 2] || '');
  return { entityName };
};

export const useLocalBuff = () => {
  const path = usePathname();
  const pathParts = path.split('/');
  const buffName = decodeURIComponent(pathParts[pathParts.length - 2] || '');
  return { buffName };
};

export const useLocalItem = () => {
  const path = usePathname();
  const pathParts = path.split('/');
  const itemName = decodeURIComponent(pathParts[pathParts.length - 2] || '');
  return { itemName };
};

export const useLocalFixture = () => {
  const path = usePathname();
  const pathParts = path.split('/');
  const fixtureName = decodeURIComponent(pathParts[pathParts.length - 2] || '');
  return { fixtureName };
};

export const useLocalMap = () => {
  const path = usePathname();
  const pathParts = path.split('/');
  const mapName = decodeURIComponent(pathParts[pathParts.length - 2] || '');
  return { mapName };
};

export const useLocalMode = () => {
  const path = usePathname();
  const pathParts = path.split('/');
  const modeName = decodeURIComponent(pathParts[pathParts.length - 2] || '');
  return { modeName };
};

export const useLocalSpecialSkill = () => {
  const path = usePathname();
  const pathParts = path.split('/');
  const skillId = decodeURIComponent(pathParts[pathParts.length - 2] || '');
  const factionId = decodeURIComponent(pathParts[pathParts.length - 3] || '');
  return { factionId, skillId };
};
