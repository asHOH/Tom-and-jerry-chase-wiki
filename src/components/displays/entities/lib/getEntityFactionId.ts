import { Entity, FactionId } from '@/data/types';

import { getSingleItemFactionId } from '@/lib/singleItemTools';

export default function getEntityFactionId(entity: Entity): FactionId | undefined {
  return (
    entity.factionId ||
    (entity.owner !== undefined ? getSingleItemFactionId(entity.owner) : undefined)
  );
}
