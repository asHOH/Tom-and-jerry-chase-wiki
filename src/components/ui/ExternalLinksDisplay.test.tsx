import { render } from '@testing-library/react';

import ExternalLinksDisplay from './ExternalLinksDisplay';

describe('ExternalLinksDisplay', () => {
  it('keeps link icons out of the accessibility tree', () => {
    const { container } = render(<ExternalLinksDisplay />);
    const icons = Array.from(container.querySelectorAll('svg'));

    expect(icons).not.toHaveLength(0);
    icons.forEach((icon) => {
      expect(icon).toHaveAttribute('aria-hidden', 'true');
      expect(icon).toHaveAttribute('focusable', 'false');
    });
  });
});
