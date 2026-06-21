import type { Metadata } from 'next';

import { generatePageMetadata } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';

import ModeNav from '../components/ModeNav';
import type { GameMode } from '../components/ModeSelector';
import GameClient from '../GameClient';

export const dynamic = 'force-static';

type Props = {
  params: Promise<{ mode: string }>;
};

const MODE_META: Record<string, { title: string; description: string }> = {
  all: {
    title: '能力对决 — 全部角色',
    description: '比较全部角色属性 — 最大血量、攻击增伤、移动速度、跳跃高度',
  },
  cats: {
    title: '能力对决 — 猫阵营',
    description: '比较猫阵营角色属性 — 最大血量、攻击增伤、移动速度、跳跃高度、爪刀CD',
  },
  mice: {
    title: '能力对决 — 鼠阵营',
    description:
      '比较鼠阵营角色属性 — 最大血量、攻击增伤、移动速度、跳跃高度、推奶酪速度、砸墙破坏力',
  },
  blitz: {
    title: '能力对决 — 限时挑战',
    description: '30 秒限时挑战 — 比较角色属性，错误不结束，拼到时间耗尽',
  },
};

const VALID_MODES: GameMode[] = ['all', 'cats', 'mice', 'blitz'];

export function generateStaticParams() {
  return VALID_MODES.map((mode) => ({ mode }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { mode } = await params;
  const meta = MODE_META[mode];
  return generatePageMetadata({
    title: meta?.title ?? '能力对决',
    description: meta?.description ?? '能力对决 — 比较角色属性',
    keywords: ['能力对决', '角色属性', '猫和老鼠', mode],
    canonicalUrl: `${SITE_URL}/games/stat-showdown/${mode}`,
  });
}

export default async function StatShowdownModePage({ params }: Props) {
  const { mode } = await params;

  if (!VALID_MODES.includes(mode as GameMode)) {
    return null; // 404 handled by Next.js notFound
  }

  const gameMode = mode as GameMode;
  const meta = MODE_META[mode]!;

  return (
    <GameClient
      mode={gameMode}
      description={meta.description}
      modeNav={<ModeNav currentMode={gameMode} />}
    />
  );
}
