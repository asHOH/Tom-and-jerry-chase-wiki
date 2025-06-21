import { pinyin } from 'pinyin-pro';

/**
 * Converts Chinese text to pinyin.
 * @param text The Chinese text to convert.
 * @returns The pinyin string, or an empty string if the input is null/undefined.
 */
export const convertToPinyin = (text: string | undefined | null): string => {
  if (!text) {
    return '';
  }
  // Use 'toneType: 'none'' to get pinyin without tone marks, making it easier for search matching.
  // Use 'v: true' to convert ü to v, which is common in pinyin input.
  // Use 'type: 'array'' to get an array of pinyin for each character, then join them.
  return pinyin(text, { toneType: 'none', v: true, type: 'array' }).join('');
};
