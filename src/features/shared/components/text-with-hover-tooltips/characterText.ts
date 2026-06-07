import { autoWrapNames } from '@/data/autoWrapNames';
import { characters } from '@/data';

import type { CharacterRecord } from './types';

export const resolveCharacterExpression = (
  expr: string,
  character?: CharacterRecord
): unknown | undefined => {
  if (!character) return undefined;
  const trimmed = expr.trim().replace(/^:/, '');
  if (!/^[\w.$[\]]+$/.test(trimmed)) return undefined;

  const tokens: Array<string | number> = [];
  const pathPattern = /([^.[\]]+)|(\[(\d+)\])/g;
  let match: RegExpExecArray | null;

  while ((match = pathPattern.exec(trimmed)) !== null) {
    if (match[1]) tokens.push(match[1]);
    else if (match[3]) tokens.push(Number(match[3]));
  }

  let current: unknown = character;
  for (const key of tokens) {
    if (current == null || (typeof current !== 'object' && typeof current !== 'function')) {
      return undefined;
    }
    current = (current as Record<string | number, unknown>)[key];
  }
  return current;
};

export function preprocessText(text: string, currentCharacterName?: string | undefined): string {
  if (text.includes('{') || text.includes('}') || text.includes('《') || text.includes('》')) {
    return text;
  }

  let result = text;

  const currentCharacter = currentCharacterName ? characters[currentCharacterName] : undefined;
  const currentCharacterNames = [
    currentCharacterName,
    currentCharacter?.id,
    ...(currentCharacter?.aliases ?? []),
  ].filter((name): name is string => typeof name === 'string' && name.length > 0);

  const processedRanges: Array<{ start: number; end: number }> = [];

  for (const name of autoWrapNames) {
    let searchIndex = 0;

    while (true) {
      const index = result.indexOf(name, searchIndex);
      if (index === -1) break;

      const overlaps = processedRanges.some(
        (range) => index < range.end && index + name.length > range.start
      );

      if (!overlaps) {
        if (currentCharacterNames.includes(name)) {
          processedRanges.push({
            start: index,
            end: index + name.length,
          });
          searchIndex = index + name.length;
        } else {
          result =
            result.substring(0, index) + '{' + name + '}' + result.substring(index + name.length);

          processedRanges.push({
            start: index,
            end: index + name.length + 2,
          });

          processedRanges.forEach((range) => {
            if (range.start > index) {
              range.start += 2;
              range.end += 2;
            }
          });

          searchIndex = index + name.length + 2;
        }
      } else {
        searchIndex = index + 1;
      }
    }
  }

  return result;
}
