'use client';

import { cn } from '@/lib/design';
import TextWithHoverTooltips from '@/features/shared/components/TextWithHoverTooltips';
import { CheckCircleIcon, CircleIcon } from '@/components/icons/CommonIcons';

import type { QuizQuestion } from '../data/catQuestions';
import type { MouseQuizQuestion } from '../data/mouseQuestions';

type QuestionCardProps = {
  question: QuizQuestion | MouseQuizQuestion;
  selectedAnswers: ReadonlySet<number>;
  onToggleAnswer: (index: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
};

/**
 * Displays a single quiz question with multi-select answer options.
 * The user can toggle multiple answers, then confirm to proceed.
 */
export default function QuestionCard({
  question,
  selectedAnswers,
  onToggleAnswer,
  onSubmit,
  isSubmitting,
}: QuestionCardProps) {
  const count = selectedAnswers.size;
  const total = question.answers.length;

  return (
    <div className='space-y-6'>
      <h2 className='text-center text-xl font-semibold text-gray-900 md:text-2xl dark:text-white'>
        {question.text}
      </h2>

      <div className='grid gap-3 md:grid-cols-2'>
        {question.answers.map((answer, index) => {
          const isSelected = selectedAnswers.has(index);
          return (
            <button
              key={index}
              onClick={() => onToggleAnswer(index)}
              disabled={isSubmitting}
              className={cn(
                'flex items-center gap-3 rounded-lg border-2 px-5 py-4 text-left transition-all duration-150',
                'min-h-11 touch-manipulation', // Mobile touch target
                'focus:ring-2 focus:ring-blue-400 focus:outline-none',
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500 dark:hover:bg-gray-700'
              )}
            >
              {isSelected ? (
                <CheckCircleIcon className='h-6 w-6 shrink-0 text-blue-500' />
              ) : (
                <CircleIcon className='h-6 w-6 shrink-0 text-gray-400 dark:text-gray-500' />
              )}
              <span className='text-gray-800 dark:text-gray-200'>
                <TextWithHoverTooltips text={answer.text}></TextWithHoverTooltips>
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={onSubmit}
        disabled={count === 0 || isSubmitting}
        className={cn(
          'w-full rounded-lg px-5 py-3 text-center font-medium transition-all duration-150',
          count > 0 && !isSubmitting
            ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
            : 'cursor-not-allowed bg-gray-300 text-gray-500 dark:bg-gray-600 dark:text-gray-400'
        )}
      >
        确认选择 ({count}/{total})
      </button>
    </div>
  );
}
