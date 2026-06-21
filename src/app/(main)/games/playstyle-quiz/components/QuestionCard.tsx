'use client';

import { cn } from '@/lib/design';

import type { QuizQuestion } from '../data/catQuestions';
import type { MouseQuizQuestion } from '../data/mouseQuestions';

type QuestionCardProps = {
  question: QuizQuestion | MouseQuizQuestion;
  onAnswer: (index: number) => void;
  selectedAnswer: number | null;
};

/**
 * Displays a single quiz question with 4 answer options.
 * Highlights the selected answer.
 */
export default function QuestionCard({ question, onAnswer, selectedAnswer }: QuestionCardProps) {
  return (
    <div className='space-y-6'>
      <h2 className='text-center text-xl font-semibold text-gray-900 md:text-2xl dark:text-white'>
        {question.text}
      </h2>

      <div className='grid gap-3 md:grid-cols-2'>
        {question.answers.map((answer, index) => {
          const isSelected = selectedAnswer === index;
          return (
            <button
              key={index}
              onClick={() => onAnswer(index)}
              disabled={selectedAnswer !== null}
              className={cn(
                'rounded-lg border-2 px-5 py-4 text-left transition-all duration-150',
                'min-h-[44px] touch-manipulation', // Mobile touch target
                'focus:ring-2 focus:ring-blue-400 focus:outline-none',
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500 dark:hover:bg-gray-700'
              )}
            >
              <span
                className={cn(
                  'mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                  isSelected
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                )}
              >
                {String.fromCharCode(65 + index)}
              </span>
              <span className='text-gray-800 dark:text-gray-200'>{answer.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
