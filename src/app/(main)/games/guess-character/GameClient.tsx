'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSnapshot } from 'valtio';

import { formatDateKey, getDailyCharacterId, getGameDate, getPuzzleNumber } from '@/lib/gameUtils';
import { buildSkillCluesForCharacter } from '@/lib/skillEffectUtils';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { catCharacterIds, mouseCharacterIds } from '@/features/characters/data/characterMetadata';
import GameLayout from '@/features/games/components/GameLayout';
import StreakCounter from '@/features/games/components/StreakCounter';
import { getRelationsBySubject } from '@/features/shared/traits/relationIndex';
import { buffs, characters } from '@/data';

import CluePanel, { type ClueEntry } from './components/CluePanel';
import GuessHistory from './components/GuessHistory';
import GuessInput from './components/GuessInput';
import ResultDialog from './components/ResultDialog';

type Props = { description?: string };

type DailyState = {
  date: string;
  guesses: string[];
  solved: boolean;
  startedAt: number;
};

type StreakState = {
  currentStreak: number;
  maxStreak: number;
  lastPlayedDate: string | null;
};

const ALL_CHARACTER_IDS = [...mouseCharacterIds, ...catCharacterIds];
const MAX_WRONG_GUESSES = 8;

/** Simple deterministic hash of a string (for picking tags/display values) */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Bucket a number to the nearest 50 for HP range display (cats), or to specific tiers (mice) */
function bucketHp(hp: number | undefined, factionId?: string): string {
  if (hp == null) return '未知';

  if (factionId === 'mouse') {
    const tiers = [
      { ref: 72, label: '70–75' },
      { ref: 100, label: '99–101' },
      { ref: 124, label: '124' },
    ];
    let best = tiers[0]!;
    let bestDist = Math.abs(hp - best.ref);
    for (const tier of tiers) {
      const dist = Math.abs(hp - tier.ref);
      if (dist < bestDist) {
        best = tier;
        bestDist = dist;
      }
    }
    return best.label;
  }

  const low = Math.floor(hp / 50) * 50;
  const high = Math.ceil(hp / 50) * 50;
  return `${low}–${high}`;
}

