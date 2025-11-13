'use client';

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

  return (
    <div className={'max-w-6xl mx-auto pt-4 space-y-2 dark:text-slate-200'}>
      <header className={'text-center space-y-2 mb-2 px-2'}>
        <PageTitle>特性大全</PageTitle>
        <PageDescription>
          <TextWithHoverTooltips
            text={`
          列举了当前收录的所有特性，共$${`${allTraits.length}`}$font-bold#条`}
          />
        </PageDescription>
      </header>

      <div className='grid items-center justify-center'>
        <div className='px-2 py-3 mt-3 mb-6 text-sm font-normal gap-4 flex flex-col flex-wrap bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 dark:text-slate-200 [&_img]:select-none rounded-lg border-1 border-dashed border-gray-400 dark:border-gray-600'>
          {allTraits.map((trait, index) => (
            <div key={index} className='text-base whitespace-pre-wrap'>
              <TextWithHoverTooltips
                text={processStrings(OneTraitText(trait)).replace('•', String(index + 1) + '.')}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
