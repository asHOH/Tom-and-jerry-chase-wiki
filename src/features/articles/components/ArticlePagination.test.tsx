import { fireEvent, render, screen } from '@testing-library/react';

import ArticlePagination from './ArticlePagination';

it('preserves the page window, current page, and navigation callbacks', () => {
  const handlePageChange = jest.fn();
  render(
    <ArticlePagination
      currentPage={5}
      totalPages={10}
      handlePageChange={handlePageChange}
      isMobile={false}
      selectedCategories={new Set()}
    />
  );

  expect(screen.getByRole('button', { name: '第 5 页' })).toHaveAttribute('aria-current', 'page');
  expect(screen.queryByRole('button', { name: '第 2 页' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '第 8 页' })).not.toBeInTheDocument();
  expect(screen.getAllByText('...')).toHaveLength(2);

  fireEvent.click(screen.getByRole('button', { name: '上一页' }));
  fireEvent.click(screen.getByRole('button', { name: '第 6 页' }));
  fireEvent.click(screen.getByRole('button', { name: '下一页' }));
  fireEvent.click(screen.getByRole('button', { name: '第 1 页' }));
  fireEvent.click(screen.getByRole('button', { name: '第 10 页' }));
  expect(handlePageChange.mock.calls).toEqual([[4], [6], [6], [1], [10]]);
});

it.each([
  [1, '上一页'],
  [10, '下一页'],
])('disables the endpoint control on page %i', (currentPage, label) => {
  const handlePageChange = jest.fn();
  render(
    <ArticlePagination
      currentPage={currentPage}
      totalPages={10}
      handlePageChange={handlePageChange}
      isMobile
      selectedCategories={new Set()}
    />
  );

  const button = screen.getByRole('button', { name: label });
  expect(button).toBeDisabled();
  fireEvent.click(button);
  expect(handlePageChange).not.toHaveBeenCalled();
});
