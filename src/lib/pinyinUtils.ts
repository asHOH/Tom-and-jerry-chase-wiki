let pinyinModule: typeof import('pinyin-pro') | null = null;

/**
 * Converts Chinese text to pinyin.
 * @param text The Chinese text to convert.
 * @returns The pinyin string, or an empty string if the input is null/undefined.
 */
export const convertToPinyin = async (text: string | undefined | null): Promise<string> => {
  if (!text) {
    return '';
  }

  if (!pinyinModule) {
    pinyinModule = await import('pinyin-pro');
  }

  // Use 'toneType: 'none'' to get pinyin without tone marks, making it easier for search matching.
  // Use 'v: true' to convert ü to v, which is common in pinyin input.
  // Use 'type: 'array'' to get an array of pinyin for each character, then join them.
  return pinyinModule.pinyin(text, { toneType: 'none', v: true, type: 'array' }).join('');
};
