import traits from '@/data/traits';
import { SingleItem, Trait } from '@/data/types';
import { checkItemMatchesTrait } from './tools';

/**
 * 从全部特性中筛选出所有包含所给出singleItem的特性
 *
 * @param singleItem - 要匹配的对象（该函数会自动寻找并匹配factionId）
 * @param checkMode - 筛选模式（default或hard），若选用hard模式，则会改为将所给singleItem的factionId作为excludeFactionId属性的考虑内容
 */

export const filterTraitsBySingleItem = (
  singleItem: SingleItem,
  checkMode: 'default' | 'hard' = 'default'
): Trait[] => {
  return traits.filter((trait) => checkItemMatchesTrait(trait, singleItem, checkMode));
};
