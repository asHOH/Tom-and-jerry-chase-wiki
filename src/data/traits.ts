import { Trait } from './types';

const traits: Trait[] = [
  {
    description: '杰瑞不喜欢吃胡萝卜。',
    group: [
      { name: '巨型胡萝卜', type: 'entity' },
      { name: '杰瑞', type: 'character' },
    ],
  },
  {
    description: '兔子喜欢吃胡萝卜。',
    group: [
      [
        { name: '兔子先生', type: 'skill' },
        { name: '兔子大表哥', type: 'skill' },
      ],
      { name: '巨型胡萝卜', type: 'entity' },
      { name: '兔八哥', type: 'character' },
    ],
  },
  {
    description: '杰瑞和剑客泰菲和泰菲+泰菲+剑客泰菲。',
    group: [
      { name: '杰瑞', type: 'character' },
      { name: '剑客泰菲', type: 'character' },
      { name: '泰菲类角色', type: 'itemGroup' },
      [
        { name: '泰菲', type: 'character' },
        { name: '泰菲', type: 'character' },
        { name: '剑客泰菲', type: 'character' },
      ],
    ],
  },
];

export default traits;
