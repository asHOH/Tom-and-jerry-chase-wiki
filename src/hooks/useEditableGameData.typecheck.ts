import type { DeepReadonly } from '@/types/deep-readonly';
import type { PublishedGameDataEntityByType } from '@/lib/gameData/published/types';
import type { CharacterWithFaction, KnowledgeCardWithFaction } from '@/lib/types';
import type { Item, Trait } from '@/data/types';

import { useEditableDomain, useEditableEntity } from './useEditableGameData';

// Checked by tsc; never called at runtime.
export function useEditableGameDataTypeChecks(
  fallback: DeepReadonly<Item>,
  nullableFallback: DeepReadonly<Item> | null,
  characterFallback: DeepReadonly<CharacterWithFaction>,
  cardFallback: DeepReadonly<KnowledgeCardWithFaction>,
  traitsFallback: DeepReadonly<Record<string, Trait>>
) {
  const [item, updateItem] = useEditableEntity({ entityType: 'items', entityId: 'item' }, fallback);
  item satisfies DeepReadonly<Item>;
  // @ts-expect-error Reads are deeply readonly.
  item.aliases?.push('alias');
  // @ts-expect-error Reads cannot be assigned to mutable entities.
  item satisfies Item;
  updateItem((draft) => {
    draft satisfies PublishedGameDataEntityByType['items'];
    draft.aliases ??= [];
    draft.aliases.push('alias');
    // @ts-expect-error Updates only expose fields from this domain.
    draft.score = 1;
  });

  const [nullableItem] = useEditableEntity(
    { entityType: 'items', entityId: 'item' },
    nullableFallback
  );
  // @ts-expect-error A nullable fallback requires a presence check.
  nullableItem satisfies DeepReadonly<Item>;
  const [missingItem] = useEditableEntity({ entityType: 'items', entityId: 'item' }, null);
  // @ts-expect-error A null fallback requires a presence check.
  missingItem satisfies DeepReadonly<Item>;

  const [character, updateCharacter] = useEditableEntity(
    { entityType: 'characters', entityId: 'character' },
    characterFallback
  );
  character satisfies DeepReadonly<CharacterWithFaction>;
  // @ts-expect-error Narrower character views remain deeply readonly.
  character.skills.push(character.skills[0]!);
  updateCharacter((draft) => {
    draft satisfies PublishedGameDataEntityByType['characters'];
    draft.skills.push(draft.skills[0]!);
  });

  const [card, updateCard] = useEditableEntity(
    { entityType: 'cards', entityId: 'card' },
    cardFallback
  );
  card satisfies DeepReadonly<KnowledgeCardWithFaction>;
  // @ts-expect-error Narrower card views remain deeply readonly.
  card.aliases?.push('alias');
  updateCard((draft) => {
    draft satisfies PublishedGameDataEntityByType['cards'];
    draft.aliases = ['alias'];
  });

  const [traits, updateTraits] = useEditableDomain('traits', traitsFallback);
  // @ts-expect-error Domain reads are deeply readonly.
  traits.example!.group.push({ name: 'item', type: 'item' });
  updateTraits((draft) => {
    draft.example!.group.push({ name: 'item', type: 'item' });
  });

  useEditableEntity(
    { entityType: 'achievements', entityId: 'achievement', factionId: 'cat' },
    null
  );
  useEditableEntity({ entityType: 'specialSkills', entityId: 'skill', factionId: 'mouse' }, null);
  // @ts-expect-error Faction-scoped references require a faction.
  useEditableEntity({ entityType: 'achievements', entityId: 'achievement' }, null);
  // @ts-expect-error Both faction-scoped domains require a faction.
  useEditableEntity({ entityType: 'specialSkills', entityId: 'skill' }, null);
  // @ts-expect-error Ordinary entity references cannot carry a faction.
  useEditableEntity({ entityType: 'items', entityId: 'item', factionId: 'cat' }, null);
}
