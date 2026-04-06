import React, { type JSX } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import EditModeToolbar, { type EditModeToolbarProps } from './EditModeToolbar';

jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}));

jest.mock('motion/react', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const motionOnlyProps = new Set([
    'animate',
    'drag',
    'dragControls',
    'dragListener',
    'dragMomentum',
    'exit',
    'initial',
    'layout',
    'transition',
    'whileHover',
    'whileTap',
  ]);

  const stripMotionProps = (props: React.HTMLAttributes<HTMLElement>) => {
    return Object.fromEntries(
      Object.entries(props).filter(([key]) => !motionOnlyProps.has(key))
    ) as React.HTMLAttributes<HTMLElement>;
  };

  const createMotionTag = (tag: keyof JSX.IntrinsicElements) => {
    const MotionTag = ReactModule.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
      ({ children, ...props }, ref) =>
        ReactModule.createElement(tag, { ...stripMotionProps(props), ref }, children)
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

  const getPublishButton = () => {
    const buttons = screen.getAllByRole('button');
    return buttons[buttons.length - 1]!;
  };

  it('does not exit edit mode when publish fails', async () => {
    const props = createProps();
    props.onPublish.mockResolvedValue(false);

    render(<EditModeToolbar {...props} />);

    fireEvent.click(getPublishButton());
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'publish failed' },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(getPublishButton());

    await waitFor(() => {
      expect(props.onPublish).toHaveBeenCalledWith('publish failed');
    });

    expect(props.onExitEditMode).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue('publish failed')).toBeInTheDocument();
  });

  it('exits edit mode after a successful publish', async () => {
    const props = createProps();
    props.onPublish.mockResolvedValue(true);

    render(<EditModeToolbar {...props} />);

    fireEvent.click(getPublishButton());
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(getPublishButton());

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
        entityLabel: 'Characters',
        entityId: 'tom',
        itemLabel: 'Tom',
        count: 2,
      },
      {
        entityType: 'specialSkills',
        entityLabel: 'Special Skill',
        entityId: 'double-burst',
        itemLabel: 'Double Burst',
        factionId: 'cat',
        count: 1,
      },
    ];

    render(<EditModeToolbar {...props} />);

    const [, draftsButton] = screen.getAllByRole('button');
    fireEvent.click(draftsButton!);

    const menu = screen.getByRole('menu');
    const menuItems = within(menu).getAllByRole('listitem');

    expect(menuItems).toHaveLength(2);
    expect(menu).toHaveTextContent('Characters');
    expect(menu).toHaveTextContent('Tom');
    expect(menu).toHaveTextContent('Special Skill');
    expect(menu).toHaveTextContent('Double Burst');
    expect(menu).toHaveTextContent('2');
    expect(menu).toHaveTextContent('1');
  });
});
