import React, { type JSX } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import type { GameDataSubmitMode } from '@/lib/gameData/submitMode';
import { EditModeContext } from '@/context/EditModeContext';

import EditModeToolbar, { type EditModeToolbarProps } from './EditModeToolbar';

const mockSetIsPreviewMode = jest.fn();

function renderToolbar(props: EditModeToolbarProps, isPreviewMode = false) {
  return render(
    <EditModeContext
      value={{
        isEditMode: true,
        isLoading: false,
        isPreviewMode,
        setIsPreviewMode: mockSetIsPreviewMode,
      }}
    >
      <EditModeToolbar {...props} />
    </EditModeContext>
  );
}

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
      onPublish: jest.fn<
        Promise<boolean>,
        [string | undefined, { submitMode?: GameDataSubmitMode } | undefined]
      >(),
    }) satisfies EditModeToolbarProps;

  const getPublishButton = () => {
    const buttons = screen.getAllByRole('button');
    return buttons[buttons.length - 1]!;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    { active: false, buttonName: '预览', next: true },
    { active: true, buttonName: '退出预览', next: false },
  ])('toggles preview mode when active is $active', ({ active, buttonName, next }) => {
    renderToolbar(createProps(), active);

    fireEvent.click(screen.getByRole('button', { name: buttonName }));

    expect(mockSetIsPreviewMode).toHaveBeenCalledWith(next);
  });

  it('does not exit edit mode when publish fails', async () => {
    const props = createProps();
    props.onPublish.mockResolvedValue(false);

    renderToolbar(props);

    fireEvent.click(getPublishButton());
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'publish failed' },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(getPublishButton());

    await waitFor(() => {
      expect(props.onPublish).toHaveBeenCalledWith('publish failed', undefined);
    });

    expect(props.onExitEditMode).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue('publish failed')).toBeInTheDocument();
  });

  it('exits edit mode after a successful publish', async () => {
    const props = createProps();
    props.onPublish.mockResolvedValue(true);

    renderToolbar(props);

    fireEvent.click(getPublishButton());
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(getPublishButton());

    await waitFor(() => {
      expect(props.onPublish).toHaveBeenCalledWith(undefined, undefined);
      expect(props.onExitEditMode).toHaveBeenCalledTimes(1);
    });
  });

  it('shows the advanced submit options only when elevated submit behavior is available', () => {
    const props = createProps();
    const { rerender } = renderToolbar(props);

    expect(screen.queryByRole('button', { name: '自动审核并公开' })).not.toBeInTheDocument();

    rerender(
      <EditModeContext
        value={{
          isEditMode: true,
          isLoading: false,
          isPreviewMode: false,
          setIsPreviewMode: mockSetIsPreviewMode,
        }}
      >
        <EditModeToolbar
          {...props}
          advancedSubmit={{
            available: true,
            defaultOutcome: 'approved',
            modes: ['default', 'force_public_pending', 'force_pending'],
          }}
        />
      </EditModeContext>
    );

    fireEvent.click(getPublishButton());

    expect(screen.getByText('当前将自动审核通过并公开显示。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '自动审核并公开' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '仅自动公开' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '普通提交' })).toBeInTheDocument();
  });

  it('lets reviewers submit with auto publish only', async () => {
    const props = createProps();
    props.onPublish.mockResolvedValue(true);

    renderToolbar({
      ...props,
      advancedSubmit: {
        available: true,
        defaultOutcome: 'approved',
        modes: ['default', 'force_public_pending', 'force_pending'],
      },
    });

    fireEvent.click(getPublishButton());
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: '仅自动公开' }));

    expect(screen.getByText('本次将自动公开，提交后仍可被复核或撤销。')).toBeInTheDocument();

    fireEvent.click(getPublishButton());

    await waitFor(() => {
      expect(props.onPublish).toHaveBeenCalledWith(undefined, {
        submitMode: 'force_public_pending',
      });
    });
  });

  it('lets elevated submitters downgrade to ordinary pending submit', async () => {
    const props = createProps();
    props.onPublish.mockResolvedValue(true);

    renderToolbar({
      ...props,
      advancedSubmit: {
        available: true,
        defaultOutcome: 'public_pending',
        modes: ['default', 'force_pending'],
      },
    });

    fireEvent.click(getPublishButton());
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: '普通提交' }));

    expect(screen.getByText('按普通提交处理，提交后等待审核。')).toBeInTheDocument();

    fireEvent.click(getPublishButton());

    await waitFor(() => {
      expect(props.onPublish).toHaveBeenCalledWith(undefined, { submitMode: 'force_pending' });
    });
  });

  it('restores the default advanced submit copy when switching back to default mode', () => {
    const props = createProps();

    renderToolbar({
      ...props,
      advancedSubmit: {
        available: true,
        defaultOutcome: 'approved',
        modes: ['default', 'force_public_pending', 'force_pending'],
      },
    });

    fireEvent.click(getPublishButton());
    fireEvent.click(screen.getByRole('button', { name: '普通提交' }));
    fireEvent.click(screen.getByRole('button', { name: '自动审核并公开' }));

    expect(screen.getByText('当前将自动审核通过并公开显示。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '自动审核并公开' })).toBeDisabled();
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

    renderToolbar(props);

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
