import type { Metadata } from 'next';

import SceneMapLogin from './SceneMapLogin';

export const metadata: Metadata = {
  title: '地图编辑登录',
  robots: { index: false, follow: false },
};
export default function Page() {
  return <SceneMapLogin />;
}
