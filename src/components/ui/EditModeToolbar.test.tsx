import React, { type JSX } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import EditModeToolbar, { type EditModeToolbarProps } from './EditModeToolbar';

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
    useDragControls: () => ({ start: jest.fn() }),
    useReducedMotion: () => false,
    useDragControls: () => ({
      start: jest.fn(),
      bindToContainer: jest.fn(),
    }),
  };
});

describe('EditModeToolbar', () => {
  const createProps = () =>
    ({
      actionCount: 2,
      draftsSummary: [] as NonNullable<EditModeToolbarProps['draftsSummary']>,
      isDirty: true,
      isPublishing: false,
      onDiscard: jest.fn(),
      onExitEditMode: jest.fn(),
      onPublish: jest.fn<Promise<boolean>, [string | undefined]>(),
    }) satisfies EditModeToolbarProps;

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

  it('renders item-level draft rows in the drafts dropdown', () => {
    const props = createProps();
    props.draftsSummary = [
      {
        entityType: 'characters',
        entityLabel: '角色',
        entityId: '汤姆',
        itemLabel: '汤姆',
        count: 2,
      },
      {
        entityType: 'specialSkills',
        entityLabel: '特技',
        entityId: '双重爆发',
        itemLabel: '双重爆发',
        factionId: 'cat',
        count: 1,
      },
    ];

    render(<EditModeToolbar {...props} />);

    fireEvent.click(screen.getByRole('button', { name: '查看草稿' }));

    expect(screen.getByText('角色 · 汤姆')).toBeInTheDocument();
    expect(screen.getByText('特技 · 双重爆发 (猫)')).toBeInTheDocument();
    expect(screen.getByText('2 条')).toBeInTheDocument();
    expect(screen.getByText('1 条')).toBeInTheDocument();
  });
});
