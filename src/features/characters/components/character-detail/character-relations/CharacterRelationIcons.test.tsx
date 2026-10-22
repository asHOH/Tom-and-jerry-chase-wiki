import { render, screen } from '@testing-library/react';

import {
  AdvantageIcon,
  DisadvantageIcon,
  HappyFaceIcon,
  HeartIcon,
  MapIcon,
  NeutralFaceIcon,
  SadFaceIcon,
} from './CharacterRelationIcons';

const icons = [
  { Icon: HappyFaceIcon, label: 'smile', viewBox: '0 0 16 16', fill: 'none' },
  { Icon: NeutralFaceIcon, label: 'neutral', viewBox: '0 0 16 16', fill: 'none' },
  { Icon: SadFaceIcon, label: 'sad', viewBox: '0 0 16 16', fill: 'none' },
  { Icon: HeartIcon, label: 'heart', viewBox: '0 0 16 16', fill: 'none' },
  { Icon: AdvantageIcon, label: 'advantage', viewBox: '0 0 20 20', fill: 'currentColor' },
  { Icon: DisadvantageIcon, label: 'disadvantage', viewBox: '0 0 20 20', fill: 'currentColor' },
  { Icon: MapIcon, label: 'map', viewBox: '0 0 20 20', fill: 'currentColor' },
];

it.each(icons)(
  '$label preserves its default geometry and accessible name',
  ({ Icon, label, viewBox, fill }) => {
    render(<Icon />);
    const svg = screen.getByRole('img', { name: label });
    expect(svg).toHaveAttribute('width', '16');
    expect(svg).toHaveAttribute('height', '16');
    expect(svg).toHaveAttribute('viewBox', viewBox);
    expect(svg).toHaveAttribute('fill', fill);
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(svg).not.toHaveAttribute('stroke');
    expect(svg).not.toHaveAttribute('stroke-width');
  }
);

it.each(icons)('$label preserves title, decoration, and explicit SVG overrides', ({ Icon }) => {
  const { container, rerender } = render(<Icon aria-label='custom label' size='2em' />);
  const svg = screen.getByRole('img', { name: 'custom label' });
  expect(svg).toHaveAttribute('width', '2em');
  expect(svg).toHaveAttribute('height', '2em');

  rerender(<Icon title='custom title' aria-label='custom label' />);
  expect(screen.getByRole('img', { name: 'custom title' })).toBe(svg);
  expect(svg.querySelector('title')).toHaveTextContent('custom title');

  rerender(<Icon decorative title='decoration' />);
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  expect(svg).not.toHaveAttribute('aria-label');
  expect(svg.querySelector('title')).toHaveTextContent('decoration');

  rerender(<Icon decorative aria-hidden={false} viewBox='0 0 32 32' fill='red' stroke='blue' />);
  expect(svg).toHaveAttribute('aria-hidden', 'false');
  expect(svg).toHaveAttribute('viewBox', '0 0 32 32');
  expect(svg).toHaveAttribute('fill', 'red');
  expect(svg).toHaveAttribute('stroke', 'blue');
  expect(svg.querySelector('title')).not.toBeInTheDocument();
});
