import React from 'react';
import Image from 'next/image';

import { getSingleItemOwnedBuffs } from '@/lib/singleItemOwnbuffs';
import { SingleItem } from '@/data/types';

import { getBuffIcons, getBuffIconSrc } from './buffIconMap';
import { compareBuffDescriptions } from './compareBuff';
import TextWithHoverTooltips from './TextWithHoverTooltips';

interface SingleItemOwnbuffsTextProps {
  singleItem: SingleItem;
}

interface State {
  sortMode: 'default' | 'name';
  compareMode: boolean;
}
type BuffGroupMembers = Map<string, string[]>;
type BuffEntry = { id: string; description: string };

const BUFF_GROUP_PATTERN = /分组(\d+(?:\s*[,，、]\s*\d+)*)/g;

/** 比对文本超长时，最多向前回退的层数（不含当前项自身） */
const MAX_COMPARE_LOOKBACK = 3;

/** 比对文本相对原文本允许的最大长度倍率 */
const MAX_COMPARE_LENGTH_RATIO = 1.1;

/** 把 [显示文本](链接目标) 折叠为「显示文本」，用于长度度量 */
const MARKDOWN_LINK_PATTERN = /\[([^\]]*)\]\([^)]*\)/g;

/**
 * 把 $显示文本$样式描述# 折叠为「显示文本」，用于长度度量。
 * 例：`$暂未收录相关状态$italic text-gray-500 dark:text-gray-400 text-sm#`
 *     折叠为 `暂未收录相关状态`
 */
const STYLE_SUFFIX_PATTERN = /\$([^$]*)\$[^#]*#/g;

/**
 * 按“可见文本”度量长度：
 *   - markdown 链接的链接目标部分（悬停提示内容）不计入长度；
 *   - `$显示文本$样式描述#` 中 `#` 前的样式描述不计入长度，仅计入显示文本。
 */
function effectiveLength(text: string): number {
  return text.replace(MARKDOWN_LINK_PATTERN, '$1').replace(STYLE_SUFFIX_PATTERN, '$1').length;
}

/**
 * 剥离名称中不影响分组的附加标记：
 *   1) `*`：注释标记，全局剔除（若放在 -N 剥离之后，`名称-1*`
 *      这种形态会因尾部的 `*` 导致 `-\d+$` 匹配失败）；
 *   2) `-N` / `-N,M`：处理脚本 merge_names 生成的变体尾标。
 *
 * 例：
 *   `张三-1`、`张三-1,2` → `张三`
 *   `华尔兹加速2级（加速）-1` → `华尔兹加速2级（加速）`
 *   `华尔兹加速2级（加速）*-1` → `华尔兹加速2级（加速）`
 */
function getBaseName(fullName: string): string {
  return fullName.replace(/\*/g, '').replace(/-\d+(?:,\d+)*$/, '');
}

/**
 * 去除**紧跟在等级标记之后**的括号补充说明。
 *
 * 例：
 *   `华尔兹3段-敌-Lv1（眩晕）`      → `华尔兹3段-敌-Lv1`
 *   `华尔兹加速2级（加速）`         → `华尔兹加速2级`
 *   `布奇-横冲直撞Lv2（速度更快）`  → `布奇-横冲直撞Lv2`
 *
 * 但括号前**没有**等级标记时（如 `技巧（主动）`、`技巧（武器）`），
 * 括号是名称的组成部分，予以保留，从而保证二者分属不同组。
 */
function stripParentheticalAfterLevel(name: string): string {
  return name.replace(/(Lv\.?\s*\d+|\d+级)\s*[（(][^）)]*[）)]/g, '$1');
}

/**
 * 华尔兹“己”类状态中，1 段 / 2 段 / 3 段视为同一组的不同段数变体。
 *
 * 例：
 *   `华尔兹1段-己-Lv1`、`华尔兹2段-己-Lv1`、`华尔兹3段-己-Lv1`
 *   → 统一为 `华尔兹-己`
 *
 * 注意：只处理 `-己` 形式；`华尔兹1段攻击1级`、`华尔兹3段-敌-Lv1`
 * 中的段号需要保留，否则组 7 / 8 / 9 会被错误合并。
 */
function normalizeWaltzSelfSegment(name: string): string {
  return name.replace(/^华尔兹\d+段(?=-己)/, '华尔兹');
}

/**
 * 去除 Lv 等级标记：
 *   `Lv1`、`Lv.1`、`Lv 1` → ''
 */
