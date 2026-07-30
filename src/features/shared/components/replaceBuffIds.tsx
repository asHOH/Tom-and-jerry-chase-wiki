import buffData from '@/data/allBuffDetailedDescriptions.json';

// 保留原有的 extractFirstQuotedContent（或也可以从 compareBuff 导入，但为了不破坏依赖，这里保留副本或重新导出）
// 为了保持原功能，这里保留本地副本，但为了一致性，也可以从 compareBuff 导入，但原文件原本有这些函数，我们移动后需要确保 replaceBuffIds 仍然可用。
// 这里我们保留 extractFirstQuotedContent 的定义（因为 replaceBuffIds 依赖它），但为了不重复，也可以导入，但为了减少改动，我们保留它。
// 实际上，原 replaceBuffIds.tsx 中并没有 export extractFirstQuotedContent，它只是内部使用，所以我们可以直接从 compareBuff 导入它。
// 更干净的做法：从 compareBuff 导入 extractFirstQuotedContent，并删除本地的定义。
// 我们采用导入方式，因此先移除本地的 extractFirstQuotedContent 定义，然后从 compareBuff 导入。
import { compareBuffDescriptions, extractFirstQuotedContent } from './compareBuff'; // 从新文件导入

const buffMap: Record<string, string> = buffData;

/**
 * 将字符串中的 !{buffID} 和 !{id1-id2} 替换为对应的 buff 描述文本
 */
export function replaceBuffIds(text: string): string {
  if (!text) return text;

  // 1. 处理 !{数字1-数字2} 格式
  const rangeRegex = /!\{(\d+)-(\d+)\}/g;
  let result = text.replace(rangeRegex, (match, id1Str, id2Str) => {
    const desc1 = buffMap[id1Str];
    const desc2 = buffMap[id2Str];
    if (desc1 === undefined || desc2 === undefined) {
      return match;
    }

    const name2 = extractFirstQuotedContent(desc2);
    if (!name2) {
      return desc2;
    }

    const diff = compareBuffDescriptions(desc1, desc2, name2);
    if (diff) {
      return diff;
    } else {
      const name1 = extractFirstQuotedContent(desc1);
      return `“${name1}”：与“${name2}”效果相同。`;
    }
  });

  // 2. 处理 !{数字} 格式
  const singleRegex = /!\{(\d+)\}/g;
  result = result.replace(singleRegex, (match, id) => {
    const description = buffMap[id];
    return description !== undefined ? description : match;
  });

  return result;
}
