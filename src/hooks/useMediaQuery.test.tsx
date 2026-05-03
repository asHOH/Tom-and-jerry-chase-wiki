import { render } from '@testing-library/react';
import { useMediaQuery as useMediaQueryHook } from 'usehooks-ts';

import { useMobile } from './useMediaQuery';

jest.mock('usehooks-ts', () => ({
  useMediaQuery: jest.fn(() => false),
}));

const mockedUseMediaQuery = jest.mocked(useMediaQueryHook);

function MobileProbe() {
  return <span>{useMobile() ? 'mobile' : 'desktop'}</span>;
}

describe('useMobile', () => {
  it('does not read matchMedia during the hydration render', () => {
    render(<MobileProbe />);

    expect(mockedUseMediaQuery).toHaveBeenCalledWith('(max-width: 767px)', {
      initializeWithValue: false,
    });
  });
});