function stripLvLevel(name: string): string {
  return name.replace(/Lv\.?\s*\d+/gi, '');
}

/**
 * 去除中文等级标记 `N级`。
 *
 * 但“加速N级”中的等级是状态核心，不能去除，否则
 * `华尔兹加速2级（加速）` 与 `华尔兹加速3级（加速）`
 * 会被错误合并为同一组。
 */
function stripChineseLevelExceptAcceleration(name: string): string {
  return name.replace(/(?<!加速)\d+级/g, '');
}

/**
 * 去除名称末尾用于表示等级的罗马数字：
 *   `强化I`、`强化II`、`强化III` → `强化`
 *
 * 为避免误伤以罗马数字字符结尾的英文/拼音名称（如 `VIP`），
 * 要求罗马数字之前必须紧跟一个汉字。
 *
 * 之所以放在 `stripLvLevel` 与 `stripChineseLevelExceptAcceleration`
 * 之后执行，是为了让 `LvN` / `N级` 优先被处理，避免残留字符干扰匹配。
 */
function stripRomanLevel(name: string): string {
  return name.replace(/(?<=[\u4e00-\u9fff])\s*[IVXLCDM]+$/, '');
}

/**
 * 去除名称末尾的阿拉伯数字（不带连字符的等级变体）：
 *   `兔子免疫BUFF1`、`兔子免疫BUFF2`、`兔子免疫BUFF3` → `兔子免疫BUFF`
 *
 * 安全性：此步位于 `stripChineseLevelExceptAcceleration` 与
 * `stripLvLevel` 之后，`N级`、`LvN`、`-N` 均已被处理，因此
 * `\d+$` 只会命中真正以裸数字结尾的名称。
 */
function stripTrailingArabicDigits(name: string): string {
  return name.replace(/\d+$/, '');
}

/**
 * 生成统一分组键。
 *
 * 规则顺序（顺序敏感）：
 *   1. 剔除 `*` 注释标记并剥 `-N` 尾标；
 *   2. 去除「等级标记后」的括号补充说明（不碰名称性括号）；
 *   3. 合并 `华尔兹N段-己` 的段号；
 *   4. 去除 `LvN`；
 *   5. 去除 `N级`，但保留“加速N级”中的等级；
 *   6. 去除名称末尾的罗马数字等级标记；
 *   7. 去除名称末尾的阿拉伯数字等级标记。
 */
function buildGroupKey(name: string): string {
  let key = getBaseName(name);
  key = stripParentheticalAfterLevel(key);
  key = normalizeWaltzSelfSegment(key);
  key = stripLvLevel(key);
  key = stripChineseLevelExceptAcceleration(key);
  key = stripRomanLevel(key);
  key = stripTrailingArabicDigits(key);
  return key.trim();
}

function extractFullName(description: string): string {
  const match = description.match(/^“([^”]+)”/);
  if (!match) return '';
  let content = match[1] || '';
  const bracketMatch = content.match(/^\[([^\]]+)\]\([^)]*\)$/);
  if (bracketMatch) {
    content = bracketMatch[1] || '';
  }
  return content;
}

function getBuffGroupIds(description: string): string[] {
  return Array.from(description.matchAll(BUFF_GROUP_PATTERN)).flatMap((match) =>
    (match[1] ?? '').split(/\s*[,，、]\s*/).filter(Boolean)
  );
}

function getBuffGroupMembers(buffs: BuffEntry[]): BuffGroupMembers {
  const membersByGroup: BuffGroupMembers = new Map();

  for (const buff of buffs) {
    const name = extractFullName(buff.description);
    if (!name) continue;

    for (const groupId of getBuffGroupIds(buff.description)) {
      const members = membersByGroup.get(groupId) ?? [];
      if (!members.includes(name)) members.push(name);
      membersByGroup.set(groupId, members);
    }
  }

  return membersByGroup;
}

function addBuffGroupTooltips(description: string, membersByGroup: BuffGroupMembers): string {
  return description.replace(BUFF_GROUP_PATTERN, (original, groupList: string) => {
    const groupIds = groupList.split(/\s*[,，、]\s*/).filter(Boolean);
    const renderedGroups = groupIds.map((groupId) => {
      const members = membersByGroup.get(groupId);
      if (!members?.length) return `分组${groupId}`;

      const tooltip = [
        `本技能中属于分组${groupId}的状态（${members.length}个）：`,
        ...members.map((name) => `· ${name}`),
      ].join('\n');

      return `[分组${groupId}](${tooltip})`;
    });

    return renderedGroups.length > 0 ? renderedGroups.join('、') : original;
  });
}

