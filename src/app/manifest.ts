import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '猫和老鼠手游wiki',
    short_name: '猫鼠wiki',
    description: '猫和老鼠手游wiki - 提供详细的角色属性、技能、加点、知识卡查询推荐等数据和攻略',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    orientation: 'portrait',
    scope: '/',
    lang: 'zh-CN',
    categories: ['games', 'entertainment', 'reference'],
    screenshots: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        label: '应用截图',
      },
    ],
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/favicon.ico',
        sizes: '16x16 32x32',
        type: 'image/x-icon',
      },
    ],
    // Enhanced PWA features
    prefer_related_applications: false,
    shortcuts: [
      {
        name: '猫阵营角色',
        short_name: '猫角色',
        description: '查看猫阵营角色信息',
        url: '/?tab=cat',
        icons: [{ src: '/images/icons/cat faction.png', sizes: '96x96' }],
      },
      {
        name: '鼠阵营角色',
        short_name: '鼠角色',
        description: '查看鼠阵营角色信息',
        url: '/?tab=mouse',
        icons: [{ src: '/images/icons/mouse faction.png', sizes: '96x96' }],
      },
    ],
  };
}
