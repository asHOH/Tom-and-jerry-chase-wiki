'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';

import { getPathSegmentFromEnd } from '@/lib/edit/editModeRouteUtils';

function useRouteParamFromEnd(indexFromEnd: number): string {
  const pathname = usePathname();
  return useMemo(() => getPathSegmentFromEnd(pathname, indexFromEnd), [pathname, indexFromEnd]);
}

export const useLocalCharacter = () => {
  const characterId = useRouteParamFromEnd(0);
  return { characterId };
};

export const useLocalCard = () => {
  const cardId = useRouteParamFromEnd(0);
  return { cardId };
};

export const useLocalEntity = () => {
  const entityName = useRouteParamFromEnd(0);
  return { entityName };
};

export const useLocalBuff = () => {
  const buffName = useRouteParamFromEnd(0);
  return { buffName };
};

export const useLocalItem = () => {
  const itemName = useRouteParamFromEnd(0);
  return { itemName };
};

export const useLocalFixture = () => {
  const fixtureName = useRouteParamFromEnd(0);
  return { fixtureName };
};

export const useLocalMap = () => {
  const mapName = useRouteParamFromEnd(0);
  return { mapName };
};

export const useLocalMode = () => {
  const modeName = useRouteParamFromEnd(0);
  return { modeName };
};

export const useLocalSpecialSkill = () => {
  const skillId = useRouteParamFromEnd(0);
  const factionId = useRouteParamFromEnd(1);
  return { factionId, skillId };
};

export const useLocalAchievement = () => {
  const achievementName = useRouteParamFromEnd(0);
  return { achievementName };
};
