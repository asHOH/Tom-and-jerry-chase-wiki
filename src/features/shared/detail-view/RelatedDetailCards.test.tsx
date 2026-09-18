import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import singleItemRreverse from '@/lib/singleItemReverse';
import { getSingleItemPrototype } from '@/lib/singleItemTools';
import type { SingleItem } from '@/data/types';

import { filterTraitsBySingleItem } from '../traits/filterTraitsBySingleItem';
import DetailReverseCard from './DetailReverseCard';
import DetailTraitsCard from './DetailTraitsCard';
import { getOwnEntities } from './getOwnEntities';

jest.mock('@/lib/singleItemReverse', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@/lib/singleItemTools', () => ({ getSingleItemPrototype: jest.fn() }));
jest.mock('@/context/TraitsContext', () => ({ useTraitsData: () => ({}) }));
jest.mock('../traits/filterTraitsBySingleItem', () => ({ filterTraitsBySingleItem: jest.fn() }));
jest.mock('./getOwnEntities', () => ({ getOwnEntities: jest.fn() }));
jest.mock('@/components/ui/CollapseCard', () => ({
  __esModule: true,
  default: ({ title, children }: { title: string; children: ReactNode }) => (
    <section aria-label={title}>{children}</section>
  ),
}));
jest.mock('../components/SingleItemTraitsText', () => ({
  __esModule: true,
  default: ({ singleItem }: { singleItem: SingleItem }) => (
    <p>{`${singleItem.type}:${singleItem.name}`}</p>
  ),
}));
jest.mock('../components/SingleItemReverseCard', () => ({
  __esModule: true,
  default: ({ singleItem }: { singleItem: SingleItem }) => (
    <p>{`${singleItem.type}:${singleItem.name}`}</p>
  ),
}));

describe.each([
  ['traits', DetailTraitsCard],
  ['references', DetailReverseCard],
] as const)('related %s', (_name, Card) => {
  beforeEach(() => {
    jest.mocked(getOwnEntities).mockReturnValue([
      { name: '衍生物甲', type: 'entity' },
      { name: '衍生物乙', type: 'entity' },
    ]);
    jest.mocked(getSingleItemPrototype).mockReturnValue([
      { name: '原型甲', type: 'item' },
      { name: '当前物件', type: 'fixture' },
    ]);
    const counts: Record<string, number> = {
      'item:当前物件': 1,
      'entity:衍生物甲': 2,
      'entity:衍生物乙': 3,
      'item:原型甲': 4,
      'fixture:当前物件': 5,
    };
    const entries = (item: SingleItem) =>
      Array.from({ length: counts[`${item.type}:${item.name}`] ?? 0 }) as never;
    jest.mocked(singleItemRreverse).mockImplementation(entries);
    jest.mocked(filterTraitsBySingleItem).mockImplementation(entries);
  });

  it('uses each prototype count and opens only its own accordion panel', () => {
    render(<Card singleItem={{ name: '当前物件', type: 'item' }} />);

    expect(screen.getByRole('region')).toHaveAccessibleName(/\(15\)$/);
    expect(screen.getByRole('button', { name: '衍生物甲(2)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '衍生物乙(3)' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '原型甲(4)' }));
    expect(screen.getByText('item:原型甲')).toBeInTheDocument();
    expect(screen.queryByText('entity:衍生物甲')).not.toBeInTheDocument();
    expect(screen.queryByText('entity:衍生物乙')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '当前物件-原型(5)' }));
    expect(screen.getByText('fixture:当前物件')).toBeInTheDocument();
    expect(screen.queryByText('item:原型甲')).not.toBeInTheDocument();
    expect(screen.queryByText('entity:衍生物乙')).not.toBeInTheDocument();
  });

  it('keeps prototypes visible when owned entities have no entries', () => {
    const entries = (item: SingleItem) =>
      Array.from({ length: item.type === 'entity' ? 0 : 1 }) as never;
    jest.mocked(singleItemRreverse).mockImplementation(entries);
    jest.mocked(filterTraitsBySingleItem).mockImplementation(entries);

    render(<Card singleItem={{ name: '当前物件', type: 'item' }} />);

    expect(screen.queryByRole('button', { name: /衍生物/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '原型甲(1)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '当前物件-原型(1)' })).toBeInTheDocument();
  });
});
