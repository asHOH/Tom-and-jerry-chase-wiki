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
    icons: [
      {
        src: '/icon.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  };
}
