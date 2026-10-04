import React, { type JSX } from 'react';
import { fireEvent, render } from '@testing-library/react';

import ImagePickerModal from './ImagePickerModal';

jest.mock('motion/react', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const motionOnlyProps = new Set(['animate', 'exit', 'initial', 'transition']);

  const MockMotionDiv = ReactModule.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
  >(({ children, ...props }, ref) => {
    const htmlProps = Object.fromEntries(
      Object.entries(props).filter(([key]) => !motionOnlyProps.has(key))
    ) as React.HTMLAttributes<HTMLDivElement>;

    return ReactModule.createElement('div', { ...htmlProps, ref }, children);
  });
  MockMotionDiv.displayName = 'MockMotion(div)';

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    m: { div: MockMotionDiv },
    useReducedMotion: () => false,
  } satisfies {
    AnimatePresence: (props: { children: React.ReactNode }) => JSX.Element;
    m: { div: typeof MockMotionDiv };
    useReducedMotion: () => boolean;
  };
});

const defaultProps = {
  isOpen: true,
  onSelect: jest.fn(),
  onUpload: jest.fn(async () => '/uploaded.png'),
  allowedSourcesDescription: '站内图片地址',
  refreshLibraryKey: 0,
};

describe('ImagePickerModal', () => {
  it('blocks backdrop dismissal during upload but still permits Escape', () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <ImagePickerModal {...defaultProps} onClose={onClose} isUploading />
    );

    const uploadingBackdrop = document.querySelector('.z-120[aria-hidden="true"]');
    if (!uploadingBackdrop) throw new Error('Expected image picker backdrop');

    fireEvent.mouseDown(uploadingBackdrop);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    rerender(<ImagePickerModal {...defaultProps} onClose={onClose} isUploading={false} />);

    const idleBackdrop = document.querySelector('.z-120[aria-hidden="true"]');
    if (!idleBackdrop) throw new Error('Expected image picker backdrop');

    fireEvent.mouseDown(idleBackdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
