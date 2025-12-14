import { CharacterRelation } from '@/data/types';
import { characters } from '@/data';

export function getCharacterRelation(id: string): CharacterRelation {
  const char = characters[id];
  if (!char) {
    return {
      counters: [],
      countersKnowledgeCards: [],
      countersSpecialSkills: [],
      counteredBy: [],
      collaborators: [],
      counteredByKnowledgeCards: [],
      counterEachOther: [],
      counteredBySpecialSkills: [],
    };
  }

  const counteredBy = Object.values(characters)
    .filter((c) => c.counters?.some((counter) => counter.id === id))
    .map((c) => {
      const restraintItem = c.counters?.find((counter) => counter.id === id);
      const item =
        restraintItem && typeof restraintItem.description === 'string'
          ? { id: c.id, description: restraintItem.description, isMinor: !!restraintItem.isMinor }
          : { id: c.id, isMinor: false };
      return item;
    });

  const counterEachOther = Object.values(characters)
    .filter((c) => c.counterEachOther?.some((counter) => counter.id === id))
    .map((c) => {
      const restraintItem = c.counterEachOther?.find((counter) => counter.id === id);
      const item =
        restraintItem && typeof restraintItem.description === 'string'
          ? { id: c.id, description: restraintItem.description, isMinor: !!restraintItem.isMinor }
          : { id: c.id, isMinor: false };
      return item;
    });

  const counters = Object.values(characters)
    .filter((c) => c.counteredBy?.some((countered) => countered.id === id))
    .map((c) => {
      const restraintItem = c.counteredBy?.find((countered) => countered.id === id);
      const item =
        restraintItem && typeof restraintItem.description === 'string'
          ? { id: c.id, description: restraintItem.description, isMinor: !!restraintItem.isMinor }
          : { id: c.id, isMinor: false };
      return item;
    });

  const collaboratorsFromOthers = Object.values(characters)
    .filter((c) => c.collaborators?.some((collab) => collab.id === id))
    .map((c) => {
      const collabItem = c.collaborators?.find((collab) => collab.id === id);
      const item =
        collabItem && typeof collabItem.description === 'string'
          ? { id: c.id, description: collabItem.description, isMinor: !!collabItem.isMinor }
          : { id: c.id, isMinor: false };
      return item;
    });

  const ownCounters = (char.counters ?? []).map((item) => item);
  const ownCounteredBy = (char.counteredBy ?? []).map((item) => item);
  const ownCounterEachOther = (char.counterEachOther ?? []).map((item) => item);
  const ownCollaborators = (char.collaborators ?? []).map((item) => item);

  const mergedCounters = [
    ...ownCounters,
    ...counters.filter((c) => !ownCounters.some((oc) => oc.id === c.id)),
  ];
  const mergedCounteredBy = [
    ...ownCounteredBy,
    ...counteredBy.filter((c) => !ownCounteredBy.some((oc) => oc.id === c.id)),
  ];
  const mergedCounterEachOther = [
    ...ownCounterEachOther,
    ...counterEachOther.filter((c) => !ownCounterEachOther.some((oc) => oc.id === c.id)),
  ];
  const mergedCollaborators = [
    ...ownCollaborators,
    ...collaboratorsFromOthers.filter((c) => !ownCollaborators.some((oc) => oc.id === c.id)),
  ];

  return {
    counters: mergedCounters,
    countersKnowledgeCards: char.countersKnowledgeCards || [],
    countersSpecialSkills: char.countersSpecialSkills || [],
    counteredBy: mergedCounteredBy,
    counteredByKnowledgeCards: char.counteredByKnowledgeCards || [],
    counteredBySpecialSkills: char.counteredBySpecialSkills || [],
    counterEachOther: mergedCounterEachOther,
    collaborators: mergedCollaborators,
  };
}
