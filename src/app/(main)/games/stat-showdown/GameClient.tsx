'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSnapshot } from 'valtio';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTimer } from '@/hooks/useTimer';
import GameLayout from '@/features/games/components/GameLayout';
import StreakCounter from '@/features/games/components/StreakCounter';
import { characters } from '@/data';

import ComparisonCard from './components/ComparisonCard';
import GameOverDialog from './components/GameOverDialog';
import ModeSelector, { type GameMode } from './components/ModeSelector';
import StatLabel from './components/StatLabel';
import TimerDisplay from './components/TimerDisplay';

type Props = { description?: string };

/** Stat keys available per mode */
const MODE_STATS: Record<GameMode, string[]> = {
  cats: ['maxHp', 'attackBoost', 'moveSpeed', 'jumpHeight', 'clawKnifeCdHit'],
  mice: [
    'maxHp',
    'attackBoost',
    'moveSpeed',
    'jumpHeight',
    'cheesePushSpeed',
    'wallCrackDamageBoost',
  ],
  all: ['maxHp', 'attackBoost', 'moveSpeed', 'jumpHeight'],
  blitz: ['maxHp', 'attackBoost', 'moveSpeed', 'jumpHeight'],
};

type HighScores = { cats: number; mice: number; all: number; blitz: number };

const STAT_LABELS: Record<string, string> = {
  maxHp: '最大血量',
  attackBoost: '攻击增伤 (%)',
  moveSpeed: '移动速度',
  jumpHeight: '跳跃高度',
  clawKnifeCdHit: '爪刀CD (命中)',
  cheesePushSpeed: '推奶酪速度',
  wallCrackDamageBoost: '砸墙破坏力',
};

