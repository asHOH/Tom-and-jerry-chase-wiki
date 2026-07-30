'use client';

import { useEffect, useRef, useState } from 'react';

import traits from '@/data/traits';
import TextWithHoverTooltips from '@/features/shared/components/TextWithHoverTooltips';
import { OneTraitText } from '@/features/shared/traits/OneTraitText';
import Button from '@/components/ui/Button';
import { FormInput } from '@/components/ui/FormControls';
import PageHeader from '@/components/ui/PageHeader';

const processStrings = (input: string | string[]): string =>
  Array.isArray(input) ? input.join('\n') : input;

export default function TraitCollision() {
  const allTraits = Object.values(traits).filter((trait) => !trait.relation);
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
    <div ref={topRef} className={'mx-auto max-w-7xl space-y-2 pt-4 dark:text-slate-200'}>
      <PageHeader
        title='特性大全'
        description={
          <TextWithHoverTooltips
            text={`
          列举已收录的所有特性，共$${`${allTraits.length}`}$font-bold#条，当前为第${startIndex + 1}-${Math.min(endIndex, allTraits.length)}条（第${currentPage}页/共${totalPages}页）`}
          />
        }
        className='mb-2'
      />

      <div className='grid items-center justify-center'>
        <div className='mt-3 mb-6 flex flex-col flex-wrap gap-4 rounded-lg border border-dashed border-gray-400 bg-linear-to-br from-white to-gray-50 px-2 py-3 text-sm font-normal dark:border-gray-600 dark:from-slate-800 dark:to-slate-900 dark:text-slate-200 [&_img]:select-none'>
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
      <div className='mt-8 mb-4 flex items-center justify-center space-x-4'>
        <Button
          variant='secondary'
          size='sm'
          onClick={goToFirstPage}
          disabled={currentPage === 1}
          className='rounded py-1'
        >
          首页
        </Button>
        <Button
          variant='secondary'
          size='sm'
          onClick={goToPreviousPage}
          disabled={currentPage === 1}
          className='rounded py-1'
        >
          上一页
        </Button>

        <span className='text-sm'>
          第 {currentPage} 页 / 共 {totalPages} 页
        </span>

        <Button
          variant='secondary'
          size='sm'
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
          className='rounded py-1'
        >
          下一页
        </Button>
        <Button
          variant='secondary'
          size='sm'
          onClick={goToLastPage}
          disabled={currentPage === totalPages}
          className='rounded py-1'
        >
          末页
        </Button>
      </div>

      {/* 页面跳转输入框 */}
      <div className='mb-8 flex items-center justify-center space-x-2'>
        <label htmlFor='trait-page-input' className='text-sm'>
          跳转到:
        </label>
        <FormInput
          type='number'
          size='sm'
          fullWidth={false}
          min='1'
          max={totalPages}
          value={pageInput}
          onChange={handlePageInputChange}
          onBlur={handlePageInputSubmit}
          onKeyPress={handlePageInputKeyPress}
          id='trait-page-input'
          className='hide-spinner w-16 rounded py-1 text-center'
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
