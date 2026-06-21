'use client';

import Button from '@/components/ui/Button';

type QuizSelectorProps = {
  onSelect: (faction: 'cat' | 'mouse') => void;
};

/**
 * Initial screen — user picks which faction quiz to take.
 * Two large buttons: 猫问卷 (Cat) and 鼠问卷 (Mouse).
 */
export default function QuizSelector({ onSelect }: QuizSelectorProps) {
  return (
    <div className='flex flex-col items-center gap-6 py-12'>
      <p className='text-center text-lg text-gray-600 dark:text-gray-300'>
        选择一个阵营，回答 10 道游戏情境问题，
        <br />
        我们将为你匹配最适合的角色！
      </p>
      <div className='flex flex-wrap justify-center gap-4'>
        <Button
          onClick={() => onSelect('cat')}
          variant='primary'
          size='lg'
          className='min-w-36 text-lg'
        >
          🐱 猫问卷
        </Button>
        <Button
          onClick={() => onSelect('mouse')}
          variant='secondary'
          size='lg'
          className='min-w-36 text-lg'
        >
          🐭 鼠问卷
        </Button>
      </div>
    </div>
  );
}