type CharacterSummary = {
  id: string;
  imageUrl: string;
  factionId: string;
  stats: Record<string, number | undefined>;
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function pickRandomStat(stats: string[]): string {
  return stats[Math.floor(Math.random() * stats.length)]!;
}

export default function StatShowdownClient({ description }: Props) {
  const charsSnap = useSnapshot(characters);

  const [mode, setMode] = useState<GameMode>('all');
  const [score, setScore] = useState(0);
  const [isJudging, setIsJudging] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [leftWinner, setLeftWinner] = useState<boolean | null>(null);

  const [leftChar, setLeftChar] = useState<CharacterSummary | null>(null);
  const [rightChar, setRightChar] = useState<CharacterSummary | null>(null);
  const [currentStat, setCurrentStat] = useState('maxHp');
  const [flipped, setFlipped] = useState(false);

  const [highScores, setHighScores] = useLocalStorage<HighScores>('stat-showdown-scores', {
    cats: 0,
    mice: 0,
    all: 0,
    blitz: 0,
  });

  const highScore = highScores[mode];

  // Blitz timer
  const onBlitzEnd = useCallback(() => {
    endGame(score, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);
  const timer = useTimer(30, mode === 'blitz' ? onBlitzEnd : undefined);

  // Build character pool on mount / mode change
  const pool = useMemo<CharacterSummary[]>(() => {
    const all = Object.values(charsSnap).map((c) => ({
      id: c.id,
      imageUrl: c.imageUrl,
      factionId: c.factionId ?? 'mouse',
      stats: {
        maxHp: c.maxHp,
        attackBoost: c.attackBoost,
        moveSpeed: c.moveSpeed,
        jumpHeight: c.jumpHeight,
        clawKnifeCdHit: c.factionId === 'cat' ? c.clawKnifeCdHit : undefined,
        cheesePushSpeed: c.factionId === 'mouse' ? c.cheesePushSpeed : undefined,
        wallCrackDamageBoost: c.factionId === 'mouse' ? c.wallCrackDamageBoost : undefined,
      },
    }));

    if (mode === 'cats') return all.filter((c) => c.factionId === 'cat');
    if (mode === 'mice') return all.filter((c) => c.factionId === 'mouse');
    return all;
  }, [charsSnap, mode]);

  const endGame = useCallback(
    (finalScore: number, showImmediately = false) => {
      setIsGameOver(true);
      if (finalScore > highScore) {
        setHighScores((prev) => ({ ...prev, [mode]: finalScore }));
      }
      if (showImmediately) {
        setShowDialog(true);
      } else {
        setTimeout(() => setShowDialog(true), 500);
      }
    },
    [highScore, mode, setHighScores]
  );

  const generatePair = useCallback(() => {
    if (pool.length < 2) return;

    const statName = pickRandomStat(MODE_STATS[mode]);

    // Filter characters that have this stat
    const withStat = pool.filter((c) => c.stats[statName] != null);
    if (withStat.length < 2) return;

    // Pick two different characters with different stat values
    let attempts = 0;
    let left: CharacterSummary, right: CharacterSummary;
    do {
      left = pickRandom(withStat);
      right = pickRandom(withStat);
      attempts++;
    } while (
      (left.id === right.id || left.stats[statName] === right.stats[statName]) &&
      attempts < 50
    );

    if (left.stats[statName] === right.stats[statName]) return; // Tie - skip

    setLeftChar(left);
    setRightChar(right);
    setCurrentStat(statName);
    setFlipped(false);
    setIsJudging(false);
    setLeftWinner(null);
  }, [pool, mode]);

  // Initialize game
  useEffect(() => {
    if (!isGameOver) {
      generatePair();
      if (mode === 'blitz') {
        timer.reset(30);
        timer.start();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, isGameOver]);

  const handleSelect = useCallback(
    (side: 'left' | 'right') => {
      if (isJudging || isGameOver || !leftChar || !rightChar) return;

      setIsJudging(true);
      setFlipped(true);

      const leftVal = leftChar.stats[currentStat];
      const rightVal = rightChar.stats[currentStat];

      if (leftVal == null || rightVal == null) return;

      const correct = leftVal > rightVal ? 'left' : 'right';
      const winner = side === correct;

      setLeftWinner(correct === 'left');

      if (winner) {
        // Correct — advance
        setScore((prev) => prev + 1);
        setTimeout(() => {
          generatePair();
        }, 1500);
      } else {
        // Wrong — game over
        endGame(score);
      }
    },
    [isJudging, isGameOver, leftChar, rightChar, currentStat, score, generatePair, endGame]
  );

  const handlePlayAgain = useCallback(() => {
    setScore(0);
    setIsGameOver(false);
    setShowDialog(false);
    setIsJudging(false);
    setLeftWinner(null);
    setFlipped(false);
    if (mode === 'blitz') {
      timer.reset(30);
      timer.start();
    }
    generatePair();
  }, [mode, generatePair, timer]);

  const handleModeChange = useCallback((newMode: GameMode) => {
    setMode(newMode);
    setScore(0);
    setIsGameOver(false);
    setShowDialog(false);
    setIsJudging(false);
    setLeftWinner(null);
    setFlipped(false);
  }, []);

  const leftValue = leftChar?.stats[currentStat];
  const rightValue = rightChar?.stats[currentStat];

  return (
    <GameLayout title='能力对决' description={description}>
      <ModeSelector currentMode={mode} onSelect={handleModeChange} />

      {mode === 'blitz' && (
        <TimerDisplay
          timeLeft={timer.timeLeft}
          formattedTime={timer.formattedTime}
          isWarning={timer.timeLeft <= 10}
        />
      )}

      <StreakCounter current={score} best={highScore} size='md' />

      <StatLabel statName={currentStat} />

      {/* Cards */}
      <div className='flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8'>
        {leftChar && (
          <ComparisonCard
            characterName={leftChar.id}
            imageUrl={leftChar.imageUrl}
            statValue={leftValue}
            statLabel={STAT_LABELS[currentStat] ?? currentStat}
            isFlipped={flipped}
            isWinner={isJudging ? leftWinner : null}
            onSelect={() => handleSelect('left')}
            disabled={isJudging || isGameOver}
          />
        )}

        <div className='text-2xl font-bold text-gray-400 dark:text-gray-500'>VS</div>

        {rightChar && (
          <ComparisonCard
            characterName={rightChar.id}
            imageUrl={rightChar.imageUrl}
            statValue={rightValue}
            statLabel={STAT_LABELS[currentStat] ?? currentStat}
            isFlipped={flipped}
            isWinner={isJudging ? (leftWinner === null ? null : !leftWinner) : null}
            onSelect={() => handleSelect('right')}
            disabled={isJudging || isGameOver}
          />
        )}
      </div>

      <GameOverDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        score={score}
        highScore={highScore}
        onPlayAgain={handlePlayAgain}
      />
    </GameLayout>
  );
}
