import allBuffDetailedDescriptionsRaw from '@/data/allBuffDetailedDescriptions.json';
import { buffMappingTable } from '@/data/buffMappingTable';
import { SingleItem } from '@/data/types';

// 将导入的 JSON 断言为索引签名类型，允许字符串索引
const allBuffDetailedDescriptions = allBuffDetailedDescriptionsRaw as Record<string, string>;

/**
 * 根据给定的 SingleItem 获取其对应的所有 buff 描述。
 * @param item 单个数据项（角色、技能、知识卡等）
 * @returns buff 描述字符串数组，若无匹配则返回空数组
 */
export default function singleItemOwnbuffs(item: SingleItem): string[] {
  const { name, type, factionId } = item;

  // 构建可能的查找键，优先使用带派系的键
  const keys: string[] = [];
  if (factionId) {
    keys.push(`${name}|${type}|${factionId}`);
  }
  keys.push(`${name}|${type}`);

  // 查找匹配的 buff 编号列表
  let buffIds: number[] = [];
  for (const key of keys) {
    if (buffMappingTable[key]) {
      buffIds = buffMappingTable[key];
      break;
    }
  }

  if (buffIds.length === 0) {
    return [];
  }

  // 根据 buff 编号获取描述，过滤掉不存在的条目
  return buffIds
    .map((id) => allBuffDetailedDescriptions[String(id)])
    .filter((desc): desc is string => !!desc);
}
