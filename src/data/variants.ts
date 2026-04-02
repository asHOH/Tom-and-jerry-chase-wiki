import { VariantEdge } from './types';

// 维护说明：每个数据由一个原种prototype与一个变种variant构成。在singleItemTools中计算时，变种会继承其原种的原种。
// 目前仅在item，entity，fixture三个板块显示变种相关内容。

export const variantEdges: VariantEdge[] = [
  /* ---------------- item，entity，fixture ---------------- */
  {
    prototype: { name: '蛋糕', type: 'item' },
    variant: { name: '蛋糕-旧版', type: 'item' },
  },
  {
    prototype: { name: '火箭', type: 'item' },
    variant: { name: '蛋糕', type: 'item' },
  },
  {
    prototype: { name: '藤蔓纸盒', type: 'item' },
    variant: { name: '大纸盒', type: 'entity' },
  },
  {
    prototype: { name: '大纸盒', type: 'item' },
    variant: { name: '藤蔓纸盒', type: 'entity' },
  },
  {
    prototype: { name: '火箭', type: 'item' },
    variant: { name: '线条火箭', type: 'entity' },
  },
  {
    prototype: { name: '轨道', type: 'entity' },
    variant: { name: '轨道-旧版', type: 'entity' },
  },
  {
    prototype: { name: '列车', type: 'entity' },
    variant: { name: '列车-旧版', type: 'entity' },
  },
  {
    prototype: { name: '弓箭', type: 'entity' },
    variant: { name: '弓箭-旧版', type: 'entity' },
  },
  {
    prototype: { name: '蓄力箭', type: 'entity' },
    variant: { name: '蓄力箭-旧版', type: 'entity' },
  },
];
