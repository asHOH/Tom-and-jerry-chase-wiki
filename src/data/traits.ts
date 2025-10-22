import { Trait } from './types';

const traits: Trait[] = [
  {
    description: '杰瑞和泰菲。',
    group: [
      { name: '泰菲', type: 'character' },
      { name: '杰瑞', type: 'character' },
    ],
  },
  {
    description: '杰瑞和汤姆和泰菲+剑客泰菲。',
    group: [
      [
        { name: '泰菲', type: 'character' },
        { name: '剑客泰菲', type: 'character' },
      ],
      { name: '杰瑞', type: 'character' },
      { name: '汤姆', type: 'character' },
    ],
  },
  {
    description: '杰瑞和剑客泰菲和泰菲+泰菲+剑客泰菲。',
    group: [
      { name: '杰瑞', type: 'character' },
      { name: '剑客泰菲', type: 'character' },
      [
        { name: '泰菲', type: 'character' },
        { name: '泰菲', type: 'character' },
        { name: '剑客泰菲', type: 'character' },
      ],
    ],
  },
];

export default traits;
