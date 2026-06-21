'use client';

import { useCallback, useMemo, useState } from 'react';
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
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const questions = faction === 'cat' ? catQuestions : mouseQuestions;
  const totalQuestions = questions.length;

  // Compute results once all answers are collected
  const result = useMemo(() => {
    if (phase !== 'result' || !faction || answers.length !== totalQuestions) return null;

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
  }, [phase, faction, answers, totalQuestions, charsSnap]);

  const handleFactionSelect = useCallback((f: 'cat' | 'mouse') => {
    setFaction(f);
    setPhase('quiz');
    setCurrentQuestion(0);
    setAnswers([]);
    setSelectedAnswer(null);
  }, []);

  const handleAnswer = useCallback(
    (answerIndex: number) => {
      const currentQ = questions[currentQuestion];
      if (!currentQ) return;

      const selected = currentQ.answers[answerIndex];
      if (!selected) return;

      setSelectedAnswer(answerIndex);

      // Brief delay before advancing to show the selection
      setTimeout(() => {
        const newAnswers = [...answers, selected];
        setAnswers(newAnswers);
        setSelectedAnswer(null);

        if (currentQuestion + 1 >= totalQuestions) {
          setPhase('result');
        } else {
          setCurrentQuestion((prev) => prev + 1);
        }
      }, 400);
    },
    [answers, currentQuestion, questions, totalQuestions]
  );

  const handleRetake = useCallback(() => {
    setPhase('select');
    setFaction(null);
    setCurrentQuestion(0);
    setAnswers([]);
    setSelectedAnswer(null);
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
              onAnswer={handleAnswer}
              selectedAnswer={selectedAnswer}
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