export default function GuessCharacterClient({ description }: Props) {
  const charsSnap = useSnapshot(characters);

  // Mode: 'daily' or 'practice'
  const [mode, setMode] = useState<'daily' | 'practice'>('daily');

  // Daily game persisted state
  const [dailyState, setDailyState] = useLocalStorage<DailyState>('guess-character-daily', {
    date: '',
    guesses: [],
    solved: false,
    startedAt: 0,
  });
  const [streak, setStreak] = useLocalStorage<StreakState>('guess-character-streak', {
    currentStreak: 0,
    maxStreak: 0,
    lastPlayedDate: null,
  });

  // Practice game ephemeral state
  const [practiceGuesses, setPracticeGuesses] = useState<string[]>([]);
  const [practiceSolved, setPracticeSolved] = useState(false);
  const [practiceCharacterId, setPracticeCharacterId] = useState<string | null>(null);

  // Result dialog
  const [showResult, setShowResult] = useState(false);

  // Determine today's date and puzzle info
  const today = getGameDate();
  const todayStr = formatDateKey(today);
  const puzzleNumber = getPuzzleNumber(todayStr);

  // Daily character (deterministic from date)
  const dailyCharacterId = useMemo(
    () => getDailyCharacterId(today, ALL_CHARACTER_IDS).characterId,
    [today]
  );

  // Active game state
  const isDaily = mode === 'daily';

  const activeCharacterId = isDaily ? dailyCharacterId : (practiceCharacterId ?? dailyCharacterId);
  const guesses = isDaily ? dailyState.guesses : practiceGuesses;
  const solved = isDaily ? dailyState.solved : practiceSolved;

  // Today already played (daily mode, already solved)
  const todayPlayed = isDaily && dailyState.date === todayStr && dailyState.solved;

  // Compute clues for the active character
  const clues = useMemo<ClueEntry[]>(() => {
    const character = charsSnap[activeCharacterId];
    if (!character) return [];

    const entries: ClueEntry[] = [];

    // Clue 0: Faction + weapon count
    const factionLabel = character.factionId === 'cat' ? '猫阵营' : '鼠阵营';
    const weaponCount =
      character.skills?.filter((s) => s.type === 'weapon1' || s.type === 'weapon2').length ?? 0;
    entries.push({
      label: '阵营 · 武器数',
      value: weaponCount > 0 ? `${factionLabel} · ${weaponCount}` : factionLabel,
    });

    // Clue 1: Single positioning tag (deterministic pick based on character name)
    const tags =
      character.factionId === 'cat' ? character.catPositioningTags : character.mousePositioningTags;
    const tagNames = tags?.map((t) => t.tagName) ?? [];
    const pickedTag =
      tagNames.length > 0 ? tagNames[hashString(character.id) % tagNames.length] : null;
    entries.push({
      label: '定位标签之一',
      value: pickedTag ?? '无定位标签',
    });

    // Clues 2...N: Skill effects (anonymized)
    // Cast from Valtio readonly snapshot to mutable types expected by skillEffectUtils
    const skillTypeLabel: Record<string, string> = {
      active: '主动技能效果',
      weapon1: '武器技能1效果',
      weapon2: '武器技能2效果',
      passive: '被动技能效果',
    };
    const skillClues = buildSkillCluesForCharacter(
      character as unknown as Parameters<typeof buildSkillCluesForCharacter>[0],
      charsSnap as unknown as Parameters<typeof buildSkillCluesForCharacter>[1],
      buffs
    );
    for (const sc of skillClues) {
      entries.push({
        label: skillTypeLabel[sc.skillType] ?? `技能效果 #${sc.skillIndex + 1}`,
        value: sc.anonymizedText,
        isSkillEffect: true,
      });
    }

    // Counter relation clue — inserted before the first skill effect clue
    const firstSkillClueIndex = entries.findIndex((e) => e.isSkillEffect);
    if (firstSkillClueIndex >= 0) {
      const allCounters = [
        ...getRelationsBySubject('counters', { name: activeCharacterId, type: 'character' }),
        ...getRelationsBySubject('counteredBy', { name: activeCharacterId, type: 'character' }),
        ...getRelationsBySubject('counterEachOther', {
          name: activeCharacterId,
          type: 'character',
        }),
      ].filter((r) => !r.isMinor);

      if (allCounters.length > 0) {
        const picked = allCounters[hashString(character.id) % allCounters.length]!;
        const targetName = picked.target.name;
        const clueLabels: Record<string, string> = {
          counters: `克制 ${targetName}`,
          counteredBy: `被 ${targetName} 克制`,
          counterEachOther: `与 ${targetName} 互相克制`,
        };
        const clueValue = clueLabels[picked.kind] ?? `${picked.kind} ${targetName}`;

        entries.splice(firstSkillClueIndex, 0, {
          label: '克制关系',
          value: clueValue,
        });
      }
    }

    // HP range
    entries.push({ label: '血量范围', value: bucketHp(character.maxHp, character.factionId) });

    // Move speed + Jump height
    const ms = character.moveSpeed ?? '?';
    const jh = character.jumpHeight ?? '?';
    entries.push({ label: '移速 & 跳跃', value: `移速: ${ms} · 跳跃: ${jh}` });

    // Attack boost
    const atk = character.attackBoost ?? 0;
    entries.push({ label: '攻击增伤', value: `${atk}%` });

    // Description snippet
    const desc = character.description?.slice(0, 40) ?? '暂无简介';
    entries.push({ label: '简介', value: desc.length >= 40 ? `${desc}…` : desc });

    return entries;
  }, [activeCharacterId, charsSnap]);

  // How many clues are currently revealed (always at least 1)
  const revealedCount = Math.min(guesses.length + 1, clues.length);

  // Has the player guessed correctly?
  const correctGuessIndex = (() => {
    if (!solved && !todayPlayed) return null;
    const idx = guesses.indexOf(activeCharacterId);
    return idx >= 0 ? idx : null;
  })();
  const isGameOver = solved || guesses.length >= MAX_WRONG_GUESSES || correctGuessIndex !== null;

  // On mount, load today's daily game or start fresh
  useEffect(() => {
    if (!isDaily) return;

    // If date changed, reset daily state
    if (dailyState.date !== todayStr) {
      setDailyState({
        date: todayStr,
        guesses: [],
        solved: false,
        startedAt: Date.now(),
      });
    }

    // If already solved today, show result
    if (dailyState.date === todayStr && dailyState.solved) {
      setShowResult(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle a guess submission
  const handleGuess = useCallback(
    (characterId: string) => {
      if (isGameOver) return;

      if (isDaily) {
        const newGuesses = [...dailyState.guesses, characterId];
        const isCorrect = characterId === dailyCharacterId;
        const newSolved = isCorrect || newGuesses.length >= MAX_WRONG_GUESSES;

        setDailyState({
          ...dailyState,
          guesses: newGuesses,
          solved: newSolved || isCorrect,
        });

        if (isCorrect) {
          // Update streak
          const yesterday = formatDateKey(new Date(today.getTime() - 86400000));
          const newStreak = streak.lastPlayedDate === yesterday ? streak.currentStreak + 1 : 1;
          setStreak({
            currentStreak: newStreak,
            maxStreak: Math.max(streak.maxStreak, newStreak),
            lastPlayedDate: todayStr,
          });
          setTimeout(() => setShowResult(true), 300);
        } else if (newGuesses.length >= MAX_WRONG_GUESSES) {
          // Lost — reset streak
          setStreak({
            currentStreak: 0,
            maxStreak: streak.maxStreak,
            lastPlayedDate: todayStr,
          });
          setTimeout(() => setShowResult(true), 300);
        }
      } else {
        // Practice mode
        const newGuesses = [...practiceGuesses, characterId];
        setPracticeGuesses(newGuesses);

        if (characterId === practiceCharacterId) {
          setPracticeSolved(true);
          setTimeout(() => setShowResult(true), 300);
        } else if (newGuesses.length >= MAX_WRONG_GUESSES) {
          setPracticeSolved(true);
          setTimeout(() => setShowResult(true), 300);
        }
      }
    },
    [
      isGameOver,
      isDaily,
      dailyState,
      dailyCharacterId,
      practiceGuesses,
      practiceCharacterId,
      setDailyState,
      setStreak,
      streak,
      todayStr,
      today,
    ]
  );

  // Start a new practice game
  const startPractice = useCallback(() => {
    // Pick a random character
    const rng = (Math.random() * ALL_CHARACTER_IDS.length) | 0;
    setPracticeCharacterId(ALL_CHARACTER_IDS[rng]!);
    setPracticeGuesses([]);
    setPracticeSolved(false);
    setShowResult(false);
  }, []);

  // Initialize practice mode on switch
  const switchToPractice = useCallback(() => {
    setMode('practice');
    if (!practiceCharacterId) {
      const rng = (Math.random() * ALL_CHARACTER_IDS.length) | 0;
      setPracticeCharacterId(ALL_CHARACTER_IDS[rng]!);
    }
    setPracticeGuesses([]);
    setPracticeSolved(false);
    setShowResult(false);
  }, [practiceCharacterId]);

  // Prepare character list for GuessInput
  const characterList = useMemo(
    () =>
      ALL_CHARACTER_IDS.map((id) => ({
        id,
        factionId: charsSnap[id]?.factionId ?? 'mouse',
      })),
    [charsSnap]
  );

  const guessedIdSet = useMemo(() => new Set(guesses), [guesses]);

  const targetCharacter = charsSnap[activeCharacterId];

  return (
    <GameLayout title='猜角色' description={description}>
      {/* Mode toggle */}
      <div className='flex justify-center gap-3'>
        <button
          onClick={() => {
            setMode('daily');
            setShowResult(todayPlayed);
          }}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            mode === 'daily'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          <svg
            className='h-4 w-4'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
            strokeWidth={2}
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
            />
          </svg>
          每日挑战
        </button>
        <button
          onClick={switchToPractice}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            mode === 'practice'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          <svg
            className='h-4 w-4'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
            strokeWidth={2}
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
            />
          </svg>
          无限练习
        </button>
      </div>

      {/* Daily info */}
      {isDaily && (
        <div className='text-center'>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            每日挑战 #{puzzleNumber} — {todayStr}
          </p>
          <StreakCounter
            current={todayPlayed ? streak.currentStreak : streak.currentStreak}
            best={streak.maxStreak}
            size='sm'
          />
        </div>
      )}

      {/* Clues */}
      <CluePanel clues={clues} revealedCount={revealedCount} maxClues={clues.length} />

      {/* Guess input */}
      <GuessInput
        allCharacters={characterList}
        guessedIds={guessedIdSet}
        onGuess={handleGuess}
        disabled={isGameOver}
      />

      {/* Guess history */}
      <GuessHistory guesses={guesses} correctGuessIndex={correctGuessIndex} />

      {/* Already solved today */}
      {todayPlayed && !showResult && (
        <p className='text-center text-green-600 dark:text-green-400'>
          今天的每日挑战已完成！答案是 <strong>{dailyCharacterId}</strong>
        </p>
      )}

      {/* Result dialog */}
      <ResultDialog
        open={showResult}
        onOpenChange={setShowResult}
        puzzleNumber={puzzleNumber}
        characterName={activeCharacterId}
        characterImageUrl={targetCharacter?.imageUrl ?? ''}
        characterFaction={targetCharacter?.factionId === 'cat' ? '猫阵营' : '鼠阵营'}
        guesses={guesses}
        correctGuessIndex={correctGuessIndex}
        maxClues={clues.length}
        onPlayAgain={() => {
          setShowResult(false);
          startPractice();
          setMode('practice');
        }}
        isDaily={isDaily}
      />
    </GameLayout>
  );
}
