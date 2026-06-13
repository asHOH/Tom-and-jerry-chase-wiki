import { fireEvent, render, screen } from '@testing-library/react';

import PhysicalAttributesSection from './PhysicalAttributesSection';

describe('PhysicalAttributesSection', () => {
  it('hides empty display state', () => {
    const { container } = render(<PhysicalAttributesSection attributes={{}} isEditMode={false} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders display values', () => {
    render(
      <PhysicalAttributesSection
        attributes={{
          move: true,
          gravity: false,
          collision: ['角色', '墙壁'],
        }}
        isEditMode={false}
      />
    );

    expect(screen.getByText('可')).toBeInTheDocument();
    expect(screen.getByText('不受')).toBeInTheDocument();
    expect(screen.getByText('角色')).toBeInTheDocument();
    expect(screen.getByText('墙壁')).toBeInTheDocument();
  });

  it('toggles move and gravity on the draft object', () => {
    const draft = {};

    render(<PhysicalAttributesSection attributes={{}} draftAttributes={draft} isEditMode />);

    fireEvent.click(screen.getByRole('checkbox', { name: /移动/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /重力/ }));

    expect(draft).toEqual({ move: true, gravity: true });
  });

  it('adds and removes collision values and deletes empty collision', () => {
    const draft = { collision: ['角色'] };

    const { rerender } = render(
      <PhysicalAttributesSection
        attributes={{ collision: ['角色'] }}
        draftAttributes={draft}
        isEditMode
      />
    );

    fireEvent.click(screen.getByRole('checkbox', { name: '道具' }));
    expect(draft.collision).toEqual(['角色', '道具']);

    rerender(
      <PhysicalAttributesSection
        attributes={{ collision: ['角色', '道具'] }}
        draftAttributes={draft}
        isEditMode
      />
    );

    fireEvent.click(screen.getByRole('checkbox', { name: '角色' }));
    expect(draft.collision).toEqual(['道具']);

    rerender(
      <PhysicalAttributesSection
        attributes={{ collision: ['道具'] }}
        draftAttributes={draft}
        isEditMode
      />
    );

    fireEvent.click(screen.getByRole('checkbox', { name: '道具' }));
    expect(draft).not.toHaveProperty('collision');
  });
});
