import { SpecialSkillDefinition } from './types';

export const getMouseSpecialSkillImageUrl = (name: string): string => {
  return `/images/mouseSpecialSkills/${name}.png`;
};

// TODO: Add actual mouse special skills definitions
const mouseSpecialSkillDefinitions: Record<string, SpecialSkillDefinition> = {};

const mouseSpecialSkillsWithImages = Object.fromEntries(
  Object.entries(mouseSpecialSkillDefinitions).map(([skillName, skill]) => [
    skillName,
    {
      ...skill,
      factionId: 'mouse' as const,
      imageUrl: getMouseSpecialSkillImageUrl(skillName),
    },
  ])
);

export default mouseSpecialSkillsWithImages;
