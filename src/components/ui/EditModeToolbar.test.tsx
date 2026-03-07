import React, { type JSX } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import EditModeToolbar from './EditModeToolbar';

jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}));

jest.mock('motion/react', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');

  const createMotionTag = (tag: keyof JSX.IntrinsicElements) => {
    const MotionTag = ReactModule.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
      ({ children, ...props }, ref) => ReactModule.createElement(tag, { ...props, ref }, children)
    );
    MotionTag.displayName = `MockMotion(${tag})`;
    return MotionTag;
  };

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    m: {
      button: createMotionTag('button'),
      div: createMotionTag('div'),
    },
    useReducedMotion: () => false,
  };
});

describe('EditModeToolbar', () => {
  const createProps = () => ({
    actionCount: 2,
    draftsSummary: [],
    isDirty: true,
    isPublishing: false,
    onDiscard: jest.fn(),
    onExitEditMode: jest.fn(),
    onPublish: jest.fn<Promise<boolean>, [string | undefined]>(),
  });

  it('does not exit edit mode when publish fails', async () => {
    const props = createProps();
    props.onPublish.mockResolvedValue(false);

    render(<EditModeToolbar {...props} />);

    fireEvent.click(screen.getByRole('button', { name: '发布' }));
    fireEvent.change(screen.getByPlaceholderText('描述您的修改内容（可选）'), {
      target: { value: '测试发布失败' },
    });
    fireEvent.click(screen.getByRole('button', { name: '确认发布' }));

    await waitFor(() => {
      expect(props.onPublish).toHaveBeenCalledWith('测试发布失败');
    });

    expect(props.onExitEditMode).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue('测试发布失败')).toBeInTheDocument();
  });

  it('exits edit mode after a successful publish', async () => {
    const props = createProps();
    props.onPublish.mockResolvedValue(true);

    render(<EditModeToolbar {...props} />);

    fireEvent.click(screen.getByRole('button', { name: '发布' }));
    fireEvent.click(screen.getByRole('button', { name: '确认发布' }));

    await waitFor(() => {
      expect(props.onPublish).toHaveBeenCalledWith(undefined);
      expect(props.onExitEditMode).toHaveBeenCalledTimes(1);
    });
  });
});
