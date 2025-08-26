import { Entity, EntityDefinition } from './types';

export const getCatEntityImageUrl = (name: string): string => {
  return `/images/catEntities/${encodeURIComponent(name)}.png`;
};

const catEntitiesDefinitions: Record<string, EntityDefinition> = {
  胡椒粉罐头: {
    entitytype: '投射物类' as const,
    characterName: '米特',
    skillname: '胡椒粉罐头',
    aliases: ['胡椒粉', '胡椒罐'],
    move: true,
    gravity: true,
    collsion: true,
    description:
      '拿在手中时持续对自身造成伤害，投掷时对直接命中的目标造成伤害，落地后破碎形成胡椒粉烟雾，对处于其中的角色造成伤害。米特-胡椒粉罐头达到Lv.3时，召唤的胡椒粉罐头伤害频率会更高。',
    create: '通过米特-胡椒粉罐头召唤。米特-胡椒粉罐头达到Lv.3时，召唤的胡椒粉罐头伤害频率会更高。',
  },
};

const catEntitiesWithImages: Record<string, Entity> = Object.fromEntries(
  Object.entries(catEntitiesDefinitions).map(([entityName, entity]) => [
    entityName,
    {
      ...entity,
      name: entityName,
      factionId: 'cat' as const,
      imageUrl: getCatEntityImageUrl(entityName),
    },
  ])
);

export default catEntitiesWithImages;
