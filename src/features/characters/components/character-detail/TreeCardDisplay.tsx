import React, { useState } from 'react';
import { useDarkMode } from '@/context/DarkModeContext';
import type { TreeNode } from '@/features/knowledge-cards/utils/sections';
import clsx from 'clsx';

import { getCardRankColors } from '@/lib/design-tokens';
import Tag from '@/components/ui/Tag';
import GotoLink from '@/components/GotoLink';
import Image from '@/components/Image';

interface TreeCardDisplayProps {
  tree: TreeNode[];
  isEditMode: boolean;
  isSqueezedView: boolean;
  handleSelectCard: (cardName: string, characterId: string) => void;
  characterId: string;
  getCardRank: (cardId: string) => string;
  imageBasePath: string;
  isOptionalCard: (cardId: string) => boolean;
  isFoldedMode?: boolean;
  isDarkMode?: boolean;
  isHybridMode?: boolean;
}

interface CardDisplayProps {
  cardId: string;
  isEditMode: boolean;
  isSqueezedView: boolean;
  handleSelectCard: (cardName: string, characterId: string) => void;
  characterId: string;
  getCardRank: (cardId: string) => string;
  imageBasePath: string;
  isOptional: boolean;
  isDarkMode: boolean;
  isHybridMode?: boolean;
  depth: number;
}

const CardDisplay: React.FC<CardDisplayProps> = ({
  cardId,
  isEditMode,
  isSqueezedView,
  handleSelectCard,
  characterId,
  getCardRank,
  imageBasePath,
  isOptional,
  isDarkMode,
  isHybridMode,
  depth,
}) => {
  'use no memo';
  const cardName = cardId.split('-')[1]!;
  const cardRank = getCardRank(cardId);
  const rankColors = getCardRankColors(cardRank, false, isDarkMode);

  // In hybrid mode, show tags for branches (depth > 0), images for root (depth === 0)
  const shouldUseTags = isSqueezedView || (isHybridMode && depth > 0);

  if (shouldUseTags) {
    return (
      <GotoLink key={cardId} name={cardName} className='no-underline' asPreviewOnly>
        <span
          onClick={() => {
            if (isEditMode) return;
            handleSelectCard(cardName, characterId);
          }}
          className='cursor-pointer'
        >
          <Tag
            colorStyles={rankColors}
            size='sm'
            margin='compact'
            className={clsx(
              'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm',
              isOptional && 'opacity-50'
            )}
          >
            {cardName}
          </Tag>
        </span>
      </GotoLink>
    );
  }

  return (
    <GotoLink key={cardId} name={cardName} className='no-underline' asPreviewOnly hideImagePreview>
      <div
        className={clsx(
          'relative h-20 w-20 cursor-pointer transition-transform duration-200 hover:scale-105 sm:h-24 sm:w-24',
          isOptional && 'opacity-50'
        )}
        onClick={() => {
          if (isEditMode) return;
          handleSelectCard(cardName, characterId);
        }}
      >
        <Image src={`${imageBasePath}${cardId}.png`} alt={cardId} fill className='object-contain' />
      </div>
    </GotoLink>
  );
};

// Separate component for OR groups with local state
const OrGroupDisplay: React.FC<
  TreeCardDisplayProps & {
    nodes: TreeNode[];
    depth: number;
  }
> = ({ nodes, depth, ...props }) => {
  'use no memo';
  const childrenCount = nodes.length;
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset selected index if it's out of bounds
  const validSelectedIndex = selectedIndex >= childrenCount ? 0 : selectedIndex;
  const isFolded = props.isFoldedMode;

  const handleNavigate = (direction: 'prev' | 'next') => {
    setSelectedIndex((prev) => {
      if (direction === 'prev') {
        return prev > 0 ? prev - 1 : childrenCount - 1;
      } else {
        return prev < childrenCount - 1 ? prev + 1 : 0;
      }
    });
  };

  if (isFolded) {
    // In folded mode, only show the selected child
    const selectedChild = nodes[validSelectedIndex];
    if (!selectedChild) return null;

    return (
      <div className='flex flex-col items-center gap-2'>
        <TreeNodeDisplay
          node={selectedChild}
          depth={depth + 1}
          isDarkMode={props.isDarkMode ?? false}
          {...props}
        />
        {/* Navigation bar */}
        {childrenCount > 1 && (
          <div className='flex items-center gap-2 rounded-md bg-gray-100 px-3 py-1.5 dark:bg-slate-700'>
            <button
              type='button'
              onClick={() => handleNavigate('prev')}
              className='text-sm font-medium text-gray-700 transition-colors hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400'
              aria-label='上一个选项'
            >
              ←
            </button>
            <span className='text-xs font-medium text-gray-600 dark:text-gray-400'>
              {validSelectedIndex + 1} / {childrenCount}
            </span>
            <button
              type='button'
              onClick={() => handleNavigate('next')}
              className='text-sm font-medium text-gray-700 transition-colors hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400'
              aria-label='下一个选项'
            >
              →
            </button>
          </div>
        )}
      </div>
    );
  }

  // Normal mode: Render children in a vertical column
  return (
    <div className='flex flex-col items-center gap-1'>
      {nodes.map((child, index) => (
        <TreeNodeDisplay
          key={index}
          node={child}
          depth={depth + 1}
          isDarkMode={props.isDarkMode ?? false}
          {...props}
        />
      ))}
    </div>
  );
};

const TreeNodeDisplay: React.FC<
  TreeCardDisplayProps & {
    node: TreeNode;
    depth: number;
    isDarkMode: boolean;
  }
> = ({ node, depth, isDarkMode, ...props }) => {
  'use no memo';

  if (node.type === 'card' && node.cardId) {
    const isOptional = props.isOptionalCard(node.cardId);
    return (
      <CardDisplay
        cardId={node.cardId}
        isEditMode={props.isEditMode}
        isSqueezedView={props.isSqueezedView}
        handleSelectCard={props.handleSelectCard}
        characterId={props.characterId}
        getCardRank={props.getCardRank}
        imageBasePath={props.imageBasePath}
        isOptional={isOptional}
        isDarkMode={isDarkMode}
        isHybridMode={props.isHybridMode ?? false}
        depth={depth}
      />
    );
  }

  if (node.type === 'and-group' && node.children) {
    return (
      <div
        className={clsx('flex flex-wrap items-center', props.isSqueezedView ? 'gap-1' : 'sm:gap-1')}
      >
        {node.children.map((child, index) => (
          <TreeNodeDisplay
            key={index}
            node={child}
            depth={depth + 1}
            isDarkMode={isDarkMode}
            {...props}
          />
        ))}
      </div>
    );
  }

  if (node.type === 'or-group' && node.children) {
    return (
      <OrGroupDisplay nodes={node.children} depth={depth} isDarkMode={isDarkMode} {...props} />
    );
  }

  return null;
};

const TreeCardDisplay: React.FC<TreeCardDisplayProps> = (props) => {
  'use no memo';
  const [isDarkMode] = useDarkMode();

  return (
    <div
      className={clsx('flex flex-wrap items-center', props.isSqueezedView ? 'gap-1' : 'sm:gap-1')}
    >
      {props.tree.map((node, index) => (
        <TreeNodeDisplay
          key={index}
          node={node}
          depth={0}
          isDarkMode={props.isDarkMode ?? isDarkMode}
          {...props}
        />
      ))}
    </div>
  );
};

export default TreeCardDisplay;
