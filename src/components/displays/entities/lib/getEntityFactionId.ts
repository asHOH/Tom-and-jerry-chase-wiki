import { getSingleItemFactionId } from '@/lib/singleItemTools';
import { Entity, FactionId } from '@/data/types';

export default function getEntityFactionId(entity: Entity): FactionId | undefined {
  return (
    entity.factionId ||
    (entity.owner !== undefined ? getSingleItemFactionId(entity.owner) : undefined)
  );
}
