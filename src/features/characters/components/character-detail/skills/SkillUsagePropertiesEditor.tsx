'use client';

import type { DeepReadonly } from '@/types/deep-readonly';
import { cn } from '@/lib/design';
import type {
  CancelableAftercastType,
  CancelableSkillType,
  FactionId,
  SkillUsageProperties,
} from '@/data/types';
import {
  convertCancelableAftercastToDisplayText,
  convertCancelableSkillToDisplayText,
} from '@/features/characters/utils/skills';
import { editable } from '@/components/ui/editable';

const cancelableOptions = [
  '道具键',
  '道具键*',
  '跳跃键',
  '移动键',
  '药水键',
  '本技能键',
  '其他技能键',
] as const;

type SkillUsagePropertiesEditorProps = {
  usage: DeepReadonly<SkillUsageProperties>;
  usageRef: SkillUsageProperties;
  pathPrefix: string;
  radioNameSuffix: string;
  factionId?: FactionId | undefined;
  scope?: 'characters' | 'entities';
};

type BooleanProperty = 'canMoveWhileUsing' | 'canUseInAir' | 'canHitInPipe' | 'causesWoundedState';

function BooleanCheckbox({
  usage,
  usageRef,
  property,
  label,
  trueText,
  falseText,
}: Pick<SkillUsagePropertiesEditorProps, 'usage' | 'usageRef'> & {
  property: BooleanProperty;
  label: string;
  trueText: string;
  falseText: string;
}) {
  return (
    <div className='flex items-center gap-1 text-xs'>
      <span className='text-gray-400 dark:text-gray-500'>{label}:</span>
      <label className='flex cursor-pointer items-center gap-1'>
        <input
          type='checkbox'
          checked={usage[property] ?? false}
          onChange={(event) => {
            usageRef[property] = event.target.checked;
          }}
          className='h-3 w-3'
        />
        <span className='font-bold'>{usage[property] ? trueText : falseText}</span>
      </label>
    </div>
  );
}

function CancelableEditor({
  usage,
  usageRef,
  pathPrefix,
  phase,
  scope,
}: Pick<SkillUsagePropertiesEditorProps, 'usage' | 'usageRef' | 'pathPrefix'> & {
  phase: 'forecast' | 'aftercast';
  scope: 'characters' | 'entities';
}) {
  const e = scope === 'characters' ? editable('characters') : editable('entities');
  const isForecast = phase === 'forecast';
  const cancelProperty = isForecast ? 'cancelableSkill' : 'cancelableAftercast';
  const value = usage[phase];
  const cancelableValue = usage[cancelProperty];
  const noAnimationText = isForecast ? '无前摇' : '无后摇';
  const specialText = isForecast ? '不可主动打断' : '不可取消';
  const actionText = isForecast ? '打断' : '取消后摇';
  const activeOptions = Array.isArray(cancelableValue) ? cancelableValue : [];
  const displayText = isForecast
    ? convertCancelableSkillToDisplayText(cancelableValue as DeepReadonly<CancelableSkillType>)
    : convertCancelableAftercastToDisplayText(
        cancelableValue as DeepReadonly<CancelableAftercastType>
      );

  const setCancelableValue = (next: CancelableSkillType | CancelableAftercastType | undefined) => {
    if (next === undefined) {
      delete usageRef[cancelProperty];
    } else if (isForecast) {
      usageRef.cancelableSkill = next as CancelableSkillType;
    } else {
      usageRef.cancelableAftercast = next as CancelableAftercastType;
    }
  };

  const setDuration = (next: number) => {
    usageRef[phase] = next;
    if (next !== 0 && usageRef[cancelProperty] === noAnimationText) {
      delete usageRef[cancelProperty];
    }
  };

  const disabled = value === 0;

  return (
    <div className='space-y-1'>
      <div className='text-xs'>{displayText}</div>
      <div className='flex items-center gap-2 text-xs'>
        <div className='flex items-center gap-1'>
          <span className='text-gray-400 dark:text-gray-500'>{isForecast ? '前摇' : '后摇'}:</span>
          <e.span
            path={`${pathPrefix}.${phase}`}
            initialValue={value ?? ''}
            isSingleLine={true}
            onSave={(rawValue) => {
              const parsed = Number.parseFloat(String(rawValue).trim());
              setDuration(Number.isFinite(parsed) ? parsed : -1);
            }}
          />
          <span className='text-gray-400 dark:text-gray-500'>秒</span>
        </div>
        <label className='flex cursor-pointer items-center gap-1'>
          <input
            type='checkbox'
            checked={value === 0}
            onChange={(event) => {
              setDuration(event.target.checked ? 0 : -1);
              if (event.target.checked) setCancelableValue(noAnimationText);
            }}
            className='h-3 w-3'
          />
          <span className={cn({ 'font-bold': value === 0 })}>{noAnimationText}</span>
        </label>
      </div>
      <div className={cn('flex flex-wrap gap-1 text-xs', disabled && 'opacity-50')}>
        <label className='flex cursor-pointer items-center gap-1'>
          <input
            type='checkbox'
            disabled={disabled}
            checked={cancelableValue === specialText}
            onChange={(event) => setCancelableValue(event.target.checked ? specialText : undefined)}
            className='h-3 w-3'
          />
          <span className={cn({ 'font-bold': cancelableValue === specialText })}>
            {specialText}
          </span>
        </label>
      </div>
      <div className={cn('flex flex-wrap gap-1 text-xs', disabled && 'opacity-50')}>
        <span className='text-gray-400 dark:text-gray-500'>可被</span>
        {cancelableOptions.map((option) => (
          <label key={option} className='flex cursor-pointer items-center gap-1'>
            <input
              type='checkbox'
              disabled={disabled}
              checked={activeOptions.includes(option)}
              onChange={(event) => {
                const nextOptions = Array.isArray(cancelableValue) ? [...cancelableValue] : [];
                if (event.target.checked) {
                  if (!nextOptions.includes(option)) nextOptions.push(option);
                  const mutuallyExclusive = option === '道具键' ? '道具键*' : '道具键';
                  if (option === '道具键' || option === '道具键*') {
                    const otherIndex = nextOptions.indexOf(mutuallyExclusive);
                    if (otherIndex >= 0) nextOptions.splice(otherIndex, 1);
                  }
                } else {
                  const optionIndex = nextOptions.indexOf(option);
                  if (optionIndex >= 0) nextOptions.splice(optionIndex, 1);
                }
                setCancelableValue(nextOptions.length > 0 ? nextOptions : undefined);
              }}
              className='h-3 w-3'
            />
            <span className={cn({ 'font-bold': activeOptions.includes(option) })}>{option}</span>
          </label>
        ))}
        <span className='text-gray-400 dark:text-gray-500'>{actionText}</span>
      </div>
    </div>
  );
}

