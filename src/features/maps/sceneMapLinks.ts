// Canonical wiki map identities mapped explicitly to the standalone scene
// viewer's supported catalog. Special-mode layouts have no equivalent there.
const SCENE_MAP_IDS = {
  经典之家I: 'classic-home-i',
  经典之家II: 'classic-home-ii',
  经典之家III: 'classic-home-iii',
  雪夜古堡I: 'snowy-castle-i',
  雪夜古堡II: 'snowy-castle-ii',
  雪夜古堡III: 'snowy-castle-iii',
  夏日游轮I: 'summer-cruise-i',
  夏日游轮II: 'summer-cruise-ii',
  夏日游轮III: 'summer-cruise-iii',
  太空堡垒I: 'space-fortress-i',
  太空堡垒II: 'space-fortress-ii',
  太空堡垒III: 'space-fortress-iii',
  游乐场: 'amusement-park',
  大都会: 'metropolis',
  森林牧场: 'forest-ranch',
  御门酒店: 'imperial-hotel',
  熊猫馆: 'panda-house',
  天宫: 'heavenly-palace',
  '天宫-云上': 'heavenly-palace-clouds',
} as const;

export function getSceneMapUrl(mapName: string): string | undefined {
  if (!Object.hasOwn(SCENE_MAP_IDS, mapName)) return undefined;
  const url = new URL('https://maps.tjwiki.com/');
  url.searchParams.set('map', SCENE_MAP_IDS[mapName as keyof typeof SCENE_MAP_IDS]);
  return url.href;
}

export function getSceneMapName(mapId: string): string | undefined {
  return Object.entries(SCENE_MAP_IDS).find(([, id]) => id === mapId)?.[0];
}