/**
 * 生成「curr 相对 reference」的比对展示文本。
 * 若两者内容等价，退化为「与 X 效果相同」的短提示。
 */
function buildCompareText(curr: BuffEntry, reference: BuffEntry): string {
  const currName = extractFullName(curr.description);
  const refName = extractFullName(reference.description);
  const diff = compareBuffDescriptions(curr.description, reference.description, refName);
  if (diff) return diff;
  return `“${currName}”：与“${refName}”效果相同。`;
}

/**
 * 生成一个比对组（≥2 条目）的展示序列：
 *  - 首条直接展示原文本，作为链式参照起点；
 *  - 后续条目依次向前最多 3 个参照项寻找「比对文本可见长度
 *    ≤ 当前条目可见长度 × 1.15」的候选（markdown 链接目标与
 *    `$文本$样式#` 中的样式均不计入长度）；
 *  - **若找到参照项**：把当前条目插入到该参照项在展示序列中的紧下方
 *    （形成链式堆叠，视觉上体现“相对谁比对”）；
 *  - **若仍全超长**：回落当前条目原文，并保持原顺序追加到末尾。
 */
function buildGroupDisplay(group: BuffEntry[]): BuffEntry[] {
  const result: BuffEntry[] = [];
  if (group.length === 0) return result;

  const first = group[0]!;
  result.push({ id: first.id, description: first.description });

  for (let i = 1; i < group.length; i++) {
    const curr = group[i]!;
    const currLen = effectiveLength(curr.description);
    const maxLen = currLen * MAX_COMPARE_LENGTH_RATIO;
    let chosen: string | null = null;
    let referenceId: string | null = null;
    const maxLookback = Math.min(MAX_COMPARE_LOOKBACK, i);

    for (let k = 1; k <= maxLookback; k++) {
      const reference = group[i - k]!;
      const candidate = buildCompareText(curr, reference);
      if (effectiveLength(candidate) <= maxLen) {
        chosen = candidate;
        referenceId = reference.id;
        break;
      }
    }

    const entry: BuffEntry = {
      id: curr.id,
      description: chosen !== null ? chosen : curr.description,
    };

    // 成功追溯到参照项 → 移动到该参照项紧下方；
    // 未追溯成功 → 保持原顺序追加。
    const refIdx = referenceId !== null ? result.findIndex((e) => e.id === referenceId) : -1;
    if (refIdx >= 0) {
      result.splice(refIdx + 1, 0, entry);
    } else {
      result.push(entry);
    }
  }

  return result;
}

export default class SingleItemOwnbuffsCard extends React.Component<
  SingleItemOwnbuffsTextProps,
  State
