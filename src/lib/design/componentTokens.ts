import { designTokens } from './designTokens';

export const componentTokens = {
  factionButton: {
    base: {
      padding: '1rem 1.5rem', // 16px 24px
      borderRadius: designTokens.radius.md,
      fontSize: designTokens.typography.fontSize.base,
      fontWeight: designTokens.typography.fontWeight.bold,
      transition: designTokens.transitions.hover,
      cursor: 'pointer',
      border: 'none',
      outline: 'none',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      gap: designTokens.spacing.xs,
      textAlign: 'center' as const,
      flex: 1,
      minWidth: '11.25rem', // 180px
    },

    mobile: {
      padding: '0.75rem 1rem', // 12px 16px
    },

    content: {
      display: 'flex',
      alignItems: 'center',
      gap: designTokens.spacing.sm,
    },

    emoji: {
      fontSize: designTokens.typography.fontSize['2xl'],
    },

    title: {
      fontSize: designTokens.typography.fontSize['2xl'],
      fontWeight: designTokens.typography.fontWeight.bold,
      whiteSpace: 'nowrap',
    },

    description: {
      fontSize: designTokens.typography.fontSize.sm,
      color: designTokens.colors.faction.textSecondary,
      marginTop: '0.25rem', // 4px
    },

    hover: {
      transform: 'translateY(-2px)',
    },
    theme: {
      light: {
        base: {
          backgroundColor: designTokens.colors.faction.background,
          color: designTokens.colors.faction.text,
          boxShadow: designTokens.shadows.card,
        },
        descriptionColor: designTokens.colors.faction.textSecondary,
        hover: {
          backgroundColor: designTokens.colors.faction.hover,
          color: designTokens.colors.faction.hoverText,
          boxShadow: designTokens.shadows.cardHover,
        },
      },
      dark: {
        base: {
          backgroundColor: designTokens.colors.faction.dark.background,
          color: designTokens.colors.faction.dark.text,
          boxShadow: designTokens.shadows.dark.card,
        },
        descriptionColor: designTokens.colors.faction.dark.textSecondary,
        hover: {
          backgroundColor: designTokens.colors.faction.dark.hover,
          color: designTokens.colors.faction.dark.hoverText,
          boxShadow: designTokens.shadows.dark.cardHover,
        },
      },
    },
  },
  factionButtonContainer: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'center',
    gap: designTokens.spacing.lg,
    width: '100%',
    maxWidth: '43.75rem', // 700px
    margin: '0 auto',
  },

  // Card component tokens
  card: {
    base: {
      borderRadius: designTokens.radius.lg,
      boxShadow: designTokens.shadows.card,
      transition: designTokens.transitions.hover,
      border: 'none',
      outline: 'none',
    },
    content: {
      height: '16rem', // h-64 (256px)
    },
  },
  // Tag component tokens
  tag: {
    base: {
      padding: `${designTokens.spacing.xs6} ${designTokens.spacing.xs}`, // 6px 8px
      borderRadius: designTokens.radius.sm,
      fontWeight: designTokens.typography.fontWeight.medium,
      display: 'inline-block',
      border: 'none',
    },
    compact: {
      padding: `${designTokens.spacing.xs5} ${designTokens.spacing.xs7}`, // 5px 7px
      borderRadius: designTokens.radius.sm,
      fontWeight: designTokens.typography.fontWeight.medium,
      display: 'inline-block',
      border: 'none',
    },
    micro: {
      padding: `${designTokens.spacing.xs3} ${designTokens.spacing.xs4}`, // 3px 4px
      borderRadius: designTokens.radius.sm,
      fontWeight: designTokens.typography.fontWeight.medium,
      display: 'inline-block',
      border: 'none',
    },
  },

  // Image component tokens
  image: {
    dimensions: {
      CHARACTER_CARD: { width: 140, height: 140 },
      KNOWLEDGECARD_CARD: { width: 140, height: 140 },
      SPECIAL_SKILL_CARD: { width: 90, height: 90 },
      ITEM_CARD: { width: 130, height: 130 },
      CARD_DETAILS: { width: 220, height: 220 },
    },
    container: {
      height: '12rem', // h-48 (192px)
      borderRadius: `${designTokens.radius.lg} ${designTokens.radius.lg} 0 0`,
    },
  },

  // Grid component tokens
  grid: {
    gap: designTokens.spacing.md,
    columns: {
      mobile: 2,
      tablet: 3,
      desktop: 4,
      large: 5,
      extraLarge: 6,
    },
  },
} as const;
