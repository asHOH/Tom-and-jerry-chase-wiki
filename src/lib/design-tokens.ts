export const designTokens = {
  spacing: {
    xs: '8px',    // 2 units
    sm: '12px',   // 3 units  
    md: '16px',   // 4 units
    lg: '24px',   // 6 units
    xl: '32px'    // 8 units
  },

  colors: {
    faction: {
      // Base faction button colors
      background: '#e5e7eb',      // gray-200
      text: '#1f2937',            // gray-800
      textSecondary: '#6b7280',   // gray-500
      hover: '#2563eb',           // blue-600
      hoverText: '#ffffff',       // white
      border: 'transparent'
    },
    
    primary: {
      50: '#eff6ff',
      100: '#dbeafe', 
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8'
    },
    
    gray: {
      200: '#e5e7eb',
      300: '#d1d5db',
      500: '#6b7280',
      600: '#4b5563',
      800: '#1f2937',
      900: '#111827'
    }
  },

  typography: {
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem'   // 36px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },

  shadows: {
    card: '0 2px 6px rgba(0, 0, 0, 0.05)',
    cardHover: '0 4px 12px rgba(37, 99, 235, 0.2)',
    button: '0 1px 3px rgba(0, 0, 0, 0.1)',
    navigation: '0 2px 4px rgba(0, 0, 0, 0.1)'
  },

  radius: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px'
  },

  zIndex: {
    base: 1,
    dropdown: 10,
    sticky: 20,
    modal: 30,
    navigation: 9999
  },

  transitions: {
    fast: '150ms ease',
    normal: '200ms ease',
    slow: '300ms ease',
    colors: 'background-color 200ms ease, color 200ms ease',
    transform: 'transform 200ms ease',
    all: 'all 200ms ease',
    hover: 'background-color 300ms ease, color 300ms ease, transform 300ms ease, box-shadow 300ms ease'
  }
} as const;

export const componentTokens = {
  factionButton: {
    base: {
      padding: '16px 24px',
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
      minWidth: '220px',
      backgroundColor: designTokens.colors.faction.background,
      color: designTokens.colors.faction.text,
      boxShadow: designTokens.shadows.card
    },
    
    content: {
      display: 'flex',
      alignItems: 'center',
      gap: designTokens.spacing.sm
    },
    
    emoji: {
      fontSize: designTokens.typography.fontSize['2xl']
    },
    
    title: {
      fontSize: designTokens.typography.fontSize['2xl'],
      fontWeight: designTokens.typography.fontWeight.bold
    },
    
    description: {
      fontSize: designTokens.typography.fontSize.sm,
      color: designTokens.colors.faction.textSecondary,
      marginTop: '4px'
    },
    
    hover: {
      backgroundColor: designTokens.colors.faction.hover,
      color: designTokens.colors.faction.hoverText,
      boxShadow: designTokens.shadows.cardHover,
      transform: 'translateY(-2px)'
    }
  },
  
  factionButtonContainer: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'center',
    gap: designTokens.spacing.lg,
    width: '100%',
    maxWidth: '700px',
    margin: '0 auto'
  }
} as const;

export const createStyleFromTokens = (tokenPath: any): React.CSSProperties => {
  if (typeof tokenPath === 'object' && tokenPath !== null) {
    const styles: React.CSSProperties = {};
    
    for (const [key, value] of Object.entries(tokenPath)) {
      if (typeof value === 'string' || typeof value === 'number') {
        (styles as any)[key] = value;
      }
    }
    
    return styles;
  }
  
  return {};
};
