'use client';

import { useState, useRef, useEffect } from 'react';
import PageTitle from '@/components/ui/PageTitle';
import traits from '@/data/traits';
import { OneTraitText } from '../../traits/shared/OneTraitText';
import PageDescription from '@/components/ui/PageDescription';
import TextWithHoverTooltips from '../../characters/shared/TextWithHoverTooltips';

interface TraitCollsionProps {}

const processStrings = (input: string | string[]): string =>
  Array.isArray(input) ? input.join('\n') : input;

export default function TraitCollsion({}: TraitCollsionProps) {
  const allTraits = Object.values(traits);
  const topRef = useRef<HTMLDivElement>(null);

  // 分页状态
  const traitsPerPage = 25;
  const totalPages = Math.ceil(allTraits.length / traitsPerPage);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState(currentPage.toString());

  // 计算当前页的特性范围
  const startIndex = (currentPage - 1) * traitsPerPage;
  const endIndex = startIndex + traitsPerPage;
  const currentPageTraits = allTraits.slice(startIndex, endIndex);

  // 翻页时滚动到顶部
  useEffect(() => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentPage]);

  // 同步输入框与当前页
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  // 翻页函数
  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };

  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);
  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);

  // 处理页码输入
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = () => {
    const page = parseInt(pageInput);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      goToPage(page);
    } else {
      // 输入无效，恢复为当前页
      setPageInput(currentPage.toString());
    }
  };

  const handlePageInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePageInputSubmit();
    }
  };

  return (
    <div ref={topRef} className={'max-w-6xl mx-auto pt-4 space-y-2 dark:text-slate-200'}>
      <header className={'text-center space-y-2 mb-2 px-2'}>
        <PageTitle>特性大全</PageTitle>
        <PageDescription>
          <TextWithHoverTooltips
            text={`
          列举已收录的所有特性，共$${`${allTraits.length}`}$font-bold#条，当前为第${startIndex + 1}-${Math.min(endIndex, allTraits.length)}条（第${currentPage}页/共${totalPages}页）`}
          />
        </PageDescription>
      </header>

      <div className='grid items-center justify-center'>
        <div className='px-2 py-3 mt-3 mb-6 text-sm font-normal gap-4 flex flex-col flex-wrap bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 dark:text-slate-200 [&_img]:select-none rounded-lg border-1 border-dashed border-gray-400 dark:border-gray-600'>
          {currentPageTraits.map((trait, index) => (
            <div key={startIndex + index} className='text-base whitespace-pre-wrap'>
              <TextWithHoverTooltips
                text={processStrings(OneTraitText(trait)).replace(
                  '•',
                  String(startIndex + index + 1) + '.'
                )}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 分页控件 */}
      <div className='flex justify-center items-center space-x-4 mt-8 mb-4'>
        <button
          onClick={goToFirstPage}
          disabled={currentPage === 1}
          className='px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors'
        >
          首页
        </button>
        <button
          onClick={goToPreviousPage}
          disabled={currentPage === 1}
          className='px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors'
        >
          上一页
        </button>

        <span className='text-sm'>
          第 {currentPage} 页 / 共 {totalPages} 页
        </span>

        <button
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
          className='px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors'
        >
          下一页
        </button>
        <button
          onClick={goToLastPage}
          disabled={currentPage === totalPages}
          className='px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors'
        >
          末页
        </button>
      </div>

      {/* 页面跳转输入框 */}
      <div className='flex justify-center items-center space-x-2 mb-8'>
        <span className='text-sm'>跳转到:</span>
        <input
          type='number'
          min='1'
          max={totalPages}
          value={pageInput}
          onChange={handlePageInputChange}
          onBlur={handlePageInputSubmit}
          onKeyPress={handlePageInputKeyPress}
          className='w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-center hide-spinner'
        />
        <span className='text-sm'>页</span>
      </div>

      {/* 隐藏微调按钮的样式 */}
      <style jsx>{`
        /* Chrome, Safari, Edge, Opera */
        input.hide-spinner::-webkit-outer-spin-button,
        input.hide-spinner::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        /* Firefox */
        input.hide-spinner[type='number'] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}