function RadioGroup<T extends string>({
  usage,
  usageRef,
  property,
  label,
  options,
  defaultValue,
  radioNameSuffix,
}: Pick<SkillUsagePropertiesEditorProps, 'usage' | 'usageRef' | 'radioNameSuffix'> & {
  property: 'cooldownTiming' | 'cueRange';
  label: string;
  options: readonly T[];
  defaultValue: T;
}) {
  const currentValue = (usage[property] as T | undefined) ?? defaultValue;

  return (
    <div className='flex items-center gap-1 text-xs'>
      <span className='text-gray-400 dark:text-gray-500'>{label}:</span>
      <div className='flex flex-wrap gap-1'>
        {options.map((option) => (
          <label key={option} className='flex cursor-pointer items-center gap-1'>
            <input
              type='radio'
              name={`${property}-${radioNameSuffix}`}
              checked={currentValue === option}
              onChange={() => {
                if (property === 'cooldownTiming') {
                  usageRef.cooldownTiming = option as NonNullable<
                    SkillUsageProperties['cooldownTiming']
                  >;
                } else {
                  usageRef.cueRange = option as NonNullable<SkillUsageProperties['cueRange']>;
                }
              }}
              className='h-3 w-3'
            />
            <span className={cn({ 'font-bold': currentValue === option })}>{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function SkillUsagePropertiesEditor({
  usage,
  usageRef,
  pathPrefix,
  radioNameSuffix,
  factionId,
  scope = 'characters',
}: SkillUsagePropertiesEditorProps) {
  return (
    <div className='space-y-2'>
      <BooleanCheckbox
        usage={usage}
        usageRef={usageRef}
        property='canMoveWhileUsing'
        label='移动释放'
        trueText='可移动释放'
        falseText='不可移动释放'
      />
      <BooleanCheckbox
        usage={usage}
        usageRef={usageRef}
        property='canUseInAir'
        label='空中释放'
        trueText='可空中释放'
        falseText='不可空中释放'
      />
      {factionId === 'cat' && (
        <BooleanCheckbox
          usage={usage}
          usageRef={usageRef}
          property='causesWoundedState'
          label='造成受伤状态'
          trueText='可造成受伤状态'
          falseText='不可造成受伤状态'
        />
      )}
      <CancelableEditor
        usage={usage}
        usageRef={usageRef}
        pathPrefix={pathPrefix}
        phase='forecast'
        scope={scope}
      />
      <CancelableEditor
        usage={usage}
        usageRef={usageRef}
        pathPrefix={pathPrefix}
        phase='aftercast'
        scope={scope}
      />
      <BooleanCheckbox
        usage={usage}
        usageRef={usageRef}
        property='canHitInPipe'
        label='管道攻击'
        trueText='可击中管道中的角色'
        falseText='不可击中管道中的角色'
      />
      <RadioGroup
        usage={usage}
        usageRef={usageRef}
        property='cooldownTiming'
        label='CD时机'
        options={['前摇前', '释放时', '释放后'] as const}
        defaultValue='释放时'
        radioNameSuffix={radioNameSuffix}
      />
      <RadioGroup
        usage={usage}
        usageRef={usageRef}
        property='cueRange'
        label='技能音效'
        options={['随距离远近变化', '全图可见', '本房间可见', '无音效'] as const}
        defaultValue='无音效'
        radioNameSuffix={radioNameSuffix}
      />
    </div>
  );
}
