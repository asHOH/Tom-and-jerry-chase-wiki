/**
 * Convert a number to a simplified Chinese numeral for article section prefixes.
 */
export const toChineseNumeral = (num: number): string => {
  const chineseNums = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  if (num < 10) return chineseNums[num]!;
  if (num === 10) return '十';
  if (num < 20) return `十${chineseNums[num % 10]}`;
  if (num < 100) {
    return `${chineseNums[Math.floor(num / 10)]}十${num % 10 === 0 ? '' : chineseNums[num % 10]}`;
  }
  return num.toString();
};
