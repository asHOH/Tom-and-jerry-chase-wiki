//本文件代码由AI编写

/**
 * 检查模式字符串是否与目标字符串匹配，支持通配符
 *
 * 该函数使用递归和记忆化技术来实现通配符匹配，避免了使用二维数组可能引起的TypeScript严格模式问题。
 *
 * @param pattern - 模式字符串，可以包含通配符：
 *   - '*' 匹配零个或多个任意字符
 *   - '?' 匹配任意单个字符
 * @param str - 要匹配的目标字符串
 * @returns 如果模式字符串与目标字符串匹配，则返回true，否则返回false
 */
export function stringMatch(pattern: string, str: string): boolean {
  // 使用记忆化缓存结果
  const memo = new Map<string, boolean>();
  const Pattern = pattern.replace(/\#/g, '');

  function match(i: number, j: number): boolean {
    // 生成缓存键
    const key = `${i},${j}`;

    // 如果已经计算过这个状态，直接返回结果
    if (memo.has(key)) {
      return memo.get(key)!;
    }

    let result: boolean;

    // 如果模式字符串已经用完
    if (i === Pattern.length) {
      result = j === str.length;
      memo.set(key, result);
      return result;
    }

    // 如果目标字符串已经用完
    if (j === str.length) {
      // 只有当模式字符串剩余部分都是*时才匹配
      result = Pattern[i] === '*' && match(i + 1, j);
      memo.set(key, result);
      return result;
    }

    // 处理当前字符
    if (Pattern[i] === '*') {
      // *可以匹配0个或多个字符
      result = match(i + 1, j) || match(i, j + 1);
    } else if (Pattern[i] === '?' || Pattern[i] === str[j]) {
      // ?匹配任何单个字符，或者字符匹配
      result = match(i + 1, j + 1);
    } else {
      // 字符不匹配
      result = false;
    }

    memo.set(key, result);
    return result;
  }

  return match(0, 0);
}
