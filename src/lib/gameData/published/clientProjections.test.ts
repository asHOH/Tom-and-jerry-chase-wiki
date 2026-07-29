import { characters } from '@/data/static';

import { projectKnowledgeCardCharacters, projectSpecialSkillCharacters } from './clientProjections';

const characterId = Object.keys(characters)[0]!;
const character = characters[characterId]!;
const characterRecord = { [characterId]: character };

describe('published client projections', () => {
  it('keeps only knowledge-card usage fields for card detail pages', () => {
    const projected = projectKnowledgeCardCharacters(characterRecord)[characterId]!;

    expect(projected).toEqual({
      id: character.id,
      imageUrl: character.imageUrl,
      factionId: character.faction.id,
      knowledgeCardGroups: character.knowledgeCardGroups,
    });
    expect(projected).not.toHaveProperty('description');
    expect(projected).not.toHaveProperty('skills');
  });

  it('keeps only special-skill usage fields for skill detail pages', () => {
    const projected = projectSpecialSkillCharacters(characterRecord)[characterId]!;

    expect(projected).toEqual({
      id: character.id,
      imageUrl: character.imageUrl,
      factionId: character.faction.id,
      ...(character.specialSkills === undefined ? {} : { specialSkills: character.specialSkills }),
    });
    expect(projected).not.toHaveProperty('description');
    expect(projected).not.toHaveProperty('knowledgeCardGroups');
  });
});
