'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useSnapshot } from 'valtio';

import { useDarkMode } from '@/context/DarkModeContext';
import GameLayout from '@/features/games/components/GameLayout';
import { characters } from '@/data';

import QuestionCard from './components/QuestionCard';
import QuizProgress from './components/QuizProgress';
import QuizSelector from './components/QuizSelector';
import ResultCard from './components/ResultCard';
import catQuestions, { type QuizOption } from './data/catQuestions';
import mouseQuestions from './data/mouseQuestions';
import { buildUserProfile, findClosestCharacters } from './utils/matchCalculator';

type GamePhase = 'select' | 'quiz' | 'result';

type Props = { description?: string };

export default function PlaystyleQuizClient({ description }: Props) {
  const charsSnap = useSnapshot(characters);
  const [isDarkMode] = useDarkMode();

  const [phase, setPhase] = useState<GamePhase>('select');
  const [faction, setFaction] = useState<'cat' | 'mouse' | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<QuizOption[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isTransitioning = useRef(false);

  const questions = faction === 'cat' ? catQuestions : mouseQuestions;
  const totalQuestions = questions.length;

  // Compute results once all answers are collected
  const result = useMemo(() => {
    if (phase !== 'result' || !faction || answers.length === 0) return null;

    const userProfile = buildUserProfile(answers);
    const matches = findClosestCharacters(userProfile, faction, charsSnap);

    const topMatch = matches[0];
    if (!topMatch) return null;

    const character = charsSnap[topMatch.characterId];
    return {
      topMatch,
      character,
      similarMatches: matches.slice(1),
    };
  }, [phase, faction, answers, charsSnap]);

  const handleFactionSelect = useCallback((f: 'cat' | 'mouse') => {
    setFaction(f);
    setPhase('quiz');
    setCurrentQuestion(0);
    setAnswers([]);
    setSelectedAnswers(new Set());
  }, []);

  const handleToggleAnswer = useCallback((answerIndex: number) => {
    if (isTransitioning.current) return;
    setSelectedAnswers((prev) => {
      const next = new Set(prev);
      if (next.has(answerIndex)) {
        next.delete(answerIndex);
      } else {
        next.add(answerIndex);
      }
      return next;
    });
  }, []);

  const handleSubmit = useCallback(() => {
    if (isTransitioning.current || selectedAnswers.size === 0) return;

    const currentQ = questions[currentQuestion];
    if (!currentQ) return;

    isTransitioning.current = true;
    setIsSubmitting(true);

    // Build selected options from the current Set (safe — guard prevents re-entry)
    const selected: QuizOption[] = [];
    for (const index of selectedAnswers) {
      const opt = currentQ.answers[index];
      if (opt) selected.push(opt);
    }

    setAnswers((prev) => [...prev, ...selected]);
    setSelectedAnswers(new Set());

    // Brief delay to show the confirmed state before advancing
    setTimeout(() => {
      if (currentQuestion + 1 >= totalQuestions) {
        setPhase('result');
      } else {
        setCurrentQuestion((prev) => prev + 1);
      }
      setIsSubmitting(false);
      isTransitioning.current = false;
    }, 200);
  }, [currentQuestion, questions, totalQuestions, selectedAnswers]);

  const handleRetake = useCallback(() => {
    setPhase('select');
    setFaction(null);
    setCurrentQuestion(0);
    setAnswers([]);
    setSelectedAnswers(new Set());
  }, []);

  return (
    <GameLayout title='人格测试' description={description}>
      {phase === 'select' && <QuizSelector onSelect={handleFactionSelect} />}

      {phase === 'quiz' && (
        <div className='mx-auto max-w-2xl space-y-8'>
          <QuizProgress current={currentQuestion} total={totalQuestions} />
          {questions[currentQuestion] && (
            <QuestionCard
              question={questions[currentQuestion]}
              selectedAnswers={selectedAnswers}
              onToggleAnswer={handleToggleAnswer}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      )}

      {phase === 'result' && result && (
        <div className='space-y-8'>
          <ResultCard
            match={result.topMatch}
            character={result.character!}
            faction={faction!}
            isDarkMode={isDarkMode}
            similarMatches={result.similarMatches}
            allCharacters={charsSnap}
          />
          <div className='flex justify-center gap-4'>
            <button
              onClick={handleRetake}
              className='rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            >
              重新测试
            </button>
          </div>
        </div>
      )}
    </GameLayout>
  );
}