> {
  constructor(props: SingleItemOwnbuffsTextProps) {
    super(props);
    this.state = {
      sortMode: 'default',
      compareMode: false,
    };
    this.toggleSort = this.toggleSort.bind(this);
    this.toggleCompare = this.toggleCompare.bind(this);
  }

  toggleSort() {
    this.setState((prev) => ({
      sortMode: prev.sortMode === 'default' ? 'name' : 'default',
    }));
  }

  toggleCompare() {
    this.setState((prev) => ({
      compareMode: !prev.compareMode,
    }));
  }

  render() {
    const { singleItem } = this.props;
    const { sortMode, compareMode } = this.state;
    const icons = getBuffIcons();
    const ownedBuffs = getSingleItemOwnedBuffs(singleItem);
    const buffGroupMembers =
      singleItem.type === 'skill' ? getBuffGroupMembers(ownedBuffs) : undefined;

    if (ownedBuffs.length === 0) {
      return (
        <TextWithHoverTooltips text='    $暂未收录相关状态$italic text-gray-500 dark:text-gray-400 text-sm#' />
      );
    }

    const sortedBuffs = [...ownedBuffs];
    if (sortMode === 'name') {
      sortedBuffs.sort((a, b) => {
        const nameA = extractFullName(a.description);
        const nameB = extractFullName(b.description);
        return nameA.localeCompare(nameB, 'zh-Hans-CN', { numeric: true });
      });
    }

    let displayBuffs: BuffEntry[] = [];

    if (compareMode) {
      // 原始顺序索引，用于最终稳定排序
      const orderIndex = new Map<string, number>();
      sortedBuffs.forEach((buff, idx) => orderIndex.set(buff.id, idx));

      // ---------- 单轮分组：buildGroupKey（语义规范化后的分组键） ----------
      const groups = new Map<string, BuffEntry[]>();
      const anonymous: BuffEntry[] = [];

      for (const buff of sortedBuffs) {
        const fullName = extractFullName(buff.description);
        if (!fullName) {
          anonymous.push(buff);
          continue;
        }
        const key = buildGroupKey(fullName);
        const bucket = groups.get(key) ?? [];
        bucket.push(buff);
        groups.set(key, bucket);
      }

      // ---------- 组装展示序列，按组内首条在原始列表中的位置排序 ----------
      type Section = { order: number; entries: BuffEntry[] };
      const sections: Section[] = [];

      for (const group of groups.values()) {
        if (group.length >= 2) {
          sections.push({
            order: orderIndex.get(group[0]!.id) ?? Number.MAX_SAFE_INTEGER,
            entries: buildGroupDisplay(group),
          });
        } else {
          const buff = group[0]!;
          sections.push({
            order: orderIndex.get(buff.id) ?? Number.MAX_SAFE_INTEGER,
            entries: [{ id: buff.id, description: buff.description }],
          });
        }
      }
      for (const buff of anonymous) {
        sections.push({
          order: orderIndex.get(buff.id) ?? Number.MAX_SAFE_INTEGER,
          entries: [{ id: buff.id, description: buff.description }],
        });
      }

      sections.sort((a, b) => a.order - b.order);
      for (const section of sections) {
        displayBuffs.push(...section.entries);
      }
    } else {
      displayBuffs = sortedBuffs.map((b) => ({ id: b.id, description: b.description }));
    }

    return (
      <>
        <div className='mb-1 flex flex-wrap items-center gap-3'>
          {/* 排序开关 */}
          <div
            className='relative inline-flex h-6 min-w-30 cursor-pointer overflow-hidden rounded-full border border-gray-300 select-none dark:border-gray-600'
            onClick={this.toggleSort}
          >
            <div
              className={`absolute top-0 h-full w-1/2 transition-all duration-300 ease-in-out ${
                sortMode === 'default' ? 'left-0' : 'left-1/2'
              } rounded-full bg-blue-500 dark:bg-blue-400`}
            />
            <div
              className={`relative z-10 flex flex-1 items-center justify-center text-xs ${
                sortMode === 'default' ? 'text-white' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              默认排列
            </div>
            <div
              className={`relative z-10 flex flex-1 items-center justify-center text-xs ${
                sortMode === 'name' ? 'text-white' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              名称排列
            </div>
          </div>

          {/* 比对模式开关 */}
          <div
            className='relative inline-flex h-6 min-w-30 cursor-pointer overflow-hidden rounded-full border border-gray-300 select-none dark:border-gray-600'
            onClick={this.toggleCompare}
          >
            <div
              className={`absolute top-0 h-full w-1/2 transition-all duration-300 ease-in-out ${
                compareMode === false ? 'left-0' : 'left-1/2'
              } rounded-full bg-purple-500 dark:bg-purple-400`}
            />
            <div
              className={`relative z-10 flex flex-1 items-center justify-center text-xs ${
                compareMode === false ? 'text-white' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              默认模式
            </div>
            <div
              className={`relative z-10 flex flex-1 items-center justify-center text-xs ${
                compareMode === true ? 'text-white' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              比对模式
            </div>
          </div>

          <span className='text-xs text-gray-500 dark:text-gray-400'>
            （部分相关信息可查阅 状态效果 或 机制-状态 页面）
          </span>
        </div>

        {displayBuffs.map(({ id, description }) => {
          const iconName = icons[id];
          const content = buffGroupMembers
            ? addBuffGroupTooltips(description, buffGroupMembers)
            : description;

          return (
            <div key={id} id={`buff-${id}`} className='scroll-mt-24 leading-6'>
              {/* 图标作为首行 inline 元素；-translate-y-[2px] 向上微调，修正中文视觉中线 */}
              <span className='mr-1 inline-block h-5 w-5 -translate-y-[2px] align-middle'>
                <Image
                  src={getBuffIconSrc(iconName)}
                  alt=''
                  className='block h-5 w-5 object-contain'
                />
              </span>

              <TextWithHoverTooltips text={content} />
            </div>
          );
        })}
      </>
    );
  }
}
