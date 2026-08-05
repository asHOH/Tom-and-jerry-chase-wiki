import { componentTokens } from './componentTokens';
import { designTokens } from './designTokens';

describe('design tokens', () => {
  it('uses Tailwind radius variables while keeping literal boundary values', () => {
    expect(designTokens.radius).toEqual({
      none: '0',
      xs: 'var(--radius-xs)',
      sm: 'var(--radius-sm)',
      md: 'var(--radius-md)',
      lg: 'var(--radius-lg)',
      xl: 'var(--radius-xl)',
      '2xl': 'var(--radius-2xl)',
      full: '9999px',
    });
  });

  it('preserves component radius dimensions with Tailwind-aligned names', () => {
    expect(componentTokens.factionButton.base.borderRadius).toBe(designTokens.radius.lg);
    expect(componentTokens.tag.base.borderRadius).toBe(designTokens.radius.md);
    expect(componentTokens.tag.compact.borderRadius).toBe(designTokens.radius.md);
    expect(componentTokens.tag.micro.borderRadius).toBe(designTokens.radius.md);
  });
});
