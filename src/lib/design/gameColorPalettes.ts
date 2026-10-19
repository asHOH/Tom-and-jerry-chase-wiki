import { sharedPositioningTagPalettes } from './palettes';

export const gameColorPalettes = {
  factions: {
    cat: {
      text: 'var(--game-factions-cat-text)',
      background: 'var(--game-factions-cat-background)',
    },
    mouse: {
      text: 'var(--game-factions-mouse-text)',
      background: 'var(--game-factions-mouse-background)',
    },
  },
  skillLevels: {
    level1: {
      text: 'var(--game-skill-levels-level1-text)',
      background: 'var(--game-skill-levels-level1-background)',
      border: 'var(--game-skill-levels-level1-border)',
      container: 'game-container-skill-1',
    },
    level2: {
      text: 'var(--game-skill-levels-level2-text)',
      background: 'var(--game-skill-levels-level2-background)',
      border: 'var(--game-skill-levels-level2-border)',
      container: 'game-container-skill-2',
    },
    level3: {
      text: 'var(--game-skill-levels-level3-text)',
      background: 'var(--game-skill-levels-level3-background)',
      border: 'var(--game-skill-levels-level3-border)',
      container: 'game-container-skill-3',
    },
  },
  rank: {
    S: {
      text: 'var(--game-rank--s-text)',
      background: 'var(--game-rank--s-background)',
      border: 'var(--game-rank--s-border)',
    },
    A: {
      text: 'var(--game-rank--a-text)',
      background: 'var(--game-rank--a-background)',
      border: 'var(--game-rank--a-border)',
    },
    B: {
      text: 'var(--game-rank--b-text)',
      background: 'var(--game-rank--b-background)',
      border: 'var(--game-rank--b-border)',
    },
    C: {
      text: 'var(--game-rank--c-text)',
      background: 'var(--game-rank--c-background)',
      border: 'var(--game-rank--c-border)',
    },
    default: {
      text: 'var(--game-rank-default-text)',
      background: 'var(--game-rank-default-background)',
      border: 'var(--game-rank-default-border)',
    },
  },
  cost: {
    high: {
      text: 'var(--game-cost-high-text)',
      background: 'var(--game-cost-high-background)',
      border: 'var(--game-cost-high-border)',
    },
    medium: {
      text: 'var(--game-cost-medium-text)',
      background: 'var(--game-cost-medium-background)',
      border: 'var(--game-cost-medium-border)',
    },
    low: {
      text: 'var(--game-cost-low-text)',
      background: 'var(--game-cost-low-background)',
      border: 'var(--game-cost-low-border)',
    },
    veryLow: {
      text: 'var(--game-cost-very-low-text)',
      background: 'var(--game-cost-very-low-background)',
      border: 'var(--game-cost-very-low-border)',
    },
  },
  knowledgeCardGroupMeta: {
    contributor: {
      text: 'var(--game-knowledge-card-group-meta-contributor-text)',
      background: 'var(--game-knowledge-card-group-meta-contributor-background)',
    },
    missingWarning: {
      text: 'var(--game-knowledge-card-group-meta-missing-warning-text)',
      background: 'var(--game-knowledge-card-group-meta-missing-warning-background)',
    },
  },
  positioningTags: {
    attack: sharedPositioningTagPalettes.crimson,
    defense: sharedPositioningTagPalettes.azure,
    chase: sharedPositioningTagPalettes.russet,
    speedrun: sharedPositioningTagPalettes.emerald,
    fight: sharedPositioningTagPalettes.violet,
    lateGame: sharedPositioningTagPalettes.deepGray,
    comeback: sharedPositioningTagPalettes.amber,
    cheese: sharedPositioningTagPalettes.amber,
    disrupt: sharedPositioningTagPalettes.crimson,
    support: sharedPositioningTagPalettes.azure,
    rescue: sharedPositioningTagPalettes.emerald,
    breakthrough: sharedPositioningTagPalettes.violet,
    wallBreak: sharedPositioningTagPalettes.russet,
    lateGameMouse: sharedPositioningTagPalettes.deepGray,
    minor: {
      text: 'var(--game-positioning-tags-minor-text)',
      background: 'var(--game-positioning-tags-minor-background)',
      border: 'var(--game-positioning-tags-minor-border)',
      container: 'game-container-minor',
    },
  },
  avatars: {
    tuffy: {
      text: 'var(--game-avatar-tuffy-text)',
      background: 'var(--game-avatar-tuffy-background)',
    },
    other: {
      text: 'var(--game-avatar-other-text)',
      background: 'var(--game-avatar-other-background)',
    },
  },
} as const;
