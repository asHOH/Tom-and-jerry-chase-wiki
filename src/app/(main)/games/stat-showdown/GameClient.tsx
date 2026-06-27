'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSnapshot } from 'valtio';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTimer } from '@/hooks/useTimer';
import GameLayout from '@/features/games/components/GameLayout';
import StreakCounter from '@/features/games/components/StreakCounter';
import { characters } from '@/data';

import ComparisonCard from './components/ComparisonCard';
import GameOverDialog from './components/GameOverDialog';
import { type GameMode } from './components/ModeSelector';
import StatLabel from './components/StatLabel';
import TimerDisplay from './components/TimerDisplay';

type Props = {
  mode: GameMode;
  description?: string;
  /** Navigation tabs for switching between modes (rendered above the game) */
  modeNav?: React.ReactNode;
};

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
  all: [
    'maxHp',
    'attackBoost',
    'moveSpeed',
    'jumpHeight',
    'clawKnifeCdHit',
    'cheesePushSpeed',
    'wallCrackDamageBoost',
  ],
  blitz: [
    'maxHp',
    'attackBoost',
    'moveSpeed',
    'jumpHeight',
    'clawKnifeCdHit',
    'cheesePushSpeed',
    'wallCrackDamageBoost',
  ],
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

/** Modes that allow cross-faction comparison ONLY for attackBoost */
const CROSS_FACTION_MODES: Set<GameMode> = new Set(['all', 'blitz']);

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

