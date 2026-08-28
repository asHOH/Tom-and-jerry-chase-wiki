import { Map, MapDefinition } from './types';

const getMapImageUrl = (name: string, map: MapDefinition): string => {
  if (map.specialImageUrl) return encodeURI(map.specialImageUrl);
  if (map.unuseImage) return `/images/icons/cat-faction.png`;
  return `/images/maps/${encodeURIComponent(name)}.png`;
};

const mapDefinitions: Record<string, MapDefinition> = {
  经典之家I: {
    type: '常规地图',
    size: '小型',
    aliases: ['经典之家', '经典1'],
    studyLevelUnlock: '见习学业',
    changeWithStudyLevel: true,
    roomCount: 8,
    pipeCount: 2,
    doorCount: 7,
    supportedModes: [
      '经典奶酪赛',
      '天梯',
      '黄金钥匙赛',
      '特工行动',
      '克隆大作战',
      '房间',
      '创意玩法',
    ],
    randomizedRoom: true,
    interactiveMap: {
      width: 12722,
      height: 5443,
      tileSize: 512,
      minZoom: 0,
      maxZoom: 4,
      tileUrl: '/images/map-tiles/classic-home-i/{z}/{y}/{x}.webp',
      previewUrl: '/images/map-tiles/classic-home-i/preview.webp',
      rooms: [
        {
          name: '庭院',
          polygons: [
            [
              { x: 0, y: 0.38 },
              { x: 0.29, y: 0.38 },
              { x: 0.29, y: 0.72 },
              { x: 0, y: 0.72 },
            ],
          ],
        },
        {
          name: '客厅',
          polygons: [
            [
              { x: 0.29, y: 0.45 },
              { x: 0.53, y: 0.45 },
              { x: 0.53, y: 0.72 },
              { x: 0.29, y: 0.72 },
            ],
          ],
        },
        {
          name: '卧室',
          polygons: [
            [
              { x: 0.35, y: 0.24 },
              { x: 0.53, y: 0.24 },
              { x: 0.53, y: 0.45 },
              { x: 0.35, y: 0.45 },
            ],
          ],
        },
        {
          name: '楼梯间',
          showLabel: false,
          polygons: [
            [
              { x: 0.53, y: 0.11 },
              { x: 0.6722, y: 0.11 },
              { x: 0.6722, y: 0.72 },
              { x: 0.53, y: 0.72 },
            ],
          ],
        },
        {
          name: '阁楼',
          polygons: [
            [
              { x: 0.6722, y: 0 },
              { x: 0.88, y: 0 },
              { x: 0.88, y: 0.22 },
              { x: 0.6722, y: 0.22 },
            ],
          ],
        },
        {
          name: '厨房',
          polygons: [
            [
              { x: 0.6722, y: 0.22 },
              { x: 0.8634, y: 0.22 },
              { x: 0.8634, y: 0.4762 },
              { x: 0.6722, y: 0.4762 },
            ],
          ],
        },
        {
          name: '餐厅',
          polygons: [
            [
              { x: 0.6722, y: 0.4762 },
              { x: 0.9, y: 0.4762 },
              { x: 0.9, y: 0.72 },
              { x: 0.6722, y: 0.72 },
            ],
          ],
        },
        {
          name: '杂物间',
          polygons: [
            [
              { x: 0.65, y: 0.72 },
              { x: 0.9, y: 0.72 },
              { x: 0.9, y: 1 },
              { x: 0.65, y: 1 },
            ],
          ],
        },
        {
          name: '杂物间（右）',
          showLabel: false,
          polygons: [
            [
              { x: 0.9, y: 0.5982 },
              { x: 1, y: 0.5982 },
              { x: 1, y: 1 },
              { x: 0.9, y: 1 },
            ],
          ],
        },
        {
          name: '过渡区域',
          showLabel: false,
          polygons: [
            [
              { x: 0.29, y: 0.24 },
              { x: 0.35, y: 0.24 },
              { x: 0.35, y: 0.45 },
              { x: 0.29, y: 0.45 },
            ],
          ],
        },
      ],
      points: [
        {
          id: 'classic-home-scouting-canary',
          category: 'scoutingCanary',
          position: { x: 0.018, y: 0.56 },
          minimapPaths: [],
          relatedEntries: [{ name: '侦查金丝雀', type: 'fixture' }],
        },
        {
          category: 'mouseHole',
          position: { x: 0.3734, y: 0.4393 },
          isInvisible: true,
          relatedEntries: [{ name: '老鼠洞', type: 'fixture' }],
        },
        {
          category: 'mouseHole',
          position: { x: 0.4556, y: 0.7103 },
          isInvisible: true,
          relatedEntries: [{ name: '老鼠洞', type: 'fixture' }],
        },
        {
          category: 'mouseHole',
          position: { x: 0.7709, y: 0.4406 },
          isInvisible: true,
          relatedEntries: [{ name: '老鼠洞', type: 'fixture' }],
        },
        {
          category: 'mouseHole',
          position: { x: 0.8807, y: 0.711 },
          isInvisible: true,
          relatedEntries: [{ name: '老鼠洞', type: 'fixture' }],
        },
        {
          category: 'mouseHole',
          position: { x: 0.8279, y: 0.9601 },
          isInvisible: true,
          relatedEntries: [{ name: '老鼠洞', type: 'fixture' }],
        },
        {
          id: 'classic-home-pipe-b-stairwell',
          category: 'pipe',
          subtype: '楼梯间管道',
          position: { x: 0.5872, y: 0.4347 },
          connection: {
            targetPointId: 'classic-home-pipe-b-storage',
            direction: 'both',
            label: 'B',
          },
          isInvisible: true,
          relatedEntries: [{ name: '管道', type: 'fixture' }],
        },
        {
          id: 'classic-home-pipe-b-storage',
          category: 'pipe',
          subtype: '杂物间管道',
          position: { x: 0.6606, y: 0.915 },
          connection: {
            targetPointId: 'classic-home-pipe-b-stairwell',
            direction: 'both',
            label: 'B',
          },
          isInvisible: true,
          relatedEntries: [{ name: '管道', type: 'fixture' }],
        },
        {
          id: 'classic-home-pipe-a-attic',
          category: 'pipe',
          subtype: '阁楼管道',
          position: { x: 0.876, y: 0.0926 },
          connection: {
            targetPointId: 'classic-home-pipe-a-courtyard',
            direction: 'both',
            label: 'A',
          },
          isInvisible: true,
          relatedEntries: [{ name: '管道', type: 'fixture' }],
        },
        {
          id: 'classic-home-pipe-a-courtyard',
          category: 'pipe',
          subtype: '庭院管道',
          position: { x: 0.0041, y: 0.6459 },
          connection: {
            targetPointId: 'classic-home-pipe-a-attic',
            direction: 'both',
            label: 'A',
          },
          isInvisible: true,
          relatedEntries: [{ name: '管道', type: 'fixture' }],
        },
        {
          id: 'map-point-28019e26-5376-4079-baf6-2c1fced6e5f6',
          category: 'teleport',
          position: { x: 0.44882880050306556, y: 0.43500153617794557 },
          isRandomCandidate: false,
          relatedEntries: [],
          isInvisible: false,
        },
        {
          id: 'map-point-27501979-2460-4acf-a33a-1355e28b768b',
          category: 'teleport',
          position: { x: 0.3233768275428392, y: 0.43538557761526575 },
          isRandomCandidate: false,
          relatedEntries: [],
          isInvisible: false,
        },
        {
          id: 'map-point-10f40659-eb63-42e6-a4bb-6eafa5bc3a38',
          category: 'teleport',
          position: { x: 0.7905989624272913, y: 0.3751075567794025 },
          isRandomCandidate: false,
          relatedEntries: [],
        },
        {
          id: 'map-point-935a3f12-d7bb-441c-a0a0-4b8032cb4ed5',
          category: 'teleport',
          position: { x: 0.7984593617355762, y: 0.6594473694646465 },
          isRandomCandidate: false,
          relatedEntries: [],
        },
        {
          id: 'map-point-d988c5d1-2b34-4120-895e-97739ce6ddc4',
          category: 'teleport',
          position: { x: 0.7714195881150763, y: 0.15981813889672328 },
          isRandomCandidate: false,
          relatedEntries: [],
        },
        {
          id: 'map-point-a9d89f01-49cf-46b3-95d3-8c02b720ab94',
          category: 'teleport',
          position: { x: 0.6208143373683384, y: 0.42477903179031173 },
          isRandomCandidate: false,
          relatedEntries: [],
        },
        {
          id: 'map-point-f244f01f-5850-401d-b60b-18c14dfe545a',
          category: 'teleport',
          position: { x: 0.4097626159408898, y: 0.6327205928986052 },
          isRandomCandidate: false,
          relatedEntries: [],
        },
        {
          id: 'map-point-ce8ff7b4-b57b-4bd8-8fbd-0289af7dd93a',
          category: 'teleport',
          position: { x: 0.9551171199496934, y: 0.8589017000264891 },
          isRandomCandidate: false,
          relatedEntries: [],
        },
        {
          id: 'map-point-95e2fb90-d8c3-40b9-9293-6234c7074208',
          category: 'teleport',
          position: { x: 0.8222763716396793, y: 0.9601029885070351 },
          isRandomCandidate: false,
          relatedEntries: [],
        },
        {
          id: 'map-point-0c1e25ae-b215-4052-9265-6f0ef9aba3d4',
          category: 'teleport',
          position: { x: 0.11295393806005345, y: 0.6711050781720285 },
          isRandomCandidate: false,
          relatedEntries: [],
        },
        {
          id: 'map-point-3cc7c820-9d4d-4fa7-8a1b-72c592c6f28b',
          category: 'cheese',
          position: { x: 0.4505554959065177, y: 0.572574336683541 },
          isRandomCandidate: true,
          relatedEntries: [{ name: '奶酪', type: 'item' }],
        },
        {
          id: 'map-point-38cac293-a8b0-48bf-b546-bc621185a14c',
          category: 'rocket',
          position: { x: 0.4479796509463183, y: 0.6503780255742774 },
          isRandomCandidate: true,
          relatedEntries: [{ name: '火箭', type: 'item' }],
        },
        {
          id: 'map-point-d1a92206-2f71-4484-8001-cd0c30405171',
          category: 'rocket',
          position: { x: 0.6915694885740578, y: 0.3089767881507536 },
          isRandomCandidate: true,
          relatedEntries: [{ name: '火箭', type: 'item' }],
        },
        {
          id: 'map-point-5532ac2d-5d2c-4e70-b9a0-c47cc6e3f7db',
          category: 'cheese',
          position: { x: 0.7331969856109406, y: 0.2860222360356032 },
          isRandomCandidate: true,
          relatedEntries: [{ name: '奶酪', type: 'item' }],
        },
        {
          id: 'map-point-6f28a603-e2df-4b4c-8b51-227808733b32',
          category: 'cheese',
          position: { x: 0.858682573543399, y: 0.5706499441619066 },
          isRandomCandidate: true,
          relatedEntries: [{ name: '奶酪', type: 'item' }],
        },
        {
          id: 'map-point-2bb06fc6-1d73-406f-9a94-699bceeeb2f4',
          category: 'rocket',
          position: { x: 0.7076877575655319, y: 0.6034096177513486 },
          isRandomCandidate: true,
          relatedEntries: [{ name: '火箭', type: 'item' }],
        },
        {
          id: 'map-point-15ce3ba6-ba5f-4ea2-8ef9-26a5e93d62f4',
          category: 'drink',
          position: {
            x: 0.3835874862443012,
            y: 0.27925740340911626,
          },
          isRandomCandidate: true,
          relatedEntries: [
            {
              name: '饮料',
              type: 'itemGroup',
            },
          ],
        },
        {
          id: 'map-point-55ce0971-618c-4543-ab9e-dc22a7c6e740',
          category: 'drink',
          position: {
            x: 0.6932872189907248,
            y: 0.323718178716851,
          },
          isRandomCandidate: true,
          relatedEntries: [
            {
              name: '饮料',
              type: 'itemGroup',
            },
          ],
        },
        {
          id: 'map-point-fe9d8835-3a8e-467b-872f-77d6381e5103',
          category: 'drink',
          position: {
            x: 0.4788555258607137,
            y: 0.5444607080225456,
          },
          isRandomCandidate: true,
          relatedEntries: [
            {
              name: '饮料',
              type: 'itemGroup',
            },
          ],
        },
        {
          id: 'map-point-76ffe864-9008-4180-bf79-d490ae3877c5',
          category: 'drink',
          position: {
            x: 0.8768713267082189,
            y: 0.5681668045332292,
          },
          isRandomCandidate: true,
          relatedEntries: [
            {
              name: '饮料',
              type: 'itemGroup',
            },
          ],
        },
        {
          id: 'map-point-96bba343-2d7d-452f-b8a7-a88b1d0181e5',
          category: 'drink',
          position: {
            x: 0.8378701442423554,
            y: 0.8456447217804728,
          },
          isRandomCandidate: true,
          relatedEntries: [
            {
              name: '饮料',
              type: 'itemGroup',
            },
          ],
        },
        {
          id: 'map-point-a925143a-2be8-4eb7-b4b8-a887ec834c0e',
          category: 'drink',
          position: {
            x: 0.1272645917895208,
            y: 0.6078626380194684,
          },
          isRandomCandidate: true,
          relatedEntries: [
            {
              name: '饮料',
              type: 'itemGroup',
            },
          ],
        },
        {
          id: 'map-point-e2b70990-4238-4260-a1c8-b42df5aa23e7',
          category: 'drink',
          position: {
            x: 0.8454147967704697,
            y: 0.08486809832311268,
          },
          isRandomCandidate: true,
          relatedEntries: [
            {
              name: '饮料',
              type: 'itemGroup',
            },
          ],
        },
        {
          id: 'map-point-967d07cc-773f-470f-996e-7ffefd2ed8e6',
          category: 'wallCrack',
          position: {
            x: 0.8677883180994929,
            y: 0.9406575460918446,
          },
          isRandomCandidate: true,
          relatedEntries: [
            {
              name: '墙缝',
              type: 'fixture',
            },
          ],
        },
        {
          id: 'map-point-4a3924e2-4d81-4c13-8d24-e1080323bff3',
          category: 'idleFruitPlate',
          position: {
            x: 0.9872660163494194,
            y: 0.960866181991274,
          },
          isRandomCandidate: false,
          relatedEntries: [
            {
              name: '果盘',
              type: 'item',
            },
          ],
          targetWallCrackPointId: 'map-point-967d07cc-773f-470f-996e-7ffefd2ed8e6',
        },
        {
          id: 'map-point-8f5ce768-83fa-4865-99e7-81a98a8ef82f',
          category: 'wallCrack',
          position: {
            x: 0.3846879421474611,
            y: 0.4196215322432482,
          },
          isInvisible: false,
          relatedEntries: [
            {
              name: '墙缝',
              type: 'fixture',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-0fef13a5-d90f-4fff-a921-aa3976c093b4',
          category: 'wallCrack',
          position: {
            x: 0.7678431064298067,
            y: 0.15175454712474737,
          },
          relatedEntries: [
            {
              name: '墙缝',
              type: 'fixture',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-dbdeecd3-2d6e-4d0b-be8c-b431778ccd7b',
          category: 'wallCrack',
          position: {
            x: 0.7661924225750668,
            y: 0.36340253536652584,
          },
          relatedEntries: [
            {
              name: '墙缝',
              type: 'fixture',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-5ac9e469-50fc-4cab-814b-bd3de014f4c6',
          category: 'wallCrack',
          position: {
            x: 0.5626473824870304,
            y: 0.4323902259783208,
          },
          relatedEntries: [
            {
              name: '墙缝',
              type: 'fixture',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-89208b9e-40f0-4681-ad15-c8831d049f4c',
          category: 'wallCrack',
          position: {
            x: 0.5434680081748153,
            y: 0.6911629616020577,
          },
          relatedEntries: [
            {
              name: '墙缝',
              type: 'fixture',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-dbda90eb-e493-40ac-9fd2-92ff68394b0d',
          category: 'wallCrack',
          position: {
            x: 0.7374626631032857,
            y: 0.9398309755649458,
          },
          relatedEntries: [
            {
              name: '墙缝',
              type: 'fixture',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-0b864eb0-a330-4f8d-b94a-7eff98447fab',
          category: 'wallCrack',
          position: {
            x: 0.43908190536079234,
            y: 0.6913466838140732,
          },
          relatedEntries: [
            {
              name: '墙缝',
              type: 'fixture',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-94b3920e-dc25-432b-babd-c666e8bb7fa4',
          category: 'cheese',
          position: {
            x: 0.36248231410155635,
            y: 0.615285688039684,
          },
          relatedEntries: [
            {
              name: '奶酪',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-4c077df4-8a6b-4ba8-8365-3312e7500615',
          category: 'drink',
          position: {
            x: 0.3652727558559975,
            y: 0.557964357890869,
          },
          relatedEntries: [
            {
              name: '饮料',
              type: 'itemGroup',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-09d3bfd6-ae6f-41ba-b8b7-2dbebbbd58e5',
          category: 'rocket',
          position: {
            x: 0.37458732903631503,
            y: 0.5419805254455263,
          },
          relatedEntries: [
            {
              name: '火箭',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-d467b431-9a48-4898-a0e8-823c5be95052',
          category: 'rocket',
          position: {
            x: 0.37057852538908975,
            y: 0.6940106558882969,
          },
          relatedEntries: [
            {
              name: '火箭',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-d328c4bf-9dea-4c36-b042-20c4389f419c',
          category: 'rocket',
          position: {
            x: 0.10572237069643138,
            y: 0.6559801580011023,
          },
          relatedEntries: [
            {
              name: '火箭',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-a5651df3-e7d7-4aa4-84c0-a8092bbb2000',
          category: 'rocket',
          position: {
            x: 0.11039930828486087,
            y: 0.591952967113724,
          },
          relatedEntries: [
            {
              name: '火箭',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-00d3b417-23cb-4471-b58e-c6f375b7467d',
          category: 'rocket',
          position: {
            x: 0.05863857883980506,
            y: 0.6939187947822891,
          },
          relatedEntries: [
            {
              name: '火箭',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-1efb748a-0287-4c72-b6f1-f9a11c222612',
          category: 'rocket',
          position: {
            x: 0.015484986637321176,
            y: 0.5979239390042256,
          },
          relatedEntries: [
            {
              name: '火箭',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-ed2424ba-d498-493a-ad2b-bc544c588b5b',
          category: 'cheese',
          position: {
            x: 0.027432793585914165,
            y: 0.6158368546757303,
          },
          relatedEntries: [
            {
              name: '奶酪',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-f3298aca-3733-4937-a86b-cd40743ef34d',
          category: 'rocket',
          position: {
            x: 0.1767410784467851,
            y: 0.5861657174352379,
          },
          relatedEntries: [
            {
              name: '火箭',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-c7cbd821-5d63-45cd-a36b-6a116ebfbfaa',
          category: 'rocket',
          position: {
            x: 0.6552035843420846,
            y: 0.942678669851185,
          },
          relatedEntries: [
            {
              name: '火箭',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-256f61ee-8e85-4a57-bb30-bd3021300378',
          category: 'cheese',
          position: {
            x: 0.6931693130011004,
            y: 0.9305530038581664,
          },
          relatedEntries: [
            {
              name: '奶酪',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-3ce9a3e4-f6e7-4423-94eb-e26403036d8d',
          category: 'rocket',
          position: {
            x: 0.794647068071058,
            y: 0.9439647253352931,
          },
          relatedEntries: [
            {
              name: '火箭',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-1b539baa-61d6-4005-88fc-830ca0418b1f',
          category: 'rocket',
          position: {
            x: 0.865508567835246,
            y: 0.8497152305713761,
          },
          relatedEntries: [
            {
              name: '火箭',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-af4a45ec-f992-4cb0-a6c0-801fd59b5e7a',
          category: 'rocket',
          position: {
            x: 0.823730545511712,
            y: 0.6938269336762815,
          },
          relatedEntries: [
            {
              name: '火箭',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-535c377c-9cb1-4c8c-b0a1-c0eec5d15463',
          category: 'rocket',
          position: {
            x: 0.8006995755384374,
            y: 0.5654969685835017,
          },
          relatedEntries: [
            {
              name: '火箭',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-ba6aed59-5f5a-4142-93f4-0dfe1d3e2aab',
          category: 'cheese',
          position: {
            x: 0.7916994183304512,
            y: 0.5824912731949292,
          },
          relatedEntries: [
            {
              name: '奶酪',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-0aee9195-9865-461f-89dd-c01ca1d83766',
          category: 'drink',
          position: {
            x: 0.6982392705549442,
            y: 0.5691714128238105,
          },
          relatedEntries: [
            {
              name: '饮料',
              type: 'itemGroup',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-30edb8b6-9982-44a2-9235-83a4e6f8d387',
          category: 'rocket',
          position: {
            x: 0.6864486715925169,
            y: 0.15588829689509462,
          },
          relatedEntries: [
            {
              name: '火箭',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-6b6dad2e-8488-42a3-9910-0284aa82d28d',
          category: 'rocket',
          position: {
            x: 0.715728659015878,
            y: 0.07725519015248944,
          },
          relatedEntries: [
            {
              name: '火箭',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-f1076432-3600-410f-b5f0-2a0233e4ce1f',
          category: 'rocket',
          position: {
            x: 0.7521616098097783,
            y: 0.15588829689509462,
          },
          relatedEntries: [
            {
              name: '火箭',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-c137b2af-aee0-4e62-8bec-37eee09199c9',
          category: 'rocket',
          position: {
            x: 0.8239270554944191,
            y: 0.11262171596546022,
          },
          relatedEntries: [
            {
              name: '火箭',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-f7215a1f-d7a5-4427-88bc-7fcec989d298',
          category: 'rocket',
          position: {
            x: 0.8351281245087251,
            y: 0.1557045746830792,
          },
          relatedEntries: [
            {
              name: '火箭',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-53a66a78-16db-4a5d-8398-70e1fc100e52',
          category: 'rocket',
          position: {
            x: 0.8662553057695331,
            y: 0.15588829689509462,
          },
          relatedEntries: [
            {
              name: '火箭',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-4cf90d6c-b00a-4e5d-b5b4-e43550271c81',
          category: 'drink',
          position: {
            x: 0.8234161295393806,
            y: 0.28504501194194376,
          },
          relatedEntries: [
            {
              name: '饮料',
              type: 'itemGroup',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-5f3b82dd-d658-4242-bddf-201b2076b97d',
          category: 'drink',
          position: {
            x: 0.3306869988995441,
            y: 0.5441851919897116,
          },
          relatedEntries: [
            {
              name: '饮料',
              type: 'itemGroup',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-98ce8d84-d89c-4de9-bb85-377f2eb00391',
          category: 'cheese',
          position: {
            x: 0.69729602263795,
            y: 0.09489252250597097,
          },
          relatedEntries: [
            {
              name: '奶酪',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-6075599e-093e-404e-abd5-fa23acf4571f',
          category: 'drink',
          position: {
            x: 0.8670020437038202,
            y: 0.08864596729744627,
          },
          relatedEntries: [
            {
              name: '饮料',
              type: 'itemGroup',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-81b9e5b3-cd36-4d1a-93e2-709b3fa98a02',
          category: 'rocket',
          position: {
            x: 0.38574909605407953,
            y: 0.2638250964541613,
          },
          relatedEntries: [
            {
              name: '火箭',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-b74a1d15-3002-48ce-9b2f-996fcf59c5fd',
          category: 'cheese',
          position: {
            x: 0.3963213331237227,
            y: 0.2821054565496969,
          },
          relatedEntries: [
            {
              name: '奶酪',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-fec79ed4-5da8-4b92-9276-04ae450c4210',
          category: 'rocket',
          position: {
            x: 0.4129853796572866,
            y: 0.42246922652948743,
          },
          relatedEntries: [
            {
              name: '火箭',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-20c312af-bb63-4d56-aba0-3b197be4d156',
          category: 'rocket',
          position: {
            x: 0.4886810249960698,
            y: 0.3047951497336028,
          },
          relatedEntries: [
            {
              name: '火箭',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-92061956-2adb-41d5-a7e9-da04444ee5ef',
          category: 'drink',
          position: {
            x: 0.49689514227322745,
            y: 0.2771449568252802,
          },
          relatedEntries: [
            {
              name: '饮料',
              type: 'itemGroup',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-f41788f6-9f25-458f-91b0-85e70f136435',
          category: 'cheese',
          position: {
            x: 0.14887596289891528,
            y: 0.6099577438912365,
          },
          relatedEntries: [
            {
              name: '奶酪',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-5ce4afc1-d25f-43f0-9be1-c43f575f1adf',
          category: 'rocket',
          position: {
            x: 0.22437509825499136,
            y: 0.6944699614183355,
          },
          relatedEntries: [
            {
              name: '火箭',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-23d33862-d290-4dbf-9f26-dcf1858e467c',
          category: 'cheese',
          position: {
            x: 0.8157522402138029,
            y: 0.2875252618041521,
          },
          relatedEntries: [
            {
              name: '奶酪',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-b239b753-3f52-4dd1-b12a-7ad41c22b2ef',
          category: 'rocket',
          position: {
            x: 0.820861499764188,
            y: 0.33832445342641926,
          },
          relatedEntries: [
            {
              name: '火箭',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-574decb8-ba6d-4e11-ab3f-8680ec9a743b',
          category: 'rocket',
          position: {
            x: 0.7316066656186134,
            y: 0.4231122542715414,
          },
          relatedEntries: [
            {
              name: '火箭',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-9f4a24a7-2168-45e1-bf08-4405bb3e3d0a',
          category: 'cheese',
          position: {
            x: 0.48942776293035684,
            y: 0.2795333455814808,
          },
          relatedEntries: [
            {
              name: '奶酪',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-58368fc7-f79c-4ec9-b6be-f09a8231058a',
          category: 'drink',
          position: {
            x: 0.020220877220562806,
            y: 0.6134484659195296,
          },
          relatedEntries: [
            {
              name: '饮料',
              type: 'itemGroup',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-db0d33d0-47f3-4bb5-bd73-5ccdfe82a746',
          category: 'cheese',
          position: {
            x: 0.7941361421160195,
            y: 0.09176924490170861,
          },
          relatedEntries: [
            {
              name: '奶酪',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-b378cf25-4806-4e86-85b8-103184433d55',
          category: 'drink',
          position: {
            x: 0.7443012105014934,
            y: 0.8591769244901709,
          },
          relatedEntries: [
            {
              name: '饮料',
              type: 'itemGroup',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-a0a78978-b466-44e4-875d-ec6e3a3ec88c',
          category: 'cheese',
          position: {
            x: 0.708968715610753,
            y: 0.6208892155061547,
          },
          relatedEntries: [
            {
              name: '奶酪',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-8d270cf0-1dfc-4a8b-8b83-6d1d808ec229',
          category: 'cheese',
          position: {
            x: 0.7885552586071373,
            y: 0.26694837405842364,
          },
          relatedEntries: [
            {
              name: '奶酪',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-8fa25a3d-3a4e-4f4d-94c4-91ec508f87fc',
          category: 'cheese',
          position: {
            x: 0.40563590630404023,
            y: 0.5372956090391329,
          },
          relatedEntries: [
            {
              name: '奶酪',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-79013a4b-3486-4387-a32d-8a978d9ac1dc',
          category: 'cheese',
          position: {
            x: 0.7343185033799717,
            y: 0.8618408965643947,
          },
          relatedEntries: [
            {
              name: '奶酪',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
        {
          id: 'map-point-ea833e4d-d156-4072-bfa5-43a18dbaf636',
          category: 'cheese',
          position: {
            x: 0.17589608552114447,
            y: 0.6037571192357156,
          },
          relatedEntries: [
            {
              name: '奶酪',
              type: 'item',
            },
          ],
          isRandomCandidate: true,
        },
      ],
    },
    description:
      '$地形更改1$text-fuchsia-600 dark:text-fuchsia-400#：楼梯间通往阁楼的楼梯会随学业等级变化（楼梯→斜坡）。\n$地形更改2$text-fuchsia-600 dark:text-fuchsia-400#：各房间地形均有至少2种预设方案，游戏开始时每个房间会随机选取一种方案并生成。',
    specialImageUrl: '/images/maps/经典之家.png',
    mapSkin: [
      {
        name: '经典之家I（樱花）',
        imageUrl: '/images/maps/经典之家（樱花）.png',
        description:
          '常驻地图皮肤，可由地图冠名者自由更换。\n该换肤会改变小推车、吊灯等组件的外观。',
      },
      {
        name: '经典之家I（圣诞）',
        imageUrl: '/images/maps/经典之家（圣诞）.png',
        description:
          '限时地图皮肤，有时会在圣诞节前后返场，返场时本地图自动更换为此皮肤，同时无法再更换为其它皮肤。',
      },
      {
        name: '经典之家I（国风）',
        imageUrl: '/images/maps/经典之家（国风）.png',
        description:
          '限时地图皮肤，有时会在春节前后返场，返场时本地图会自动应用此皮肤，同时无法再更换为其它皮肤。\n该换肤会改变部分道具和地图组件外观。',
      },
      {
        name: '经典之家I（虎丘）',
        imageUrl: '/images/maps/经典之家（虎丘）.png',
        description:
          '限时地图皮肤，极少返场，返场时本地图会自动应用此皮肤，同时无法再更换为其它皮肤。\n该换肤会改变部分道具和地图组件外观。',
      },
    ],
  },
  经典之家II: {
    type: '常规地图',
    size: '中型',
    aliases: ['经典2'],
    studyLevelUnlock: '见习学业',
    changeWithStudyLevel: true,
    roomCount: 8,
    pipeCount: 2,
    doorCount: 7,
    supportedModes: [
      '经典奶酪赛',
      '天梯',
      '黄金钥匙赛',
      '特工行动',
      '克隆大作战',
      '房间',
      '创意玩法',
    ],
    randomizedRoom: true,
    description:
      '$地形更改1$text-fuchsia-600 dark:text-fuchsia-400#：楼梯间通往阁楼的楼梯会随学业等级变化（楼梯→斜坡）。\n$地形更改2$text-fuchsia-600 dark:text-fuchsia-400#：各房间地形均有至少2种预设方案，游戏开始时每个房间会随机选取一种方案并生成。',
    specialImageUrl: '/images/maps/经典之家.png',
    mapSkin: [
      {
        name: '经典之家II（樱花）',
        imageUrl: '/images/maps/经典之家（樱花）.png',
        description:
          '常驻地图皮肤，可由地图冠名者自由更换。\n该换肤会改变小推车、吊灯等组件的外观。',
      },
    ],
  },
  经典之家III: {
    type: '常规地图',
    size: '中型',
    aliases: ['经典3'],
    studyLevelUnlock: '见习学业',
    changeWithStudyLevel: true,
    roomCount: 8,
    pipeCount: 2,
    doorCount: 6,
    supportedModes: [
      '经典奶酪赛',
      '天梯',
      '黄金钥匙赛',
      '特工行动',
      '克隆大作战',
      '房间',
      '创意玩法',
    ],
    randomizedRoom: true,
    description:
      '$地形更改1$text-fuchsia-600 dark:text-fuchsia-400#：楼梯间通往阁楼的楼梯会随学业等级变化（楼梯→斜坡）。\n$地形更改2$text-fuchsia-600 dark:text-fuchsia-400#：各房间地形均有至少2种预设方案，游戏开始时每个房间会随机选取一种方案并生成。',
    specialImageUrl: '/images/maps/经典之家.png',
    mapSkin: [
      {
        name: '经典之家III（樱花）',
        imageUrl: '/images/maps/经典之家（樱花）.png',
        description:
          '常驻地图皮肤，可由地图冠名者自由更换。\n该换肤会改变小推车、吊灯等组件的外观。',
      },
    ],
  },
  雪夜古堡I: {
    type: '常规地图',
    size: '中型',
    aliases: ['雪夜古堡', '雪堡1', '古堡1'],
    studyLevelUnlock: '高级学业',
    roomCount: 8,
    pipeCount: 2,
    doorCount: 5,
    supportedModes: [
      '经典奶酪赛',
      '天梯',
      '黄金钥匙赛',
      '奔跑吧老鼠团体赛',
      '特工行动',
      '克隆大作战',
      '房间',
      '创意玩法',
    ],
    hiddenRoomCount: 1,
    randomizedRoom: true,
    description:
      '$地形更改$text-fuchsia-600 dark:text-fuchsia-400#：钟楼房间会随机从巨钟/弹簧预设地形中生成一种，餐厅会随机从桌子/传送带预设地形中生成一种。\n$彩蛋区域$text-fuchsia-600 dark:text-fuchsia-400#：所有角色均可从侍卫房上方取得钥匙，到盔甲房开启彩蛋房木门，彩蛋房内有1具盔甲人，可被角色穿戴并变身。',
    specialImageUrl: '/images/maps/雪夜古堡.png',
    mapSkin: [
      {
        name: '夏日古堡I',
        imageUrl: '/images/maps/夏日古堡.png',
        description:
          '常驻地图皮肤，可由地图冠名者自由更换。\n该换肤会删除木门遮挡视野的效果，删除钟楼区域两根遮挡视野的柱子。',
      },
      {
        name: '雪夜古堡I（万圣）',
        imageUrl: '/images/maps/雪夜古堡（万圣）.png',
        description:
          '限时地图皮肤，有时会在万圣节前后返场，返场时本地图会自动应用此皮肤，同时无法再更换为其它皮肤。',
      },
    ],
  },
  雪夜古堡II: {
    type: '常规地图',
    size: '中型',
    aliases: ['雪堡2', '古堡2'],
    studyLevelUnlock: '高级学业',
    roomCount: 8,
    pipeCount: 2,
    doorCount: 5,
    supportedModes: [
      '经典奶酪赛',
      '天梯',
      '黄金钥匙赛',
      '特工行动',
      '克隆大作战',
      '房间',
      '创意玩法',
    ],
    hiddenRoomCount: 2,
    randomizedRoom: true,
    description:
      '$地形更改$text-fuchsia-600 dark:text-fuchsia-400#：钟楼房间会随机从巨钟/弹簧预设地形中生成一种，餐厅会随机从桌子/传送带预设地形中生成一种。\n$彩蛋区域1$text-fuchsia-600 dark:text-fuchsia-400#：所有角色均可从侍卫房上方取得钥匙，到盔甲房开启彩蛋房木门，彩蛋房内有1具盔甲人，可被角色穿戴并变身。\n$彩蛋区域2$text-fuchsia-600 dark:text-fuchsia-400#：庭院右侧存在一个被隐藏的彩蛋房入口。角色在庭院最右侧跳跃数十次后可[开启彩蛋房入口](从游戏表现来看，该效果实际为“清除彩蛋房入口处原有的隐形地面”。曾有部分角色可借助特性直接进入彩蛋房)（老鼠所需的跳跃次数高于猫咪），此后所有角色均可从此处进入彩蛋房，彩蛋房内有6种饮料各一瓶，以及4个随机高级道具（随机从{遥控器}、{蓝花瓶}、{鞭炮束}、{手枪}、{苍蝇拍}中刷新）。',
    specialImageUrl: '/images/maps/雪夜古堡.png',
  },
  雪夜古堡III: {
    type: '常规地图',
    size: '大型',
    aliases: ['雪堡3', '古堡3', '双古堡'],
    studyLevelUnlock: '高级学业',
    roomCount: 15,
    pipeCount: 4,
    doorCount: 5,
    supportedModes: [
      '经典奶酪赛',
      '天梯',
      '黄金钥匙赛',
      '特工行动',
      '克隆大作战',
      '房间',
      '创意玩法',
    ],
    hiddenRoomCount: 1,
    description:
      '$地形更改$text-fuchsia-600 dark:text-fuchsia-400#：两个钟楼房间均会随机从巨钟/弹簧预设地形中生成一种，侍卫房、盔甲房、卧室、餐厅的洞口会各自随机生成在左侧/右侧古堡。\n$彩蛋区域$text-fuchsia-600 dark:text-fuchsia-400#：所有角色均可从侍卫房上方取得钥匙，到盔甲房开启彩蛋房木门，彩蛋房内有1具盔甲人，可被角色穿戴并变身。两侧盔甲房通向同一个彩蛋房，离开彩蛋房时会固定传送到右侧盔甲房。',
    specialImageUrl: '/images/maps/雪夜古堡.png',
  },
  夏日游轮I: {
    type: '常规地图',
    size: '中型',
    aliases: ['夏日游轮', '游轮1'],
    studyLevelUnlock: '特级学业',
    roomCount: 9,
    pipeCount: 1,
    supportedModes: [
      '经典奶酪赛',
      '天梯',
      '黄金钥匙赛',
      '特工行动',
      '克隆大作战',
      '房间',
      '创意玩法',
    ],
    hiddenRoomCount: 1,
    description:
      '$彩蛋区域$text-fuchsia-600 dark:text-fuchsia-400#：电影院放映机每次放映电影时，左上角均有概率出现9位彩蛋房密码，按3×3排布，其中0=红灯、1=绿灯；可在船长室右侧控制面板处调整各开关的开启/关闭状态，当各开关状态均正确时，右侧彩蛋房大门将打开，内有6种饮料各一瓶，以及数个高级道具（随机从{遥控器}、{蓝花瓶}、{鞭炮束}、{手枪}、{苍蝇拍}中刷新），还有一个望远镜，打开开关后可使全图所有角色短暂{暴露位置}。',
    specialImageUrl: '/images/maps/夏日游轮.png',
  },
  夏日游轮II: {
    type: '常规地图',
    size: '中型',
    aliases: ['游轮2'],
    studyLevelUnlock: '特级学业',
    roomCount: 9,
    pipeCount: 0,
    supportedModes: [
      '经典奶酪赛',
      '天梯',
      '黄金钥匙赛',
      '特工行动',
      '克隆大作战',
      '房间',
      '创意玩法',
    ],
    hiddenRoomCount: 1,
    description:
      '$彩蛋区域$text-fuchsia-600 dark:text-fuchsia-400#：电影院放映机每次放映电影时，左上角均有概率出现9位彩蛋房密码，按3×3排布，其中0=红灯、1=绿灯；可在船长室右侧控制面板处调整各开关的开启/关闭状态，当各开关状态均正确时，右侧彩蛋房大门将打开，内有6种饮料各一瓶，以及数个高级道具（随机从{遥控器}、{蓝花瓶}、{鞭炮束}、{手枪}、{苍蝇拍}中刷新），还有一个望远镜，打开开关后可使全图所有角色短暂{暴露位置}。',
    specialImageUrl: '/images/maps/夏日游轮.png',
  },
  夏日游轮III: {
    type: '常规地图',
    size: '中型',
    aliases: ['游轮3'],
    studyLevelUnlock: '特级学业',
    roomCount: 9,
    pipeCount: 1,
    supportedModes: [
      '经典奶酪赛',
      '天梯',
      '黄金钥匙赛',
      '奔跑吧老鼠团体赛',
      '特工行动',
      '克隆大作战',
      '房间',
      '创意玩法',
    ],
    hiddenRoomCount: 1,
    description:
      '$彩蛋区域$text-fuchsia-600 dark:text-fuchsia-400#：电影院放映机每次放映电影时，左上角均有概率出现9位彩蛋房密码，按3×3排布，其中0=红灯、1=绿灯；可在船长室右侧控制面板处调整各开关的开启/关闭状态，当各开关状态均正确时，右侧彩蛋房大门将打开，内有6种饮料各一瓶，以及数个高级道具（随机从{遥控器}、{蓝花瓶}、{鞭炮束}、{手枪}、{苍蝇拍}中刷新），还有一个望远镜，打开开关后可使全图所有角色短暂{暴露位置}。',
    specialImageUrl: '/images/maps/夏日游轮.png',
  },
  太空堡垒I: {
    type: '常规地图',
    size: '中型',
    aliases: ['太空堡垒', '太空1', '堡垒1'],
    studyLevelUnlock: '特级学业',
    roomCount: 8,
    pipeCount: 0,
    supportedModes: [
      '经典奶酪赛',
      '天梯',
      '黄金钥匙赛',
      '奔跑吧老鼠团体赛',
      '特工行动',
      '克隆大作战',
      '房间',
      '创意玩法',
    ],
    hiddenRoomCount: 1,
    description:
      '$彩蛋区域$text-fuchsia-600 dark:text-fuchsia-400#：所有角色均可乘坐领航厅右侧发射器前往彩蛋房，内有1个{老鼠夹}、1瓶{神秘药水}和1个{苍蝇拍}，可在彩蛋房乘坐火箭返回本地图的货仓左侧。发射器和火箭的特性与{管道}类似，但使用CD为20秒。\n$特殊机制$text-indigo-700 dark:text-indigo-400#：位于奶酪矿的道具生成口可能会刷新{奶酪}，至多3块。',
    specialImageUrl: '/images/maps/太空堡垒.png',
    interactiveMap: {
      width: 19214,
      height: 11782,
      tileSize: 512,
      minZoom: 0,
      maxZoom: 4,
      tileUrl: '/images/map-tiles/space-fortress-i/{z}/{y}/{x}.webp',
      previewUrl: '/images/map-tiles/space-fortress-i/preview.webp',
      rooms: [],
      points: [],
    },
    mapSkin: [
      {
        name: '星海堡垒I',
        imageUrl: '/images/maps/星海堡垒.png',
        description:
          '常驻地图皮肤，可由地图冠名者自由更换，在创意玩法中会自动应用此皮肤（无法更换）。\n该换肤会改变部分房间名称。',
      },
    ],
  },
  太空堡垒II: {
    type: '常规地图',
    size: '中型',
    aliases: ['太空2', '堡垒2'],
    studyLevelUnlock: '特级学业',
    roomCount: 9,
    pipeCount: 2,
    supportedModes: [
      '经典奶酪赛',
      '天梯',
      '黄金钥匙赛',
      '特工行动',
      '克隆大作战',
      '房间',
      '创意玩法',
    ],
    description:
      '$特殊机制$text-indigo-700 dark:text-indigo-400#：所有角色均可乘坐实验舱右侧发射器前往左侧太空。发射器的特性与{管道}类似，但使用CD为20秒。\n在本地图中，位于货仓的道具生成口可能会刷新{奶酪}，至多3块。',
    specialImageUrl: '/images/maps/太空堡垒.png',
    interactiveMap: {
      width: 19456,
      height: 11037,
      tileSize: 512,
      minZoom: 0,
      maxZoom: 4,
      tileUrl: '/images/map-tiles/space-fortress-ii/{z}/{y}/{x}.webp',
      previewUrl: '/images/map-tiles/space-fortress-ii/preview.webp',
      rooms: [],
      points: [],
    },
    mapSkin: [
      {
        name: '星海堡垒II',
        imageUrl: '/images/maps/星海堡垒.png',
        description:
          '常驻地图皮肤，可由地图冠名者自由更换，在创意玩法中会自动应用此皮肤（无法更换）。\n该换肤会改变部分房间名称。',
      },
    ],
  },
  太空堡垒III: {
    type: '常规地图',
    size: '大型',
    aliases: ['太空3', '堡垒3'],
    studyLevelUnlock: '特级学业',
    roomCount: 8,
    pipeCount: 2,
    supportedModes: [
      '经典奶酪赛',
      '天梯',
      '黄金钥匙赛',
      '特工行动',
      '克隆大作战',
      '房间',
      '创意玩法',
    ],
    changeWithMode: true,
    hiddenRoomCount: 1,
    description:
      '$彩蛋区域$text-fuchsia-600 dark:text-fuchsia-400#：所有角色均可乘坐领航厅右侧发射器前往彩蛋房，内有1个{老鼠夹}、1瓶{神秘药水}和1个{苍蝇拍}，可在彩蛋房乘坐火箭返回本地图的奶酪矿左侧。发射器和火箭的特性与{管道}类似，但使用CD为20秒。\n$特殊机制$text-indigo-700 dark:text-indigo-400#：位于奶酪矿的道具生成口可能会刷新{奶酪}，至多3块。\n$地形更改$text-fuchsia-600 dark:text-fuchsia-400#：在{特工行动}中，本地图维修舱不刷新{老鼠洞}（即本地图只有4个老鼠洞）。',
    specialImageUrl: '/images/maps/太空堡垒.png',
    interactiveMap: {
      width: 19214,
      height: 11696,
      tileSize: 512,
      minZoom: 0,
      maxZoom: 4,
      tileUrl: '/images/map-tiles/space-fortress-iii/{z}/{y}/{x}.webp',
      previewUrl: '/images/map-tiles/space-fortress-iii/preview.webp',
      rooms: [],
      points: [],
    },
    mapSkin: [
      {
        name: '星海堡垒III',
        imageUrl: '/images/maps/星海堡垒.png',
        description:
          '常驻地图皮肤，可由地图冠名者自由更换，在创意玩法中会自动应用此皮肤（无法更换）。\n该换肤会改变部分房间名称。',
      },
    ],
  },
  游乐场: {
    type: '常规地图',
    size: '大型',
    studyLevelUnlock: '大师学业',
    roomCount: 5,
    pipeCount: 1,
    supportedModes: ['经典奶酪赛', '天梯', '房间'],
  },
  森林牧场: {
    type: '常规地图',
    size: '大型',
    aliases: ['牧场'],
    studyLevelUnlock: '大师学业',
    roomCount: 5,
    pipeCount: 3,
    supportedModes: [
      '经典奶酪赛',
      '天梯',
      '黄金钥匙赛',
      '奔跑吧老鼠团体赛',
      '克隆大作战',
      '5V5经典奶酪赛',
      '房间',
    ],
    hiddenRoomCount: 1,
    description:
      '$彩蛋区域$text-fuchsia-600 dark:text-fuchsia-400#：[绝大多数角色](部分有飞行/多段跳能力的角色可以通过技能直接跳到彩蛋房入口处，这样就不需要和其他角色一样借助墙壁进行二次跳跃)可先跳到湖泊沉船右上方的船帮处，再向左上方跳跃到达位于房间左上角的彩蛋房入口，随后向左走并在损坏的吊灯处跳跃即可进入彩蛋房，彩蛋房内有通向牛棚/主人房的单向管道，以及4个高级道具（随机从{神秘饮料}、{遥控器}、{蓝花瓶}、{鞭炮束}、{手枪}、{苍蝇拍}中刷新）。\n在[玩具王国](指本地图的玩具王国换肤)中，彩蛋房位置不变，但入口处有一定坡度，可直接借助坡度二次跳跃。',
    mapSkin: [
      {
        name: '玩具王国',
        imageUrl: '/images/maps/玩具王国.png',
        description:
          '常驻地图皮肤，可由地图冠名者自由更换。\n该换肤会改变部分房间名称，删除原湖底区域的部分竖向墙壁。',
      },
    ],
  },
  大都会: {
    type: '常规地图',
    size: '大型',
    studyLevelUnlock: '大师学业',
    roomCount: 7,
    pipeCount: 4,
    supportedModes: ['经典奶酪赛', '房间'],
    description:
      '$彩蛋区域$text-fuchsia-600 dark:text-fuchsia-400#：街道左侧有一个展示柜，陈列了1瓶{隐身饮料}、1瓶{变身饮料}和2瓶{神秘饮料}，投掷道具碰撞该展示柜[数次](不同道具所需次数不同)后可击碎该展示柜，随后可拿取这些饮料。',
    hiddenRoomCount: 1,
  },
  熊猫馆: {
    type: '常规地图',
    size: '中型',
    studyLevelUnlock: '大师学业',
    roomCount: 5,
    pipeCount: 10,
    supportedModes: ['经典奶酪赛', '天梯', '黄金钥匙赛', '特工行动', '克隆大作战', '房间'],
    description:
      '$特殊机制$text-indigo-700 dark:text-indigo-400#：熊猫谷区域的老鼠洞初始被大熊猫堵住，需要向他投喂4个食物后才会起身，随后才可推入该位置的奶酪。作为交换，该位置的奶酪推入所需进度较低。',
  },
  御门酒店: {
    type: '常规地图',
    size: '大型',
    aliases: ['酒店'],
    studyLevelUnlock: '大师学业',
    roomCount: 7,
    pipeCount: 1,
    supportedModes: [
      '经典奶酪赛',
      '天梯',
      '黄金钥匙赛',
      '奔跑吧老鼠团体赛',
      '特工行动',
      '克隆大作战',
      '房间',
    ],
    description:
      '$特殊机制$text-indigo-700 dark:text-indigo-400#：走廊区域的所有道具均会被包裹在{礼物盒}/{礼物袋}中，需打开这些礼盒才能得到道具。作为交换，该房间生成的道具[品质](即该房间可能会更多地刷新稀有道具，如蓝花瓶等)较高，且必然会额外刷新1块奶酪。',
  },
  天宫: {
    type: '常规地图',
    size: '大型',
    aliases: ['老天宫'],
    studyLevelUnlock: '大师学业',
    roomCount: 5,
    pipeCount: 2,
    supportedModes: ['经典奶酪赛', '天梯', '黄金钥匙赛', '特工行动', '克隆大作战', '房间'],
    mapSkin: [
      {
        name: '天宫（战损）',
        imageUrl: '/images/maps/天宫（战损）.png',
        description: '常驻地图皮肤，可由地图冠名者自由更换。',
      },
    ],
    description:
      '$特殊机制$text-indigo-700 dark:text-indigo-400#：兜率宫处的两个初始火箭为二段火箭，初始燃烧倒计时较低，但起飞到达上方莲花水台后会重置进度且二次点燃。',
  },
  '天宫-云上': {
    type: '常规地图',
    size: '小型',
    aliases: ['新天宫', '天宫二'],
    studyLevelUnlock: '大师学业',
    roomCount: 5,
    pipeCount: 2,
    supportedModes: ['经典奶酪赛', '黄金钥匙赛', '特工行动', '克隆大作战', '房间'],
    description:
      '$特殊机制$text-indigo-700 dark:text-indigo-400#：玉清宫和兜率宫处的各两个初始火箭为二段火箭，初始燃烧倒计时较低，但起飞到达上方莲花水台后会重置进度且二次点燃。',
  },
  '经典之家-疯狂奶酪赛': {
    type: '娱乐地图',
    size: '微型',
    roomCount: 4,
    pipeCount: 0,
    doorCount: 3,
    supportedModes: ['疯狂奶酪赛', '房间'],
  },
  '雪夜古堡-疯狂奶酪赛': {
    type: '娱乐地图',
    size: '微型',
    roomCount: 2,
    pipeCount: 1,
    doorCount: 1,
    supportedModes: ['疯狂奶酪赛', '房间'],
    specialImageUrl: '/images/maps/雪夜古堡.png',
  },
  金丝雀之家: {
    type: '娱乐地图',
    size: '微型',
    roomCount: 1,
    pipeCount: 0,
    supportedModes: ['烟花大作战', '房间'],
  },
  '熊猫馆-烟花大作战': {
    type: '娱乐地图',
    size: '微型',
    roomCount: 1,
    pipeCount: 0,
    supportedModes: ['烟花大作战', '房间'],
    specialImageUrl: '/images/maps/熊猫馆.png',
  },
  阳光沙滩: {
    type: '娱乐地图',
    size: '微型',
    roomCount: 1,
    pipeCount: 0,
    supportedModes: ['沙滩排球', '房间'],
  },
  后院: {
    type: '娱乐地图',
    size: '微型',
    roomCount: 1,
    pipeCount: 1,
    supportedModes: ['装饰树大作战', '房间'],
    specialImageUrl: '/images/maps/经典之家.png',
  },
  '5V5大都会': {
    type: '娱乐地图',
    size: '大型',
    studyLevelUnlock: '大师学业',
    roomCount: 7,
    pipeCount: 4,
    supportedModes: ['5V5经典奶酪赛', '房间'],
    hiddenRoomCount: 1,
    specialImageUrl: '/images/maps/大都会.png',
  },
  家之典经: {
    type: '娱乐地图',
    size: '微型',
    roomCount: 8,
    pipeCount: 2,
    doorCount: 7,
    supportedModes: ['多元乱斗', '房间'],
    specialImageUrl: '/images/maps/经典之家.png',
  },
  '经典之家-谁是外星人': {
    type: '娱乐地图',
    size: '小型',
    roomCount: 6,
    supportedModes: ['谁是外星人'],
    specialImageUrl: '/images/maps/经典之家.png',
  },
};

const mapsWithImages: Record<string, Map> = Object.fromEntries(
  Object.entries(mapDefinitions).map(([mapName, map]) => [
    mapName,
    {
      ...map,
      name: mapName,
      imageUrl: getMapImageUrl(mapName, map),
      //为常规地图添加缩略图地址
      mapImageUrl:
        map.mapImageUrl === undefined && map.type === '常规地图'
          ? `/images/maps/${encodeURIComponent(mapName + '-地图')}.png`
          : map.mapImageUrl || '',
      //为地图添加默认描述
      description:
        map.description === undefined
          ? `${mapName}是一张${map.size}的${map.type}${map.studyLevelUnlock ? `，解锁于${map.studyLevelUnlock}` : ''}${map.roomCount ? `，有${map.roomCount}个房间` : ''}${map.pipeCount ? `，有${map.pipeCount}个管道` : ''}${map.doorCount ? `，有${map.doorCount}个传统木门` : ''}。`
          : `${mapName}是一张${map.size}的${map.type}${map.studyLevelUnlock ? `，解锁于${map.studyLevelUnlock}` : ''}${map.roomCount ? `，有${map.roomCount}个房间` : ''}${map.pipeCount ? `，有${map.pipeCount}个管道` : ''}${map.doorCount ? `，有${map.doorCount}个传统木门` : ''}。\n` +
            map.description,
      //更正地图皮肤的imageUrl
      mapSkin:
        map.mapSkin !== undefined
          ? map.mapSkin.map((mapSkin) => {
              return {
                name: mapSkin.name,
                imageUrl: encodeURI(mapSkin.imageUrl),
                description: mapSkin.description,
              };
            })
          : [],
    },
  ])
);

export function createMapsData(): Record<string, Map> {
  return structuredClone(mapsWithImages);
}

export default createMapsData();
