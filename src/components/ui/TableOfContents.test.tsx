import { act, fireEvent, render, screen } from '@testing-library/react';

import { useScrollSpy } from '@/hooks/useScrollSpy';

import TableOfContents from './TableOfContents';

const items = [
  { id: '介绍', label: '介绍', depth: 0 },
  { id: 'Skill:技能', label: '技能', depth: 1 },
  { id: 'missing', label: '暂缺', depth: 0 },
  { id: '结尾', label: '结尾', depth: 0 },
];
const ids = items.map((item) => item.id);

function Harness({ empty = false }: { empty?: boolean }) {
  const activeId = useScrollSpy(empty ? [] : ids);
  return <TableOfContents items={items} activeId={activeId} ariaLabel='目录' />;
}

it('reveals focused horizontal links without moving list or wrapping directories', () => {
  const { rerender } = render(
    <TableOfContents items={items} activeId='' ariaLabel='目录' layout='inline' />
  );
  const link = screen.getByRole('link', { name: '结尾' });
  link.scrollIntoView = jest.fn();
  fireEvent.focus(link);
  expect(link.scrollIntoView).toHaveBeenCalledWith({
    block: 'nearest',
    inline: 'nearest',
    behavior: 'instant',
  });
  jest.mocked(link.scrollIntoView).mockClear();
  rerender(<TableOfContents items={items} activeId='' ariaLabel='目录' />);
  fireEvent.focus(link);
  expect(link.scrollIntoView).not.toHaveBeenCalled();
  rerender(
    <TableOfContents
      items={items}
      activeId='结尾'
      ariaLabel='目录'
      layout='wrap'
      appearance='plain'
    />
  );
  fireEvent.focus(link);
  expect(link.scrollIntoView).not.toHaveBeenCalled();
  expect(link).toHaveAttribute('href', '#结尾');
  expect(link).toHaveAttribute('aria-current', 'location');
});

it('tracks heading positions, skips absent or folded targets, and clears an empty directory', () => {
  jest.useFakeTimers();
  const positions: Record<string, number> = { 介绍: -1000, 'Skill:技能': 100, 结尾: 500 };
  const content = document.createElement('div');
  document.body.append(content);
  for (const id of Object.keys(positions)) {
    const heading = document.createElement('h2');
    heading.id = id;
    heading.getBoundingClientRect = () => ({ top: positions[id] }) as DOMRect;
    content.append(heading);
  }
  const { rerender, unmount } = render(<Harness />);
  const skillLink = screen.getByRole('link', { name: '技能' });
  expect(skillLink).toHaveAttribute('href', '#Skill:技能');
  expect(skillLink).toHaveAttribute('aria-current', 'location');
  expect(skillLink.parentElement).toHaveStyle({ marginLeft: '12px' });

  document.getElementById('Skill:技能')!.setAttribute('aria-hidden', 'true');
  fireEvent.scroll(window);
  act(() => jest.runOnlyPendingTimers());
  expect(screen.getByRole('link', { name: '介绍' })).toHaveAttribute('aria-current', 'location');

  positions['结尾'] = 164;
  document.getElementById('结尾')!.style.scrollMarginTop = '164px';
  fireEvent.resize(window);
  act(() => jest.runOnlyPendingTimers());
  expect(screen.getByRole('link', { name: '结尾' })).toHaveAttribute('aria-current', 'location');

  rerender(<Harness empty />);
  expect(document.querySelector('[aria-current]')).toBeNull();
  unmount();
  content.remove();
  jest.useRealTimers();
});
