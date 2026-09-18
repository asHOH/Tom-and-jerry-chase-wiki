import { render, screen } from '@testing-library/react';

import PrototypeVariantSection from './PrototypeVariantSection';

jest.mock('@/components/ui/SingleItemButton', () => {
  return function MockSingleItemButton({ singleItem }: { singleItem: { name: string } }) {
    return <span>{singleItem.name}</span>;
  };
});

it.each([
  [false, false],
  [true, false],
  [false, true],
  [true, true],
])(
  'renders prototype=%s and variant=%s sections only when populated',
  (hasPrototype, hasVariant) => {
    const { container } = render(
      <PrototypeVariantSection
        prototypes={hasPrototype ? [{ name: '原型', type: 'item' }] : []}
        variants={hasVariant ? [{ name: '变种', type: 'entity' }] : []}
      />
    );

    expect(screen.queryByText('本内容为以下内容的变种：') !== null).toBe(hasPrototype);
    expect(screen.queryByText('原型') !== null).toBe(hasPrototype);
    expect(screen.queryByText('本内容有以下变种：') !== null).toBe(hasVariant);
    expect(screen.queryByText('变种') !== null).toBe(hasVariant);
    if (!hasPrototype && !hasVariant) expect(container).toBeEmptyDOMElement();
  }
);