export default function StatShowdownClient({ mode, description, modeNav }: Props) {
  const charsSnap = useSnapshot(characters);

  const [score, setScore] = useState(0);
  const [isJudging, setIsJudging] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [leftWinner, setLeftWinner] = useState<boolean | null>(null);

  const [leftChar, setLeftChar] = useState<CharacterSummary | null>(null);
  const [rightChar, setRightChar] = useState<CharacterSummary | null>(null);
  const [currentStat, setCurrentStat] = useState('maxHp');
  const [flipped, setFlipped] = useState(false);

  // Manual advance: allow clicking to skip to next round after a correct guess
  const [canAdvance, setCanAdvance] = useState(false);
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Blitz timer starts only after first choice
  const [timerStarted, setTimerStarted] = useState(false);
  // Escalating penalty: wrong count increases penalty each time
  const [wrongCount, setWrongCount] = useState(0);
  // Feedback badge next to timer in blitz mode
  const [blitzFeedback, setBlitzFeedback] = useState<{
    text: string;
    type: 'correct' | 'wrong';
  } | null>(null);
  const blitzFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [highScores, setHighScores] = useLocalStorage<HighScores>('stat-showdown-scores', {
    cats: 0,
    mice: 0,
    all: 0,
    blitz: 0,
  });

  const highScore = highScores[mode];

  // Build character pool based on mode
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

  // Keep endGame in a ref so onBlitzEnd never captures a stale version
  const endGameRef = useRef(endGame);
  useEffect(() => {
    endGameRef.current = endGame;
  }, [endGame]);

  // Blitz timer — onEnd callback uses ref to avoid stale closures
  const onBlitzEnd = useCallback(() => {
    endGameRef.current(score, true);
  }, [score]);

  const timer = useTimer(30, mode === 'blitz' ? onBlitzEnd : undefined);
  const { reset: resetTimer, start: startTimer, pause: pauseTimer, adjust: adjustTimer } = timer;
  const timerTimeLeft = timer.timeLeft;

  const clearAdvanceTimeout = useCallback(() => {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
    if (blitzFeedbackTimeoutRef.current) {
      clearTimeout(blitzFeedbackTimeoutRef.current);
      blitzFeedbackTimeoutRef.current = null;
    }
  }, []);

  const generatePair = useCallback(() => {
    clearAdvanceTimeout();
    setCanAdvance(false);

    if (pool.length < 2) return;

    const statName = pickRandomStat(MODE_STATS[mode]);

    // Filter characters that have this stat
    const withStat = pool.filter((c) => c.stats[statName] != null);
    if (withStat.length < 2) return;

    // In all/blitz modes, only attackBoost allows cross-faction comparison.
    // All other stats require same-faction characters.
    let candidates = withStat;
    if (CROSS_FACTION_MODES.has(mode) && statName !== 'attackBoost') {
      const cats = candidates.filter((c) => c.factionId === 'cat');
      const mice = candidates.filter((c) => c.factionId === 'mouse');
      candidates = cats.length >= mice.length ? cats : mice;
      if (candidates.length < 2) {
        candidates = cats.length >= mice.length ? mice : cats;
      }
      if (candidates.length < 2) return;
    }

    // Pick two different characters with different stat values
    let attempts = 0;
    let left: CharacterSummary, right: CharacterSummary;
    do {
      left = pickRandom(candidates);
      right = pickRandom(candidates);
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
  }, [pool, mode, clearAdvanceTimeout]);

  // Initialize / reset game when mode changes or game is restarted
  useEffect(() => {
    if (!isGameOver) {
      generatePair();
    }
    // oxlint-disable-next-line react/exhaustive-deps
  }, [mode, isGameOver]);

  // Dedicated timer management — blitz starts only after first choice
  useEffect(() => {
    if (mode === 'blitz' && !isGameOver && timerStarted) {
      startTimer();
    } else {
      pauseTimer();
      if (mode === 'blitz' && !isGameOver && !timerStarted) {
        resetTimer(30);
      }
    }
  }, [mode, isGameOver, timerStarted, resetTimer, startTimer, pauseTimer]);

  const handleAdvance = useCallback(() => {
    generatePair();
  }, [generatePair]);

  const handleSelect = useCallback(
    (side: 'left' | 'right') => {
      // If canAdvance is true, clicking advances to next round
      if (canAdvance) {
        handleAdvance();
        return;
      }

      if (isJudging || isGameOver || !leftChar || !rightChar) return;

      setIsJudging(true);
      setFlipped(true);

      const leftVal = leftChar.stats[currentStat];
      const rightVal = rightChar.stats[currentStat];

      if (leftVal == null || rightVal == null) return;

      // clawKnifeCdHit is a cooldown — lower is better
      const lowerIsBetter = currentStat === 'clawKnifeCdHit';
      const correct =
        leftVal > rightVal ? (lowerIsBetter ? 'right' : 'left') : lowerIsBetter ? 'left' : 'right';
      const winner = side === correct;

      setLeftWinner(correct === 'left');

      if (mode === 'blitz') {
        // Start timer on first choice
        if (!timerStarted) setTimerStarted(true);
        const currentTime = timerTimeLeft;
        if (winner) {
          setScore((prev) => prev + 1);
          adjustTimer(currentTime + 1);
          setBlitzFeedback({ text: '+1s', type: 'correct' });
          generatePair();
        } else {
          const penalty = 4 + wrongCount;
          const newTime = currentTime - penalty;
          setWrongCount((prev) => prev + 1);
          if (newTime <= 0) {
            endGame(score);
          } else {
            adjustTimer(newTime);
            setBlitzFeedback({ text: `-${penalty}s`, type: 'wrong' });
            generatePair();
          }
        }
        // Clear feedback after 1.5s
        if (blitzFeedbackTimeoutRef.current) clearTimeout(blitzFeedbackTimeoutRef.current);
        blitzFeedbackTimeoutRef.current = setTimeout(() => setBlitzFeedback(null), 1500);
      } else {
        // Non-blitz: correct = can manually skip or auto-advance after 1.5s, wrong = game over
        if (winner) {
          setScore((prev) => prev + 1);
          setCanAdvance(true);
          advanceTimeoutRef.current = setTimeout(() => {
            generatePair();
          }, 1500);
        } else {
          endGame(score);
        }
      }
    },
    [
      canAdvance,
      isJudging,
      isGameOver,
      leftChar,
      rightChar,
      currentStat,
      score,
      mode,
      generatePair,
      endGame,
      handleAdvance,
      timerStarted,
      wrongCount,
      timerTimeLeft,
      adjustTimer,
    ]
  );

  const handlePlayAgain = useCallback(() => {
    clearAdvanceTimeout();
    setCanAdvance(false);
    setScore(0);
    setIsGameOver(false);
    setShowDialog(false);
    setIsJudging(false);
    setLeftWinner(null);
    setFlipped(false);
    setTimerStarted(false);
    setWrongCount(0);
    // Timer is reset and waits for first choice in blitz mode
    generatePair();
  }, [generatePair, clearAdvanceTimeout]);

  const leftValue = leftChar?.stats[currentStat];
  const rightValue = rightChar?.stats[currentStat];

  return (
    <GameLayout title='能力对决' description={description}>
      {/* Mode navigation tabs */}
      {modeNav}

      {/* Blitz timer */}
      {mode === 'blitz' && (
        <TimerDisplay
          timeLeft={timer.timeLeft}
          formattedTime={timer.formattedTime}
          isWarning={timer.timeLeft <= 10}
          started={timerStarted}
          feedbackText={blitzFeedback?.text ?? null}
          feedbackType={blitzFeedback?.type ?? null}
        />
      )}

      <StreakCounter current={score} best={highScore} size='md' label='得分' />

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
            disabled={canAdvance ? false : isJudging || isGameOver}
            showAdvanceHint={canAdvance}
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
            disabled={canAdvance ? false : isJudging || isGameOver}
            showAdvanceHint={canAdvance}
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
