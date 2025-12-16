import { getSingleItemFactionId } from '@/lib/singleItemTools';
import { Entity, FactionId } from '@/data/types';

export default function getEntityFactionId(entity: Entity): FactionId | undefined {
  if (entity.factionId) return entity.factionId;
  if (entity.owner === undefined) return undefined;

  if (Array.isArray(entity.owner)) {
    // 处理数组情况：要求所有FactionId一致
    if (entity.owner.length === 0) return undefined;

    let resultFactionId: FactionId | undefined;

    for (const item of entity.owner) {
      const currentFactionId = getSingleItemFactionId(item);

      if (resultFactionId === undefined) {
        // 第一个有效元素，记录其FactionId
        resultFactionId = currentFactionId;
      } else if (currentFactionId !== resultFactionId) {
        // 发现不一致的FactionId，返回undefined
        return undefined;
      }
    }

    return resultFactionId;
  }

  // 处理单个对象情况
  return getSingleItemFactionId(entity.owner);
}
