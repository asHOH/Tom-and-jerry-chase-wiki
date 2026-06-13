import { render, screen } from '@testing-library/react';

import CharacterLikeAttributesSection from './CharacterLikeAttributesSection';

jest.mock('@/components/ui/Tooltip', () => {
  return function MockTooltip({
    children,
    content,
  }: {
    children: React.ReactNode;
    content: React.ReactNode;
  }) {
    return <span data-tooltip={String(content)}>{children}</span>;
  };
});

describe('CharacterLikeAttributesSection', () => {
  it('renders faction/type wording, defined stat rows, and tooltip labels', () => {
    render(
      <CharacterLikeAttributesSection
        attributes={{
          type: 'cat',
          factionBelong: 'cat',
          maxHp: 100,
          moveSpeed: 760,
        }}
        intro='该道具特性与'
        isDetailed={false}
      />
    );

    expect(screen.getByText('猫阵营')).toBeInTheDocument();
    expect(screen.getByText('猫角色')).toBeInTheDocument();
    expect(screen.getByText('Hp上限')).toBeInTheDocument();
    expect(screen.getByText('移速')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('760')).toBeInTheDocument();
    expect(screen.queryByText('Hp恢复')).not.toBeInTheDocument();
  });

  it('uses the value renderer for editable stat values', () => {
    render(
      <CharacterLikeAttributesSection
        attributes={{
          type: 'mouse',
          factionBelong: 'mouse',
          attackBoost: 10,
        }}
        intro='该衍生物特性与'
        isDetailed
        renderValue={(field, value) => <span data-testid={`editable-${field}`}>{value}</span>}
      />
    );

    expect(screen.getByTestId('editable-attackBoost')).toHaveTextContent('10');
  });
});
