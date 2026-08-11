export const GAME_IMAGE_DIMENSIONS = {
  CHARACTER_CARD: { width: 140, height: 140 },
  KNOWLEDGECARD_CARD: { width: 140, height: 140 },
  SPECIAL_SKILL_CARD: { width: 90, height: 90 },
  ITEM_CARD: { width: 130, height: 130 },
  CARD_DETAILS: { width: 220, height: 220 },
} as const;

export type GameImageSize = keyof typeof GAME_IMAGE_DIMENSIONS;
